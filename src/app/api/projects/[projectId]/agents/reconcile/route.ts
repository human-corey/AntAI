import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
import { getServerContext } from "@/lib/server-context";
import { apiLog } from "@/lib/logger";

type Params = { params: Promise<{ projectId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  apiLog.info("POST /agents/reconcile", { projectId });

  const teams = db
    .select({ id: schema.teams.id })
    .from(schema.teams)
    .where(eq(schema.teams.projectId, projectId))
    .all();

  if (teams.length === 0) {
    return NextResponse.json({ reconciled: [] });
  }

  const teamIds = teams.map((t) => t.id);

  // Find agents that DB thinks are active but might not have running processes
  const staleAgents = db
    .select()
    .from(schema.agents)
    .where(inArray(schema.agents.teamId, teamIds))
    .all()
    .filter(
      (a) => a.status === "running" || a.status === "thinking" || a.status === "tool_use"
    );

  if (staleAgents.length === 0) {
    return NextResponse.json({ reconciled: [] });
  }

  const { processManager } = getServerContext();
  const reconciled: string[] = [];
  const now = new Date().toISOString();

  for (const agent of staleAgents) {
    if (!processManager.isRunning(agent.id)) {
      // Agent has no running process — fix status
      const newStatus = agent.sessionId ? "idle" : "stopped";
      apiLog.info("Reconciling stale agent", {
        agentId: agent.id,
        oldStatus: agent.status,
        newStatus,
      });
      db.update(schema.agents)
        .set({ status: newStatus, updatedAt: now })
        .where(eq(schema.agents.id, agent.id))
        .run();
      reconciled.push(agent.id);
    }
  }

  // Also reconcile teams: if all agents are stopped/idle, team should not be "running"
  for (const teamId of teamIds) {
    const team = db.select().from(schema.teams).where(eq(schema.teams.id, teamId)).get();
    if (team && (team.status === "running" || team.status === "starting")) {
      const hasRunning = db
        .select()
        .from(schema.agents)
        .where(eq(schema.agents.teamId, teamId))
        .all()
        .some((a) => a.status === "running" || a.status === "thinking" || a.status === "tool_use");

      if (!hasRunning) {
        apiLog.info("Reconciling stale team", { teamId, oldStatus: team.status });
        db.update(schema.teams)
          .set({ status: "stopped", updatedAt: now })
          .where(eq(schema.teams.id, teamId))
          .run();
      }
    }
  }

  return NextResponse.json({ reconciled });
}
