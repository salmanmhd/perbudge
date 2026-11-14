"use server";

import { ensureUserInDb } from "./dashboard-data";
import type mongoose from "mongoose";
import Transaction, { type ITransaction } from "@/lib/models/transaction";

export async function getAllTransactions(filters?: {
  type?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { transactions: [], total: 0 };

  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  const query: mongoose.QueryFilter<ITransaction> = { userId: userObjectId };

  if (filters?.type && filters.type !== "all") {
    query.type = filters.type as ITransaction["type"];
  }
  if (filters?.category) {
    query.category = { $regex: filters.category, $options: "i" };
  }
  if (filters?.search) {
    query.$or = [
      { category: { $regex: filters.search, $options: "i" } },
      { counterparty: { $regex: filters.search, $options: "i" } },
    ];
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(query).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    Transaction.countDocuments(query),
  ]);

  return {
    transactions: JSON.parse(JSON.stringify(transactions)),
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export async function deleteTransaction(transactionId: string) {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };

  const tx = await Transaction.findOne({ _id: transactionId, userId: userObjectId });
  if (!tx) return { success: false, error: "Transaction not found" };

  await Transaction.deleteOne({ _id: transactionId, userId: userObjectId });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");

  return { success: true };
}
