import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { updateProjectSchema } from "@/lib/validation/projects";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const project = db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .get();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const body = await req.json();
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .get();
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  db.update(schema.projects)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(schema.projects.id, projectId))
    .run();

  const updated = db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .get();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const existing = db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .get();
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  db.delete(schema.projects).where(eq(schema.projects.id, projectId)).run();
  return NextResponse.json({ ok: true });
}
