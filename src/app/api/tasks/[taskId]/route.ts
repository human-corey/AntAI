import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { updateTaskSchema } from "@/lib/validation/tasks";

type Params = { params: Promise<{ taskId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { taskId } = await params;
  const task = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { taskId } = await params;
  const body = await req.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date().toISOString() };
  if (parsed.data.status === "completed") {
    updates.completedAt = new Date().toISOString();
  }

  db.update(schema.tasks).set(updates).where(eq(schema.tasks.id, taskId)).run();
  const updated = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
  return NextResponse.json(updated);
}
