"use server";

import { revalidatePath } from "next/cache";
import { ensureUserInDb } from "@/lib/actions/dashboard-data";
import Loan from "@/lib/models/loan";
import Transaction from "@/lib/models/transaction";
import {
  loanOutstanding,
  loanRemainingEmis,
  loanProgressPct,
  nextDueDate,
} from "@/lib/finance";

export interface LoanView {
  _id: string;
  name: string;
  lender?: string;
  principal: number;
  emiAmount: number;
  interestRate?: number;
  tenureMonths: number;
  emisPaid: number;
  dueDay: number;
  startDate: string;
  status: "active" | "closed";
  notes?: string;
  // derived
  remainingEmis: number;
  outstanding: number;
  progressPct: number;
  nextDueISO: string;
}

function toView(loan: any): LoanView {
  return {
    _id: String(loan._id),
    name: loan.name,
    lender: loan.lender,
    principal: loan.principal,
    emiAmount: loan.emiAmount,
    interestRate: loan.interestRate,
    tenureMonths: loan.tenureMonths,
    emisPaid: loan.emisPaid,
    dueDay: loan.dueDay,
    startDate: new Date(loan.startDate).toISOString(),
    status: loan.status,
    notes: loan.notes,
    remainingEmis: loanRemainingEmis(loan),
    outstanding: loanOutstanding(loan),
    progressPct: loanProgressPct(loan),
    nextDueISO: nextDueDate(loan.dueDay).toISOString(),
  };
}

export async function getLoans(): Promise<LoanView[]> {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return [];

  const loans = await Loan.find({ userId: userObjectId })
    .sort({ status: 1, createdAt: -1 })
    .lean();

  return (loans as any[]).map(toView);
}

/** Total EMI outflow per month across all active loans. */
export async function getMonthlyEmiTotal(): Promise<number> {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return 0;

  const agg = await Loan.aggregate([
    { $match: { userId: userObjectId, status: "active" } },
    { $group: { _id: null, total: { $sum: "$emiAmount" } } },
  ]);
  return agg[0]?.total || 0;
}

export async function createLoan(data: {
  name: string;
  lender?: string;
  principal: number;
  emiAmount: number;
  interestRate?: number;
  tenureMonths: number;
  emisPaid?: number;
  dueDay: number;
  startDate?: string;
  notes?: string;
}) {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };

  try {
    await Loan.create({
      userId: userObjectId,
      ...data,
      emisPaid: data.emisPaid || 0,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
    });
    revalidatePath("/dashboard/loans");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("createLoan error:", error);
    return { success: false, error: error.message || "Failed to add loan." };
  }
}

/**
 * Record one EMI as paid: increments emisPaid, optionally logs a matching
 * expense transaction, and auto-closes the loan when fully paid.
 */
export async function payEmi(id: string, logTransaction = true) {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };

  const loan = await Loan.findOne({ _id: id, userId: userObjectId });
  if (!loan) return { success: false, error: "Loan not found" };
  if (loan.emisPaid >= loan.tenureMonths) {
    return { success: false, error: "All EMIs already paid" };
  }

  loan.emisPaid += 1;
  if (loan.emisPaid >= loan.tenureMonths) loan.status = "closed";
  await loan.save();

  if (logTransaction) {
    await Transaction.create({
      userId: userObjectId,
      amount: loan.emiAmount,
      category: loan.category || "bills",
      type: "expense",
      paymentMode: "cash",
      note: `EMI: ${loan.name}`,
      isRecurring: true,
      date: new Date(),
    });
  }

  revalidatePath("/dashboard/loans");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  return { success: true };
}

export async function deleteLoan(id: string) {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };
  await Loan.deleteOne({ _id: id, userId: userObjectId });
  revalidatePath("/dashboard/loans");
  return { success: true };
}
