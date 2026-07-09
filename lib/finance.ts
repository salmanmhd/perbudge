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
    // Show paise only when the amount actually has them: ₹500 stays ₹500,
    // but ₹10.29 renders in full.
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Round a money value to 2 decimal places, killing binary-float noise. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Sanitize a raw text field into a valid money string: digits with at most one
 * decimal point and two decimal places. Safe to use directly in a controlled
 * input's onChange. Empty string stays empty.
 */
export function sanitizeAmountInput(raw: string): string {
  let s = raw.replace(/[^0-9.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    const intPart = s.slice(0, firstDot);
    const decPart = s.slice(firstDot + 1).replace(/\./g, "").slice(0, 2);
    s = `${intPart}.${decPart}`;
  }
  return s;
}

/** Digits-only sanitizer for whole-number fields (days, counts, tenure). */
export function sanitizeIntInput(raw: string, maxLen?: number): string {
  const s = raw.replace(/[^0-9]/g, "");
  return maxLen ? s.slice(0, maxLen) : s;
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

/* ── Payoff trajectory ───────────────────────────────────────── */

export interface TrajectoryPoint {
  /** e.g. "Jul '26" */
  label: string;
  /** Total outstanding across all loans at the start of this month. */
  outstanding: number;
  /** EMI outflow due during this month (steps down as loans close). */
  outflow: number;
}

export interface LoanTrajectory {
  points: TrajectoryPoint[];
  /** Month of the final payment across all loans. */
  debtFreeLabel: string | null;
  monthsToDebtFree: number;
  totalOutstanding: number;
  currentMonthlyOutflow: number;
  /** When each loan closes and the monthly EMI it frees up. Soonest first. */
  freedEvents: { name: string; label: string; emiFreed: number }[];
}

/**
 * Project the month-by-month payoff of a set of loans, assuming one EMI paid
 * per month. Outstanding uses the same schedule model as loanOutstanding
 * (remaining EMIs × amount), so the trajectory ends exactly at ₹0.
 */
export function loanPayoffTrajectory(
  loans: { name: string; emiAmount: number; remainingEmis: number }[],
  from: Date = new Date()
): LoanTrajectory {
  const active = loans.filter((l) => l.remainingEmis > 0 && l.emiAmount > 0);
  const maxMonths = active.reduce((m, l) => Math.max(m, l.remainingEmis), 0);

  const monthLabel = (offset: number) => {
    const d = new Date(from.getFullYear(), from.getMonth() + offset, 1);
    return new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" })
      .format(d)
      .replace(/ (\d)/, " '$1");
  };

  const points: TrajectoryPoint[] = [];
  for (let m = 0; m <= maxMonths; m++) {
    let outstanding = 0;
    let outflow = 0;
    for (const l of active) {
      const left = Math.max(0, l.remainingEmis - m);
      outstanding += left * l.emiAmount;
      if (left > 0) outflow += l.emiAmount;
    }
    points.push({ label: monthLabel(m), outstanding: round2(outstanding), outflow: round2(outflow) });
  }

  const freedEvents = active
    .map((l) => ({ name: l.name, order: l.remainingEmis, emiFreed: l.emiAmount, label: monthLabel(l.remainingEmis - 1) }))
    .sort((a, b) => a.order - b.order)
    .map(({ name, label, emiFreed }) => ({ name, label, emiFreed }));

  return {
    points,
    debtFreeLabel: maxMonths > 0 ? monthLabel(maxMonths - 1) : null,
    monthsToDebtFree: maxMonths,
    totalOutstanding: points[0]?.outstanding ?? 0,
    currentMonthlyOutflow: points[0]?.outflow ?? 0,
    freedEvents,
  };
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
