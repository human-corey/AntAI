import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getServerContext } from "@/lib/server-context";

type Params = { params: Promise<{ projectId: string; teamId: string; agentId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { teamId, agentId } = await params;
  const agent = db.select().from(schema.agents).where(eq(schema.agents.id, agentId)).get();
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const { processManager, roomManager } = getServerContext();

  if (processManager.isRunning(agentId)) {
    processManager.killAgent(agentId);
  }

  const now = new Date().toISOString();
  db.update(schema.agents).set({ status: "stopped", stoppedAt: now, updatedAt: now }).where(eq(schema.agents.id, agentId)).run();
  roomManager.broadcast("agent", agentId, { type: "agent:exited", agentId, code: -1 });

  return NextResponse.json({ ok: true, agentId });
}
