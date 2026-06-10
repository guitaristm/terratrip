"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TripSchema, type TripFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Trip } from "@/lib/types";

interface TripFormProps {
  defaultValues?: Partial<TripFormValues>;
  onSubmit: (data: TripFormValues) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export function TripForm({ defaultValues, onSubmit, onCancel, submitLabel = "Save", isLoading }: TripFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TripFormValues>({
    resolver: zodResolver(TripSchema),
    defaultValues: {
      name: "",
      country: "",
      startDate: "",
      endDate: "",
      budget: 0,
      currency: "THB",
      ...defaultValues,
    },
  });

  const currency = watch("currency");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="name">Trip Name</Label>
          <Input id="name" placeholder="Ex: Japan Oct 2026" {...register("name")} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="country">Country / Destination</Label>
          <Input id="country" placeholder="Ex: Japan" {...register("country")} />
          {errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
          {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="endDate">End Date</Label>
          <Input id="endDate" type="date" {...register("endDate")} />
          {errors.endDate && <p className="text-xs text-red-500">{errors.endDate.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="budget">Budget</Label>
          <Input id="budget" type="number" min="0" step="100" placeholder="50000" {...register("budget")} />
          {errors.budget && <p className="text-xs text-red-500">{errors.budget.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={(v) => setValue("currency", v as TripFormValues["currency"])}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="THB">THB — Thai Baht</SelectItem>
              <SelectItem value="JPY">JPY — Japanese Yen</SelectItem>
              <SelectItem value="USD">USD — US Dollar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={isLoading} className="flex-1">
          {isLoading ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

// Helper to convert Trip to form defaults
export function tripToFormValues(trip: Trip): TripFormValues {
  return {
    name: trip.name,
    country: trip.country,
    startDate: new Date(trip.startDate).toISOString().slice(0, 10),
    endDate: new Date(trip.endDate).toISOString().slice(0, 10),
    budget: trip.budget,
    currency: trip.currency as TripFormValues["currency"],
  };
}
