"use client";
import { Map, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { formatCurrency, convertAmount } from "@/lib/utils";
import type { Trip, Expense } from "@/lib/types";

interface StatsCardsProps {
  trips: Trip[];
  expenses: Expense[];
  currency: string;
}

export function StatsCards({ trips, expenses, currency }: StatsCardsProps) {
  const upcomingTrips = trips.filter((t) => new Date(t.endDate) >= new Date()).length;
  const totalBudget = trips.reduce((sum, t) => sum + convertAmount(t.budget, t.currency, currency), 0);
  const totalSpent = expenses.reduce((sum, e) => sum + convertAmount(e.amount, e.currency, currency), 0);
  const nextTrip = trips
    .filter((t) => new Date(t.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

  const daysToNext = nextTrip
    ? Math.ceil((new Date(nextTrip.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const cards = [
    {
      label: "Total Trips",
      value: trips.length.toString(),
      sub: `${upcomingTrips} upcoming`,
      icon: Map,
      gradient: "linear-gradient(135deg,#f59e0b,#d97706)",
    },
    {
      label: "Next Trip",
      value: nextTrip ? nextTrip.name : "—",
      sub: daysToNext != null ? `in ${daysToNext} day${daysToNext !== 1 ? "s" : ""}` : "No trips planned",
      icon: Calendar,
      gradient: "linear-gradient(135deg,#38bdf8,#2563eb)",
    },
    {
      label: "Total Budget",
      value: formatCurrency(totalBudget, currency),
      sub: "across all trips",
      icon: DollarSign,
      gradient: "linear-gradient(135deg,#34d399,#059669)",
    },
    {
      label: "Total Spent",
      value: formatCurrency(totalSpent, currency),
      sub: `${Math.round((totalBudget > 0 ? totalSpent / totalBudget : 0) * 100)}% of budget`,
      icon: TrendingUp,
      gradient: "linear-gradient(135deg,#c084fc,#7c3aed)",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="animate-fade-in-up rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">{card.label}</span>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ background: card.gradient }}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="truncate text-lg font-bold text-stone-800 dark:text-stone-100">{card.value}</p>
            <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
