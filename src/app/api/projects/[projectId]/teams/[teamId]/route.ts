import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { updateTeamSchema } from "@/lib/validation/teams";

type Params = { params: Promise<{ projectId: string; teamId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { teamId } = await params;
  const team = db.select().from(schema.teams).where(eq(schema.teams.id, teamId)).get();
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  return NextResponse.json(team);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { teamId } = await params;
  const body = await req.json();
  const parsed = updateTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = db.select().from(schema.teams).where(eq(schema.teams.id, teamId)).get();
  if (!existing) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  db.update(schema.teams).set({ ...parsed.data, updatedAt: new Date().toISOString() }).where(eq(schema.teams.id, teamId)).run();
  const updated = db.select().from(schema.teams).where(eq(schema.teams.id, teamId)).get();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { teamId } = await params;
  const existing = db.select().from(schema.teams).where(eq(schema.teams.id, teamId)).get();
  if (!existing) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  db.delete(schema.teams).where(eq(schema.teams.id, teamId)).run();
  return NextResponse.json({ ok: true });
}
