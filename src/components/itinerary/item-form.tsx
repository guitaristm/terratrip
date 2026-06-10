"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ItineraryItemSchema, type ItineraryItemFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryField } from "./category-field";

interface ItemFormProps {
  defaultValues?: Partial<ItineraryItemFormValues>;
  onSubmit: (data: ItineraryItemFormValues) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export function ItemForm({ defaultValues, onSubmit, onCancel, submitLabel = "Save", isLoading }: ItemFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ItineraryItemFormValues>({
    resolver: zodResolver(ItineraryItemSchema),
    defaultValues: {
      time: "",
      title: "",
      notes: "",
      category: "other",
      amount: undefined,
      currency: "JPY",
      ...defaultValues,
    },
  });

  const category = watch("category");
  const currency = watch("currency");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <Label>Title *</Label>
        <Input placeholder="Nagoya Castle" {...register("title")} />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea placeholder="Book tickets in advance…" rows={2} {...register("notes")} />
      </div>

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

      <div className="flex gap-2 pt-1">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>}
        <Button type="submit" variant="primary" disabled={isLoading} className="flex-1">
          {isLoading ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
