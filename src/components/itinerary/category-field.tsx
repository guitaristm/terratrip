"use client";
import { useState } from "react";
import { Plus, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/lib/categories";
import { CategoryModal } from "./category-modal";

const NEW_SENTINEL = "__new_category__";

export function CategoryField({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  const { categories, getCategory, ensureCategoryByLabel } = useCategories();
  const [modalOpen, setModalOpen] = useState(false);
  const [otherText, setOtherText] = useState("");

  const current = getCategory(value);
  const known = categories.some((c) => c.key === value);
  const list = known ? categories : [...categories, current];
  const showOther = value === "other";

  function commitOther() {
    const t = otherText.trim();
    if (!t) return;
    const cat = ensureCategoryByLabel(t);
    onChange(cat.key);
    setOtherText("");
  }

  return (
    <div className="space-y-2">
      <Select
        value={known ? value : current.key}
        onValueChange={(v) => {
          if (v === NEW_SENTINEL) {
            setModalOpen(true);
            return;
          }
          onChange(v);
        }}
      >
        <SelectTrigger>
          <SelectValue>
            <span className="flex items-center gap-2">
              <span
                className="flex h-5 w-5 items-center justify-center rounded-md text-xs"
                style={{ backgroundColor: `${current.color}1a` }}
              >
                {current.emoji}
              </span>
              <span>{current.label}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {list.map((c) => (
            <SelectItem key={c.key} value={c.key}>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span>
                  {c.emoji} {c.label}
                </span>
              </span>
            </SelectItem>
          ))}
          <SelectItem value={NEW_SENTINEL} className="mt-1 border-t border-stone-100 pt-2 font-medium text-amber-600">
            <span className="flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" /> New Category
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {showOther && (
        <div className="flex gap-2">
          <Input
            placeholder="Specify a custom category…"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            onBlur={commitOther}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitOther();
              }
            }}
            className="h-9"
          />
          <button
            type="button"
            onClick={commitOther}
            disabled={!otherText.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white transition-colors hover:bg-amber-700 disabled:opacity-40"
            aria-label="Add custom category"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <CategoryModal open={modalOpen} onOpenChange={setModalOpen} onCreated={(cat) => onChange(cat.key)} />
    </div>
  );
}
