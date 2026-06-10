"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import type { Expense, Trip } from "@/lib/types";
import type { ExpenseFormValues } from "@/lib/schemas";
import { ExpenseSchema } from "@/lib/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useCategories } from "@/lib/categories";
import { CategoryField } from "./category-field";

function ExpenseForm({ defaultValues, onSubmit, onCancel, submitLabel = "Save", isLoading }: {
  defaultValues?: Partial<ExpenseFormValues>;
  onSubmit: (data: ExpenseFormValues) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: { title: "", amount: 0, currency: "JPY", category: "other", date: new Date().toISOString().slice(0, 10), ...defaultValues },
  });
  const currency = watch("currency");
  const category = watch("category");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Title *</Label>
        <Input placeholder="Hotel Mimatsu" {...register("title")} />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Amount *</Label>
          <Input type="number" min="0" step="1" placeholder="5000" {...register("amount")} />
          {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={(v) => setValue("currency", v as ExpenseFormValues["currency"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="THB">THB — Baht</SelectItem>
              <SelectItem value="JPY">JPY — Yen</SelectItem>
              <SelectItem value="USD">USD — Dollar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <CategoryField value={category} onChange={(v) => setValue("category", v, { shouldValidate: true })} />
        </div>
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" {...register("date")} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>}
        <Button type="submit" variant="primary" disabled={isLoading} className="flex-1">{isLoading ? "Saving…" : submitLabel}</Button>
      </div>
    </form>
  );
}

export function ExpenseTracker({ trip }: { trip: Trip }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { getCategory } = useCategories();

  const refresh = useCallback(async () => {
    try {
      const data = await api.expenses.list(trip.id);
      setExpenses(data);
    } catch { toast("Failed to load expenses", "error"); }
    finally { setLoading(false); }
  }, [trip.id, toast]);

  useEffect(() => { refresh(); }, [refresh]);

  const categoryTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  async function handleAdd(data: ExpenseFormValues) {
    setIsLoading(true);
    try {
      await api.expenses.create({ ...data, tripId: trip.id, baseCurrency: trip.currency });
      await refresh();
      setAddOpen(false);
      toast("Expense added!");
    } catch { toast("Failed to add expense", "error"); }
    finally { setIsLoading(false); }
  }

  async function handleEdit(data: ExpenseFormValues) {
    if (!editExpense) return;
    setIsLoading(true);
    try {
      await api.expenses.update(editExpense.id, data);
      await refresh();
      setEditExpense(null);
      toast("Expense updated!");
    } catch { toast("Failed to update expense", "error"); }
    finally { setIsLoading(false); }
  }

  async function handleDelete() {
    if (!deleteExpense) return;
    try {
      await api.expenses.delete(deleteExpense.id);
      await refresh();
      setDeleteExpense(null);
      toast("Expense deleted.");
    } catch { toast("Failed to delete expense", "error"); }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-stone-800">Expenses</h2>
          <p className="text-sm text-stone-500">{expenses.length} entries · {formatCurrency(total, trip.currency)}</p>
        </div>
        <Button variant="primary" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add Expense</Button>
      </div>

      {Object.entries(categoryTotals).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {Object.entries(categoryTotals).map(([cat, amt]) => {
            const c = getCategory(cat);
            return (
              <div
                key={cat}
                className="rounded-xl border border-stone-100 bg-white p-3"
                style={{ borderLeft: `3px solid ${c.color}` }}
              >
                <div
                  className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg text-base"
                  style={{ backgroundColor: `${c.color}1a` }}
                >
                  {c.emoji}
                </div>
                <div className="mb-0.5 text-xs text-stone-500">{c.label}</div>
                <div className="text-sm font-semibold text-stone-800">{formatCurrency(amt, trip.currency)}</div>
              </div>
            );
          })}
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-stone-200 rounded-2xl">
          <div className="text-3xl mb-2">💴</div>
          <p className="text-sm text-stone-500 font-medium">No expenses yet</p>
          <Button variant="primary" className="mt-4" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add Expense</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => {
            const c = getCategory(expense.category);
            return (
            <div key={expense.id} className="group flex items-center gap-3 bg-white border border-stone-100 rounded-xl px-4 py-3 hover:border-stone-200 transition-colors">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
                style={{ backgroundColor: `${c.color}1a` }}
              >
                {c.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">{expense.title}</p>
                <p className="text-xs text-stone-400">{formatDate(expense.date)} · {c.label}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-stone-800">{formatCurrency(expense.amount, expense.currency)}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditExpense(expense)}><Pencil className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-red-50 hover:text-red-500" onClick={() => setDeleteExpense(expense)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <ExpenseForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} submitLabel="Add Expense" isLoading={isLoading} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editExpense} onOpenChange={(open) => !open && setEditExpense(null)}>
        <DialogContent><DialogHeader><DialogTitle>Edit Expense</DialogTitle></DialogHeader>
          {editExpense && (
            <ExpenseForm
              defaultValues={{ title: editExpense.title, amount: editExpense.amount, currency: editExpense.currency as ExpenseFormValues["currency"], category: editExpense.category as ExpenseFormValues["category"], date: new Date(editExpense.date).toISOString().slice(0, 10) }}
              onSubmit={handleEdit} onCancel={() => setEditExpense(null)} submitLabel="Save Changes" isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteExpense} onOpenChange={(open) => !open && setDeleteExpense(null)}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Delete Expense</DialogTitle></DialogHeader>
          <p className="text-sm text-stone-600 mb-4">Delete <strong>{deleteExpense?.title}</strong>?</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteExpense(null)} className="flex-1">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} className="flex-1">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
