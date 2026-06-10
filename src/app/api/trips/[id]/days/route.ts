export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const DaySchema = z.object({
  date: z.string(),
  title: z.string().min(1),
  order: z.number().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const days = await prisma.itineraryDay.findMany({
      where: { tripId: id },
      orderBy: { order: "asc" },
      include: { items: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json(days);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch days" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tripId } = await params;
  try {
    const body = await req.json();
    const parsed = DaySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const count = await prisma.itineraryDay.count({ where: { tripId } });
    const day = await prisma.itineraryDay.create({
      data: {
        tripId,
        date: new Date(parsed.data.date),
        title: parsed.data.title,
        order: parsed.data.order ?? count,
      },
      include: { items: true },
    });
    return NextResponse.json(day, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create day" }, { status: 500 });
  }
}
