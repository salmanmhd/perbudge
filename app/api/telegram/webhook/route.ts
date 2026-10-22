import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/user";
import Transaction from "@/lib/models/transaction";
import { parseExpenseMessage } from "@/lib/telegram-parser";
import { CATEGORIES, getCategoryByName } from "@/lib/categories";
import {
  sendTelegramMessage,
  editTelegramMessageText,
  answerCallbackQuery,
  InlineKeyboardMarkup,
} from "@/lib/telegram";

export const dynamic = "force-dynamic";

const CATEGORY_ALIASES: Record<string, string> = {
  travel: "transport",
  cab: "transport",
  petrol: "transport",
  fuel: "transport",
  auto: "transport",
  bus: "transport",
  train: "transport",
  groceries: "food",
  grocery: "food",
  dining: "food",
  snack: "food",
  coffee: "food",
  tea: "food",
  chai: "food",
  movie: "entertainment",
  movies: "entertainment",
  game: "entertainment",
  games: "entertainment",
  fun: "entertainment",
  medical: "health",
  medicine: "health",
  doctor: "health",
  hospital: "health",
  college: "education",
  school: "education",
  books: "education",
  fees: "education",
  electricity: "bills",
  wifi: "bills",
  water: "bills",
  recharge: "bills",
  house: "rent",
  room: "rent",
  flat: "rent",
};

function resolveCategory(nameOrId: string | null): string | null {
  if (!nameOrId) return null;
  const normalized = nameOrId.trim().toLowerCase();

  const directCategory = getCategoryByName(normalized);
  if (directCategory) return directCategory.id;

  if (CATEGORY_ALIASES[normalized]) {
    return CATEGORY_ALIASES[normalized];
  }

  return null;
}

function getCategoryDisplay(catId: string): string {
  const cat = getCategoryByName(catId);
  return cat ? cat.label : catId.charAt(0).toUpperCase() + catId.slice(1);
}

function buildCategoryPickerKeyboard(expenseId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "🍔 Food", callback_data: `cat:${expenseId}:food` },
        { text: "🚗 Transport", callback_data: `cat:${expenseId}:transport` },
        { text: "🧾 Bills", callback_data: `cat:${expenseId}:bills` },
      ],
      [
        { text: "🛍️ Shopping", callback_data: `cat:${expenseId}:shopping` },
        { text: "🎬 Fun", callback_data: `cat:${expenseId}:entertainment` },
        { text: "💊 Health", callback_data: `cat:${expenseId}:health` },
      ],
      [
        { text: "📚 Education", callback_data: `cat:${expenseId}:education` },
        { text: "🏠 Rent", callback_data: `cat:${expenseId}:rent` },
        { text: "📦 Others", callback_data: `cat:${expenseId}:others` },
      ],
      [{ text: "❌ Undo", callback_data: `del:${expenseId}` }],
    ],
  };
}

function buildResolvedKeyboard(expenseId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "🔄 Change Category", callback_data: `pick:${expenseId}` },
        { text: "❌ Undo", callback_data: `del:${expenseId}` },
      ],
    ],
  };
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Secret Header (Critical Serverless Rule)
    const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
    const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (configuredSecret && secretToken !== configuredSecret) {
      console.warn("Unauthorized webhook attempt rejected");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // -------------------------------------------------------------------------
    // Flow D: Handling Inline Button Clicks (callback_query)
    // -------------------------------------------------------------------------
    if (body.callback_query) {
      const cq = body.callback_query;
      const callbackQueryId = cq.id;
      const chatId = cq.message?.chat?.id;
      const messageId = cq.message?.message_id;
      const data = cq.data || "";

      if (!chatId || !data) {
        if (callbackQueryId) await answerCallbackQuery(callbackQueryId);
        return NextResponse.json({ ok: true });
      }

      await connectToDatabase();
      const user = await User.findOne({ telegramChatId: chatId });
      if (!user) {
        await answerCallbackQuery(callbackQueryId, "User not linked to Perbudge.", true);
        return NextResponse.json({ ok: true });
      }

      const [action, expenseId, value] = data.split(":");

      if (!expenseId || !mongoose.Types.ObjectId.isValid(expenseId)) {
        await answerCallbackQuery(callbackQueryId, "Invalid transaction.", true);
        return NextResponse.json({ ok: true });
      }

      // Security Constraint: All queries strictly scoped by user._id
      if (action === "pick") {
        const tx = await Transaction.findOne({ _id: expenseId, userId: user._id });
        if (tx && messageId) {
          await editTelegramMessageText(
            chatId,
            messageId,
            `Select category for ₹${tx.amount} — ${tx.note || "Expense"}:`,
            {
              reply_markup: buildCategoryPickerKeyboard(expenseId),
            }
          );
        }
        await answerCallbackQuery(callbackQueryId);
        return NextResponse.json({ ok: true });
      }

      if (action === "cat") {
        const targetCategory = value || "others";
        const updatedTx = await Transaction.findOneAndUpdate(
          { _id: expenseId, userId: user._id },
          { $set: { category: targetCategory } },
          { new: true }
        );

        if (updatedTx && messageId) {
          const categoryDisplay = getCategoryDisplay(updatedTx.category);
          await editTelegramMessageText(
            chatId,
            messageId,
            `✅ Saved ₹${updatedTx.amount} — ${updatedTx.note || "Expense"} • ${categoryDisplay}`,
            {
              reply_markup: buildResolvedKeyboard(expenseId),
            }
          );
          await answerCallbackQuery(callbackQueryId, `Category updated to ${categoryDisplay}!`);
        } else {
          await answerCallbackQuery(callbackQueryId, "Expense not found.", true);
        }

        return NextResponse.json({ ok: true });
      }

      if (action === "del") {
        const deletedTx = await Transaction.findOneAndDelete({
          _id: expenseId,
          userId: user._id,
        });

        if (deletedTx && messageId) {
          await editTelegramMessageText(chatId, messageId, "🗑️ Expense deleted.", {
            reply_markup: { inline_keyboard: [] },
          });
          await answerCallbackQuery(callbackQueryId, "Expense deleted!");
        } else {
          await answerCallbackQuery(callbackQueryId, "Expense not found or already deleted.", true);
        }

        return NextResponse.json({ ok: true });
      }

      await answerCallbackQuery(callbackQueryId);
      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------------------
    // Message Handling (body.message)
    // -------------------------------------------------------------------------
    const message = body.message;
    if (!message || !message.text) {
      // Ignored (non-text messages like photos, stickers, etc.)
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    // -------------------------------------------------------------------------
    // Flow A: /start <token> (Account Linking)
    // -------------------------------------------------------------------------
    if (text.startsWith("/start")) {
      const parts = text.split(/\s+/);
      const token = parts[1];

      if (!token) {
        await sendTelegramMessage(
          chatId,
          "👋 Welcome to Perbudge!\n\nPlease open your web dashboard settings and click *Connect Telegram* to link your account.",
          { parse_mode: "Markdown" }
        );
        return NextResponse.json({ ok: true });
      }

      await connectToDatabase();

      // Find user with matching token and update
      const user = await User.findOneAndUpdate(
        { telegramLinkToken: token },
        {
          $set: { telegramChatId: chatId },
          $unset: { telegramLinkToken: 1 },
        },
        { new: true }
      );

      if (user) {
        const nameGreeting = user.firstName ? ` ${user.firstName}` : "";
        await sendTelegramMessage(
          chatId,
          `✅ Account linked! Hi${nameGreeting}, send an expense like \`250 biryani\` or \`150 coffee #food\` to log it immediately.`,
          { parse_mode: "Markdown" }
        );
      } else {
        await sendTelegramMessage(
          chatId,
          "❌ Invalid or expired linking token. Please generate a new link from your dashboard settings.",
          { parse_mode: "Markdown" }
        );
      }

      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------------------
    // Check if user is linked before proceeding
    // -------------------------------------------------------------------------
    await connectToDatabase();
    const user = await User.findOne({ telegramChatId: chatId });

    if (!user) {
      await sendTelegramMessage(
        chatId,
        "🔒 Your Telegram is not linked to a Perbudge account.\n\nPlease open your web dashboard settings and click *Connect Telegram* to link.",
        { parse_mode: "Markdown" }
      );
      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------------------
    // Flow B: Utility Commands (/help, /today, /month)
    // -------------------------------------------------------------------------
    if (text === "/help") {
      const helpText =
        `💡 *Perbudge Telegram Bot Help*\n\n` +
        `Log expenses simply by texting shorthand messages:\n` +
        `• \`250 biryani\`\n` +
        `• \`150 coffee #food\`\n` +
        `• \`500 petrol #travel yest\`\n` +
        `• \`1200 wifi #bills 18/10\`\n\n` +
        `*Commands:*\n` +
        `• /today — Today's total expenses\n` +
        `• /month — This month's total expenses\n` +
        `• /help — Show this help message\n\n` +
        `*Shortcuts:*\n` +
        `• \`#category\` — Specify category (#food, #bills, #travel)\n` +
        `• \`yest\` / \`yesterday\` — Backdate to yesterday\n` +
        `• \`DD/MM\` — Set specific date (e.g., \`18/10\`)`;

      await sendTelegramMessage(chatId, helpText, { parse_mode: "Markdown" });
      return NextResponse.json({ ok: true });
    }

    if (text === "/today") {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const expenses = await Transaction.find({
        userId: user._id,
        type: "expense",
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      const total = expenses.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const count = expenses.length;
      const countText = count === 1 ? "1 expense" : `${count} expenses`;

      await sendTelegramMessage(
        chatId,
        `📅 *Today's Expenses*\nTotal: ₹${total.toLocaleString("en-IN")} (${countText})`,
        { parse_mode: "Markdown" }
      );
      return NextResponse.json({ ok: true });
    }

    if (text === "/month") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const expenses = await Transaction.find({
        userId: user._id,
        type: "expense",
        date: { $gte: startOfMonth, $lte: endOfMonth },
      });

      const total = expenses.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const count = expenses.length;
      const countText = count === 1 ? "1 expense" : `${count} expenses`;

      await sendTelegramMessage(
        chatId,
        `📊 *This Month's Expenses*\nTotal: ₹${total.toLocaleString("en-IN")} (${countText})`,
        { parse_mode: "Markdown" }
      );
      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------------------
    // Flow C: Logging an Expense (Standard Text Message)
    // -------------------------------------------------------------------------
    const parsed = parseExpenseMessage(text, message.date);

    if (!parsed) {
      await sendTelegramMessage(
        chatId,
        "⚠️ Format: `<amount> <description> [#category]`\nExample: `250 biryani` or `150 coffee #food`",
        { parse_mode: "Markdown" }
      );
      return NextResponse.json({ ok: true });
    }

    // Smart Category Resolution
    let resolvedCategory: string | null = null;

    // Priority 1: User hashtag (#category)
    if (parsed.categoryName) {
      resolvedCategory = resolveCategory(parsed.categoryName);
      if (!resolvedCategory) {
        // If unrecognized custom category, check if valid string or default to others
        resolvedCategory = parsed.categoryName.toLowerCase();
      }
    }

    // Priority 2: Auto-Categorization from User's History
    if (!resolvedCategory) {
      const escapedDesc = parsed.description
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const recentTx = await Transaction.findOne({
        userId: user._id,
        type: "expense",
        note: { $regex: new RegExp(`^${escapedDesc}$`, "i") },
      }).sort({ date: -1, createdAt: -1 });

      if (recentTx && recentTx.category) {
        resolvedCategory = recentTx.category;
      }
    }

    // Insert into Database scoped strictly by user._id
    const newTx = await Transaction.create({
      userId: user._id,
      amount: parsed.amount,
      category: resolvedCategory || "others",
      type: "expense",
      paymentMode: "cash",
      note: parsed.description,
      date: parsed.date,
      tags: [],
      isRecurring: false,
    });

    const txId = newTx._id.toString();

    // Send Confirmation with Inline Keyboard
    if (resolvedCategory) {
      const categoryDisplay = getCategoryDisplay(resolvedCategory);
      await sendTelegramMessage(
        chatId,
        `✅ Saved ₹${parsed.amount} — ${parsed.description} • ${categoryDisplay}`,
        {
          reply_markup: buildResolvedKeyboard(txId),
        }
      );
    } else {
      await sendTelegramMessage(
        chatId,
        `✅ Saved ₹${parsed.amount} — ${parsed.description}\nChoose a category:`,
        {
          reply_markup: buildCategoryPickerKeyboard(txId),
        }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    // Critical Serverless Rule: Global try/catch returning 200 OK so Telegram doesn't retry infinitely
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true, handledError: true });
  }
}
