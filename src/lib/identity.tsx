"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { applyTheme } from "@/lib/theme";

export interface Identity {
  id: string;
  email?: string | null;
  name: string;
  currency?: string;
  theme?: string;
  notifications?: boolean;
}

interface NameMatch {
  id: string;
  name: string;
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
        if (u && u.id) {
          setUserState(u);
          applyTheme(u.theme);
        }
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<NameMatch[] | null>(null);

  const canSubmit = name.trim().length > 0 && !submitting;

  async function continueWith(payload: { name: string; confirmUserId?: string; createNew?: boolean }) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.user.identify(payload);
      if (res?.matches) {
        setMatches(res.matches as NameMatch[]);
        setSubmitting(false);
        return;
      }
      onDone(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    continueWith({ name: name.trim() });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-pop-in rounded-3xl bg-white dark:bg-stone-900 p-7 shadow-2xl">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
          style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
        >
          <span className="text-2xl">🗺️</span>
        </div>

        {!matches ? (
          <>
            <h1 className="text-center text-lg font-bold text-stone-800 dark:text-stone-100">Welcome to TerraTrip</h1>
            <p className="mt-1 mb-5 text-center text-sm text-stone-500 dark:text-stone-400">
              What&apos;s your name? We&apos;ll use it to personalize your trips.
            </p>
            <form onSubmit={submit} className="space-y-3">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Alex Tan"
                className="h-11 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 text-sm text-stone-800 dark:text-stone-100 outline-none transition-shadow placeholder:text-stone-400 focus:ring-2 focus:ring-amber-500"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-amber-600 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
              >
                {submitting ? "One sec…" : "Continue"}
              </button>
            </form>
            <p className="mt-4 text-center text-[11px] text-stone-400 dark:text-stone-500">
              No email or password — just your name, saved on this device.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-center text-lg font-bold text-stone-800 dark:text-stone-100">Is this you?</h1>
            <p className="mt-1 mb-5 text-center text-sm text-stone-500 dark:text-stone-400">
              Someone named <strong>{name.trim()}</strong> is already here.
            </p>
            <div className="space-y-2">
              <button
                disabled={submitting}
                onClick={() => continueWith({ name: name.trim(), confirmUserId: matches[0].id })}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-amber-600 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
              >
                Yes, that&apos;s me
              </button>
              <button
                disabled={submitting}
                onClick={() => continueWith({ name: name.trim(), createNew: true })}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-600 dark:text-stone-300 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50"
              >
                No, I&apos;m someone new
              </button>
              <button
                disabled={submitting}
                onClick={() => { setMatches(null); setError(null); }}
                className="w-full pt-1 text-center text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600"
              >
                ← Use a different name
              </button>
            </div>
            {error && <p className="mt-3 text-center text-xs text-red-500">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
