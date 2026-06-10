export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tripId } = await params;
  try {
    const userId = req.cookies.get("tt_uid")?.value;
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const role = body?.role === "editor" ? "editor" : "viewer";

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const existing = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (existing) {
      return NextResponse.json({ ...existing, alreadyMember: true });
    }

    const member = await prisma.tripMember.create({
      data: {
        tripId,
        userId,
        role,
        invitedEmail: user.email,
        accepted: true,
      },
      include: { user: true },
    });
    return NextResponse.json(member, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to join trip" }, { status: 500 });
  }
}
