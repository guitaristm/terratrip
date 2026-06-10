export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CollaboratorSchema } from "@/lib/schemas";
import { sendInviteEmail } from "@/lib/email";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  try {
    const members = await prisma.tripMember.findMany({
      where: { tripId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(members);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  try {
    const body = await req.json();
    const parsed = CollaboratorSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    // Find or create user by email
    let user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: parsed.data.email,
          name: parsed.data.email.split("@")[0],
          currency: "THB",
          theme: "light",
          notifications: true,
        },
      });
    }

    // Check if already a member
    const existing = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: user.id } },
    });
    if (existing) return NextResponse.json({ error: "Already a member" }, { status: 409 });

    const member = await prisma.tripMember.create({
      data: {
        tripId,
        userId: user.id,
        role: parsed.data.role,
        invitedEmail: parsed.data.email,
        accepted: false,
      },
      include: { user: true },
    });

    // Look up the trip + inviter for the email, then attempt to send.
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    let inviterName = "A TerraTrip user";
    const inviterId = req.cookies.get("tt_uid")?.value;
    if (inviterId) {
      const inviter = await prisma.user.findUnique({ where: { id: inviterId } });
      if (inviter?.name) inviterName = inviter.name;
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const email = await sendInviteEmail({
      to: parsed.data.email,
      inviterName,
      tripName: trip?.name ?? "a trip",
      role: parsed.data.role,
      link: `${appUrl}/trips/${tripId}`,
    });

    return NextResponse.json({ ...member, emailSent: email.sent, emailReason: email.reason }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to invite collaborator" }, { status: 500 });
  }
}
