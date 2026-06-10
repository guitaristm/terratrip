// API client — all calls go through Next.js API routes → Prisma → Supabase

const BASE = "";

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

// ── Trips ──────────────────────────────────────────────────
export const api = {
  trips: {
    list: () => req<any[]>("/api/trips"),
    get: (id: string) => req<any>(`/api/trips/${id}`),
    create: (data: any) => req<any>("/api/trips", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => req<any>(`/api/trips/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => req<any>(`/api/trips/${id}`, { method: "DELETE" }),
  },

  // ── Days ──────────────────────────────────────────────────
  days: {
    list: (tripId: string) => req<any[]>(`/api/trips/${tripId}/days`),
    create: (tripId: string, data: any) =>
      req<any>(`/api/trips/${tripId}/days`, { method: "POST", body: JSON.stringify(data) }),
    update: (dayId: string, data: any) =>
      req<any>(`/api/days/${dayId}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (dayId: string) =>
      req<any>(`/api/days/${dayId}`, { method: "DELETE" }),
  },

  // ── Items ─────────────────────────────────────────────────
  items: {
    create: (dayId: string, data: any) =>
      req<any>(`/api/days/${dayId}/items`, { method: "POST", body: JSON.stringify(data) }),
    update: (dayId: string, itemId: string, data: any) =>
      req<any>(`/api/days/${dayId}/items/${itemId}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (dayId: string, itemId: string) =>
      req<any>(`/api/days/${dayId}/items/${itemId}`, { method: "DELETE" }),
  },

  // ── Expenses ──────────────────────────────────────────────
  expenses: {
    list: (tripId: string) => req<any[]>(`/api/expenses?tripId=${tripId}`),
    create: (data: any) => req<any>("/api/expenses", { method: "POST", body: JSON.stringify(data) }),
    update: (expenseId: string, data: any) =>
      req<any>(`/api/expenses/${expenseId}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (expenseId: string) => req<any>(`/api/expenses/${expenseId}`, { method: "DELETE" }),
  },

  // ── Collaborators ─────────────────────────────────────────
  collaborators: {
    list: (tripId: string) => req<any[]>(`/api/collaborators/${tripId}`),
    invite: (tripId: string, data: any) =>
      req<any>(`/api/collaborators/${tripId}`, { method: "POST", body: JSON.stringify(data) }),
    updateRole: (tripId: string, memberId: string, role: string) =>
      req<any>(`/api/collaborators/${tripId}/${memberId}`, { method: "PATCH", body: JSON.stringify({ role }) }),
    remove: (tripId: string, memberId: string) =>
      req<any>(`/api/collaborators/${tripId}/${memberId}`, { method: "DELETE" }),
  },

  // ── User ──────────────────────────────────────────────────
  user: {
    get: () => req<any>("/api/users/me"),
    update: (data: any) => req<any>("/api/users/me", { method: "PATCH", body: JSON.stringify(data) }),
    identify: (data: { name: string; email: string }) =>
      req<any>("/api/users/identify", { method: "POST", body: JSON.stringify(data) }),
    signOut: () => req<any>("/api/users/identify", { method: "DELETE" }),
  },
};
