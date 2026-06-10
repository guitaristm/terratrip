"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Trip } from "@/lib/types";
import { ItineraryView } from "@/components/itinerary/itinerary-view";
import { ExpenseTracker } from "@/components/itinerary/expense-tracker";
import { CollaboratorPanel } from "@/components/itinerary/collaborator-panel";
import { Button } from "@/components/ui/button";
import { formatDate, getDaysBetween, formatCurrency } from "@/lib/utils";
import { ArrowLeft, MapPin, Calendar, DollarSign, Users, Map, BarChart2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TripForm, tripToFormValues } from "@/components/trips/trip-form";
import type { TripFormValues } from "@/lib/schemas";
import { useToast } from "@/components/ui/toast";

type Tab = "itinerary" | "expenses" | "collaborators";

const COUNTRY_EMOJIS: Record<string, string> = {
  Japan: "🇯🇵", Thailand: "🇹🇭", "South Korea": "🇰🇷", France: "🇫🇷",
  Italy: "🇮🇹", USA: "🇺🇸", UK: "🇬🇧", Vietnam: "🇻🇳", Singapore: "🇸🇬",
};

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("itinerary");
  const [editOpen, setEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    api.trips.get(id)
      .then(setTrip)
      .catch(() => router.push("/trips"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleEdit(data: TripFormValues) {
    if (!trip) return;
    setIsLoading(true);
    try {
      const updated = await api.trips.update(trip.id, data);
      setTrip(updated);
      setEditOpen(false);
      toast("Trip updated!");
    } catch { toast("Failed to update trip", "error"); }
    finally { setIsLoading(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!trip) return null;

  const days = getDaysBetween(trip.startDate, trip.endDate);
  const flag = COUNTRY_EMOJIS[trip.country] ?? "🌍";
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "itinerary", label: "Itinerary", icon: <Map className="h-4 w-4" /> },
    { id: "expenses", label: "Expenses", icon: <BarChart2 className="h-4 w-4" /> },
    { id: "collaborators", label: "Collaborators", icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <div className="animate-fade-in-up">
      <Link href="/trips" className="inline-flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-800 mb-5 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to trips
      </Link>

      <div className="relative mb-6 overflow-hidden rounded-3xl border border-amber-200/50 p-6 text-white shadow-lg shadow-amber-900/10"
        style={{ background: "linear-gradient(135deg,#f59e0b 0%,#d97706 55%,#b45309 100%)" }}>
        <div className="pointer-events-none absolute -right-8 -top-10 text-[160px] opacity-15 select-none">{flag}</div>
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium backdrop-blur">
              <MapPin className="h-3 w-3" /> {trip.country}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{flag} {trip.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur">
                <Calendar className="h-3.5 w-3.5" /> {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur">
                {days} days
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur">
                <DollarSign className="h-3.5 w-3.5" /> {formatCurrency(trip.budget, trip.currency)}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="shrink-0 border-white/40 bg-white/15 text-white backdrop-blur hover:bg-white/25 hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        </div>
      </div>

      <div className="mb-6 flex w-full gap-1 overflow-x-auto rounded-xl bg-stone-100 dark:bg-stone-800 p-1 sm:w-fit">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all sm:flex-none ${activeTab === tab.id ? "bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 shadow-sm" : "text-stone-500 dark:text-stone-400 hover:text-stone-700"}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "itinerary" && <ItineraryView trip={trip} onTripChange={setTrip} />}
      {activeTab === "expenses" && <ExpenseTracker trip={trip} />}
      {activeTab === "collaborators" && <CollaboratorPanel trip={trip} />}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Trip</DialogTitle></DialogHeader>
          <TripForm defaultValues={tripToFormValues(trip)} onSubmit={handleEdit} onCancel={() => setEditOpen(false)} submitLabel="Save Changes" isLoading={isLoading} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
