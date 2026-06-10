"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, Users, Wallet, Check, ArrowRight, Scale } from "lucide-react";
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
import { formatCurrency, formatDate, computeSettlement } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useCategories } from "@/lib/categories";
import { useIdentity } from "@/lib/identity";
import { CategoryField } from "./category-field";

interface Participant {
  id: string;
  name: string;
}

function ExpenseForm({ defaultValues, participants, onSubmit, onCancel, submitLabel = "Save", isLoading }: {
  defaultValues?: Partial<ExpenseFormValues>;
  participants: Participant[];
  onSubmit: (data: ExpenseFormValues) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: {
      title: "",
      amount: 0,
      currency: "JPY",
      category: "other",
      date: new Date().toISOString().slice(0, 10),
      paidById: participants[0]?.id ?? null,
      splitMode: "none",
      splitWith: [],
      ...defaultValues,
    },
  });
  const currency = watch("currency");
  const category = watch("category");
  const paidById = watch("paidById");
  const splitMode = watch("splitMode") ?? "none";
  const splitWith = watch("splitWith") ?? [];
  const amount = Number(watch("amount")) || 0;

  function setSplitMode(mode: "none" | "equal") {
    setValue("splitMode", mode);
    if (mode === "equal" && splitWith.length === 0) {
      setValue("splitWith", participants.map((p) => p.id));
    }
  }

  function toggleSplit(id: string) {
    const next = splitWith.includes(id) ? splitWith.filter((x) => x !== id) : [...splitWith, id];
    setValue("splitWith", next);
  }

  const perShare = splitMode === "equal" && splitWith.length > 0 ? amount / splitWith.length : 0;

  function submit(data: ExpenseFormValues) {
    const payer = participants.find((p) => p.id === data.paidById);
    onSubmit({
      ...data,
      paidByName: payer?.name ?? data.paidByName ?? null,
      splitWith: data.splitMode === "equal" ? data.splitWith ?? [] : [],
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
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

      {/* Paid by */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Paid by</Label>
        {participants.length === 0 ? (
          <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-400">
            Invite people to the trip to track who paid.
          </p>
        ) : (
          <Select value={paidById ?? undefined} onValueChange={(v) => setValue("paidById", v)}>
            <SelectTrigger><SelectValue placeholder="Select who paid" /></SelectTrigger>
            <SelectContent>
              {participants.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Split or combine */}
      {participants.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Split</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSplitMode("none")}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                splitMode === "none" ? "border-amber-300 bg-amber-50 text-amber-700" : "border-stone-200 text-stone-600 hover:bg-stone-50"
              )}
            >
              Combine
            </button>
            <button
              type="button"
              onClick={() => setSplitMode("equal")}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                splitMode === "equal" ? "border-amber-300 bg-amber-50 text-amber-700" : "border-stone-200 text-stone-600 hover:bg-stone-50"
              )}
            >
              Split equally
            </button>
          </div>

          {splitMode === "equal" && (
            <div className="space-y-1.5 rounded-xl border border-stone-100 bg-stone-50/60 p-2">
              {participants.map((p) => {
                const on = splitWith.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleSplit(p.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-white"
                  >
                    <span className={cn(
                      "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border",
                      on ? "border-amber-500 bg-amber-500 text-white" : "border-stone-300 bg-white"
                    )}>
                      {on && <Check className="h-3 w-3" />}
                    </span>
                    <span className="flex-1 text-stone-700">{p.name}</span>
                    {on && perShare > 0 && (
                      <span className="text-xs font-medium text-stone-500">{formatCurrency(perShare, currency)}</span>
                    )}
                  </button>
                );
              })}
              <p className="px-2 pt-1 text-[11px] text-stone-400">
                {splitWith.length > 0
                  ? `${formatCurrency(perShare, currency)} each · ${splitWith.length} ${splitWith.length === 1 ? "person" : "people"}`
                  : "Select who shares this expense."}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>}
        <Button type="submit" variant="primary" disabled={isLoading} className="flex-1">{isLoading ? "Saving…" : submitLabel}</Button>
      </div>
    </form>
  );
}

export function ExpenseTracker({ trip }: { trip: Trip }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { getCategory } = useCategories();
  const { user } = useIdentity();

  const refresh = useCallback(async () => {
    try {
      const data = await api.expenses.list(trip.id);
      setExpenses(data);
    } catch { toast("Failed to load expenses", "error"); }
    finally { setLoading(false); }
  }, [trip.id, toast]);

  useEffect(() => { refresh(); }, [refresh]);

  // Build the list of people who can pay / share: trip members + the current user.
  useEffect(() => {
    api.collaborators.list(trip.id)
      .then((members: any[]) => {
        const list: Participant[] = members.map((m) => ({
          id: m.user?.id ?? m.userId,
          name: m.user?.name || m.user?.email || m.invitedEmail || "Member",
        }));
        if (user) list.unshift({ id: user.id, name: user.name });
        const seen = new Set<string>();
        setParticipants(list.filter((p) => p.id && !seen.has(p.id) && seen.add(p.id)));
      })
      .catch(() => {
        if (user) setParticipants([{ id: user.id, name: user.name }]);
      });
  }, [trip.id, user]);

  const categoryTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  // ── Settle up (who owes whom) for split expenses ──
  const nameMap = new Map<string, string>();
  for (const p of participants) nameMap.set(p.id, p.name);
  for (const e of expenses) {
    if (e.paidById && e.paidByName && !nameMap.has(e.paidById)) nameMap.set(e.paidById, e.paidByName);
  }
  const nameOf = (id: string) => nameMap.get(id) ?? "Traveler";

  const hasSplit = expenses.some(
    (e) => e.splitMode === "equal" && e.paidById && (e.splitWith?.length ?? 0) > 0
  );
  const settlement = computeSettlement(expenses, trip.currency);
  const nonZeroBalances = settlement.balances.filter((b) => Math.abs(b.net) >= 1);

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

      {hasSplit && (
        <div className="mb-6 rounded-2xl border border-stone-100 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-800">Settle up</h3>
              <p className="text-xs text-stone-400">Based on split expenses · in {trip.currency}</p>
            </div>
          </div>

          {settlement.transactions.length === 0 ? (
            <p className="rounded-xl bg-stone-50 px-3 py-3 text-sm text-stone-500">All settled up 🎉</p>
          ) : (
            <div className="space-y-2">
              {settlement.transactions.map((t, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2.5 text-sm">
                  <span className="font-medium text-stone-800 truncate">{nameOf(t.from)}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                  <span className="font-medium text-stone-800 truncate">{nameOf(t.to)}</span>
                  <span className="ml-auto shrink-0 font-semibold text-amber-600">{formatCurrency(t.amount, trip.currency)}</span>
                </div>
              ))}
            </div>
          )}

          {nonZeroBalances.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-stone-100 pt-3">
              {nonZeroBalances
                .sort((a, b) => b.net - a.net)
                .map((b) => (
                  <span
                    key={b.id}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      b.net > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                    )}
                  >
                    {nameOf(b.id)} {b.net > 0 ? "is owed" : "owes"} {formatCurrency(Math.abs(b.net), trip.currency)}
                  </span>
                ))}
            </div>
          )}
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
            const shareCount = expense.splitWith?.length ?? 0;
            const split = expense.splitMode === "equal" && shareCount > 0;
            const perShare = split ? expense.amount / shareCount : 0;
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
                <p className="text-xs text-stone-400 truncate">{formatDate(expense.date)} · {c.label}</p>
                {(expense.paidByName || split) && (
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {expense.paidByName && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                        <Wallet className="h-2.5 w-2.5" /> {expense.paidByName}
                      </span>
                    )}
                    {split && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        <Users className="h-2.5 w-2.5" /> Split {shareCount} · {formatCurrency(perShare, expense.currency)} each
                      </span>
                    )}
                  </div>
                )}
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
          <ExpenseForm participants={participants} onSubmit={handleAdd} onCancel={() => setAddOpen(false)} submitLabel="Add Expense" isLoading={isLoading} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editExpense} onOpenChange={(open) => !open && setEditExpense(null)}>
        <DialogContent><DialogHeader><DialogTitle>Edit Expense</DialogTitle></DialogHeader>
          {editExpense && (
            <ExpenseForm
              participants={participants}
              defaultValues={{
                title: editExpense.title,
                amount: editExpense.amount,
                currency: editExpense.currency as ExpenseFormValues["currency"],
                category: editExpense.category,
                date: new Date(editExpense.date).toISOString().slice(0, 10),
                paidById: editExpense.paidById ?? null,
                paidByName: editExpense.paidByName ?? null,
                splitMode: (editExpense.splitMode as "none" | "equal") ?? "none",
                splitWith: editExpense.splitWith ?? [],
              }}
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
