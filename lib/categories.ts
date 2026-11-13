export type CategoryKind = "expense" | "income" | "both";

export interface Category {
  id: string;
  label: string;
  /** lucide-react icon name, resolved by <CategoryIcon /> */
  icon: string;
  color: string;
  kind: CategoryKind;
  isDefault?: boolean;
}

/** Built-in defaults. Seeded into each user's own list on first use. */
export const CATEGORIES: Category[] = [
  { id: "food", label: "Food", icon: "Utensils", color: "oklch(0.75 0.18 55)", kind: "expense" },
  { id: "transport", label: "Transport", icon: "Car", color: "oklch(0.70 0.15 250)", kind: "expense" },
  { id: "rent", label: "Rent", icon: "House", color: "oklch(0.65 0.12 290)", kind: "expense" },
  { id: "bills", label: "Bills", icon: "ReceiptText", color: "oklch(0.72 0.16 200)", kind: "expense" },
  { id: "entertainment", label: "Entertainment", icon: "Gamepad2", color: "oklch(0.70 0.20 330)", kind: "expense" },
  { id: "shopping", label: "Shopping", icon: "ShoppingBag", color: "oklch(0.68 0.18 20)", kind: "expense" },
  { id: "health", label: "Health", icon: "HeartPulse", color: "oklch(0.72 0.15 150)", kind: "expense" },
  { id: "education", label: "Education", icon: "GraduationCap", color: "oklch(0.65 0.14 270)", kind: "expense" },
  { id: "salary", label: "Salary", icon: "Banknote", color: "oklch(0.78 0.16 145)", kind: "income" },
  { id: "others", label: "Others", icon: "Receipt", color: "oklch(0.60 0.08 260)", kind: "both" },
];

/** The catch-all category; cannot be deleted. */
export const FALLBACK_CATEGORY_ID = "others";

/** Palette offered in the category editor. */
export const CATEGORY_COLORS = [
  "oklch(0.75 0.18 55)",
  "oklch(0.68 0.18 20)",
  "oklch(0.70 0.20 330)",
  "oklch(0.65 0.12 290)",
  "oklch(0.65 0.14 270)",
  "oklch(0.70 0.15 250)",
  "oklch(0.72 0.16 200)",
  "oklch(0.72 0.15 150)",
  "oklch(0.78 0.16 145)",
  "oklch(0.80 0.15 95)",
  "oklch(0.60 0.08 260)",
];

export function slugifyCategory(label: string): string {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "category"
  );
}

export function findCategory(list: Category[], name: string): Category | undefined {
  const n = name.trim().toLowerCase();
  return list.find((c) => c.id === n || c.label.toLowerCase() === n);
}

export function getCategoryByName(name: string): Category | undefined {
  return findCategory(CATEGORIES, name);
}

export function getCategoryColor(name: string): string {
  return getCategoryByName(name)?.color || "oklch(0.60 0.08 260)";
}

export function getCategoryIconName(name: string): string {
  return getCategoryByName(name)?.icon || "Receipt";
}

export function categoriesForType(list: Category[], type: string): Category[] {
  return list.filter((c) =>
    c.kind === "both" ? true : type === "income" ? c.kind === "income" : c.kind === "expense"
  );
}
