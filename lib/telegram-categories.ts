/**
 * Category management from Telegram: /categories (button UI) plus text
 * shortcuts (/cat add|rename|delete). Plain text messages, no parse_mode.
 */
import { revalidatePath } from "next/cache";
import type mongoose from "mongoose";
import User from "@/lib/models/user";
import Transaction from "@/lib/models/transaction";
import {
  CATEGORY_COLORS,
  FALLBACK_CATEGORY_ID,
  findCategory,
  type Category,
  type CategoryKind,
} from "@/lib/categories";
import {
  createCategoryForUserId,
  deleteCategoryForUserId,
  escapeRegex,
  getCategoriesForUserId,
  updateCategoryForUserId,
} from "@/lib/categories-store";
import {
  answerCallbackQuery,
  editTelegramMessageText,
  sendTelegramMessage,
  type InlineKeyboardMarkup,
} from "@/lib/telegram";

type TgUser = {
  _id: mongoose.Types.ObjectId;
  telegramPending?: { action: "cat_add" | "cat_rename"; slug?: string; at: Date };
};

const PENDING_TTL_MS = 10 * 60 * 1000;
const KIND_LABEL: Record<CategoryKind, string> = {
  expense: "💸 Expense",
  income: "💰 Income",
  both: "🔁 Both",
};
const NEXT_KIND: Record<CategoryKind, CategoryKind> = {
  expense: "income",
  income: "both",
  both: "expense",
};

const refresh = () => revalidatePath("/dashboard", "layout");
const randomColor = () => CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];
const clean = (s: string) => s.trim().replace(/\s+/g, " ");

function setPending(user: TgUser, action: "cat_add" | "cat_rename", slug?: string) {
  return User.updateOne(
    { _id: user._id },
    { $set: { telegramPending: { action, slug, at: new Date() } } }
  );
}
function clearPending(user: TgUser) {
  return User.updateOne({ _id: user._id }, { $unset: { telegramPending: 1 } });
}

// ── Views ────────────────────────────────────────────────────────────────

function listView(cats: Category[]): { text: string; markup: InlineKeyboardMarkup } {
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [];
  for (let i = 0; i < cats.length; i += 2) {
    rows.push(
      cats.slice(i, i + 2).map((c) => ({ text: c.label, callback_data: `cm:o:${c.id}` }))
    );
  }
  rows.push([{ text: "➕ Add category", callback_data: "cm:add" }]);
  return {
    text: `🗂 Your categories (${cats.length})\nTap one to rename, change type or delete.`,
    markup: { inline_keyboard: rows },
  };
}

async function detailView(userId: mongoose.Types.ObjectId, c: Category) {
  const count = await Transaction.countDocuments({
    userId,
    category: new RegExp(`^${escapeRegex(c.label)}$`, "i"),
  });
  const isFallback = c.id === FALLBACK_CATEGORY_ID;
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [
    [
      { text: "✏️ Rename", callback_data: `cm:r:${c.id}` },
      ...(isFallback ? [] : [{ text: "🔁 Change type", callback_data: `cm:t:${c.id}` }]),
    ],
  ];
  if (!isFallback) rows.push([{ text: "🗑️ Delete", callback_data: `cm:d:${c.id}` }]);
  rows.push([{ text: "⬅️ All categories", callback_data: "cm:l" }]);
  return {
    text:
      `${c.label}\nType: ${KIND_LABEL[c.kind]}\nTransactions: ${count}` +
      (isFallback ? "\n\nOthers is the fallback and can't be deleted." : ""),
    markup: { inline_keyboard: rows },
  };
}

// ── Callback buttons (data starts with "cm:") ─────────────────────────────

export async function handleCategoryCallback(
  user: TgUser,
  chatId: number,
  messageId: number | undefined,
  callbackQueryId: string,
  data: string
) {
  const [, op, slug] = data.split(":");
  const cats = await getCategoriesForUserId(user._id);
  const cat = slug ? cats.find((c) => c.id === slug) : undefined;
  const edit = (text: string, markup?: InlineKeyboardMarkup) =>
    messageId
      ? editTelegramMessageText(chatId, messageId, text, {
          reply_markup: markup ?? { inline_keyboard: [] },
        })
      : sendTelegramMessage(chatId, text, markup ? { reply_markup: markup } : undefined);

  if (op === "l") {
    const v = listView(cats);
    await edit(v.text, v.markup);
    return answerCallbackQuery(callbackQueryId);
  }

  if (op === "add") {
    await setPending(user, "cat_add");
    await sendTelegramMessage(
      chatId,
      "Send the name for the new category.\nAdd \"+\" in front for an income category, e.g. +Freelance.\nSend /cancel to stop."
    );
    return answerCallbackQuery(callbackQueryId);
  }

  if (slug && !cat) {
    const v = listView(cats);
    await edit(v.text, v.markup);
    return answerCallbackQuery(callbackQueryId, "That category no longer exists.", true);
  }
  if (!cat) return answerCallbackQuery(callbackQueryId);

  if (op === "o") {
    const v = await detailView(user._id, cat);
    await edit(v.text, v.markup);
    return answerCallbackQuery(callbackQueryId);
  }

  if (op === "r") {
    await setPending(user, "cat_rename", cat.id);
    await sendTelegramMessage(chatId, `Send the new name for ${cat.label}.\nSend /cancel to stop.`);
    return answerCallbackQuery(callbackQueryId);
  }

  if (op === "t") {
    const res = await updateCategoryForUserId(user._id, cat.id, { kind: NEXT_KIND[cat.kind] });
    if (!res.success) return answerCallbackQuery(callbackQueryId, res.error, true);
    refresh();
    const v = await detailView(user._id, res.category!);
    await edit(v.text, v.markup);
    return answerCallbackQuery(callbackQueryId, `Now ${KIND_LABEL[res.category!.kind]}`);
  }

  if (op === "d") {
    await edit(
      `Delete ${cat.label}?\nIts transactions move to Others and its budget limit is removed.`,
      {
        inline_keyboard: [
          [
            { text: "🗑️ Yes, delete", callback_data: `cm:dy:${cat.id}` },
            { text: "Cancel", callback_data: `cm:o:${cat.id}` },
          ],
        ],
      }
    );
    return answerCallbackQuery(callbackQueryId);
  }

  if (op === "dy") {
    const res = await deleteCategoryForUserId(user._id, cat.id);
    if (!res.success) return answerCallbackQuery(callbackQueryId, res.error, true);
    refresh();
    const v = listView(await getCategoriesForUserId(user._id));
    await edit(`🗑️ Deleted ${cat.label}.\n\n${v.text}`, v.markup);
    return answerCallbackQuery(callbackQueryId, "Deleted");
  }

  return answerCallbackQuery(callbackQueryId);
}

// ── Commands ──────────────────────────────────────────────────────────────

const CAT_HELP =
  "🗂 Manage categories\n\n" +
  "/categories: list with buttons\n" +
  "/cat add Pet care: new expense category\n" +
  "/cat add +Freelance: new income category\n" +
  "/cat rename Grocery to Food\n" +
  "/cat delete Grocery";

async function addCategory(user: TgUser, chatId: number, raw: string) {
  let name = clean(raw);
  let kind: CategoryKind = "expense";
  if (name.startsWith("+")) {
    kind = "income";
    name = clean(name.slice(1));
  }
  const res = await createCategoryForUserId(user._id, {
    label: name,
    icon: kind === "income" ? "Banknote" : "Receipt",
    color: randomColor(),
    kind,
  });
  if (!res.success) {
    await sendTelegramMessage(chatId, `⚠️ ${res.error}`);
    return;
  }
  refresh();
  await sendTelegramMessage(chatId, `✅ Added ${res.category!.label} (${KIND_LABEL[kind]})`, {
    reply_markup: { inline_keyboard: [[{ text: "🗂 All categories", callback_data: "cm:l" }]] },
  });
}

async function renameCategory(user: TgUser, chatId: number, slug: string, raw: string) {
  const res = await updateCategoryForUserId(user._id, slug, { label: clean(raw) });
  if (!res.success) {
    await sendTelegramMessage(chatId, `⚠️ ${res.error}`);
    return;
  }
  refresh();
  await sendTelegramMessage(chatId, `✅ Renamed to ${res.category!.label}`, {
    reply_markup: { inline_keyboard: [[{ text: "🗂 All categories", callback_data: "cm:l" }]] },
  });
}

/** Handles /categories and /cat …; returns true if the message was consumed. */
export async function handleCategoryCommand(
  user: TgUser,
  chatId: number,
  command: string,
  text: string
): Promise<boolean> {
  if (command === "/cancel") {
    await clearPending(user);
    await sendTelegramMessage(chatId, "Cancelled.");
    return true;
  }

  if (command === "/categories") {
    await clearPending(user);
    const v = listView(await getCategoriesForUserId(user._id));
    await sendTelegramMessage(chatId, v.text, { reply_markup: v.markup });
    return true;
  }

  if (command !== "/cat") return false;
  await clearPending(user);

  const rest = text.replace(/^\/cat(@\w+)?\s*/i, "");
  const [sub, ...args] = rest.split(/\s+/);
  const argText = args.join(" ");
  const verb = (sub || "").toLowerCase();

  if (verb === "add" && argText) {
    await addCategory(user, chatId, argText);
    return true;
  }

  if ((verb === "rename" || verb === "edit") && argText) {
    const m = argText.match(/^(.+?)\s+(?:to|->|→)\s+(.+)$/i);
    if (!m) {
      await sendTelegramMessage(chatId, "Use: /cat rename Old name to New name");
      return true;
    }
    const cat = findCategory(await getCategoriesForUserId(user._id), clean(m[1]));
    if (!cat) {
      await sendTelegramMessage(chatId, `⚠️ No category called "${clean(m[1])}". Send /categories to see yours.`);
      return true;
    }
    await renameCategory(user, chatId, cat.id, m[2]);
    return true;
  }

  if ((verb === "delete" || verb === "del" || verb === "remove") && argText) {
    const cat = findCategory(await getCategoriesForUserId(user._id), clean(argText));
    if (!cat) {
      await sendTelegramMessage(chatId, `⚠️ No category called "${clean(argText)}". Send /categories to see yours.`);
      return true;
    }
    if (cat.id === FALLBACK_CATEGORY_ID) {
      await sendTelegramMessage(chatId, "⚠️ The Others category can't be deleted.");
      return true;
    }
    // Same confirm step as the buttons, so a typo can't wipe a category.
    await sendTelegramMessage(
      chatId,
      `Delete ${cat.label}?\nIts transactions move to Others and its budget limit is removed.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🗑️ Yes, delete", callback_data: `cm:dy:${cat.id}` },
              { text: "Cancel", callback_data: `cm:o:${cat.id}` },
            ],
          ],
        },
      }
    );
    return true;
  }

  await sendTelegramMessage(chatId, CAT_HELP);
  return true;
}

/**
 * If the bot asked for a typed name (Add / Rename buttons), consume this
 * message as the answer. Returns true if handled.
 */
export async function handlePendingCategoryReply(
  user: TgUser,
  chatId: number,
  text: string
): Promise<boolean> {
  const p = user.telegramPending;
  if (!p?.action) return false;
  if (!p.at || Date.now() - new Date(p.at).getTime() > PENDING_TTL_MS) {
    await clearPending(user);
    return false;
  }
  // A message that looks like an expense ("250 biryani") is not a name.
  if (/^\+?\d/.test(text)) return false;

  await clearPending(user);
  if (p.action === "cat_add") await addCategory(user, chatId, text);
  else if (p.slug) await renameCategory(user, chatId, p.slug, text);
  return true;
}
