"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, getDaysBetween, formatCurrency, convertAmount } from "@/lib/utils";
import type { Trip, Expense } from "@/lib/types";
import { MapPin, Calendar, Wallet, TrendingUp, PiggyBank, CalendarDays, ArrowRight } from "lucide-react";

const COUNTRY_EMOJIS: Record<string, string> = {
  Japan: "🇯🇵", Thailand: "🇹🇭", "South Korea": "🇰🇷", France: "🇫🇷",
  Italy: "🇮🇹", USA: "🇺🇸", UK: "🇬🇧", Vietnam: "🇻🇳", Singapore: "🇸🇬",
};

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const t = await api.trips.list();
        setTrips(t);
        const allExpenses = await Promise.all(t.map((trip: Trip) => api.expenses.list(trip.id)));
        setExpenses(allExpenses.flat());
        // default to the next upcoming trip, else the most recent
        const upcoming = [...t]
          .filter((x: Trip) => new Date(x.endDate) >= new Date())
          .sort((a: Trip, b: Trip) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        setSelectedId((upcoming[0] ?? t[0])?.id ?? "");
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const trip = useMemo(() => trips.find((t) => t.id === selectedId) ?? null, [trips, selectedId]);
  const tripExpenses = useMemo(() => expenses.filter((e) => e.tripId === selectedId), [expenses, selectedId]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (trips.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Dashboard</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Welcome! Let&apos;s plan your first adventure.</p>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-700 py-16 text-center">
          <div className="mb-2 text-4xl">🗺️</div>
          <p className="text-sm font-medium text-stone-600 dark:text-stone-300">No trips yet</p>
          <Link href="/trips/new" className="mt-4 inline-block rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors">
            Create a trip
          </Link>
        </div>
      </div>
    );
  }

  const currency = trip?.currency ?? "THB";
  const spent = tripExpenses.reduce((sum, e) => sum + convertAmount(e.amount, e.currency, currency), 0);
  const budget = trip?.budget ?? 0;
  const remaining = budget - spent;
  const days = trip ? getDaysBetween(trip.startDate, trip.endDate) : 0;
  const flag = trip ? COUNTRY_EMOJIS[trip.country] ?? "🌍" : "🌍";

  const cards = [
    { label: "Budget", value: formatCurrency(budget, currency), sub: "for this trip", icon: Wallet, gradient: "linear-gradient(135deg,#34d399,#059669)" },
    { label: "Spent", value: formatCurrency(spent, currency), sub: `${tripExpenses.length} expense${tripExpenses.length !== 1 ? "s" : ""}`, icon: TrendingUp, gradient: "linear-gradient(135deg,#c084fc,#7c3aed)" },
    { label: "Remaining", value: formatCurrency(remaining, currency), sub: budget > 0 ? `${Math.max(0, Math.round((remaining / budget) * 100))}% left` : "—", icon: PiggyBank, gradient: remaining < 0 ? "linear-gradient(135deg,#fb7185,#e11d48)" : "linear-gradient(135deg,#fbbf24,#d97706)" },
    { label: "Days", value: String(days), sub: trip ? formatDate(trip.startDate) : "", icon: CalendarDays, gradient: "linear-gradient(135deg,#38bdf8,#2563eb)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Dashboard</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Overview of your selected trip.</p>
        </div>
        <div className="w-full sm:w-72">
          <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">Trip</label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select a trip" />
            </SelectTrigger>
            <SelectContent>
              {trips.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {(COUNTRY_EMOJIS[t.country] ?? "🌍") + " " + t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {trip && (
        <>
          {/* Selected trip banner */}
          <Link
            href={`/trips/${trip.id}`}
            className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-stone-100 dark:border-stone-800 p-5 text-white shadow-sm transition-all hover:shadow-md"
            style={
              trip.coverImage
                ? { backgroundImage: `linear-gradient(135deg, rgba(20,12,0,0.6), rgba(0,0,0,0.35)), url('${trip.coverImage}')`, backgroundSize: "cover", backgroundPosition: "center" }
                : { background: "linear-gradient(135deg,#f59e0b,#d97706 60%,#b45309)" }
            }
          >
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold drop-shadow-sm">{flag} {trip.name}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-white/90">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {trip.country}</span>
                <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(trip.startDate)} — {formatDate(trip.endDate)}</span>
                <span>{days} days</span>
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur transition-colors group-hover:bg-white/30">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>

          {/* Stat cards */}
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
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm" style={{ background: card.gradient }}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="truncate text-lg font-bold text-stone-800 dark:text-stone-100">{card.value}</p>
                  <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">{card.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Spending chart for this trip */}
          <div>
            <h2 className="mb-3 text-base font-semibold text-stone-700 dark:text-stone-200">Spending Overview</h2>
            <SpendingChart expenses={tripExpenses} currency={currency} />
          </div>
        </>
      )}
    </div>
  );
}
