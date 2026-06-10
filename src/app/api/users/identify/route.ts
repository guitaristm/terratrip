export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const IdentifySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  confirmUserId: z.string().optional(),
  createNew: z.boolean().optional(),
});

const COOKIE = "tt_uid";
const ONE_YEAR = 60 * 60 * 24 * 365;

function setCookie(res: NextResponse, userId: string) {
  res.cookies.set(COOKIE, userId, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = IdentifySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const name = parsed.data.name.trim();

    // "Yes, that's me" — adopt an existing profile.
    if (parsed.data.confirmUserId) {
      const user = await prisma.user.findUnique({ where: { id: parsed.data.confirmUserId } });
      if (!user) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      const res = NextResponse.json(user);
      setCookie(res, user.id);
      return res;
    }

    // Look for existing profiles with the same name (unless they chose "I'm new").
    if (!parsed.data.createNew) {
      const matches = await prisma.user.findMany({
        where: { name: { equals: name, mode: "insensitive" } },
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: "asc" },
        take: 5,
      });
      if (matches.length > 0) {
        return NextResponse.json({ matches });
      }
    }

    // Create a fresh name-only profile (no email).
    const user = await prisma.user.create({
      data: { name, currency: "THB", theme: "light", notifications: true },
    });
    const res = NextResponse.json(user);
    setCookie(res, user.id);
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to continue" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
