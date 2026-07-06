import mongoose from "mongoose";
import { ensureUserInDb } from "@/lib/actions/dashboard-data";
import Transaction from "@/lib/models/transaction";
import Loan from "@/lib/models/loan";
import Account from "@/lib/models/account";
import Ledger from "@/lib/models/ledger";
import User from "@/lib/models/user";
import { auth } from "@clerk/nextjs/server";
import {
  formatINR,
  loanOutstanding,
  loanRemainingEmis,
  ledgerOutstanding,
  bucketForCategory,
} from "@/lib/finance";

export interface FinancialSnapshot {
  displayName: string;
  monthlyIncome: number;
  savingsTargetPct: number;
  financialGoals?: string;
  monthIncome: number;
  monthExpense: number;
  categorySpend: { category: string; amount: number }[];
  bucketSpend: { needs: number; wants: number; savings: number };
  monthlyEmiTotal: number;
  loans: { name: string; emiAmount: number; remainingEmis: number; outstanding: number }[];
  creditCards: { name: string; cycleSpend: number; creditLimit?: number; utilizationPct?: number }[];
  receivable: number;
  payable: number;
  recentCount: number;
}

/**
 * Core snapshot computation for a resolved user. No auth/session dependency —
 * safe to call from the weekly-report cron for any user.
 */
export async function computeSnapshotForUser(
  userObjectId: mongoose.Types.ObjectId,
  userDoc: any
): Promise<FinancialSnapshot> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthTx, loans, cards, ledgerRows, recentCount, ccSpendAgg] =
    await Promise.all([
      Transaction.find({ userId: userObjectId, date: { $gte: startOfMonth } }).lean(),
      Loan.find({ userId: userObjectId, status: "active" }).lean(),
      Account.find({ userId: userObjectId, type: "credit_card", archived: false }).lean(),
      Ledger.find({ userId: userObjectId, status: "open" }).lean(),
      Transaction.countDocuments({ userId: userObjectId }),
      Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            type: "expense",
            paymentMode: "credit_card",
            date: { $gte: startOfMonth },
          },
        },
        { $group: { _id: "$accountId", total: { $sum: "$amount" } } },
      ]),
    ]);

  let monthIncome = 0;
  let monthExpense = 0;
  const catMap: Record<string, number> = {};
  const bucketSpend = { needs: 0, wants: 0, savings: 0 };

  for (const tx of monthTx as any[]) {
    if (tx.type === "income") monthIncome += tx.amount;
    else if (tx.type === "expense") {
      monthExpense += tx.amount;
      const c = String(tx.category).toLowerCase();
      catMap[c] = (catMap[c] || 0) + tx.amount;
      bucketSpend[bucketForCategory(c)] += tx.amount;
    }
  }

  const categorySpend = Object.entries(catMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const spendByCard: Record<string, number> = {};
  let genericCcSpend = 0;
  for (const r of ccSpendAgg as any[]) {
    if (r._id) spendByCard[String(r._id)] = r.total;
    else genericCcSpend += r.total;
  }

  const creditCards = (cards as any[]).map((c, i) => {
    const cycleSpend = spendByCard[String(c._id)] ?? (i === 0 ? genericCcSpend : 0);
    return {
      name: c.name,
      cycleSpend,
      creditLimit: c.creditLimit,
      utilizationPct:
        c.creditLimit && c.creditLimit > 0
          ? Math.round((cycleSpend / c.creditLimit) * 100)
          : undefined,
    };
  });

  let receivable = 0;
  let payable = 0;
  for (const e of ledgerRows as any[]) {
    const out = ledgerOutstanding(e);
    if (e.direction === "receivable") receivable += out;
    else payable += out;
  }

  const loanViews = (loans as any[]).map((l) => ({
    name: l.name,
    emiAmount: l.emiAmount,
    remainingEmis: loanRemainingEmis(l),
    outstanding: loanOutstanding(l),
  }));

  return {
    displayName: userDoc?.firstName || "there",
    monthlyIncome: userDoc?.monthlyIncome || 0,
    savingsTargetPct: userDoc?.savingsTargetPct ?? 20,
    financialGoals: userDoc?.financialGoals,
    monthIncome,
    monthExpense,
    categorySpend,
    bucketSpend,
    monthlyEmiTotal: loanViews.reduce((s, l) => s + l.emiAmount, 0),
    loans: loanViews,
    creditCards,
    receivable,
    payable,
    recentCount,
  };
}

/** Snapshot for the currently authenticated user. */
export async function getFinancialSnapshot(): Promise<FinancialSnapshot | null> {
  const userObjectId = await ensureUserInDb();
  const { userId } = await auth();
  if (!userObjectId || !userId) return null;
  const userDoc: any = await User.findOne({ clerkId: userId }).lean();
  return computeSnapshotForUser(userObjectId as any, userDoc);
}

/** Turn a snapshot into an LLM-readable brief. */
export function formatSnapshotContext(s: FinancialSnapshot): string {
  if (s.recentCount === 0) {
    return "The user has not recorded any financial data yet.";
  }
  const lines: string[] = [];
  lines.push(`User: ${s.displayName}. All amounts in INR (₹).`);
  if (s.monthlyIncome)
    lines.push(
      `Stated monthly income: ${formatINR(s.monthlyIncome)}. Savings target: ${s.savingsTargetPct}%.`
    );
  if (s.financialGoals) lines.push(`Their goals: ${s.financialGoals}`);

  lines.push("");
  lines.push("THIS MONTH SO FAR:");
  lines.push(`- Income logged: ${formatINR(s.monthIncome)}`);
  lines.push(`- Expenses: ${formatINR(s.monthExpense)}`);
  lines.push(
    `- 50/30/20 actuals — Needs: ${formatINR(s.bucketSpend.needs)}, Wants: ${formatINR(
      s.bucketSpend.wants
    )}`
  );
  if (s.categorySpend.length) {
    lines.push("- Top spending categories:");
    for (const c of s.categorySpend.slice(0, 6)) {
      lines.push(`    · ${c.category}: ${formatINR(c.amount)}`);
    }
  }
  if (s.loans.length) {
    lines.push("");
    lines.push(`EMIs / LOANS (monthly outflow ${formatINR(s.monthlyEmiTotal)}):`);
    for (const l of s.loans) {
      lines.push(
        `- ${l.name}: ${formatINR(l.emiAmount)}/mo, ${l.remainingEmis} EMIs left, ~${formatINR(
          l.outstanding
        )} outstanding`
      );
    }
  }
  if (s.creditCards.length) {
    lines.push("");
    lines.push("CREDIT CARDS:");
    for (const c of s.creditCards) {
      const util = c.utilizationPct !== undefined ? ` (${c.utilizationPct}% of limit)` : "";
      lines.push(`- ${c.name}: ${formatINR(c.cycleSpend)} spent this cycle${util}`);
    }
  }
  if (s.receivable || s.payable) {
    lines.push("");
    lines.push(
      `OWED: others owe them ${formatINR(s.receivable)}; they owe others ${formatINR(
        s.payable
      )}.`
    );
  }
  return lines.join("\n");
}

/** Convenience: context string for the current user. */
export async function buildAiContext(): Promise<string> {
  const s = await getFinancialSnapshot();
  if (!s || s.recentCount === 0) {
    return "The user has not recorded any financial data yet.";
  }
  return formatSnapshotContext(s);
}
