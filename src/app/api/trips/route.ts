export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TripSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const trips = await prisma.trip.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        members: { include: { user: true } },
        _count: { select: { days: true, expenses: true } },
      },
    });
    return NextResponse.json(trips);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch trips" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = TripSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { name, country, startDate, endDate, budget, currency } = parsed.data;
    const trip = await prisma.trip.create({
      data: {
        name, country, budget, currency,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
      include: {
        members: true,
        _count: { select: { days: true, expenses: true } },
      },
    });
    return NextResponse.json(trip, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 });
  }
}
