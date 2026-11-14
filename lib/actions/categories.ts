"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { ensureUserInDb } from "@/lib/actions/dashboard-data";
import UserCategory from "@/lib/models/category";
import Transaction from "@/lib/models/transaction";
import User from "@/lib/models/user";
import { CATEGORIES, FALLBACK_CATEGORY_ID, type Category } from "@/lib/categories";
import {
  createCategoryForUserId,
  escapeRegex,
  getCategoriesForUserId,
  seedDefaults,
  toView,
  validateCategoryInput,
  type CategoryInput,
  type CategoryResult,
} from "@/lib/categories-store";

export type { CategoryInput };

export async function getUserCategories(): Promise<Category[]> {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return CATEGORIES;
  return getCategoriesForUserId(userObjectId);
}

type Result = CategoryResult;

function revalidateAll() {
  revalidatePath("/dashboard", "layout");
}

export async function createCategory(input: CategoryInput): Promise<Result> {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };
  const res = await createCategoryForUserId(userObjectId, input);
  if (res.success) revalidateAll();
  return res;
}

export async function updateCategory(id: string, input: CategoryInput): Promise<Result> {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };
  const err = validateCategoryInput(input);
  if (err) return { success: false, error: err };

  const existing = await UserCategory.findOne({ userId: userObjectId, slug: id });
  if (!existing) return { success: false, error: "Category not found" };

  const label = input.label.trim();
  const oldLabel: string = existing.label;
  if (label.toLowerCase() !== oldLabel.toLowerCase()) {
    const clash = await UserCategory.findOne({
      userId: userObjectId,
      _id: { $ne: existing._id },
      label: new RegExp(`^${escapeRegex(label)}$`, "i"),
    });
    if (clash) return { success: false, error: "A category with that name already exists" };
  }
  // The fallback must stay usable for both types.
  const kind = existing.slug === FALLBACK_CATEGORY_ID ? "both" : input.kind;

  existing.label = label;
  existing.icon = input.icon || existing.icon;
  existing.color = input.color || existing.color;
  existing.kind = kind;
  await existing.save();

  if (label !== oldLabel) {
    await renameCategoryReferences(userObjectId, [oldLabel, existing.slug], label);
  }
  revalidateAll();
  return { success: true, category: toView(existing) };
}

export async function deleteCategory(id: string): Promise<Result> {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };
  if (id === FALLBACK_CATEGORY_ID) {
    return { success: false, error: "The Others category can't be deleted" };
  }
  const existing = await UserCategory.findOne({ userId: userObjectId, slug: id });
  if (!existing) return { success: false, error: "Category not found" };

  const fallback = await UserCategory.findOne({ userId: userObjectId, slug: FALLBACK_CATEGORY_ID }).lean<{ order?: number; label?: string }>();
  const fallbackLabel = fallback?.label || "Others";

  // Move existing transactions to the fallback, drop the budget limit.
  await Transaction.updateMany(
    { userId: userObjectId, category: { $in: namesRegex([existing.label, existing.slug]) } },
    { $set: { category: fallbackLabel } }
  );
  await User.updateOne(
    { _id: userObjectId },
    { $pull: { categoryBudgets: { category: { $in: namesRegex([existing.label, existing.slug]) } } } }
  );
  await existing.deleteOne();
  revalidateAll();
  return { success: true };
}

/** Restores any missing default categories (does not touch edits). */
export async function restoreDefaultCategories(): Promise<Result> {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };
  await seedDefaults(userObjectId);
  revalidateAll();
  return { success: true };
}

function namesRegex(names: string[]) {
  return [...new Set(names)].map((n) => new RegExp(`^${escapeRegex(n)}$`, "i"));
}

async function renameCategoryReferences(
  userObjectId: mongoose.Types.ObjectId,
  oldNames: string[],
  newLabel: string
) {
  const match = namesRegex(oldNames);
  await Transaction.updateMany(
    { userId: userObjectId, category: { $in: match } },
    { $set: { category: newLabel } }
  );
  const user = await User.findById(userObjectId);
  if (user?.categoryBudgets?.length) {
    let changed = false;
    for (const cb of user.categoryBudgets) {
      if (match.some((r) => r.test(cb.category))) {
        cb.category = newLabel.toLowerCase();
        changed = true;
      }
    }
    if (changed) await user.save();
  }
}
