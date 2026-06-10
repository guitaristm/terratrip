export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SettingsSchema } from "@/lib/schemas";

const COOKIE = "tt_uid";

export async function GET(req: NextRequest) {
  try {
    const id = req.cookies.get(COOKIE)?.value;
    if (!id) return NextResponse.json(null);
    const user = await prisma.user.findUnique({ where: { id } });
    return NextResponse.json(user ?? null);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const id = req.cookies.get(COOKIE)?.value;
    if (!id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const body = await req.json();
    const parsed = SettingsSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const user = await prisma.user.update({
      where: { id },
      data: {
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
