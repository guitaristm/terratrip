import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string): string {
  const formatters: Record<string, Intl.NumberFormat> = {
    THB: new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 0 }),
    JPY: new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", minimumFractionDigits: 0 }),
    USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
  };
  return (formatters[currency] ?? formatters.THB).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Approximate static FX rates (mirrors /api/exchange-rates). Used to roll up
// budgets/expenses that may be in different currencies into one display currency.
const FX_RATES: Record<string, Record<string, number>> = {
  THB: { THB: 1, JPY: 4.0, USD: 0.028 },
  JPY: { THB: 0.25, JPY: 1, USD: 0.0067 },
  USD: { THB: 35.5, JPY: 149.5, USD: 1 },
};

export function convertAmount(amount: number, from: string, to: string): number {
  if (!amount || from === to) return amount;
  const direct = FX_RATES[from]?.[to];
  if (direct != null) return amount * direct;
  // fall back through USD if a direct pair is missing
  const fromToUsd = FX_RATES[from]?.USD;
  const usdToTarget = FX_RATES.USD?.[to];
  if (fromToUsd != null && usdToTarget != null) return amount * fromToUsd * usdToTarget;
  return amount; // unknown currency — leave as-is
}

export function getDaysBetween(start: Date | string, end: Date | string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}
