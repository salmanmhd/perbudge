"use server";

import { revalidatePath } from "next/cache";
import { ensureUserInDb } from "@/lib/actions/dashboard-data";
import Account from "@/lib/models/account";
import Transaction from "@/lib/models/transaction";
import type { AccountType } from "@/lib/models/account";
import { nextDueDate, round2 } from "@/lib/finance";

export interface AccountView {
  _id: string;
  name: string;
  type: AccountType;
  creditLimit?: number;
  billingCycleDay?: number;
  dueDay?: number;
  last4?: string;
  color?: string;
  isDefault: boolean;
  /** Credit cards: amount spent in the current billing cycle (statement due) */
  cycleSpend?: number;
  utilizationPct?: number;
  nextDueISO?: string;
}

/** Start of the current billing cycle given a billing day-of-month. */
function billingCycleStart(billingDay: number, now = new Date()): Date {
  const y = now.getFullYear();
  const m = now.getMonth();
  const clampedDay = Math.min(billingDay, new Date(y, m + 1, 0).getDate());
  const thisCycle = new Date(y, m, clampedDay);
  if (now >= thisCycle) return thisCycle;
  const prevClamped = Math.min(billingDay, new Date(y, m, 0).getDate());
  return new Date(y, m - 1, prevClamped);
}

export async function getAccounts(): Promise<AccountView[]> {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return [];

  const accounts = await Account.find({
    userId: userObjectId,
    archived: false,
  })
    .sort({ isDefault: -1, createdAt: 1 })
    .lean();

  const views: AccountView[] = [];
  for (const acc of accounts as any[]) {
    const base: AccountView = {
      _id: String(acc._id),
      name: acc.name,
      type: acc.type,
      creditLimit: acc.creditLimit,
      billingCycleDay: acc.billingCycleDay,
      dueDay: acc.dueDay,
      last4: acc.last4,
      color: acc.color,
      isDefault: acc.isDefault,
    };

    if (acc.type === "credit_card") {
      const cycleStart = acc.billingCycleDay
        ? billingCycleStart(acc.billingCycleDay)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      const spendAgg = await Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            type: "expense",
            date: { $gte: cycleStart },
            $or: [
              { accountId: acc._id },
              // fall back to generic credit_card spend when no per-card link
              { accountId: { $exists: false }, paymentMode: "credit_card" },
            ],
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      const cycleSpend = spendAgg[0]?.total || 0;
      base.cycleSpend = cycleSpend;
      if (acc.creditLimit && acc.creditLimit > 0) {
        base.utilizationPct = Math.round((cycleSpend / acc.creditLimit) * 100);
      }
      if (acc.dueDay) {
        base.nextDueISO = nextDueDate(acc.dueDay).toISOString();
      }
    }

    views.push(base);
  }

  return views;
}

export async function createAccount(data: {
  name: string;
  type: AccountType;
  creditLimit?: number;
  billingCycleDay?: number;
  dueDay?: number;
  last4?: string;
  color?: string;
  isDefault?: boolean;
}) {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };

  try {
    if (data.isDefault) {
      await Account.updateMany({ userId: userObjectId }, { $set: { isDefault: false } });
    }
    await Account.create({
      userId: userObjectId,
      name: data.name,
      type: data.type,
      creditLimit: data.creditLimit != null ? round2(Number(data.creditLimit)) : undefined,
      billingCycleDay: data.billingCycleDay,
      dueDay: data.dueDay,
      last4: data.last4,
      color: data.color,
      isDefault: data.isDefault || false,
    });
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("createAccount error:", error);
    return { success: false, error: error.message || "Failed to add account." };
  }
}

export async function updateAccount(
  id: string,
  data: Partial<{
    name: string;
    creditLimit: number;
    billingCycleDay: number;
    dueDay: number;
    last4: string;
    isDefault: boolean;
  }>
) {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };

  try {
    if (data.isDefault) {
      await Account.updateMany({ userId: userObjectId }, { $set: { isDefault: false } });
    }
    await Account.updateOne({ _id: id, userId: userObjectId }, { $set: data });
    revalidatePath("/dashboard/accounts");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update account." };
  }
}

export async function archiveAccount(id: string) {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };

  await Account.updateOne(
    { _id: id, userId: userObjectId },
    { $set: { archived: true } }
  );
  revalidatePath("/dashboard/accounts");
  return { success: true };
}
