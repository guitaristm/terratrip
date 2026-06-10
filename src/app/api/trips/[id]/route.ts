export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TripSchema } from "@/lib/schemas";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        members: { include: { user: true } },
        days: { orderBy: { order: "asc" }, include: { items: { orderBy: { order: "asc" } } } },
        expenses: { orderBy: { date: "desc" } },
        _count: { select: { days: true, expenses: true } },
      },
    });
    if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(trip);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch trip" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = TripSchema.partial().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.startDate) data.startDate = new Date(parsed.data.startDate);
    if (parsed.data.endDate) data.endDate = new Date(parsed.data.endDate);

    const trip = await prisma.trip.update({
      where: { id },
      data,
      include: {
        members: { include: { user: true } },
        _count: { select: { days: true, expenses: true } },
      },
    });
    return NextResponse.json(trip);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.trip.delete({ where: { id } });
    return NextResponse.json({ deleted: id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 });
  }
}
