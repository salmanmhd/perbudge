import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/user";
import Transaction from "@/lib/models/transaction";
import { parseExpenseMessage } from "@/lib/telegram-parser";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  findCategory,
  categoriesForType,
  type Category,
} from "@/lib/categories";
import { createCategoryForUserId, getCategoriesForUserId } from "@/lib/categories-store";
import { auditFinancialsWithAi } from "@/lib/ai-audit";
import {
  sendTelegramMessage,
  editTelegramMessageText,
  answerCallbackQuery,
  InlineKeyboardMarkup,
  editTelegramReplyMarkup,
  setTelegramCommands,
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

function resolveCategory(nameOrId: string | null, list: Category[] = CATEGORIES): string | null {
  if (!nameOrId) return null;
  const normalized = nameOrId.trim().toLowerCase();
  const compact = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");

  const directCategory =
    findCategory(list, normalized) ?? list.find((c) => compact(c.label) === compact(normalized));
  if (directCategory) return directCategory.label;

  const alias = CATEGORY_ALIASES[normalized];
  if (alias) {
    return findCategory(list, alias)?.label ?? alias;
  }

  return null;
}

function getCategoryDisplay(catId: string, list: Category[] = CATEGORIES): string {
  const cat = findCategory(list, catId);
  return cat ? cat.label : catId.charAt(0).toUpperCase() + catId.slice(1);
}

function buildCategoryPickerKeyboard(
  expenseId: string,
  list: Category[] = CATEGORIES,
  opts: { kind?: "expense" | "income"; createName?: string } = {}
): InlineKeyboardMarkup {
  // Telegram caps callback_data at 64 bytes.
  const fits = (data: string) => Buffer.byteLength(data) <= 64;
  const cats = categoriesForType(list, opts.kind ?? "expense").filter((c) =>
    fits(`cat:${expenseId}:${c.id}`)
  );
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [];
  if (opts.createName && fits(`new:${expenseId}:${opts.createName}`)) {
    rows.push([
      { text: `➕ Create "${titleCase(opts.createName)}"`, callback_data: `new:${expenseId}:${opts.createName}` },
    ]);
  }
  for (let i = 0; i < cats.length; i += 3) {
    rows.push(
      cats.slice(i, i + 3).map((c) => ({ text: c.label, callback_data: `cat:${expenseId}:${c.id}` }))
    );
  }
  rows.push([{ text: "↩️ Undo", callback_data: `del:${expenseId}` }]);
  return { inline_keyboard: rows };
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Escapes user text for Telegram's legacy Markdown parse mode. */
function escapeMd(s: string): string {
  return s.replace(/([_*`\[])/g, "\\$1");
}

/**
 * "⚠️ Food: ₹4,600 of ₹5,000 (92%)" once a category crosses 80% of its
 * monthly limit; null otherwise.
 */
async function budgetAlert(
  user: { _id: mongoose.Types.ObjectId; categoryBudgets?: { category: string; limit: number }[] },
  category: string
): Promise<string | null> {
  const budget = user.categoryBudgets?.find(
    (b) => b.category.toLowerCase() === category.toLowerCase()
  );
  if (!budget || budget.limit <= 0) return null;

  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const nowIst = new Date(Date.now() + IST_OFFSET_MS);
  const monthStart = new Date(
    Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), 1) - IST_OFFSET_MS
  );
  const [agg] = await Transaction.aggregate([
    {
      $match: {
        userId: user._id,
        type: "expense",
        date: { $gte: monthStart },
        category: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const spent = agg?.total ?? 0;
  const pct = Math.round((spent / budget.limit) * 100);
  if (pct < 80) return null;
  const icon = pct >= 100 ? "🚨" : "⚠️";
  return `${icon} ${category}: ${inr(spent)} of ${inr(budget.limit)} (${pct}%)`;
}

function buildResolvedKeyboard(expenseId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "✏️ Category", callback_data: `pick:${expenseId}` },
        { text: "↩️ Undo", callback_data: `del:${expenseId}` },
      ],
    ],
  };
}

function buildUndoOnlyKeyboard(expenseId: string): InlineKeyboardMarkup {
  return { inline_keyboard: [[{ text: "↩️ Undo", callback_data: `del:${expenseId}` }]] };
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Sum of today's expenses (India time) for the running total. */
async function todayExpenseTotal(userId: mongoose.Types.ObjectId): Promise<number> {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const nowIst = new Date(Date.now() + IST_OFFSET_MS);
  const startUtc = new Date(
    Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate()) - IST_OFFSET_MS
  );
  const [agg] = await Transaction.aggregate([
    { $match: { userId, type: "expense", date: { $gte: startUtc } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return agg?.total ?? 0;
}

function confirmationText(
  amount: number,
  category: string,
  list: Category[],
  todayTotal: number,
  opts: { income?: boolean; alert?: string | null } = {}
): string {
  const label = getCategoryDisplay(category, list);
  if (opts.income) return `+${inr(amount)} · ${label}`;
  let text = `${inr(amount)} · ${label}\nToday ${inr(todayTotal)}`;
  if (opts.alert) text += `\n${opts.alert}`;
  return text;
}

/** Clears buttons on the previous confirmation so only the latest one is actionable. */
async function retirePreviousActionMessage(
  chatId: number,
  user: { _id: mongoose.Types.ObjectId; telegramLastActionMsgId?: number },
  newMessageId?: number
) {
  const prev = user.telegramLastActionMsgId;
  if (prev && prev !== newMessageId) {
    await editTelegramReplyMarkup(chatId, prev).catch(() => {});
  }
  if (newMessageId) {
    await User.updateOne({ _id: user._id }, { $set: { telegramLastActionMsgId: newMessageId } });
  }
}

export async function POST(req: NextRequest) {
  let replyChatId: number | null = null;
  try {
    // 1. Verify Secret Header (Critical Serverless Rule)
    const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
    const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    // Fail closed: without a configured secret anyone could forge updates.
    if (!configuredSecret || secretToken !== configuredSecret) {
      console.warn("Unauthorized webhook attempt rejected");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    replyChatId = body.callback_query?.message?.chat?.id ?? body.message?.chat?.id ?? null;

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

      const userCats = await getCategoriesForUserId(user._id);

      // Security Constraint: All queries strictly scoped by user._id
      if (action === "pick") {
        const tx = await Transaction.findOne({ _id: expenseId, userId: user._id });
        if (tx && messageId) {
          await editTelegramMessageText(
            chatId,
            messageId,
            `${inr(tx.amount)} · ${tx.note || "Expense"}\nPick a category:`,
            {
              reply_markup: buildCategoryPickerKeyboard(expenseId, userCats, {
                kind: tx.type === "income" ? "income" : "expense",
              }),
            }
          );
        }
        await answerCallbackQuery(callbackQueryId);
        return NextResponse.json({ ok: true });
      }

      if (action === "cat") {
        const targetCategory =
          findCategory(userCats, value || "others")?.label ?? (value || "others");
        const updatedTx = await Transaction.findOneAndUpdate(
          { _id: expenseId, userId: user._id },
          { $set: { category: targetCategory } },
          { new: true }
        );

        if (updatedTx && messageId) {
          const categoryDisplay = getCategoryDisplay(updatedTx.category, userCats);
          const isIncome = updatedTx.type === "income";
          const [todayTotal, alert] = isIncome
            ? [0, null]
            : await Promise.all([
                todayExpenseTotal(user._id),
                budgetAlert(user, updatedTx.category),
              ]);
          await editTelegramMessageText(
            chatId,
            messageId,
            confirmationText(updatedTx.amount, updatedTx.category, userCats, todayTotal, {
              income: isIncome,
              alert,
            }),
            // Category was just chosen by hand, so only offer Undo.
            { reply_markup: buildUndoOnlyKeyboard(expenseId) }
          );
          await answerCallbackQuery(callbackQueryId, `Category updated to ${categoryDisplay}!`);
        } else {
          await answerCallbackQuery(callbackQueryId, "Expense not found.", true);
        }

        return NextResponse.json({ ok: true });
      }

      if (action === "new") {
        const name = titleCase((value || "").trim());
        const created = await createCategoryForUserId(user._id, {
          label: name,
          icon: "Receipt",
          color: CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)],
          kind: "expense",
        });
        // If it already exists, just use it.
        const label = created.success
          ? created.category!.label
          : findCategory(await getCategoriesForUserId(user._id), name)?.label;
        if (!label) {
          await answerCallbackQuery(callbackQueryId, created.success ? "Failed" : created.error, true);
          return NextResponse.json({ ok: true });
        }
        const updatedTx = await Transaction.findOneAndUpdate(
          { _id: expenseId, userId: user._id },
          { $set: { category: label } },
          { new: true }
        );
        if (updatedTx && messageId) {
          const freshCats = await getCategoriesForUserId(user._id);
          const todayTotal = await todayExpenseTotal(user._id);
          await editTelegramMessageText(
            chatId,
            messageId,
            confirmationText(updatedTx.amount, label, freshCats, todayTotal),
            { reply_markup: buildUndoOnlyKeyboard(expenseId) }
          );
        }
        await answerCallbackQuery(callbackQueryId, `Created ${label}`);
        return NextResponse.json({ ok: true });
      }

      if (action === "del") {
        const deletedTx = await Transaction.findOneAndDelete({
          _id: expenseId,
          userId: user._id,
        });

        if (deletedTx && messageId) {
          await editTelegramMessageText(chatId, messageId, `🗑️ Removed ${inr(deletedTx.amount)} · ${deletedTx.note || "Expense"}`, {
            reply_markup: { inline_keyboard: [] },
          });
          await answerCallbackQuery(callbackQueryId, "Deleted");
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
        await setTelegramCommands().catch(() => {});
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

    const userCats = await getCategoriesForUserId(user._id);

    // -------------------------------------------------------------------------
    // Flow B: Utility Commands (/help, /today, /last, /analysis, /month)
    // -------------------------------------------------------------------------
    const command = text.split(/\s+/)[0].toLowerCase().replace(/@\w+$/, "");

    if (command === "/help") {
      const helpText =
        `💡 *Perbudge Telegram Bot Guide*\n\n` +
        `*How to Log Expenses:*\n` +
        `Send a quick message anytime:\n` +
        `• \`250 biryani\` — quick expense\n` +
        `• \`150 coffee #food\` — specify category\n` +
        `• \`500 petrol yest\` — backdate to yesterday\n` +
        `• \`1200 wifi #bills 18/10\` — backdate to Oct 18\n` +
        `• \`+5000 salary\` — log income\n\n` +
        `*Commands:*\n` +
        `• /today — Today's total spending & items\n` +
        `• /last — View your last 5 logged expenses\n` +
        `• /analysis — Monthly breakdown & top categories\n` +
        `• /month — Quick total spend for this month\n` +
        `• /help — Show this help message\n\n` +
        `*Shortcuts:*\n` +
        `• \`#<category>\` — Category tag (#food, #bills, #travel, etc.)\n` +
        `• \`yest\` or \`yesterday\` — Backdate 1 day\n` +
        `• \`DD/MM\` — Set specific date (e.g. \`18/10\`)`;

      await sendTelegramMessage(chatId, helpText, { parse_mode: "Markdown" });
      return NextResponse.json({ ok: true });
    }

    if (command === "/today") {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const expenses = await Transaction.find({
        userId: user._id,
        type: "expense",
        date: { $gte: startOfDay, $lte: endOfDay },
      }).sort({ date: -1, createdAt: -1 });

      const total = expenses.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const count = expenses.length;

      if (count === 0) {
        await sendTelegramMessage(
          chatId,
          `📅 *Today's Expenses*\n\nYou haven't logged any expenses today yet. Send something like \`250 biryani\` to start!`,
          { parse_mode: "Markdown" }
        );
        return NextResponse.json({ ok: true });
      }

      const countText = count === 1 ? "1 expense" : `${count} expenses`;
      let reply = `📅 *Today's Expenses*\nTotal: *₹${total.toLocaleString("en-IN")}* (${countText})\n\n`;

      expenses.slice(0, 5).forEach((tx) => {
        reply += `• *₹${tx.amount.toLocaleString("en-IN")}* — ${escapeMd(tx.note || "Expense")} _(${escapeMd(getCategoryDisplay(tx.category, userCats))})_\n`;
      });

      if (count > 5) {
        reply += `_...and ${count - 5} more_`;
      }

      await sendTelegramMessage(chatId, reply, { parse_mode: "Markdown" });
      return NextResponse.json({ ok: true });
    }

    if (command === "/last") {
      // Fetch the user's last 5 expenses sorted by createdAt in descending order
      const lastExpenses = await Transaction.find({
        userId: user._id,
        type: "expense",
      })
        .sort({ createdAt: -1 })
        .limit(5);

      if (lastExpenses.length === 0) {
        await sendTelegramMessage(
          chatId,
          "🕒 *Recent Expenses*\n\nYou haven't logged any expenses yet! Send something like `250 biryani` to get started.",
          { parse_mode: "Markdown" }
        );
        return NextResponse.json({ ok: true });
      }

      let reply = "🕒 *Your Last 5 Expenses*\n\n";
      lastExpenses.forEach((tx, idx) => {
        const d = new Date(tx.date || tx.createdAt);
        const formattedDate = d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        });
        const categoryLabel = getCategoryDisplay(tx.category, userCats);
        reply += `${idx + 1}. *₹${tx.amount.toLocaleString("en-IN")}* — ${escapeMd(tx.note || "Expense")} • _${escapeMd(categoryLabel)}_ (${formattedDate})\n`;
      });

      await sendTelegramMessage(chatId, reply, { parse_mode: "Markdown" });
      return NextResponse.json({ ok: true });
    }

    if (command === "/analysis") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthName = now.toLocaleString("en-IN", { month: "long", year: "numeric" });

      const monthExpenses = await Transaction.find({
        userId: user._id,
        type: "expense",
        date: { $gte: startOfMonth, $lte: endOfMonth },
      });

      if (monthExpenses.length === 0) {
        await sendTelegramMessage(
          chatId,
          `📊 *Financial Breakdown — ${monthName}*\n\nNo expenses logged for this month yet. Start logging by sending an expense like \`250 biryani\`.`,
          { parse_mode: "Markdown" }
        );
        return NextResponse.json({ ok: true });
      }

      const totalSpend = monthExpenses.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const categoryTotals: Record<string, number> = {};

      for (const tx of monthExpenses) {
        const cat = getCategoryDisplay(tx.category || "others", userCats);
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (tx.amount || 0);
      }

      const sortedCategories = Object.entries(categoryTotals)
        .map(([cat, amount]) => ({
          category: cat,
          label: getCategoryDisplay(cat, userCats),
          amount,
          percentage: totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      const topCategory = sortedCategories[0];

      let reply = `📊 *Financial Breakdown — ${monthName}*\n\n`;
      reply += `💰 *Total Spent:* ₹${totalSpend.toLocaleString("en-IN")} (${monthExpenses.length} ${monthExpenses.length === 1 ? "expense" : "expenses"})\n`;
      reply += `🔥 *Top Category:* ${escapeMd(topCategory.label)} (₹${topCategory.amount.toLocaleString("en-IN")} • ${topCategory.percentage}%)\n\n`;
      reply += `*Category Breakdown:*\n`;

      for (const cat of sortedCategories) {
        reply += `• *${escapeMd(cat.label)}*: ₹${cat.amount.toLocaleString("en-IN")} (${cat.percentage}%)\n`;
      }

      // Generate AI audit insight with robust model fallback (gemini-3.8-flash -> gemini-3.6-flash)
      try {
        const aiInsight = await auditFinancialsWithAi({
          monthName,
          totalSpend,
          count: monthExpenses.length,
          topCategory,
          categoryBreakdown: sortedCategories,
        });

        if (aiInsight) {
          reply += `\n🤖 *AI Co-pilot Insight:*\n_${escapeMd(aiInsight)}_`;
        }
      } catch (aiErr) {
        console.warn("AI audit failed gracefully:", aiErr);
      }

      await sendTelegramMessage(chatId, reply, { parse_mode: "Markdown" });
      return NextResponse.json({ ok: true });
    }

    if (command === "/month") {
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

    const isIncome = parsed.isIncome;
    const kind = isIncome ? "income" : "expense";
    const kindCats = categoriesForType(userCats, kind);

    // Smart Category Resolution
    let resolvedCategory: string | null = null;
    /** A #tag that matches no category: offer to create it. */
    let unknownTag: string | null = null;

    // Priority 1: User hashtag (#category)
    if (parsed.categoryName) {
      resolvedCategory = resolveCategory(parsed.categoryName, userCats);
      if (!resolvedCategory) unknownTag = parsed.categoryName.toLowerCase();
    }

    // Priority 2: Auto-Categorization from User's History
    if (!resolvedCategory && !unknownTag) {
      const escapedDesc = parsed.description
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const recentTx = await Transaction.findOne({
        userId: user._id,
        type: kind,
        note: { $regex: new RegExp(`^${escapedDesc}$`, "i") },
      }).sort({ date: -1, createdAt: -1 });

      if (recentTx && recentTx.category) {
        resolvedCategory = getCategoryDisplay(recentTx.category, userCats);
      }
    }

    // Income with no match: a single income category is an easy pick.
    if (!resolvedCategory && !unknownTag && isIncome && kindCats.length === 1) {
      resolvedCategory = kindCats[0].label;
    }

    const fallbackLabel = findCategory(userCats, "others")?.label || "Others";

    // Insert into Database scoped strictly by user._id
    const newTx = await Transaction.create({
      userId: user._id,
      amount: parsed.amount,
      category: resolvedCategory || fallbackLabel,
      type: kind,
      paymentMode: "cash",
      note: parsed.description,
      date: parsed.date,
      tags: [],
      isRecurring: false,
    });

    const txId = newTx._id.toString();

    // Send a compact confirmation; only the newest one keeps its buttons.
    let sent: { ok?: boolean; result?: { message_id?: number } };
    if (resolvedCategory) {
      const [todayTotal, alert] = isIncome
        ? [0, null]
        : await Promise.all([todayExpenseTotal(user._id), budgetAlert(user, newTx.category)]);
      sent = await sendTelegramMessage(
        chatId,
        confirmationText(parsed.amount, newTx.category, userCats, todayTotal, {
          income: isIncome,
          alert,
        }),
        { reply_markup: buildResolvedKeyboard(txId) }
      );
    } else {
      const prefix = isIncome ? "+" : "";
      const prompt = unknownTag
        ? `No category "${titleCase(unknownTag)}" yet. Create it or pick one:`
        : "Pick a category:";
      sent = await sendTelegramMessage(
        chatId,
        `${prefix}${inr(parsed.amount)} · ${parsed.description}\n${prompt}`,
        {
          reply_markup: buildCategoryPickerKeyboard(txId, userCats, {
            kind,
            createName: isIncome ? undefined : unknownTag ?? undefined,
          }),
        }
      );
    }
    await retirePreviousActionMessage(chatId, user, sent?.result?.message_id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Critical Serverless Rule: Global try/catch returning 200 OK so Telegram doesn't retry infinitely
    console.error("Telegram webhook error:", error);
    if (replyChatId) {
      await sendTelegramMessage(replyChatId, "⚠️ Couldn't process that. Please try again.").catch(
        () => {}
      );
    }
    return NextResponse.json({ ok: true, handledError: true });
  }
}
