"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import { ensureUserInDb } from "@/lib/actions/dashboard-data";
import UserCategory from "@/lib/models/category";
import Transaction from "@/lib/models/transaction";
import User from "@/lib/models/user";
import {
  CATEGORIES,
  FALLBACK_CATEGORY_ID,
  slugifyCategory,
  type Category,
  type CategoryKind,
} from "@/lib/categories";

type CategoryDoc = { slug: string; label: string; icon: string; color: string; kind: CategoryKind; isDefault: boolean };

function toView(doc: CategoryDoc): Category {
  return {
    id: doc.slug,
    label: doc.label,
    icon: doc.icon,
    color: doc.color,
    kind: doc.kind,
    isDefault: doc.isDefault,
  };
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Seeds the defaults for a user who has no categories yet. */
async function seedDefaults(userObjectId: mongoose.Types.ObjectId) {
  const ops = CATEGORIES.map((c, i) => ({
    updateOne: {
      filter: { userId: userObjectId, slug: c.id },
      update: {
        $setOnInsert: {
          userId: userObjectId,
          slug: c.id,
          label: c.label,
          icon: c.icon,
          color: c.color,
          kind: c.kind,
          order: i,
          isDefault: true,
        },
      },
      upsert: true,
    },
  }));
  await UserCategory.bulkWrite(ops, { ordered: false });
}

/** Categories for a user by ObjectId (no auth; for webhooks/server code). */
export async function getCategoriesForUserId(
  userObjectId: mongoose.Types.ObjectId
): Promise<Category[]> {
  await connectToDatabase();
  let docs: CategoryDoc[] = await UserCategory.find({ userId: userObjectId }).sort({ order: 1, createdAt: 1 }).lean<CategoryDoc[]>();
  if (docs.length === 0) {
    await seedDefaults(userObjectId);
    docs = await UserCategory.find({ userId: userObjectId }).sort({ order: 1, createdAt: 1 }).lean<CategoryDoc[]>();
  }
  return docs.map(toView);
}

export async function getUserCategories(): Promise<Category[]> {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return CATEGORIES;
  return getCategoriesForUserId(userObjectId);
}

export interface CategoryInput {
  label: string;
  icon: string;
  color: string;
  kind: CategoryKind;
}

type Result = { success: true; category?: Category } | { success: false; error: string };

function validate(input: CategoryInput): string | null {
  const label = input.label?.trim();
  if (!label) return "Name is required";
  if (label.length > 30) return "Name must be 30 characters or fewer";
  if (!["expense", "income", "both"].includes(input.kind)) return "Invalid type";
  return null;
}

function revalidateAll() {
  revalidatePath("/dashboard", "layout");
}

export async function createCategory(input: CategoryInput): Promise<Result> {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };
  const err = validate(input);
  if (err) return { success: false, error: err };

  await getCategoriesForUserId(userObjectId); // ensure defaults exist
  const label = input.label.trim();
  const slug = slugifyCategory(label);

  const clash = await UserCategory.findOne({
    userId: userObjectId,
    $or: [{ slug }, { label: new RegExp(`^${escapeRegex(label)}$`, "i") }],
  });
  if (clash) return { success: false, error: "A category with that name already exists" };

  const last = await UserCategory.findOne({ userId: userObjectId }).sort({ order: -1 }).lean<{ order?: number; label?: string }>();
  const doc = await UserCategory.create({
    userId: userObjectId,
    slug,
    label,
    icon: input.icon || "Receipt",
    color: input.color,
    kind: input.kind,
    order: (last?.order ?? 0) + 1,
    isDefault: false,
  });
  revalidateAll();
  return { success: true, category: toView(doc) };
}

export async function updateCategory(id: string, input: CategoryInput): Promise<Result> {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };
  const err = validate(input);
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
