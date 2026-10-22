# Technical Specification: Telegram Bot Integration for Perbudge

## 1. Objective

Implement a multi-user Telegram Bot integration using **Stateless Webhooks** compatible with **Vercel Serverless Functions (Free Tier)**. Users will link their Perbudge accounts to a single Telegram bot via Deep Linking (`?start=<token>`) and log/manage expenses directly from Telegram using shorthand text commands and Inline Keyboard buttons.

---

## 2. Environment Variables

Add the following variables to `.env` / `.env.local` and Vercel project settings:

```env
TELEGRAM_BOT_TOKEN="your_bot_token_from_botfather"
TELEGRAM_BOT_USERNAME="your_bot_username_without_at"
TELEGRAM_WEBHOOK_SECRET="random_32_char_secret_string"

```

---

## 3. Database Schema Changes (PostgreSQL)

Update the `users` table (via migration or schema file) to support Telegram account linking:

1. Add `telegram_chat_id` (`BIGINT`, `UNIQUE`, `NULLABLE`) — Stores the user's permanent Telegram Chat ID.
2. Add `telegram_link_token` (`VARCHAR(64)`, `UNIQUE`, `NULLABLE`) — Stores a temporary one-time token for linking the account.
3. Add an index on `telegram_chat_id` for fast webhook lookups.

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT UNIQUE,
ADD COLUMN IF NOT EXISTS telegram_link_token VARCHAR(64) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_telegram_chat_id ON users(telegram_chat_id);

```

---

## 4. Feature 1: Account Linking API & UI (Web Dashboard)

### 4.1 Backend Endpoint: `POST /api/telegram/link`

- **Auth:** Requires authenticated session (`user_id`).
- **Action:**

1. Generate a secure random token: `const token = 'link_' + crypto.randomBytes(16).toString('hex')`.
2. Update the logged-in user's record in `users`:

```sql
UPDATE users SET telegram_link_token = $1 WHERE id = $2;

```

3. Return the Telegram Deep Link URL:

```json
{
  "url": "[https://t.me/](https://t.me/)<TELEGRAM_BOT_USERNAME>?start=<token>",
  "isLinked": false
}
```

### 4.2 Backend Endpoint: `DELETE /api/telegram/link`

- **Auth:** Requires authenticated session (`user_id`).
- **Action:** Clears `telegram_chat_id = NULL` and `telegram_link_token = NULL` for the current user so they can unlink their Telegram account.

### 4.3 Frontend UI (Settings / Profile Page)

- Display a **"Connect Telegram"** card in the user settings/dashboard.
- If `user.telegram_chat_id` is `NULL`: Show a **"Connect Telegram Bot"** button that calls `POST /api/telegram/link` and opens the returned `https://t.me/...` URL in a new tab.
- If `user.telegram_chat_id` is present: Show a green **"Connected to Telegram"** badge and an **"Unlink"** button.

---

## 5. Feature 2: Expense Text Parser Utility

Create a utility module `lib/telegram-parser.ts` that parses single-line shorthand messages into structured expense data.

### Supported Input Formats:

- `250 biryani` -> `{ amount: 250, description: "biryani", categoryName: null, date: <msgDate> }`
- `150 coffee #food` -> `{ amount: 150, description: "coffee", categoryName: "food", date: <msgDate> }`
- `500 petrol #travel yest` -> `{ amount: 500, description: "petrol", categoryName: "travel", date: <yesterday> }`
- `1200 wifi #bills 18/10` -> `{ amount: 1200, description: "wifi", categoryName: "bills", date: <Oct 18> }`

### Parser Rules:

1. **Timestamp Handling (Offline Support):** Base the default date on Telegram's `message.date` (Unix timestamp in seconds $\times 1000$), falling back to `new Date()`.
2. **Date Overrides:**

- If the text contains standalone `yest`, `yesterday`, or `-1d` (case-insensitive), subtract 1 day from the base date and strip the keyword.
- If the text contains `DD/MM` (e.g., `18/10`), set the day and month accordingly on the current year and strip the token.

3. **Category Extraction:**

- Match `/#(\w+)/i`. If found, extract `match[1].toLowerCase()` as `categoryName` and strip `#<category>` from the text.

4. **Amount Extraction:**

- Match the first valid number `/\b(\d+(?:\.\d{1,2})?)\b/`. If no number is found, return `null` (invalid expense format). Strip the matched amount from the text.

5. **Description Extraction:**

- Trim remaining whitespace. Collapse multiple spaces into one. If empty, default to `"Quick Expense"`.

---

## 6. Feature 3: Telegram Webhook Endpoint

Create the webhook route at `app/api/telegram/webhook/route.ts` (or equivalent backend controller).

### Critical Serverless Rules (Vercel Compatibility):

1. **Verify Secret Header:** Check `req.headers.get('x-telegram-bot-api-secret-token') === process.env.TELEGRAM_WEBHOOK_SECRET`. Return `401` if invalid.
2. **Always `await` All Promises:** Never use fire-and-forget async calls; `await` all DB queries and `fetch` calls to Telegram before returning the response.
3. **Global `try / catch` Returning `200 OK`:** Always return HTTP status `200` inside the `catch` block so Telegram does not infinitely retry failed messages.

### Webhook Flows to Handle:

#### Flow A: `/start <token>` (Account Linking)

- Triggered when `body.message?.text?.startsWith('/start')`.
- Extract `<token>` from `body.message.text.split(' ')[1]`.
- If no token is provided, reply: _"👋 Welcome to Perbudge! Please open your web dashboard settings and click 'Connect Telegram' to link your account."_
- If token is present, run:

```sql
UPDATE users
SET telegram_chat_id = $1, telegram_link_token = NULL
WHERE telegram_link_token = $2
RETURNING id, name;

```

- If matched, reply: _"✅ Account linked! Hi , send an expense like `250 biryani` or `150 coffee #food` to log it immediately."_
- If not matched, reply: _"❌ Invalid or expired linking token. Please generate a new link from your dashboard."_

#### Flow B: Utility Commands (`/help`, `/today`, `/month`)

- Before processing any non-`/start` message, look up the user:

```sql
SELECT id, name FROM users WHERE telegram_chat_id = $1;

```

- If no user is found, reply: _"🔒 Your Telegram is not linked to a Perbudge account. Please connect it from your web dashboard."_
- **`/today`**: Query total expenses for `user_id` where date is today, reply with total amount and count of items.
- **`/month`**: Query total expenses for `user_id` in the current month, reply with total amount.

#### Flow C: Logging an Expense (Standard Text Message)

1. Parse `body.message.text` using `parseExpenseMessage(text, body.message.date)`.
2. If parser returns `null`, reply with usage instructions: _"⚠️ Format: `<amount> <description> [#category]` (e.g., `250 biryani`)"_.
3. **Smart Category Resolution:**

- Fetch the user's available categories from the DB (or standard app categories).
- **Priority 1:** If `parsed.categoryName` was provided via `#hashtag`, case-insensitively match it against the user's categories.
- **Priority 2 (Auto-Categorization from History):** If no `#hashtag` was provided, check the user's most recent expense with the exact same description:

```sql
SELECT category_id, category FROM expenses
WHERE user_id = $1 AND LOWER(TRIM(description)) = LOWER(TRIM($2))
ORDER BY created_at DESC LIMIT 1;

```

4. **Insert into Database:**

- Insert the expense into the `expenses` table scoped strictly to `user_id`.

5. **Send Confirmation & Inline Keyboard:**

- If a category was resolved (either via `#hashtag` or history auto-match), send a message showing the saved expense, the category, a `[ 🔄 Change Category ]` button, and an `[ ❌ Undo ]` button.
- If no category was resolved, send the saved expense message along with **Inline Keyboard Buttons** displaying the user's categories (`callback_data: "cat:<expenseId>:<categoryIdOrName>"`) and an `[ ❌ Undo ]` button (`callback_data: "del:<expenseId>"`).

#### Flow D: Handling Inline Button Clicks (`body.callback_query`)

1. Extract `chatId = body.callback_query.message.chat.id`, `messageId = body.callback_query.message.message_id`, and `data = body.callback_query.data`.
2. Parse `const [action, expenseId, value] = data.split(':')`.
3. **Security Constraint:** Every `UPDATE` or `DELETE` query MUST enforce ownership via `user_id = (SELECT id FROM users WHERE telegram_chat_id = $chatId)` in the `WHERE` clause so users can never modify another user's records.
4. **If `action === 'cat'`:**

- Update the expense's category in the DB.
- Call Telegram `editMessageText` API to update the message in place: `✅ Saved ₹<amount> — <description> • <categoryName>` and keep only a small `[ ❌ Undo ]` button.

5. **If `action === 'del'`:**

- Delete the expense from the DB where `id = expenseId` and `user_id` matches `chatId`.
- Call Telegram `editMessageText` API to replace the message with: `🗑️ Expense deleted.`

6. Always call Telegram's `answerCallbackQuery` endpoint at the end to stop the button loading spinner on the client.

---

## 7. Helper Script: Registering the Webhook

Create a setup script or admin API endpoint `GET /api/telegram/setup` (protected by secret query param) that registers the webhook with Telegram:

```typescript
const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;
const response = await fetch(`[https://api.telegram.org/bot$](https://api.telegram.org/bot$){process.env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: webhookUrl,
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ['message', 'callback_query'],
  }),
});

```

---

## 8. Acceptance Criteria for Agent

- [ ] Existing database schema is inspected first so column names (`expenses`, `categories`, `users`) match the existing codebase conventions.
- [ ] All SQL queries use parameterized inputs and strictly scope operations by `user_id`.
- [ ] All Telegram HTTP calls (`sendMessage`, `editMessageText`, `answerCallbackQuery`) are awaited before returning `NextResponse.json({ ok: true })`.
- [ ] Zero third-party Telegram bot libraries are installed; use native `fetch` to keep serverless cold starts fast.

```

---

```
