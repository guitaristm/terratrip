"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { api } from "@/lib/api";
import type { Trip } from "@/lib/types";
import type { TripFormValues } from "@/lib/schemas";
import { TripCard } from "./trip-card";
import { TripForm, tripToFormValues } from "./trip-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function TripManager() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [deleteTrip, setDeleteTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    try {
      const data = await api.trips.list();
      setTrips(data);
    } catch (e) {
      toast("Failed to load trips", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = trips.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.country.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(data: TripFormValues) {
    setIsLoading(true);
    try {
      await api.trips.create(data);
      await refresh();
      setCreateOpen(false);
      toast("Trip created!");
    } catch (e) {
      toast("Failed to create trip", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEdit(data: TripFormValues) {
    if (!editTrip) return;
    setIsLoading(true);
    try {
      await api.trips.update(editTrip.id, data);
      await refresh();
      setEditTrip(null);
      toast("Trip updated!");
    } catch (e) {
      toast("Failed to update trip", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTrip) return;
    try {
      await api.trips.delete(deleteTrip.id);
      await refresh();
      setDeleteTrip(null);
      toast("Trip deleted.");
    } catch (e) {
      toast("Failed to delete trip", "error");
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">My Trips</h1>
          <p className="text-sm text-stone-500 mt-0.5">{trips.length} trip{trips.length !== 1 ? "s" : ""} planned</p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Trip
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <Input placeholder="Search trips…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <div className="text-4xl mb-3">✈️</div>
          <p className="text-sm font-medium text-stone-500">No trips yet</p>
          <p className="text-xs mt-1">Create your first trip to get started</p>
          <Button variant="primary" className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Trip
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((trip) => (
            <TripCard key={trip.id} trip={trip} onEdit={setEditTrip} onDelete={setDeleteTrip} />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Trip</DialogTitle></DialogHeader>
          <TripForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} submitLabel="Create Trip" isLoading={isLoading} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTrip} onOpenChange={(open) => !open && setEditTrip(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Trip</DialogTitle></DialogHeader>
          {editTrip && (
            <TripForm defaultValues={tripToFormValues(editTrip)} onSubmit={handleEdit} onCancel={() => setEditTrip(null)} submitLabel="Save Changes" isLoading={isLoading} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTrip} onOpenChange={(open) => !open && setDeleteTrip(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Trip</DialogTitle></DialogHeader>
          <p className="text-sm text-stone-600 mb-4">Delete <strong>{deleteTrip?.name}</strong>? This removes all itinerary and expenses.</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteTrip(null)} className="flex-1">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} className="flex-1">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
