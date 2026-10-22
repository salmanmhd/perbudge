const TELEGRAM_API_BASE = "https://api.telegram.org";

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN environment variable is not defined");
  }
  return token;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface SendMessageOptions {
  parse_mode?: "Markdown" | "HTML";
  reply_markup?: InlineKeyboardMarkup;
}

/**
 * Sends a text message to a Telegram chat.
 */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  options?: SendMessageOptions
) {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`;

  const payload: Record<string, any> = {
    chat_id: chatId,
    text,
  };

  if (options?.parse_mode) payload.parse_mode = options.parse_mode;
  if (options?.reply_markup) payload.reply_markup = options.reply_markup;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return await res.json();
}

/**
 * Edits an existing Telegram message in place.
 */
export async function editTelegramMessageText(
  chatId: number | string,
  messageId: number,
  text: string,
  options?: SendMessageOptions
) {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/editMessageText`;

  const payload: Record<string, any> = {
    chat_id: chatId,
    message_id: messageId,
    text,
  };

  if (options?.parse_mode) payload.parse_mode = options.parse_mode;
  if (options?.reply_markup !== undefined) payload.reply_markup = options.reply_markup;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return await res.json();
}

/**
 * Answers a Telegram callback query to dismiss loading state on inline buttons.
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert: boolean = false
) {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/answerCallbackQuery`;

  const payload: Record<string, any> = {
    callback_query_id: callbackQueryId,
  };

  if (text) {
    payload.text = text;
    payload.show_alert = showAlert;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return await res.json();
}

/**
 * Registers the webhook URL with Telegram.
 */
export async function setTelegramWebhook(webhookUrl: string, secretToken?: string) {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/setWebhook`;

  const payload: Record<string, any> = {
    url: webhookUrl,
    allowed_updates: ["message", "callback_query"],
  };

  if (secretToken) {
    payload.secret_token = secretToken;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return await res.json();
}

/**
 * Retrieves the current webhook status from Telegram.
 */
export async function getTelegramWebhookInfo() {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/getWebhookInfo`;

  const res = await fetch(url, {
    method: "GET",
  });

  return await res.json();
}
