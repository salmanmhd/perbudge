export interface ParsedExpense {
  amount: number;
  description: string;
  categoryName: string | null;
  date: Date;
}

/**
 * Parses shorthand Telegram expense messages into structured data.
 *
 * Supported formats:
 * - "250 biryani" -> amount: 250, description: "biryani", category: null
 * - "150 coffee #food" -> amount: 150, description: "coffee", category: "food"
 * - "500 petrol #travel yest" -> amount: 500, description: "petrol", category: "travel", date: yesterday
 * - "1200 wifi #bills 18/10" -> amount: 1200, description: "wifi", category: "bills", date: Oct 18
 */
export function parseExpenseMessage(
  text: string,
  messageDateSec?: number
): ParsedExpense | null {
  if (!text || typeof text !== "string") {
    return null;
  }

  let remaining = text.trim();
  if (!remaining) return null;

  // 1. Timestamp handling: start from Telegram message date or current date
  let date = messageDateSec ? new Date(messageDateSec * 1000) : new Date();
  if (isNaN(date.getTime())) {
    date = new Date();
  }

  // 2. Date overrides
  // Yesterday keywords: yest, yesterday, -1d
  const yestMatch = remaining.match(/\b(yesterday|yest|-1d)\b/i);
  if (yestMatch) {
    date = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    remaining = remaining.replace(yestMatch[0], " ");
  }

  // DD/MM or DD/MM/YYYY format
  const dateMatch = remaining.match(/\b([0-3]?\d)\/([0-1]?\d)(?:\/(\d{2,4}))?\b/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1; // 0-indexed in JS Date
    let year = date.getFullYear();
    if (dateMatch[3]) {
      const parsedYear = parseInt(dateMatch[3], 10);
      year = parsedYear < 100 ? 2000 + parsedYear : parsedYear;
    }

    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      date = new Date(year, month, day, date.getHours(), date.getMinutes(), date.getSeconds());
      remaining = remaining.replace(dateMatch[0], " ");
    }
  }

  // 3. Category extraction: #category
  let categoryName: string | null = null;
  const categoryMatch = remaining.match(/#(\w+)/i);
  if (categoryMatch) {
    categoryName = categoryMatch[1].toLowerCase();
    remaining = remaining.replace(categoryMatch[0], " ");
  }

  // 4. Amount extraction: match currency symbol + number or plain number
  // Notice we check after stripping DD/MM so date slashes aren't parsed as amount
  const amountRegex = /(?:^|\s)(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)(?!\S)/i;
  const amountMatch = remaining.match(amountRegex);

  if (!amountMatch) {
    return null;
  }

  const amount = parseFloat(amountMatch[1]);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  // Remove the matched amount chunk from remaining text
  remaining = remaining.replace(amountMatch[0], " ");

  // 5. Description extraction: clean up remaining text
  let description = remaining
    .replace(/[₹]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!description) {
    description = "Quick Expense";
  }

  return {
    amount,
    description,
    categoryName,
    date,
  };
}
