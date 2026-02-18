import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ projectId: string; teamId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { teamId } = await params;
  const team = db.select().from(schema.teams).where(eq(schema.teams.id, teamId)).get();
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  if (team.status === "stopped" || team.status === "idle") {
    return NextResponse.json({ error: "Team is not running" }, { status: 409 });
  }

  db.update(schema.teams).set({ status: "stopping", updatedAt: new Date().toISOString() }).where(eq(schema.teams.id, teamId)).run();
  return NextResponse.json({ ok: true, teamId });
}
