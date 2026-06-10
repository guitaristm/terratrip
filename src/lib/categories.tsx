"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface Category {
  key: string;
  label: string;
  emoji: string;
  color: string; // hex
  builtin?: boolean;
}

export const BUILTIN_CATEGORIES: Category[] = [
  { key: "food", label: "Food", emoji: "🍜", color: "#f97316", builtin: true },
  { key: "hotel", label: "Hotel", emoji: "🏨", color: "#6366f1", builtin: true },
  { key: "transport", label: "Transport", emoji: "🚃", color: "#0ea5e9", builtin: true },
  { key: "shopping", label: "Shopping", emoji: "🛍", color: "#ec4899", builtin: true },
  { key: "tickets", label: "Tickets", emoji: "🎟", color: "#8b5cf6", builtin: true },
  { key: "other", label: "Other", emoji: "📌", color: "#78716c", builtin: true },
];

export const CATEGORY_COLORS = [
  "#f97316", "#ef4444", "#ec4899", "#d946ef", "#8b5cf6",
  "#6366f1", "#3b82f6", "#0ea5e9", "#06b6d4", "#14b8a6",
  "#22c55e", "#84cc16", "#eab308", "#f59e0b", "#78716c",
];

export const CATEGORY_EMOJIS = [
  "📌", "🍜", "🏨", "🚃", "🛍", "🎟", "🏖", "⛰", "🍷", "☕",
  "🎨", "🎭", "📷", "🏛", "🚢", "✈️", "🚗", "🎢", "🌸", "🏕",
];

const STORAGE_KEY = "terratrip:custom-categories";

function slugify(name: string) {
  return (
    "cat-" +
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

interface CategoryContextValue {
  categories: Category[];
  custom: Category[];
  getCategory: (key: string) => Category;
  addCategory: (data: Omit<Category, "key" | "builtin">) => Category;
  /** Get-or-create a lightweight custom category from a free-text label. */
  ensureCategoryByLabel: (label: string, opts?: { emoji?: string; color?: string }) => Category;
  removeCategory: (key: string) => void;
}

const CategoryContext = createContext<CategoryContextValue | null>(null);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [custom, setCustom] = useState<Category[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCustom(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    } catch {
      /* ignore */
    }
  }, [custom, hydrated]);

  const categories = [...BUILTIN_CATEGORIES, ...custom];

  const getCategory = useCallback(
    (key: string): Category => {
      return (
        BUILTIN_CATEGORIES.find((c) => c.key === key) ??
        custom.find((c) => c.key === key) ?? {
          key,
          label: key.replace(/^cat-/, "").replace(/-[a-z0-9]{4}$/, "").replace(/-/g, " ") || "Other",
          emoji: "📌",
          color: "#78716c",
        }
      );
    },
    [custom]
  );

  const addCategory = useCallback((data: Omit<Category, "key" | "builtin">): Category => {
    const cat: Category = { ...data, key: slugify(data.label || "category") };
    setCustom((prev) => [...prev, cat]);
    return cat;
  }, []);

  const ensureCategoryByLabel = useCallback(
    (label: string, opts?: { emoji?: string; color?: string }): Category => {
      const trimmed = label.trim();
      const existing = [...BUILTIN_CATEGORIES, ...custom].find(
        (c) => c.label.toLowerCase() === trimmed.toLowerCase()
      );
      if (existing) return existing;
      const cat: Category = {
        key: slugify(trimmed),
        label: trimmed,
        emoji: opts?.emoji ?? "📌",
        color: opts?.color ?? "#78716c",
      };
      setCustom((prev) => [...prev, cat]);
      return cat;
    },
    [custom]
  );

  const removeCategory = useCallback((key: string) => {
    setCustom((prev) => prev.filter((c) => c.key !== key));
  }, []);

  return (
    <CategoryContext.Provider
      value={{ categories, custom, getCategory, addCategory, ensureCategoryByLabel, removeCategory }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error("useCategories must be used within CategoryProvider");
  return ctx;
}
