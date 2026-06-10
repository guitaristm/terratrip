export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tripId: string; memberId: string }> }) {
  const { memberId } = await params;
  try {
    const { role } = await req.json();
    const member = await prisma.tripMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: true },
    });
    return NextResponse.json(member);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ tripId: string; memberId: string }> }) {
  const { memberId } = await params;
  try {
    await prisma.tripMember.delete({ where: { id: memberId } });
    return NextResponse.json({ deleted: memberId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
