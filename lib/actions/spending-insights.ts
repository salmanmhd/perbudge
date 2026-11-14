"use server";

import { ensureUserInDb } from "@/lib/actions/dashboard-data";
import { computeSpendingInsights, type SpendingInsight } from "@/lib/spending-insights";

/** Signed-in user's rule-based spending insights. */
export async function getSpendingInsights(): Promise<SpendingInsight[]> {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return [];
  return computeSpendingInsights(userObjectId);
}
