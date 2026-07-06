export interface Category {
  id: string;
  label: string;
  /** lucide-react icon name, resolved by <CategoryIcon /> */
  icon: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: "food", label: "Food", icon: "Utensils", color: "oklch(0.75 0.18 55)" },
  { id: "transport", label: "Transport", icon: "Car", color: "oklch(0.70 0.15 250)" },
  { id: "rent", label: "Rent", icon: "House", color: "oklch(0.65 0.12 290)" },
  { id: "bills", label: "Bills", icon: "ReceiptText", color: "oklch(0.72 0.16 200)" },
  { id: "entertainment", label: "Entertainment", icon: "Gamepad2", color: "oklch(0.70 0.20 330)" },
  { id: "shopping", label: "Shopping", icon: "ShoppingBag", color: "oklch(0.68 0.18 20)" },
  { id: "health", label: "Health", icon: "HeartPulse", color: "oklch(0.72 0.15 150)" },
  { id: "education", label: "Education", icon: "GraduationCap", color: "oklch(0.65 0.14 270)" },
  { id: "salary", label: "Salary", icon: "Banknote", color: "oklch(0.78 0.16 145)" },
  { id: "others", label: "Others", icon: "Receipt", color: "oklch(0.60 0.08 260)" },
];

export function getCategoryByName(name: string): Category | undefined {
  return CATEGORIES.find(
    (c) => c.id === name.toLowerCase() || c.label.toLowerCase() === name.toLowerCase()
  );
}

export function getCategoryColor(name: string): string {
  return getCategoryByName(name)?.color || "oklch(0.60 0.08 260)";
}

export function getCategoryIconName(name: string): string {
  return getCategoryByName(name)?.icon || "Receipt";
}
