"use server";

import { ensureUserInDb } from "./dashboard-data";
import Transaction from "@/lib/models/transaction";

export async function getUserTransactionContext() {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return null;

  // Fetch the last 100 transactions to give the AI a comprehensive view
  const transactions = await Transaction.find({ userId: userObjectId })
    .sort({ date: -1 })
    .limit(100)
    .lean();

  if (!transactions.length) {
    return "The user has no recorded transactions yet.";
  }

  // Format as simple text for token efficiency
  let contextText = "User's Recent Transactions:\n";
  contextText += "Date | Type | Category | Amount | Counterparty\n";
  
  transactions.forEach((tx) => {
    const d = new Date(tx.date).toLocaleDateString("en-IN");
    contextText += `${d} | ${tx.type} | ${tx.category} | ${tx.amount} | ${tx.counterparty || 'N/A'}\n`;
  });

  return contextText;
}
