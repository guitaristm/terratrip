"use client";
import { useState } from "react";
import { Check, Trash2, Link as LinkIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Reliable preset photos (Lorem Picsum serves real photography, always available).
const PRESETS = [
  "https://picsum.photos/seed/terra-mountain/1200/420",
  "https://picsum.photos/seed/terra-coast/1200/420",
  "https://picsum.photos/seed/terra-city/1200/420",
  "https://picsum.photos/seed/terra-forest/1200/420",
  "https://picsum.photos/seed/terra-desert/1200/420",
  "https://picsum.photos/seed/terra-island/1200/420",
];

export function CoverPicker({
  open,
  onOpenChange,
  current,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current?: string | null;
  onApply: (url: string | null) => void | Promise<void>;
}) {
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function choose(value: string | null) {
    setSaving(true);
    try {
      await onApply(value);
      setUrl("");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setUrl(""); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Trip cover photo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Pick a photo</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => {
                const active = current === p;
                return (
                  <button
                    key={p}
                    type="button"
                    disabled={saving}
                    onClick={() => choose(p)}
                    className={`group relative h-20 overflow-hidden rounded-xl border-2 transition-all ${
                      active ? "border-amber-500" : "border-transparent hover:border-stone-300 dark:hover:border-stone-600"
                    }`}
                    style={{ backgroundImage: `url('${p}')`, backgroundSize: "cover", backgroundPosition: "center" }}
                  >
                    {active && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Check className="h-5 w-5 text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><LinkIcon className="h-3.5 w-3.5" /> Or paste an image URL</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://…  (Unsplash, Google Images, etc.)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && url.trim() && choose(url.trim())}
              />
              <Button type="button" variant="primary" disabled={!url.trim() || saving} onClick={() => choose(url.trim())} className="shrink-0">
                Use
              </Button>
            </div>
            <p className="text-[11px] text-stone-400 dark:text-stone-500">Tip: open an image, copy its address, and paste it here.</p>
          </div>

          {current && (
            <button
              type="button"
              disabled={saving}
              onClick={() => choose(null)}
              className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove cover photo
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
