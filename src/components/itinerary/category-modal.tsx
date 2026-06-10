"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useCategories, CATEGORY_COLORS, CATEGORY_EMOJIS, type Category } from "@/lib/categories";

export function CategoryModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (cat: Category) => void;
}) {
  const { addCategory } = useCategories();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(CATEGORY_EMOJIS[0]);
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [spending, setSpending] = useState(true);

  function reset() {
    setName("");
    setEmoji(CATEGORY_EMOJIS[0]);
    setColor(CATEGORY_COLORS[0]);
    setSpending(true);
  }

  function handleCreate() {
    if (!name.trim()) return;
    const cat = addCategory({ label: name.trim(), emoji, color, spending });
    onCreated?.(cat);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Category</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Live preview */}
          <div className="flex items-center gap-3 rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 px-4 py-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
              style={{ backgroundColor: `${color}1a` }}
            >
              {emoji}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate">{name.trim() || "Category name"}</p>
              <span
                className="mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: `${color}1a`, color }}
              >
                {emoji} {name.trim() || "preview"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              placeholder="Ex: Museums"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-all",
                    emoji === e ? "bg-stone-800 ring-2 ring-stone-800 ring-offset-1" : "bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-8 w-8 rounded-full transition-transform",
                    color === c ? "scale-110 ring-2 ring-offset-2 ring-stone-400" : "hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSpending((s) => !s)}
            className="flex w-full items-center justify-between rounded-xl border border-stone-200 dark:border-stone-700 px-3 py-2.5 text-left transition-colors hover:bg-stone-50 dark:hover:bg-stone-800"
          >
            <span>
              <span className="block text-sm font-medium text-stone-700 dark:text-stone-200">Involves spending money</span>
              <span className="block text-[11px] text-stone-400 dark:text-stone-500">Show an amount field for activities in this category</span>
            </span>
            <span className={cn(
              "relative h-5 w-9 shrink-0 rounded-full transition-colors",
              spending ? "bg-amber-500" : "bg-stone-300"
            )}>
              <span className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white dark:bg-stone-900 transition-transform",
                spending ? "translate-x-4" : "translate-x-0.5"
              )} />
            </span>
          </button>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleCreate} disabled={!name.trim()} className="flex-1">
              Create Category
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
