export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ExpenseSchema } from "@/lib/schemas";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ expenseId: string }> }) {
  const { expenseId } = await params;
  try {
    const body = await req.json();
    const parsed = ExpenseSchema.partial().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.date) data.date = new Date(parsed.data.date);

    const expense = await prisma.expense.update({ where: { id: expenseId }, data });
    return NextResponse.json(expense);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ expenseId: string }> }) {
  const { expenseId } = await params;
  try {
    await prisma.expense.delete({ where: { id: expenseId } });
    return NextResponse.json({ deleted: expenseId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
