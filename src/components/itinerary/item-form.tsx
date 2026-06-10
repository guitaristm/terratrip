"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Link as LinkIcon, X } from "lucide-react";
import { ItineraryItemSchema, type ItineraryItemFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryField } from "./category-field";
import { useCategories } from "@/lib/categories";

interface ItemFormProps {
  defaultValues?: Partial<ItineraryItemFormValues>;
  onSubmit: (data: ItineraryItemFormValues) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export function ItemForm({ defaultValues, onSubmit, onCancel, submitLabel = "Save", isLoading }: ItemFormProps) {
  const { getCategory } = useCategories();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ItineraryItemFormValues>({
    resolver: zodResolver(ItineraryItemSchema),
    defaultValues: {
      time: "",
      title: "",
      notes: "",
      category: "sightseeing",
      amount: undefined,
      currency: "JPY",
      location: "",
      link: "",
      ...defaultValues,
    },
  });

  const category = watch("category");
  const currency = watch("currency");
  const isSpending = getCategory(category).spending !== false;

  const [showLocation, setShowLocation] = useState(!!defaultValues?.location);
  const [showLink, setShowLink] = useState(!!defaultValues?.link);

  function submit(data: ItineraryItemFormValues) {
    onSubmit({ ...data, amount: isSpending ? data.amount : undefined });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Time</Label>
          <Input type="time" {...register("time")} />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <CategoryField value={category} onChange={(v) => setValue("category", v, { shouldValidate: true })} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Activity name *</Label>
        <Input placeholder="Nagoya Castle" {...register("title")} />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea placeholder="Book tickets in advance…" rows={2} {...register("notes")} />
      </div>

      {/* Amount only for spending categories */}
      {isSpending && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" min="0" step="1" placeholder="500" {...register("amount")} />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={(v) => setValue("currency", v as ItineraryItemFormValues["currency"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="THB">THB</SelectItem>
                <SelectItem value="JPY">JPY</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Location (Google Maps) — revealed on demand */}
      {showLocation ? (
        <div className="space-y-1.5">
          <Label className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Location</span>
            <button type="button" onClick={() => { setShowLocation(false); setValue("location", ""); }} className="text-stone-400 dark:text-stone-500 hover:text-stone-600"><X className="h-3.5 w-3.5" /></button>
          </Label>
          <Input placeholder="Google Maps link or place name" {...register("location")} />
        </div>
      ) : null}

      {/* Link — revealed on demand */}
      {showLink ? (
        <div className="space-y-1.5">
          <Label className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><LinkIcon className="h-3.5 w-3.5" /> Link</span>
            <button type="button" onClick={() => { setShowLink(false); setValue("link", ""); }} className="text-stone-400 dark:text-stone-500 hover:text-stone-600"><X className="h-3.5 w-3.5" /></button>
          </Label>
          <Input placeholder="https://… (website, booking, etc.)" {...register("link")} />
        </div>
      ) : null}

      {/* Add-link buttons */}
      {(!showLocation || !showLink) && (
        <div className="flex flex-wrap gap-2">
          {!showLocation && (
            <button type="button" onClick={() => setShowLocation(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-500 dark:text-stone-400 transition-colors hover:border-amber-300 hover:text-amber-600">
              <MapPin className="h-3.5 w-3.5" /> Add location
            </button>
          )}
          {!showLink && (
            <button type="button" onClick={() => setShowLink(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-500 dark:text-stone-400 transition-colors hover:border-amber-300 hover:text-amber-600">
              <LinkIcon className="h-3.5 w-3.5" /> Add link
            </button>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>}
        <Button type="submit" variant="primary" disabled={isLoading} className="flex-1">
          {isLoading ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
