// Server-side category helpers that take a user ID directly.
// Deliberately NOT a "use server" module: exports here must never be
// callable from the client, since they skip the auth check.
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import UserCategory from "@/lib/models/category";
import {
  CATEGORIES,
  slugifyCategory,
  type Category,
  type CategoryKind,
} from "@/lib/categories";

export type CategoryDoc = {
  slug: string;
  label: string;
  icon: string;
  color: string;
  kind: CategoryKind;
  isDefault: boolean;
};

export interface CategoryInput {
  label: string;
  icon: string;
  color: string;
  kind: CategoryKind;
}

export type CategoryResult =
  | { success: true; category?: Category }
  | { success: false; error: string };

export function toView(doc: CategoryDoc): Category {
  return {
    id: doc.slug,
    label: doc.label,
    icon: doc.icon,
    color: doc.color,
    kind: doc.kind,
    isDefault: doc.isDefault,
  };
}

export function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Seeds any missing defaults for a user (never touches edited ones). */
export async function seedDefaults(userObjectId: mongoose.Types.ObjectId) {
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

/** Categories for a user by ObjectId. Seeds the defaults on first use. */
export async function getCategoriesForUserId(
  userObjectId: mongoose.Types.ObjectId
): Promise<Category[]> {
  await connectToDatabase();
  const find = () =>
    UserCategory.find({ userId: userObjectId })
      .sort({ order: 1, createdAt: 1 })
      .lean<CategoryDoc[]>();
  let docs = await find();
  if (docs.length === 0) {
    await seedDefaults(userObjectId);
    docs = await find();
  }
  return docs.map(toView);
}

export function validateCategoryInput(input: CategoryInput): string | null {
  const label = input.label?.trim();
  if (!label) return "Name is required";
  if (label.length > 30) return "Name must be 30 characters or fewer";
  if (!["expense", "income", "both"].includes(input.kind)) return "Invalid type";
  return null;
}

export async function createCategoryForUserId(
  userObjectId: mongoose.Types.ObjectId,
  input: CategoryInput
): Promise<CategoryResult> {
  const err = validateCategoryInput(input);
  if (err) return { success: false, error: err };

  await getCategoriesForUserId(userObjectId); // ensure defaults exist
  const label = input.label.trim();
  const slug = slugifyCategory(label);

  const clash = await UserCategory.findOne({
    userId: userObjectId,
    $or: [{ slug }, { label: new RegExp(`^${escapeRegex(label)}$`, "i") }],
  });
  if (clash) return { success: false, error: "A category with that name already exists" };

  const last = await UserCategory.findOne({ userId: userObjectId })
    .sort({ order: -1 })
    .lean<{ order?: number }>();
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
  return { success: true, category: toView(doc) };
}
