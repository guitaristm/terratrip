"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface Identity {
  id: string;
  email: string;
  name: string;
  currency?: string;
  theme?: string;
  notifications?: boolean;
}

interface IdentityContextValue {
  user: Identity | null;
  loading: boolean;
  setUser: (u: Identity) => void;
  signOut: () => Promise<void>;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.user
      .get()
      .then((u) => {
        if (u && u.id) setUserState(u);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function signOut() {
    try {
      await api.user.signOut();
    } catch {
      /* ignore */
    }
    setUserState(null);
  }

  return (
    <IdentityContext.Provider value={{ user, loading, setUser: setUserState, signOut }}>
      {children}
      {!loading && !user && <IdentityGate onDone={setUserState} />}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used within IdentityProvider");
  return ctx;
}

// ── Welcome / identity gate ───────────────────────────────────────────
function IdentityGate({ onDone }: { onDone: (u: Identity) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = name.trim().length > 0 && validEmail && !submitting;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const u = await api.user.identify({ name: name.trim(), email: email.trim().toLowerCase() });
      onDone(u);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-pop-in rounded-3xl bg-white p-7 shadow-2xl">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
          style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
        >
          <span className="text-2xl">🗺️</span>
        </div>
        <h1 className="text-center text-lg font-bold text-stone-800">Welcome to TerraTrip</h1>
        <p className="mt-1 mb-5 text-center text-sm text-stone-500">
          Tell us who you are so we can personalize your trips.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-600">Your name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Alex Tan"
              className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none transition-shadow placeholder:text-stone-400 focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none transition-shadow placeholder:text-stone-400 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-1 flex h-11 w-full items-center justify-center rounded-xl bg-amber-600 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            {submitting ? "Setting up…" : "Continue"}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-stone-400">
          No password needed — your name is saved on this device.
        </p>
      </div>
    </div>
  );
}
