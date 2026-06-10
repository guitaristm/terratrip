export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SettingsSchema } from "@/lib/schemas";

const DEMO_USER_EMAIL = "demo@terratrip.app";

export async function GET() {
  try {
    const user = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SettingsSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const user = await prisma.user.upsert({
      where: { email: DEMO_USER_EMAIL },
      update: {
        name: parsed.data.name,
        currency: parsed.data.currency,
        theme: parsed.data.theme,
        notifications: parsed.data.notifications,
      },
      create: {
        email: DEMO_USER_EMAIL,
        name: parsed.data.name,
        currency: parsed.data.currency,
        theme: parsed.data.theme,
        notifications: parsed.data.notifications,
      },
    });
    return NextResponse.json(user);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
