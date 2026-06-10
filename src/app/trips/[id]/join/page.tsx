"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useIdentity } from "@/lib/identity";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function JoinTripPage() {
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const tripId = params.id as string;
  const role = search.get("role") === "editor" ? "editor" : "viewer";

  const { user, loading } = useIdentity();
  const [status, setStatus] = useState<"joining" | "done" | "error">("joining");
  const [tripName, setTripName] = useState<string>("");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    // Wait until identity is resolved and the visitor has identified themselves
    // (the global IdentityGate handles prompting for name/email).
    if (loading || !user || ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const trip = await api.trips.get(tripId).catch(() => null);
        if (!trip) {
          setStatus("error");
          setMessage("This trip no longer exists.");
          return;
        }
        setTripName(trip.name);
        const res = await api.trips.join(tripId, role);
        setStatus("done");
        setMessage(res?.alreadyMember ? "You're already on this trip." : `You joined as ${role}.`);
        setTimeout(() => router.push(`/trips/${tripId}`), 1200);
      } catch (e: unknown) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Couldn't join this trip.");
      }
    })();
  }, [loading, user, tripId, role, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-3xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 p-8 text-center shadow-sm">
        {status === "joining" && (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
            <h1 className="text-base font-semibold text-stone-800 dark:text-stone-100">Joining trip…</h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {!user ? "Tell us who you are to continue." : "Adding you to the itinerary."}
            </p>
          </>
        )}
        {status === "done" && (
          <>
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
            <h1 className="text-base font-semibold text-stone-800 dark:text-stone-100">
              {tripName ? `Welcome to ${tripName}!` : "You're in!"}
            </h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
            <h1 className="text-base font-semibold text-stone-800 dark:text-stone-100">Couldn&apos;t join</h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{message}</p>
            <Link
              href="/trips"
              className="mt-4 inline-block rounded-xl bg-stone-100 dark:bg-stone-800 px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
            >
              Go to trips
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
