/**
 * Pure, dependency-free finance helpers shared across pages, AI context,
 * and the weekly email report. No "use server" — safe to import anywhere.
 */

export function formatINR(amount: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && Math.abs(amount) >= 100000) {
    // Indian short scale: lakh / crore
    if (Math.abs(amount) >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)}Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ── 50 / 30 / 20 classification ─────────────────────────────── */

export type BudgetBucket = "needs" | "wants" | "savings";

const NEEDS = new Set([
  "rent",
  "bills",
  "food",
  "health",
  "transport",
  "education",
]);
const WANTS = new Set(["entertainment", "shopping", "others"]);

export function bucketForCategory(category: string): BudgetBucket {
  const key = category.toLowerCase();
  if (NEEDS.has(key)) return "needs";
  if (WANTS.has(key)) return "wants";
  return "wants";
}

export const BUDGET_METHOD_SPLIT: Record<
  string,
  { needs: number; wants: number; savings: number }
> = {
  "50-30-20": { needs: 50, wants: 30, savings: 20 },
};

/* ── Loan / EMI math ─────────────────────────────────────────── */

export interface LoanLike {
  emiAmount: number;
  tenureMonths: number;
  emisPaid: number;
  principal: number;
  dueDay: number;
  status?: string;
}

/** Remaining EMIs left to pay. */
export function loanRemainingEmis(loan: LoanLike): number {
  return Math.max(0, loan.tenureMonths - loan.emisPaid);
}

/** Simple outstanding estimate = remaining EMIs × EMI amount. */
export function loanOutstanding(loan: LoanLike): number {
  return loanRemainingEmis(loan) * loan.emiAmount;
}

export function loanProgressPct(loan: LoanLike): number {
  if (loan.tenureMonths <= 0) return 0;
  return Math.min(100, Math.round((loan.emisPaid / loan.tenureMonths) * 100));
}

/* ── Credit-card / due-date helpers ──────────────────────────── */

/**
 * Next occurrence of a given day-of-month, relative to `from`.
 * Returns the upcoming date (today counts as upcoming).
 */
export function nextDueDate(dayOfMonth: number, from: Date = new Date()): Date {
  const year = from.getFullYear();
  const month = from.getMonth();
  const day = from.getDate();
  // Clamp for short months (e.g. due day 31 in Feb).
  const daysInThisMonth = new Date(year, month + 1, 0).getDate();
  const thisMonthDay = Math.min(dayOfMonth, daysInThisMonth);
  if (thisMonthDay >= day) return new Date(year, month, thisMonthDay);
  const daysInNextMonth = new Date(year, month + 2, 0).getDate();
  return new Date(year, month + 1, Math.min(dayOfMonth, daysInNextMonth));
}

export function daysUntil(date: Date, from: Date = new Date()): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/* ── Ledger helpers ──────────────────────────────────────────── */

export interface LedgerLike {
  direction: "receivable" | "payable";
  amount: number;
  settledAmount: number;
  status: "open" | "settled";
}

export function ledgerOutstanding(entry: LedgerLike): number {
  return Math.max(0, entry.amount - entry.settledAmount);
}
