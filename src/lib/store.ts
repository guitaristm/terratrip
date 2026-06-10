"use client";

import { DEMO_TRIPS, DEMO_DAYS, DEMO_EXPENSES } from "./demo-data";
import type { Trip, ItineraryDay, ItineraryItem, Expense, User } from "./types";

// In-memory store for demo mode (when no database is configured)
let trips: Trip[] = [...DEMO_TRIPS];
let days: ItineraryDay[] = [...DEMO_DAYS];
let expenses: Expense[] = [...DEMO_EXPENSES];
let demoUser: User = {
  id: "demo-user",
  email: "demo@terratrip.app",
  name: "Demo User",
  avatarUrl: null,
  currency: "THB",
  theme: "light",
  notifications: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function genId() {
  return Math.random().toString(36).slice(2);
}

export const store = {
  // User
  getUser: () => ({ ...demoUser }),
  updateUser: (data: Partial<User>) => {
    demoUser = { ...demoUser, ...data, updatedAt: new Date() };
    return { ...demoUser };
  },

  // Trips
  getTrips: () => trips.map((t) => ({ ...t })),
  getTrip: (id: string) => trips.find((t) => t.id === id) ?? null,
  createTrip: (data: Omit<Trip, "id" | "createdAt" | "updatedAt" | "members" | "_count">) => {
    const trip: Trip = {
      ...data,
      id: genId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [],
      _count: { days: 0, expenses: 0 },
    };
    trips = [trip, ...trips];
    return trip;
  },
  updateTrip: (id: string, data: Partial<Trip>) => {
    trips = trips.map((t) => (t.id === id ? { ...t, ...data, updatedAt: new Date() } : t));
    return trips.find((t) => t.id === id) ?? null;
  },
  deleteTrip: (id: string) => {
    trips = trips.filter((t) => t.id !== id);
    days = days.filter((d) => d.tripId !== id);
    expenses = expenses.filter((e) => e.tripId !== id);
  },

  // Days
  getDays: (tripId: string) =>
    days
      .filter((d) => d.tripId === tripId)
      .sort((a, b) => a.order - b.order)
      .map((d) => ({
        ...d,
        items: d.items?.sort((a, b) => a.order - b.order) ?? [],
      })),

  addDay: (tripId: string, date: Date, title: string) => {
    const existing = days.filter((d) => d.tripId === tripId);
    const day: ItineraryDay = {
      id: genId(),
      tripId,
      date,
      title,
      order: existing.length,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    };
    days = [...days, day];
    return day;
  },

  // Items
  addItem: (dayId: string, data: Omit<ItineraryItem, "id" | "dayId" | "createdAt" | "updatedAt">) => {
    const day = days.find((d) => d.id === dayId);
    if (!day) return null;
    const item: ItineraryItem = {
      ...data,
      id: genId(),
      dayId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    days = days.map((d) =>
      d.id === dayId ? { ...d, items: [...(d.items ?? []), item], updatedAt: new Date() } : d
    );
    return item;
  },

  updateItem: (itemId: string, data: Partial<ItineraryItem>) => {
    days = days.map((d) => ({
      ...d,
      items: d.items?.map((i) => (i.id === itemId ? { ...i, ...data, updatedAt: new Date() } : i)) ?? [],
    }));
  },

  deleteItem: (itemId: string) => {
    days = days.map((d) => ({
      ...d,
      items: d.items?.filter((i) => i.id !== itemId) ?? [],
    }));
  },

  reorderItems: (dayId: string, itemIds: string[]) => {
    days = days.map((d) => {
      if (d.id !== dayId) return d;
      const items = d.items ?? [];
      const reordered = itemIds
        .map((id, order) => {
          const item = items.find((i) => i.id === id);
          return item ? { ...item, order } : null;
        })
        .filter(Boolean) as ItineraryItem[];
      return { ...d, items: reordered };
    });
  },

  // Expenses
  getExpenses: (tripId: string) => expenses.filter((e) => e.tripId === tripId),
  addExpense: (data: Omit<Expense, "id" | "createdAt" | "updatedAt">) => {
    const expense: Expense = { ...data, id: genId(), createdAt: new Date(), updatedAt: new Date() };
    expenses = [expense, ...expenses];
    return expense;
  },
  updateExpense: (id: string, data: Partial<Expense>) => {
    expenses = expenses.map((e) => (e.id === id ? { ...e, ...data, updatedAt: new Date() } : e));
  },
  deleteExpense: (id: string) => {
    expenses = expenses.filter((e) => e.id !== id);
  },
};
