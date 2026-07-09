"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/db";
import { ensureUserInDb } from "@/lib/actions/dashboard-data";
import User from "@/lib/models/user";
import Transaction from "@/lib/models/transaction";
import { bucketForCategory, round2, type BudgetBucket } from "@/lib/finance";
import type { ICategoryBudget, BudgetMethod } from "@/lib/models/user";

export interface CategoryBudgetView {
  category: string;
  limit: number;
  spent: number;
}

export interface BucketView {
  bucket: BudgetBucket;
  targetPct: number;
  targetAmount: number;
  spent: number;
}

export interface BudgetPlan {
  monthlyIncome: number;
  budgetMethod: BudgetMethod;
  savingsTargetPct: number;
  financialGoals?: string;
  categoryBudgets: CategoryBudgetView[];
  buckets: BucketView[];
  totalSpent: number;
  totalBudgeted: number;
  /** income - totalSpent, i.e. what's left to save this month */
  projectedSavings: number;
  /** Day of month so far (1-based) and total days in this month. */
  daysElapsed: number;
  daysInMonth: number;
  /** Spend extrapolated to month-end at the current daily pace. */
  projectedMonthEndSpend: number;
}

async function monthCategorySpend(userObjectId: any): Promise<Record<string, number>> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const agg = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        type: "expense",
        date: { $gte: startOfMonth },
      },
    },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
  ]);
  const map: Record<string, number> = {};
  for (const r of agg) map[String(r._id).toLowerCase()] = r.total;
  return map;
}

export async function getBudgetPlan(): Promise<BudgetPlan> {
  const userObjectId = await ensureUserInDb();
  const { userId } = await auth();
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = now.getDate();
  const empty: BudgetPlan = {
    monthlyIncome: 0,
    budgetMethod: "50-30-20",
    savingsTargetPct: 20,
    categoryBudgets: [],
    buckets: [],
    totalSpent: 0,
    totalBudgeted: 0,
    projectedSavings: 0,
    daysElapsed,
    daysInMonth,
    projectedMonthEndSpend: 0,
  };
  if (!userObjectId || !userId) return empty;

  const user: any = await User.findOne({ clerkId: userId }).lean();
  const spendByCategory = await monthCategorySpend(userObjectId);

  const income = user?.monthlyIncome || 0;
  const method: BudgetMethod = user?.budgetMethod || "50-30-20";
  const savingsTargetPct = user?.savingsTargetPct ?? 20;

  const categoryBudgets: CategoryBudgetView[] = (user?.categoryBudgets || []).map(
    (cb: ICategoryBudget) => ({
      category: cb.category,
      limit: cb.limit,
      spent: spendByCategory[cb.category.toLowerCase()] || 0,
    })
  );

  // 50/30/20 buckets from live spend
  const bucketSpend: Record<BudgetBucket, number> = { needs: 0, wants: 0, savings: 0 };
  for (const [cat, amt] of Object.entries(spendByCategory)) {
    bucketSpend[bucketForCategory(cat)] += amt;
  }

  const buckets: BucketView[] = [
    { bucket: "needs", targetPct: 50, targetAmount: income * 0.5, spent: bucketSpend.needs },
    { bucket: "wants", targetPct: 30, targetAmount: income * 0.3, spent: bucketSpend.wants },
    { bucket: "savings", targetPct: 20, targetAmount: income * 0.2, spent: 0 },
  ];

  const totalSpent = Object.values(spendByCategory).reduce((a, b) => a + b, 0);
  const totalBudgeted = categoryBudgets.reduce((a, b) => a + b.limit, 0);
  const projectedMonthEndSpend =
    daysElapsed > 0 ? Math.round((totalSpent / daysElapsed) * daysInMonth) : totalSpent;

  return {
    monthlyIncome: income,
    budgetMethod: method,
    savingsTargetPct,
    financialGoals: user?.financialGoals,
    categoryBudgets,
    buckets,
    totalSpent,
    totalBudgeted,
    projectedSavings: income - totalSpent,
    daysElapsed,
    daysInMonth,
    projectedMonthEndSpend,
  };
}

export async function updateBudgetPlan(data: {
  monthlyIncome?: number;
  budgetMethod?: BudgetMethod;
  savingsTargetPct?: number;
  financialGoals?: string;
  categoryBudgets?: ICategoryBudget[];
}) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  await connectToDatabase();
  const update: any = {};
  if (data.monthlyIncome !== undefined) update.monthlyIncome = round2(Number(data.monthlyIncome) || 0);
  if (data.budgetMethod !== undefined) update.budgetMethod = data.budgetMethod;
  if (data.savingsTargetPct !== undefined) update.savingsTargetPct = data.savingsTargetPct;
  if (data.financialGoals !== undefined) update.financialGoals = data.financialGoals;
  if (data.categoryBudgets !== undefined)
    update.categoryBudgets = data.categoryBudgets.map((cb) => ({
      category: cb.category,
      limit: round2(Number(cb.limit) || 0),
    }));

  await User.updateOne({ clerkId: userId }, { $set: update });
  revalidatePath("/dashboard/budget");
  revalidatePath("/dashboard");
  return { success: true };
}
