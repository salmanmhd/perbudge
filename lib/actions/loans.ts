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
  round2,
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

export interface LoanInput {
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
}

/**
 * Validate + normalise a loan payload. Returns a cleaned object ready for the
 * DB, or an error string describing the first problem. Amounts are rounded to
 * paise; counts/days are floored to integers so bad client input can't reach
 * Mongoose (which otherwise fails with a cryptic ValidationError).
 */
function normalizeLoan(data: LoanInput): { value?: any; error?: string } {
  const name = (data.name || "").trim();
  if (!name) return { error: "Give the loan a name." };

  const emiAmount = round2(Number(data.emiAmount));
  if (!Number.isFinite(emiAmount) || emiAmount <= 0)
    return { error: "Monthly EMI must be a number greater than 0." };

  const tenureMonths = Math.floor(Number(data.tenureMonths));
  if (!Number.isFinite(tenureMonths) || tenureMonths < 1)
    return { error: "Total EMIs must be at least 1." };

  const emisPaid = Math.max(0, Math.floor(Number(data.emisPaid) || 0));
  if (emisPaid > tenureMonths)
    return { error: "EMIs paid can't exceed the total number of EMIs." };

  const dueDay = Math.floor(Number(data.dueDay));
  if (!Number.isFinite(dueDay) || dueDay < 1 || dueDay > 31)
    return { error: "Due day must be between 1 and 31." };

  const principalRaw = round2(Number(data.principal));
  const principal =
    Number.isFinite(principalRaw) && principalRaw > 0
      ? principalRaw
      : round2(emiAmount * tenureMonths);

  return {
    value: {
      name,
      lender: data.lender?.trim() || undefined,
      principal,
      emiAmount,
      interestRate:
        data.interestRate != null && Number.isFinite(Number(data.interestRate))
          ? Number(data.interestRate)
          : undefined,
      tenureMonths,
      emisPaid,
      dueDay,
      notes: data.notes?.trim() || undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
    },
  };
}

export async function createLoan(data: LoanInput) {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };

  const { value, error } = normalizeLoan(data);
  if (error) return { success: false, error };

  try {
    await Loan.create({
      userId: userObjectId,
      ...value,
      status: value.emisPaid >= value.tenureMonths ? "closed" : "active",
      startDate: value.startDate || new Date(),
    });
    revalidatePath("/dashboard/loans");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("createLoan error:", error);
    return { success: false, error: error.message || "Failed to add loan." };
  }
}

/** Edit an existing loan's details (fix a typo, revise EMI count, etc.). */
export async function updateLoan(id: string, data: LoanInput) {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };

  const { value, error } = normalizeLoan(data);
  if (error) return { success: false, error };

  try {
    const loan = await Loan.findOne({ _id: id, userId: userObjectId });
    if (!loan) return { success: false, error: "Loan not found." };

    loan.name = value.name;
    loan.lender = value.lender;
    loan.principal = value.principal;
    loan.emiAmount = value.emiAmount;
    loan.interestRate = value.interestRate;
    loan.tenureMonths = value.tenureMonths;
    loan.emisPaid = value.emisPaid;
    loan.dueDay = value.dueDay;
    loan.notes = value.notes;
    if (value.startDate) loan.startDate = value.startDate;
    loan.status = value.emisPaid >= value.tenureMonths ? "closed" : "active";
    await loan.save();

    revalidatePath("/dashboard/loans");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("updateLoan error:", error);
    return { success: false, error: error.message || "Failed to update loan." };
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
