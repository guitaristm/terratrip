export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ItineraryItemSchema } from "@/lib/schemas";

export async function POST(req: NextRequest, { params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = await params;
  try {
    const body = await req.json();
    const parsed = ItineraryItemSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const count = await prisma.itineraryItem.count({ where: { dayId } });
    const item = await prisma.itineraryItem.create({
      data: {
        dayId,
        title: parsed.data.title,
        time: parsed.data.time ?? null,
        notes: parsed.data.notes ?? null,
        category: parsed.data.category,
        amount: parsed.data.amount ?? null,
        currency: parsed.data.currency,
        order: parsed.data.order ?? count,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
