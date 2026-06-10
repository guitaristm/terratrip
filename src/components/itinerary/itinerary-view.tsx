"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Clock,
  ChevronDown,
  CalendarPlus,
  CalendarDays,
  MapPin,
  Link as LinkIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import type { ItineraryDay, ItineraryItem, Trip } from "@/lib/types";
import type { ItineraryItemFormValues } from "@/lib/schemas";
import { ItemForm } from "./item-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useCategories } from "@/lib/categories";

// ── date helpers (UTC-anchored to avoid timezone drift) ───────────────
function isoAddDays(start: Date | string, n: number): string {
  const d = new Date(start);
  const u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  u.setUTCDate(u.getUTCDate() + n);
  return u.toISOString().slice(0, 10);
}
function shortWeekday(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
}
function dayMonth(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
}

// Turn a place name or pasted URL into a usable Google Maps link.
function mapsHref(location: string): string {
  const v = location.trim();
  if (/^https?:\/\//i.test(v)) return v;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v)}`;
}
function externalHref(url: string): string {
  const v = url.trim();
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

// ── single itinerary item ─────────────────────────────────────────────
function SortableItem({
  item,
  onEdit,
  onDelete,
}: {
  item: ItineraryItem;
  onEdit: (i: ItineraryItem) => void;
  onDelete: (i: ItineraryItem) => void;
}) {
  const { getCategory } = useCategories();
  const cat = getCategory(item.category);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="group flex items-stretch gap-2">
      <button
        {...attributes}
        {...listeners}
        className="flex w-5 shrink-0 cursor-grab items-center justify-center rounded-md text-stone-300 dark:text-stone-600 transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-500 active:cursor-grabbing"
        aria-label="Drag activity"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div
        className="flex-1 rounded-xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-2.5 shadow-sm transition-all hover:border-stone-200 hover:shadow"
        style={{ borderLeft: `3px solid ${cat.color}` }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {item.time && (
              <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-stone-400 dark:text-stone-500">
                <Clock className="h-3 w-3" />
                {item.time}
              </span>
            )}
            <span className="truncate text-sm font-medium text-stone-800 dark:text-stone-100">
              <span className="mr-1">{cat.emoji}</span>
              {item.title}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {item.amount != null && item.amount > 0 && (
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">{formatCurrency(item.amount, item.currency)}</span>
            )}
            <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(item)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 hover:bg-red-50 hover:text-red-500"
                onClick={() => onDelete(item)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize"
            style={{ backgroundColor: `${cat.color}1a`, color: cat.color }}
          >
            {cat.label}
          </span>
          {item.location && (
            <a
              href={mapsHref(item.location)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-600 hover:bg-sky-100"
            >
              <MapPin className="h-2.5 w-2.5" /> Maps
            </a>
          )}
          {item.link && (
            <a
              href={externalHref(item.link)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-full bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 text-[10px] font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
            >
              <LinkIcon className="h-2.5 w-2.5" /> Link
            </a>
          )}
          {item.notes && <p className="truncate text-xs text-stone-400 dark:text-stone-500">{item.notes}</p>}
        </div>
      </div>
    </div>
  );
}

// ── a single day (sortable card) ──────────────────────────────────────
function DaySection({
  day,
  index,
  trip,
  defaultCollapsed,
  onRefresh,
  onDeleteDay,
}: {
  day: ItineraryDay;
  index: number;
  trip: Trip;
  defaultCollapsed: boolean;
  onRefresh: () => void;
  onDeleteDay: (day: ItineraryDay) => void;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<ItineraryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<ItineraryItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const items = day.items ?? [];

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const dayTotal = items
    .filter((i) => i.currency === trip.currency && i.amount)
    .reduce((sum, i) => sum + (i.amount ?? 0), 0);

  async function handleAdd(data: ItineraryItemFormValues) {
    setIsLoading(true);
    try {
      await api.items.create(day.id, { ...data, order: items.length });
      onRefresh();
      setAddOpen(false);
      toast("Activity added!");
    } catch {
      toast("Failed to add activity", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEdit(data: ItineraryItemFormValues) {
    if (!editItem) return;
    setIsLoading(true);
    try {
      await api.items.update(day.id, editItem.id, data);
      onRefresh();
      setEditItem(null);
      toast("Activity updated!");
    } catch {
      toast("Failed to update activity", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    try {
      await api.items.delete(day.id, deleteItem.id);
      onRefresh();
      setDeleteItem(null);
      toast("Activity deleted.");
    } catch {
      toast("Failed to delete activity", "error");
    }
  }

  async function handleItemDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(items, oldIdx, newIdx);
    await Promise.all(reordered.map((item, order) => api.items.update(day.id, item.id, { order })));
    onRefresh();
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-sm transition-shadow"
    >
      <div className="flex items-center gap-2 bg-gradient-to-r from-stone-50 to-white dark:from-stone-800/60 dark:to-stone-900 px-3 py-3">
        <button
          {...attributes}
          {...listeners}
          className="flex h-8 w-7 shrink-0 cursor-grab items-center justify-center rounded-lg text-stone-300 dark:text-stone-600 transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-500 active:cursor-grabbing"
          aria-label="Drag day"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div
          className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl text-white"
          style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
        >
          <span className="text-[9px] font-medium uppercase leading-none opacity-80">{shortWeekday(day.date)}</span>
          <span className="text-sm font-bold leading-none">{new Date(day.date).getUTCDate()}</span>
        </div>

        <button className="min-w-0 flex-1 text-left" onClick={() => setCollapsed((c) => !c)}>
          <h3 className="truncate text-sm font-semibold text-stone-800 dark:text-stone-100">Day {index + 1}</h3>
          <p className="truncate text-xs text-stone-400 dark:text-stone-500">
            {dayMonth(day.date)} · {items.length} {items.length === 1 ? "activity" : "activities"}
            {dayTotal > 0 && <> · {formatCurrency(dayTotal, trip.currency)}</>}
          </p>
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-stone-400 dark:text-stone-500 hover:text-amber-600"
            onClick={() => setAddOpen(true)}
            aria-label="Add activity"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-stone-400 dark:text-stone-500 hover:bg-red-50 hover:text-red-500"
            onClick={() => onDeleteDay(day)}
            aria-label="Delete day"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 dark:text-stone-500 transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40 p-3">
          {items.length === 0 ? (
            <button
              onClick={() => setAddOpen(true)}
              className="w-full rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-700 py-4 text-xs text-stone-400 dark:text-stone-500 transition-colors hover:border-amber-300 hover:text-amber-500"
            >
              + Add first activity
            </button>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                {items.map((item) => (
                  <SortableItem key={item.id} item={item} onEdit={setEditItem} onDelete={setDeleteItem} />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Activity · Day {index + 1}</DialogTitle>
          </DialogHeader>
          <ItemForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} submitLabel="Add Activity" isLoading={isLoading} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
          </DialogHeader>
          {editItem && (
            <ItemForm
              defaultValues={{
                time: editItem.time ?? "",
                title: editItem.title,
                notes: editItem.notes ?? "",
                category: editItem.category,
                amount: editItem.amount ?? undefined,
                currency: editItem.currency as ItineraryItemFormValues["currency"],
                location: editItem.location ?? "",
                link: editItem.link ?? "",
              }}
              onSubmit={handleEdit}
              onCancel={() => setEditItem(null)}
              submitLabel="Save Changes"
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
          </DialogHeader>
          <p className="mb-4 text-sm text-stone-600 dark:text-stone-300">
            Delete <strong>{deleteItem?.title}</strong>?
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteItem(null)} className="flex-1">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="flex-1">
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── itinerary container ───────────────────────────────────────────────
export function ItineraryView({ trip, onTripChange }: { trip: Trip; onTripChange?: (trip: Trip) => void }) {
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [deleteDayTarget, setDeleteDayTarget] = useState<ItineraryDay | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const initialized = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const refresh = useCallback(async () => {
    try {
      const data = await api.days.list(trip.id);
      setDays(data);
    } catch {
      toast("Failed to load itinerary", "error");
    } finally {
      setLoading(false);
    }
  }, [trip.id, toast]);

  // One-time reconcile: dedupe corrupted duplicate-date days, then normalize
  // each day's order/date so they form a clean continuous sequence.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      let existing = await api.days.list(trip.id);

      // Seed days for a brand-new trip from its date range.
      if (existing.length === 0) {
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
        const endUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
        let order = 0;
        while (cursor <= endUTC) {
          await api.days.create(trip.id, {
            date: cursor.toISOString().slice(0, 10),
            title: `Day ${order + 1}`,
            order,
          });
          cursor.setUTCDate(cursor.getUTCDate() + 1);
          order++;
        }
        await refresh();
        return;
      }

      // Dedupe days that share a calendar date (corruption signature).
      const seen = new Map<string, ItineraryDay>();
      const dupes: ItineraryDay[] = [];
      for (const d of [...existing].sort((a, b) => a.order - b.order)) {
        const key = new Date(d.date).toISOString().slice(0, 10);
        const prev = seen.get(key);
        if (!prev) {
          seen.set(key, d);
        } else if ((d.items?.length ?? 0) > (prev.items?.length ?? 0)) {
          dupes.push(prev);
          seen.set(key, d);
        } else {
          dupes.push(d);
        }
      }
      for (const d of dupes) await api.days.delete(d.id);

      // Normalize order + positional date + title for the survivors.
      const ordered = [...seen.values()].sort((a, b) => a.order - b.order);
      await Promise.all(
        ordered.map((d, i) => {
          const date = isoAddDays(trip.startDate, i);
          const title = `Day ${i + 1}`;
          const dDate = new Date(d.date).toISOString().slice(0, 10);
          if (d.order !== i || dDate !== date || d.title !== title) {
            return api.days.update(d.id, { order: i, date, title });
          }
          return Promise.resolve();
        })
      );

      await refresh();
    };

    init().catch(() => {
      toast("Failed to prepare itinerary", "error");
      setLoading(false);
    });
  }, [trip.id, trip.startDate, trip.endDate, refresh, toast]);

  // Reorder whole days → re-map order/date/title positionally, keep continuity.
  async function handleDayDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = days.findIndex((d) => d.id === active.id);
    const newIdx = days.findIndex((d) => d.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    const reordered = arrayMove(days, oldIdx, newIdx).map((d, i) => ({
      ...d,
      order: i,
      date: new Date(isoAddDays(trip.startDate, i)),
      title: `Day ${i + 1}`,
    }));
    setDays(reordered); // optimistic

    try {
      await Promise.all(
        reordered.map((d, i) => api.days.update(d.id, { order: i, date: isoAddDays(trip.startDate, i), title: `Day ${i + 1}` }))
      );
    } catch {
      toast("Failed to reorder days", "error");
      refresh();
    }
  }

  async function handleAddDay() {
    setBusy(true);
    try {
      const newDate = isoAddDays(trip.startDate, days.length);
      await api.days.create(trip.id, { date: newDate, title: `Day ${days.length + 1}`, order: days.length });
      // keep trip length in sync with itinerary length
      const updated = await api.trips.update(trip.id, { endDate: newDate });
      onTripChange?.(updated);
      await refresh();
      toast("Day added!");
    } catch {
      toast("Failed to add day", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteDay() {
    if (!deleteDayTarget) return;
    setBusy(true);
    try {
      await api.days.delete(deleteDayTarget.id);
      const remaining = days.filter((d) => d.id !== deleteDayTarget.id);
      // re-sequence remaining days positionally
      await Promise.all(
        remaining.map((d, i) =>
          api.days.update(d.id, { order: i, date: isoAddDays(trip.startDate, i), title: `Day ${i + 1}` })
        )
      );
      // shrink trip to match new length (min 1 day)
      const newLen = Math.max(remaining.length, 1);
      const updated = await api.trips.update(trip.id, { endDate: isoAddDays(trip.startDate, newLen - 1) });
      onTripChange?.(updated);
      setDeleteDayTarget(null);
      await refresh();
      toast("Day removed.");
    } catch {
      toast("Failed to delete day", "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
            <CalendarDays className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">Itinerary</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">{days.length} day{days.length !== 1 ? "s" : ""} · drag to reorder</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {days.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => setAllCollapsed((c) => !c)}>
              {allCollapsed ? "Expand all" : "Collapse all"}
            </Button>
          )}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDayDragEnd}>
        <SortableContext items={days.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {days.map((day, index) => (
              <DaySection
                key={`${day.id}-${allCollapsed}`}
                day={day}
                index={index}
                trip={trip}
                defaultCollapsed={allCollapsed}
                onRefresh={refresh}
                onDeleteDay={setDeleteDayTarget}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={handleAddDay}
        disabled={busy}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-700 py-4 text-sm font-medium text-stone-500 dark:text-stone-400 transition-colors hover:border-amber-300 hover:bg-amber-50/40 hover:text-amber-600 disabled:opacity-50"
      >
        <CalendarPlus className="h-4 w-4" />
        Add Day
      </button>

      <Dialog open={!!deleteDayTarget} onOpenChange={(open) => !open && setDeleteDayTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Day</DialogTitle>
          </DialogHeader>
          <p className="mb-4 text-sm text-stone-600 dark:text-stone-300">
            Remove this day and all its items? Remaining days will be renumbered and the trip length updated.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteDayTarget(null)} className="flex-1" disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDay} className="flex-1" disabled={busy}>
              Delete Day
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
