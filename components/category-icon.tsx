import {
  Utensils,
  Car,
  Home,
  ReceiptText,
  Gamepad2,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Banknote,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import { getCategoryByName, getCategoryColor } from "@/lib/categories";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  food: Utensils,
  transport: Car,
  rent: Home,
  bills: ReceiptText,
  entertainment: Gamepad2,
  shopping: ShoppingBag,
  health: HeartPulse,
  education: GraduationCap,
  salary: Banknote,
  others: Receipt,
};

export function getCategoryIcon(name: string): LucideIcon {
  const cat = getCategoryByName(name);
  return ICON_MAP[cat?.id ?? "others"] ?? Receipt;
}

/** Renders the lucide icon for a category, optionally in its category color. */
export function CategoryIcon({
  name,
  className,
  colored = false,
}: {
  name: string;
  className?: string;
  colored?: boolean;
}) {
  const Icon = getCategoryIcon(name);
  return (
    <Icon
      className={cn("h-4 w-4", className)}
      style={colored ? { color: getCategoryColor(name) } : undefined}
    />
  );
}
