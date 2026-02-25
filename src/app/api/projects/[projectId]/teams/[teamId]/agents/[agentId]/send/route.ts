import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getServerContext } from "@/lib/server-context";
import { createId } from "@/lib/utils/id";
import { apiLog } from "@/lib/logger";

type Params = { params: Promise<{ projectId: string; teamId: string; agentId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { projectId, teamId, agentId } = await params;
  apiLog.info("POST /agents/:id/send", { projectId, teamId, agentId });
  const body = await req.json();
  const { message } = body;
  if (!message || typeof message !== "string") {
    apiLog.warn("Message is required", { agentId });
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const agent = db.select().from(schema.agents).where(eq(schema.agents.id, agentId)).get();
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const { processManager } = getServerContext();

  // Case 1: Agent process is currently running — write to stdin
  if (processManager.isRunning(agentId)) {
    apiLog.info("Sending via stdin (running process)", { agentId });
    processManager.sendInput(agentId, message + "\n");

    db.insert(schema.messages).values({
      id: createId(),
      teamId,
      content: message,
      type: "user",
      toAgentId: agentId,
    }).run();

    return NextResponse.json({ ok: true, agentId, method: "stdin" });
  }

  // Case 2: Agent is not running but has a sessionId — spawn new process with --resume
  if (agent.sessionId) {
    apiLog.info("Resuming agent with --resume", { agentId, sessionId: agent.sessionId });
    const project = db.select().from(schema.projects).where(eq(schema.projects.id, projectId)).get();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const now = new Date().toISOString();
    db.update(schema.agents)
      .set({ status: "running", updatedAt: now })
      .where(eq(schema.agents.id, agentId))
      .run();

    const { roomManager } = getServerContext();
    roomManager.broadcast("agent", agentId, {
      type: "agent:status",
      agentId,
      status: "running",
    });

    const teamConfig = (() => {
      const team = db.select().from(schema.teams).where(eq(schema.teams.id, teamId)).get();
      return team?.config as { leadModel?: string } | null;
    })();

    await processManager.spawnTeamLead({
      teamId,
      agentId,
      workingDir: project.workingDir,
      prompt: message,
      model: teamConfig?.leadModel || agent.model,
      sessionId: agent.sessionId,
      isLead: agent.isLead,
    });

    db.insert(schema.messages).values({
      id: createId(),
      teamId,
      content: message,
      type: "user",
      toAgentId: agentId,
    }).run();

    return NextResponse.json({ ok: true, agentId, method: "resume" });
  }

  // Case 3: No running process, no sessionId — can't send
  apiLog.warn("Cannot send: no process and no session", { agentId });
  return NextResponse.json(
    { error: "Agent is not running and has no session to resume" },
    { status: 409 }
  );
}
