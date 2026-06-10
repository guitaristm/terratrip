"use client";

export type Theme = "light" | "dark";

export const THEME_KEY = "tt_theme";

/** Apply (or clear) the `dark` class on <html> and remember the choice. */
export function applyTheme(theme?: string | null) {
  if (typeof document === "undefined") return;
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  try {
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  } catch {
    /* ignore */
  }
}
