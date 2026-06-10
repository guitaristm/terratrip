import { z } from "zod";

export const TripSchema = z.object({
  name: z.string().min(1, "Trip name is required").max(100),
  country: z.string().min(1, "Country is required").max(100),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  budget: z.coerce.number().min(0, "Budget must be non-negative"),
  currency: z.enum(["THB", "JPY", "USD"]),
});

export type TripFormValues = z.infer<typeof TripSchema>;

export const ItineraryItemSchema = z.object({
  time: z.string().optional(),
  title: z.string().min(1, "Title is required").max(200),
  notes: z.string().optional(),
  category: z.string().min(1).max(60),
  amount: z.coerce.number().min(0).optional(),
  currency: z.enum(["THB", "JPY", "USD"]),
  order: z.number().optional(),
});

export type ItineraryItemFormValues = z.infer<typeof ItineraryItemSchema>;

export const ExpenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
  currency: z.enum(["THB", "JPY", "USD"]),
  category: z.string().min(1).max(60),
  date: z.string().min(1, "Date is required"),
});

export type ExpenseFormValues = z.infer<typeof ExpenseSchema>;

export const SettingsSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  currency: z.enum(["THB", "JPY", "USD"]),
  theme: z.enum(["light", "dark"]),
  notifications: z.boolean(),
});

export type SettingsFormValues = z.infer<typeof SettingsSchema>;

export const CollaboratorSchema = z.object({
  email: z.string().email("Valid email required"),
  role: z.enum(["editor", "viewer"]),
});

export type CollaboratorFormValues = z.infer<typeof CollaboratorSchema>;
