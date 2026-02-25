import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getServerContext } from "@/lib/server-context";
import { createId } from "@/lib/utils/id";

type Params = { params: Promise<{ projectId: string; teamId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { projectId, teamId } = await params;
  const team = db.select().from(schema.teams).where(eq(schema.teams.id, teamId)).get();
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  if (team.status === "stopped" || team.status === "idle") {
    return NextResponse.json({ error: "Team is not running" }, { status: 409 });
  }

  const now = new Date().toISOString();
  db.update(schema.teams).set({ status: "stopping", updatedAt: now }).where(eq(schema.teams.id, teamId)).run();

  try {
    const { processManager, roomManager } = getServerContext();

    roomManager.broadcast("team", teamId, { type: "team:status", teamId, status: "stopping" });

    await processManager.stopTeam(teamId);

    const stoppedAt = new Date().toISOString();
    db.update(schema.teams).set({ status: "stopped", updatedAt: stoppedAt }).where(eq(schema.teams.id, teamId)).run();
    roomManager.broadcast("team", teamId, { type: "team:status", teamId, status: "stopped" });

    // Log activity
    db.insert(schema.activityLog).values({
      id: createId(),
      projectId,
      teamId,
      type: "team_stopped",
      title: `Team "${team.name}" stopped`,
      severity: "info",
    }).run();

    roomManager.broadcast("activity", "global", {
      type: "activity:new",
      entry: {
        id: createId(),
        projectId,
        teamId,
        type: "team_stopped",
        title: `Team "${team.name}" stopped`,
        severity: "info",
        read: false,
        createdAt: stoppedAt,
      },
    });

    return NextResponse.json({ ok: true, teamId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    db.update(schema.teams).set({ status: "error", updatedAt: new Date().toISOString() }).where(eq(schema.teams.id, teamId)).run();
    try {
      const { roomManager: rm } = getServerContext();
      rm.broadcast("team", teamId, { type: "team:status", teamId, status: "error" });
    } catch { /* server context may not be available */ }
    return NextResponse.json({ error: `Failed to stop team: ${msg}` }, { status: 500 });
  }
}
