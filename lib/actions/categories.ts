"use server";

import { revalidatePath } from "next/cache";
import { ensureUserInDb } from "@/lib/actions/dashboard-data";
import { CATEGORIES, type Category } from "@/lib/categories";
import {
  createCategoryForUserId,
  deleteCategoryForUserId,
  getCategoriesForUserId,
  seedDefaults,
  updateCategoryForUserId,
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
  const res = await updateCategoryForUserId(userObjectId, id, input);
  if (res.success) revalidateAll();
  return res;
}

export async function deleteCategory(id: string): Promise<Result> {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };
  const res = await deleteCategoryForUserId(userObjectId, id);
  if (res.success) revalidateAll();
  return res;
}

/** Restores any missing default categories (does not touch edits). */
export async function restoreDefaultCategories(): Promise<Result> {
  const userObjectId = await ensureUserInDb();
  if (!userObjectId) return { success: false, error: "Unauthorized" };
  await seedDefaults(userObjectId);
  revalidateAll();
  return { success: true };
}
