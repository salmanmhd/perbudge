"use server";

import { getFinancialSnapshot } from "@/lib/actions/finance-snapshot";

export type VitalTone = "good" | "watch" | "urgent";

export interface Vital {
  key: string;
  label: string;
  /** Pre-formatted display value, e.g. "18%" or "₹12,340". */
  display: string;
  tone: VitalTone;
  /** Short context line, e.g. "target 20%". */
  sub?: string;
}

export interface FinancialPosition {
  hasData: boolean;
  /** Stated monthly income, falling back to income logged this month. */
  income: number;
  monthIncome: number;
  monthExpense: number;
  monthlyEmiTotal: number;
  loansOutstanding: number;
  cardDues: number;
  receivable: number;
  payable: number;
  /** receivable − (payable + loans outstanding + card dues). Assets excluded. */
  netPosition: number;
  vitals: Vital[];
}

export async function getFinancialPosition(): Promise<FinancialPosition | null> {
  const s = await getFinancialSnapshot();
  if (!s) return null;

  const income = s.monthlyIncome || s.monthIncome || 0;
  const loansOutstanding = s.loans.reduce((a, l) => a + l.outstanding, 0);
  const cardDues = s.creditCards.reduce((a, c) => a + c.cycleSpend, 0);
  const totalLimit = s.creditCards.reduce((a, c) => a + (c.creditLimit || 0), 0);

  const utilizationPct = totalLimit > 0 ? Math.round((cardDues / totalLimit) * 100) : null;
  const cashFlow = s.monthIncome - s.monthExpense;
  const savingsRate = income > 0 ? Math.round(((income - s.monthExpense) / income) * 100) : 0;
  const emiLoadPct = income > 0 ? Math.round((s.monthlyEmiTotal / income) * 100) : 0;
  const netPosition = s.receivable - s.payable - loansOutstanding - cardDues;

  const inr = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const vitals: Vital[] = [];

  // Savings rate — the headline health number.
  vitals.push({
    key: "savings",
    label: "Savings rate",
    display: `${savingsRate}%`,
    sub: `target ${s.savingsTargetPct}%`,
    tone: income === 0 ? "watch" : savingsRate >= s.savingsTargetPct ? "good" : savingsRate >= 0 ? "watch" : "urgent",
  });

  // EMI load — debt pressure against income.
  if (s.monthlyEmiTotal > 0) {
    vitals.push({
      key: "emi",
      label: "EMI load",
      display: income > 0 ? `${emiLoadPct}%` : inr(s.monthlyEmiTotal),
      sub: income > 0 ? "of income" : "per month",
      tone: emiLoadPct > 40 ? "urgent" : emiLoadPct > 30 ? "watch" : "good",
    });
  }

  // Credit utilization.
  if (utilizationPct !== null) {
    vitals.push({
      key: "util",
      label: "Card utilization",
      display: `${utilizationPct}%`,
      sub: `${inr(cardDues)} of ${inr(totalLimit)}`,
      tone: utilizationPct >= 70 ? "urgent" : utilizationPct >= 40 ? "watch" : "good",
    });
  }

  // Cash flow this month.
  vitals.push({
    key: "cashflow",
    label: "Cash flow",
    display: inr(cashFlow),
    sub: "income − spend, this month",
    tone: cashFlow >= 0 ? "good" : "urgent",
  });

  // Money owed net.
  if (s.receivable > 0 || s.payable > 0) {
    const net = s.receivable - s.payable;
    vitals.push({
      key: "owed",
      label: "Money owed (net)",
      display: inr(net),
      sub: net >= 0 ? "owed to you" : "you owe",
      tone: net >= 0 ? "good" : "watch",
    });
  }

  // Outstanding loans.
  if (loansOutstanding > 0) {
    vitals.push({
      key: "loans",
      label: "Loans outstanding",
      display: inr(loansOutstanding),
      sub: "remaining balance",
      tone: "watch",
    });
  }

  return {
    hasData: s.recentCount > 0,
    income,
    monthIncome: s.monthIncome,
    monthExpense: s.monthExpense,
    monthlyEmiTotal: s.monthlyEmiTotal,
    loansOutstanding,
    cardDues,
    receivable: s.receivable,
    payable: s.payable,
    netPosition,
    vitals,
  };
}
