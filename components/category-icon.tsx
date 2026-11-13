"use client";

import { createElement } from "react";
import {
  Utensils, Car, House, ReceiptText, Gamepad2, ShoppingBag, HeartPulse, GraduationCap,
  Banknote, Receipt, Coffee, Plane, Fuel, Shirt, Gift, PawPrint, Baby, Dumbbell, Music,
  Film, Smartphone, Wifi, Zap, Droplets, Wrench, Briefcase, PiggyBank, TrendingUp, Landmark,
  CreditCard, BookOpen, Pill, Stethoscope, Bus, Train, Bike, Pizza, ShoppingCart, Heart,
  Sparkles, Scissors, Hammer, Laptop, Tv, Gamepad, Wallet, HandCoins, Users, Church,
  type LucideIcon,
} from "lucide-react";
import { findCategory, CATEGORIES } from "@/lib/categories";
import { useCategories } from "@/components/categories/categories-provider";
import { cn } from "@/lib/utils";

/** Icons a user can pick for a category. Keys are stored in the DB. */
export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Utensils, Pizza, Coffee, ShoppingCart, Car, Bus, Train, Bike, Fuel, Plane, House, Wrench,
  Hammer, ReceiptText, Zap, Droplets, Wifi, Smartphone, Gamepad2, Gamepad, Film, Music, Tv,
  ShoppingBag, Shirt, Gift, Scissors, Sparkles, HeartPulse, Pill, Stethoscope, Dumbbell,
  GraduationCap, BookOpen, Laptop, Baby, PawPrint, Users, Heart, Church, Banknote, Briefcase,
  PiggyBank, TrendingUp, Landmark, CreditCard, Wallet, HandCoins, Receipt,
};

// Legacy alias
ICON_REGISTRY.Home = House;

export function resolveIcon(iconName: string | undefined): LucideIcon {
  return (iconName && ICON_REGISTRY[iconName]) || Receipt;
}

export function getCategoryIcon(name: string, list: typeof CATEGORIES = CATEGORIES): LucideIcon {
  return resolveIcon(findCategory(list, name)?.icon);
}

/** Renders the icon for a category (user's own list), optionally in its color. */
export function CategoryIcon({
  name,
  className,
  colored = false,
}: {
  name: string;
  className?: string;
  colored?: boolean;
}) {
  const list = useCategories();
  const cat = findCategory(list, name) ?? findCategory(CATEGORIES, name);
  return createElement(resolveIcon(cat?.icon), {
    className: cn("h-4 w-4", className),
    style: colored ? { color: cat?.color || "oklch(0.60 0.08 260)" } : undefined,
  });
}
