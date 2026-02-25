import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getServerContext } from "@/lib/server-context";

type Params = { params: Promise<{ projectId: string; teamId: string; agentId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { projectId, teamId, agentId } = await params;
  const agent = db.select().from(schema.agents).where(eq(schema.agents.id, agentId)).get();
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  if (!agent.sessionId) return NextResponse.json({ error: "Agent has no session to resume" }, { status: 400 });

  const project = db.select().from(schema.projects).where(eq(schema.projects.id, projectId)).get();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { processManager, roomManager } = getServerContext();

  try {
    await processManager.spawnTeamLead({
      teamId,
      agentId: agent.id,
      workingDir: project.workingDir,
      prompt: "",
      sessionId: agent.sessionId,
      isLead: agent.isLead,
    });

    const now = new Date().toISOString();
    db.update(schema.agents).set({ status: "running", stoppedAt: null, updatedAt: now }).where(eq(schema.agents.id, agentId)).run();
    db.update(schema.teams).set({ status: "running", updatedAt: now }).where(eq(schema.teams.id, teamId)).run();

    roomManager.broadcast("agent", agentId, { type: "agent:status", agentId, status: "running" });
    roomManager.broadcast("team", teamId, { type: "team:status", teamId, status: "running" });

    return NextResponse.json({ ok: true, agentId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to resume agent: ${msg}` }, { status: 500 });
  }
}
