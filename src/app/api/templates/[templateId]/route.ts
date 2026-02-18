import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ templateId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { templateId } = await params;
  const template = db.select().from(schema.templates).where(eq(schema.templates.id, templateId)).get();
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  return NextResponse.json(template);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { templateId } = await params;
  const body = await req.json();

  const existing = db.select().from(schema.templates).where(eq(schema.templates.id, templateId)).get();
  if (!existing) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  if (existing.isBuiltIn) return NextResponse.json({ error: "Cannot modify built-in templates" }, { status: 403 });

  db.update(schema.templates).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(schema.templates.id, templateId)).run();
  const updated = db.select().from(schema.templates).where(eq(schema.templates.id, templateId)).get();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { templateId } = await params;
  const existing = db.select().from(schema.templates).where(eq(schema.templates.id, templateId)).get();
  if (!existing) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  if (existing.isBuiltIn) return NextResponse.json({ error: "Cannot delete built-in templates" }, { status: 403 });

  db.delete(schema.templates).where(eq(schema.templates.id, templateId)).run();
  return NextResponse.json({ ok: true });
}
