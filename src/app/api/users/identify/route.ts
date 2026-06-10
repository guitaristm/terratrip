export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const IdentifySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email required"),
});

const COOKIE = "tt_uid";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = IdentifySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.upsert({
      where: { email },
      update: { name: parsed.data.name },
      create: {
        email,
        name: parsed.data.name,
        currency: "THB",
        theme: "light",
        notifications: true,
      },
    });

    const res = NextResponse.json(user);
    res.cookies.set(COOKIE, user.id, {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
