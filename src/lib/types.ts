export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  currency: string;
  theme: string;
  notifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trip {
  id: string;
  name: string;
  country: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  members?: TripMember[];
  days?: ItineraryDay[];
  expenses?: Expense[];
  _count?: { days: number; expenses: number };
}

export interface TripMember {
  id: string;
  tripId: string;
  userId: string;
  role: "owner" | "editor" | "viewer";
  invitedEmail?: string | null;
  accepted: boolean;
  createdAt: Date;
  user?: Partial<User>;
  trip?: Partial<Trip>;
}

export interface ItineraryDay {
  id: string;
  tripId: string;
  date: Date;
  title: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  items?: ItineraryItem[];
}

export interface ItineraryItem {
  id: string;
  dayId: string;
  time?: string | null;
  title: string;
  notes?: string | null;
  category: string;
  amount?: number | null;
  currency: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  tripId: string;
  title: string;
  amount: number;
  currency: string;
  baseAmount?: number | null;
  baseCurrency: string;
  category: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type Role = "owner" | "editor" | "viewer";
export type Currency = "THB" | "JPY" | "USD";
export type Category = "food" | "hotel" | "transport" | "shopping" | "tickets" | "other";
