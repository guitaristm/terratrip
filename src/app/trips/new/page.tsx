"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { store } from "@/lib/store";
import { TripForm } from "@/components/trips/trip-form";
import type { TripFormValues } from "@/lib/schemas";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useState } from "react";

export default function NewTripPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(data: TripFormValues) {
    setIsLoading(true);
    try {
      const trip = store.createTrip({
        name: data.name,
        country: data.country,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        budget: data.budget,
        currency: data.currency,
      });
      toast("Trip created!");
      router.push(`/trips/${trip.id}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <Link href="/trips" className="inline-flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-800 mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to trips
      </Link>
      <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-6">Create New Trip</h1>
      <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl p-6">
        <TripForm
          onSubmit={handleSubmit}
          onCancel={() => router.push("/trips")}
          submitLabel="Create Trip"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
