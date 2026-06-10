export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { SettingsSchema } from "@/lib/schemas";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SettingsSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    return NextResponse.json({ data: parsed.data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
