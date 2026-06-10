export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ExpenseSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  const tripId = req.nextUrl.searchParams.get("tripId");
  if (!tripId) return NextResponse.json({ error: "tripId required" }, { status: 400 });
  try {
    const expenses = await prisma.expense.findMany({
      where: { tripId },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tripId, ...rest } = body;
    if (!tripId) return NextResponse.json({ error: "tripId required" }, { status: 400 });

    const parsed = ExpenseSchema.safeParse(rest);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const expense = await prisma.expense.create({
      data: {
        tripId,
        title: parsed.data.title,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        category: parsed.data.category,
        date: new Date(parsed.data.date),
        baseCurrency: body.baseCurrency ?? parsed.data.currency,
        baseAmount: body.baseAmount ?? null,
      },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
