"use client";

import { createContext, useContext } from "react";
import { CATEGORIES, type Category } from "@/lib/categories";

const CategoriesContext = createContext<Category[]>(CATEGORIES);

export function CategoriesProvider({
  categories,
  children,
}: {
  categories: Category[];
  children: React.ReactNode;
}) {
  return <CategoriesContext.Provider value={categories}>{children}</CategoriesContext.Provider>;
}

/** The signed-in user's categories (falls back to built-in defaults). */
export function useCategories(): Category[] {
  return useContext(CategoriesContext);
}
