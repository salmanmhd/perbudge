"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/db";
import Transaction from "@/lib/models/transaction";
import User from "@/lib/models/user";

export async function ensureUserInDb() {
  const { userId } = await auth();
  if (!userId) return null;

  await connectToDatabase();

  // Fast path: user already exists.
  const existing = await User.findOne({ clerkId: userId }).select("_id");
  if (existing) return existing._id;

  // First login. The dashboard fires ~10 data actions in parallel and each
  // calls this — so several requests race to create the same user. Use an
  // atomic upsert ($setOnInsert) and treat a duplicate-key loss as success by
  // re-fetching, so the E11000 race can never surface to the caller.
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress || `${userId}@placeholder.com`;

  try {
    const dbUser = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $setOnInsert: {
          clerkId: userId,
          email,
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
        },
      },
      { upsert: true, new: true }
    );
    return dbUser!._id;
  } catch (err: any) {
    // A concurrent request won the insert — the row now exists, so fetch it.
    if (err?.code === 11000) {
      const dbUser = await User.findOne({ clerkId: userId }).select("_id");
      if (dbUser) return dbUser._id;
    }
    throw err;
  }
}

export async function getSummaryMetrics() {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { income: 0, expense: 0, balance: 0 };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const transactions = await Transaction.find({
    userId: userObjectId,
    date: { $gte: startOfMonth },
  });

  let income = 0;
  let expense = 0;

  transactions.forEach((tx) => {
    if (tx.type === "income") income += tx.amount;
    else if (tx.type === "expense") expense += tx.amount;
  });

  return { income, expense, balance: income - expense };
}

export async function getRecentTransactions(limit = 5) {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return [];

  const transactions = await Transaction.find({ userId: userObjectId })
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  return JSON.parse(JSON.stringify(transactions));
}

export async function getCategoryBreakdown() {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return [];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const result = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        type: "expense",
        date: { $gte: startOfMonth },
      },
    },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { total: -1 },
    },
  ]);

  return result.map((r) => ({ name: r._id, value: r.total, count: r.count }));
}

export async function getTodaySummary() {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { totalSpent: 0, totalEarned: 0, transactionCount: 0 };

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const transactions = await Transaction.find({
    userId: userObjectId,
    date: { $gte: startOfDay, $lt: endOfDay },
  }).lean();

  let totalSpent = 0;
  let totalEarned = 0;

  transactions.forEach((tx) => {
    if (tx.type === "expense") totalSpent += tx.amount;
    else if (tx.type === "income") totalEarned += tx.amount;
  });

  return {
    totalSpent,
    totalEarned,
    transactionCount: transactions.length,
  };
}

export async function getDailySpendingChart() {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return [];

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const result = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        type: "expense",
        date: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$date" },
        },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill in missing days with 0
  const dailyData: { date: string; amount: number; label: string }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const found = result.find((r) => r._id === dateStr);
    const label = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(d);
    dailyData.push({
      date: dateStr,
      amount: found ? found.total : 0,
      label,
    });
  }

  return dailyData;
}

export async function getUserBudget() {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return null;

  const { userId } = await auth();
  if (!userId) return null;

  const user = await User.findOne({ clerkId: userId }).lean();
  return user?.monthlyBudget || null;
}

export async function setMonthlyBudget(amount: number) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  await connectToDatabase();
  await User.updateOne({ clerkId: userId }, { $set: { monthlyBudget: amount } });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/dashboard");

  return { success: true };
}

