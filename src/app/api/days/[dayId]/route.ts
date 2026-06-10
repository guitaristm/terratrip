export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const DayUpdateSchema = z.object({
  date: z.string().optional(),
  title: z.string().min(1).optional(),
  order: z.number().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = await params;
  try {
    const body = await req.json();
    const parsed = DayUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const data: { date?: Date; title?: string; order?: number } = {};
    if (parsed.data.date !== undefined) data.date = new Date(parsed.data.date);
    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.order !== undefined) data.order = parsed.data.order;

    const day = await prisma.itineraryDay.update({ where: { id: dayId }, data });
    return NextResponse.json(day);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update day" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = await params;
  try {
    await prisma.itineraryDay.delete({ where: { id: dayId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete day" }, { status: 500 });
  }
}
