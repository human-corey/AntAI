import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { startTeamSchema } from "@/lib/validation/teams";

type Params = { params: Promise<{ projectId: string; teamId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { teamId } = await params;
  const body = await req.json();
  const parsed = startTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const team = db.select().from(schema.teams).where(eq(schema.teams.id, teamId)).get();
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  if (team.status === "running" || team.status === "starting") {
    return NextResponse.json({ error: "Team is already running" }, { status: 409 });
  }

  // Update team status (actual process spawning is handled by ProcessManager in Phase 3)
  db.update(schema.teams).set({ status: "starting", updatedAt: new Date().toISOString() }).where(eq(schema.teams.id, teamId)).run();

  return NextResponse.json({ ok: true, teamId, prompt: parsed.data.prompt });
}
