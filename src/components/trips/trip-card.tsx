"use client";
import Link from "next/link";
import { Pencil, Trash2, Calendar, MapPin, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getDaysBetween } from "@/lib/utils";
import type { Trip } from "@/lib/types";

interface TripCardProps {
  trip: Trip;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
}

const COUNTRY_EMOJIS: Record<string, string> = {
  Japan: "🇯🇵",
  Thailand: "🇹🇭",
  "South Korea": "🇰🇷",
  France: "🇫🇷",
  Italy: "🇮🇹",
  USA: "🇺🇸",
  UK: "🇬🇧",
  Vietnam: "🇻🇳",
  Singapore: "🇸🇬",
};

export function TripCard({ trip, onEdit, onDelete }: TripCardProps) {
  const days = getDaysBetween(trip.startDate, trip.endDate);
  const flag = COUNTRY_EMOJIS[trip.country] ?? "🌍";

  return (
    <div className="group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl overflow-hidden hover:shadow-md hover:border-stone-300 transition-all duration-200">
      {/* Color band */}
      <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{flag}</span>
            <div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-sm leading-tight">{trip.name}</h3>
              <p className="text-xs text-stone-400 dark:text-stone-500 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> {trip.country}
              </p>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(trip)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-red-50 hover:text-red-500" onClick={() => onDelete(trip)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <Calendar className="h-3.5 w-3.5 text-stone-400 dark:text-stone-500" />
            {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
            <span className="ml-auto text-stone-400 dark:text-stone-500">{days}d</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <DollarSign className="h-3.5 w-3.5 text-stone-400 dark:text-stone-500" />
            Budget: <span className="font-medium text-stone-700 dark:text-stone-200">{formatCurrency(trip.budget, trip.currency)}</span>
          </div>
          {(trip._count?.days ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
              <Users className="h-3.5 w-3.5 text-stone-400 dark:text-stone-500" />
              {trip._count?.days} days · {trip._count?.expenses} expenses
            </div>
          )}
        </div>

        <Link
          href={`/trips/${trip.id}`}
          className="block w-full text-center py-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-amber-50 hover:text-amber-700 text-xs font-medium text-stone-600 dark:text-stone-300 transition-colors border border-stone-100 dark:border-stone-800 hover:border-amber-200"
        >
          Open Trip →
        </Link>
      </div>
    </div>
  );
}
