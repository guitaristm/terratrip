export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ItineraryItemSchema } from "@/lib/schemas";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ dayId: string; itemId: string }> }) {
  const { itemId } = await params;
  try {
    const body = await req.json();
    const parsed = ItineraryItemSchema.partial().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const item = await prisma.itineraryItem.update({ where: { id: itemId }, data: parsed.data });
    return NextResponse.json(item);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ dayId: string; itemId: string }> }) {
  const { itemId } = await params;
  try {
    await prisma.itineraryItem.delete({ where: { id: itemId } });
    return NextResponse.json({ deleted: itemId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
