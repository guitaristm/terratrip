import { NextResponse } from "next/server";

// Approximate static rates (real app fetches from open.er-api.com)
const RATES: Record<string, Record<string, number>> = {
  THB: { JPY: 4.0, USD: 0.028, THB: 1 },
  JPY: { THB: 0.25, USD: 0.0067, JPY: 1 },
  USD: { THB: 35.5, JPY: 149.5, USD: 1 },
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = (url.searchParams.get("from") ?? "THB").toUpperCase();
  const to = (url.searchParams.get("to") ?? "JPY").toUpperCase();
  const rate = RATES[from]?.[to] ?? 1;
  return NextResponse.json({ from, to, rate }, {
    headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" },
  });
}
