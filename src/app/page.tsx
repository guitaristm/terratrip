"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { formatDate, getDaysBetween } from "@/lib/utils";
import { useIdentity } from "@/lib/identity";
import type { Trip, Expense } from "@/lib/types";
import { MapPin, Calendar, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const { user } = useIdentity();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const displayCurrency = user?.currency || trips[0]?.currency || "THB";

  useEffect(() => {
    const load = async () => {
      try {
        const t = await api.trips.list();
        setTrips(t);
        const allExpenses = await Promise.all(t.map((trip: Trip) => api.expenses.list(trip.id)));
        setExpenses(allExpenses.flat());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const upcomingTrips = trips
    .filter((t) => new Date(t.endDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Dashboard</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Welcome back! Here's your travel overview.</p>
      </div>

      <StatsCards trips={trips} expenses={expenses} currency={displayCurrency} />

      {upcomingTrips.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-stone-700 dark:text-stone-200">Upcoming Trips</h2>
            <Link href="/trips" className="text-xs text-amber-600 hover:text-amber-700 font-medium">View all →</Link>
          </div>
          <div className="space-y-2">
            {upcomingTrips.map((trip) => {
              const days = getDaysBetween(trip.startDate, trip.endDate);
              const daysTo = Math.ceil((new Date(trip.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <Link key={trip.id} href={`/trips/${trip.id}`} className="flex items-center gap-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl px-5 py-4 hover:border-amber-200 hover:shadow-sm transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-xl shrink-0">🗺️</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800 dark:text-stone-100 text-sm">{trip.name}</p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="h-3 w-3" /> {trip.country}
                      <span className="mx-1">·</span>
                      <Calendar className="h-3 w-3" /> {formatDate(trip.startDate)}
                      <span className="mx-1">·</span>
                      {days} days
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {daysTo > 0
                      ? <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-full">in {daysTo}d</span>
                      : <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Ongoing</span>
                    }
                  </div>
                  <ArrowRight className="h-4 w-4 text-stone-300 dark:text-stone-600 group-hover:text-amber-500 transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-stone-700 dark:text-stone-200 mb-3">Spending Overview</h2>
        <SpendingChart expenses={expenses} currency={displayCurrency} />
      </div>
    </div>
  );
}
