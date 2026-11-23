"use server";

import { revalidatePath } from "next/cache";
import { ensureUserInDb } from "@/lib/actions/dashboard-data";
import Transaction from "@/lib/models/transaction";
import type { ITransaction, PaymentMode } from "@/lib/models/transaction";
import { round2 } from "@/lib/finance";
import { errorMessage } from "@/lib/errors";

export async function createTransaction(data: {
  amount: number;
  category: string;
  type: "income" | "expense" | "transfer";
  paymentMode?: PaymentMode;
  accountId?: string;
  note?: string;
  counterparty?: string;
  isRecurring: boolean;
  date?: string;
}) {
  try {
    const userObjectId = await ensureUserInDb();
    if (!userObjectId) {
      return { success: false, error: "Unauthorized" };
    }

    const amount = round2(Number(data.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: "Amount must be greater than 0." };
    }

    const newTx = await Transaction.create({
      userId: userObjectId,
      amount,
      category: data.category,
      type: data.type,
      paymentMode: data.paymentMode || "cash",
      accountId: data.accountId || undefined,
      note: data.note,
      counterparty: data.counterparty,
      isRecurring: data.isRecurring,
      date: data.date ? new Date(data.date) : new Date(),
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");

    return { success: true, data: JSON.parse(JSON.stringify(newTx)) };
  } catch (error) {
    console.error("Failed to create transaction:", error);
    return { success: false, error: errorMessage(error) || "Failed to save transaction." };
  }
}

export async function updateTransaction(
  transactionId: string,
  data: {
    amount?: number;
    category?: string;
    type?: "income" | "expense" | "transfer";
    paymentMode?: PaymentMode;
    note?: string;
    counterparty?: string;
    isRecurring?: boolean;
    date?: string;
  }
) {
  try {
    const userObjectId = await ensureUserInDb();
    if (!userObjectId) {
      return { success: false, error: "Unauthorized" };
    }

    const tx = await Transaction.findOne({ _id: transactionId, userId: userObjectId });
    if (!tx) {
      return { success: false, error: "Transaction not found" };
    }

    if (data.amount !== undefined && !(Number(data.amount) > 0)) {
      return { success: false, error: "Amount must be greater than 0" };
    }
    if (data.type !== undefined && !["income", "expense", "transfer"].includes(data.type)) {
      return { success: false, error: "Invalid type" };
    }
    if (data.category !== undefined && !data.category.trim()) {
      return { success: false, error: "Category is required" };
    }
    if (data.date !== undefined && Number.isNaN(new Date(data.date).getTime())) {
      return { success: false, error: "Invalid date" };
    }

    const updateFields: Partial<ITransaction> = {};
    if (data.amount !== undefined) updateFields.amount = round2(Number(data.amount));
    if (data.category !== undefined) updateFields.category = data.category;
    if (data.type !== undefined) updateFields.type = data.type;
    if (data.paymentMode !== undefined) updateFields.paymentMode = data.paymentMode;
    if (data.note !== undefined) updateFields.note = data.note;
    if (data.counterparty !== undefined) updateFields.counterparty = data.counterparty;
    if (data.isRecurring !== undefined) updateFields.isRecurring = data.isRecurring;
    if (data.date !== undefined) updateFields.date = new Date(data.date);

    await Transaction.updateOne({ _id: transactionId }, { $set: updateFields });

    revalidatePath("/dashboard", "layout");

    return { success: true };
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return { success: false, error: errorMessage(error) || "Failed to update transaction." };
  }
}

