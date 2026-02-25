import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { startTeamSchema } from "@/lib/validation/teams";
import { getServerContext } from "@/lib/server-context";
import { createAgentId, createId } from "@/lib/utils/id";
import { apiLog } from "@/lib/logger";
import { DEFAULT_LEAD_SYSTEM_PROMPT } from "@/lib/constants";

type Params = { params: Promise<{ projectId: string; teamId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { projectId, teamId } = await params;
  apiLog.info("POST /teams/:id/start", { projectId, teamId });
  const body = await req.json();
  const parsed = startTeamSchema.safeParse(body);
  if (!parsed.success) {
    apiLog.warn("Validation failed", { errors: parsed.error.flatten() });
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const team = db.select().from(schema.teams).where(eq(schema.teams.id, teamId)).get();
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  if (team.status === "running" || team.status === "starting") {
    return NextResponse.json({ error: "Team is already running" }, { status: 409 });
  }

  const project = db.select().from(schema.projects).where(eq(schema.projects.id, projectId)).get();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const now = new Date().toISOString();
  db.update(schema.teams).set({ status: "starting", updatedAt: now }).where(eq(schema.teams.id, teamId)).run();

  try {
    const { processManager, roomManager, fileWatcher } = getServerContext();

    // Broadcast starting status
    roomManager.broadcast("team", teamId, { type: "team:status", teamId, status: "starting" });
    const agentId = createAgentId();
    const teamConfig = team.config as { leadModel?: string; leadSystemPrompt?: string; members?: unknown[]; initialTasks?: string[] } | null;

    await processManager.spawnTeamLead({
      teamId,
      agentId,
      workingDir: project.workingDir,
      prompt: parsed.data.prompt,
      model: teamConfig?.leadModel,
      systemPrompt: teamConfig?.leadSystemPrompt || DEFAULT_LEAD_SYSTEM_PROMPT,
      isLead: true,
    });

    // Update team status to running
    db.update(schema.teams).set({ status: "running", updatedAt: new Date().toISOString() }).where(eq(schema.teams.id, teamId)).run();
    roomManager.broadcast("team", teamId, { type: "team:status", teamId, status: "running" });

    // Log activity
    db.insert(schema.activityLog).values({
      id: createId(),
      projectId,
      teamId,
      type: "team_started",
      title: `Team "${team.name}" started`,
      detail: `Prompt: ${parsed.data.prompt.slice(0, 100)}`,
      severity: "info",
    }).run();

    roomManager.broadcast("activity", "global", {
      type: "activity:new",
      entry: {
        id: createId(),
        projectId,
        teamId,
        type: "team_started",
        title: `Team "${team.name}" started`,
        severity: "info",
        read: false,
        createdAt: new Date().toISOString(),
      },
    });

    // Activate FileWatcher for agent discovery
    activateFileWatchers(team.name, teamId, projectId, fileWatcher, roomManager);

    // 30s startup timeout
    setTimeout(() => {
      const current = db.select().from(schema.teams).where(eq(schema.teams.id, teamId)).get();
      if (current && current.status === "starting") {
        db.update(schema.teams).set({ status: "error", updatedAt: new Date().toISOString() }).where(eq(schema.teams.id, teamId)).run();
        roomManager.broadcast("team", teamId, { type: "team:status", teamId, status: "error" });
      }
    }, 30000);

    apiLog.info("Team started successfully", { teamId, agentId });
    return NextResponse.json({ ok: true, teamId, agentId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    apiLog.error("Failed to start team", { teamId, error: msg });
    db.update(schema.teams).set({ status: "error", updatedAt: new Date().toISOString() }).where(eq(schema.teams.id, teamId)).run();
    try {
      const { roomManager: rm } = getServerContext();
      rm.broadcast("team", teamId, { type: "team:status", teamId, status: "error" });
    } catch { /* server context may not be available */ }
    return NextResponse.json({ error: `Failed to start team: ${msg}` }, { status: 500 });
  }
}

function activateFileWatchers(
  teamName: string,
  teamId: string,
  projectId: string,
  fileWatcher: import("@/lib/claude/file-watcher").ClaudeFileWatcher,
  roomManager: import("@/lib/ws/rooms").RoomManager
) {
  // Watch for new team members (agent discovery)
  fileWatcher.watchTeamConfig(teamName, (_eventType, _filename, data) => {
    if (!data || typeof data !== "object") return;
    const config = data as { members?: Array<{ name: string; agentId?: string; agentType?: string }> };
    if (!config.members) return;

    const existingAgents = db.select().from(schema.agents).where(eq(schema.agents.teamId, teamId)).all();
    const existingNames = new Set(existingAgents.map((a) => a.name));

    // Detect NEW members
    for (const member of config.members) {
      if (!existingNames.has(member.name)) {
        const newAgentId = createAgentId();
        const now = new Date().toISOString();
        const agent = {
          id: newAgentId,
          teamId,
          name: member.name,
          role: member.agentType || "teammate",
          model: "claude-sonnet-4-6",
          status: "running" as const,
          isLead: false,
          createdAt: now,
          updatedAt: now,
        };
        db.insert(schema.agents).values(agent).run();

        roomManager.broadcast("team", teamId, { type: "team:agent_added", teamId, agent: agent as import("@/lib/types").Agent });
        roomManager.broadcast("activity", "global", {
          type: "activity:new",
          entry: {
            id: createId(),
            projectId,
            teamId,
            agentId: newAgentId,
            type: "agent_spawned",
            title: `Teammate joined: ${member.name}`,
            severity: "info",
            read: false,
            createdAt: now,
          },
        });
      }
    }

    // Detect REMOVED members (teammates only — leads are never auto-removed)
    const configNames = new Set(config.members.map((m) => m.name));
    for (const existingAgent of existingAgents) {
      if (existingAgent.isLead) continue; // Never auto-remove leads
      if (!configNames.has(existingAgent.name)) {
        const now = new Date().toISOString();
        db.update(schema.agents)
          .set({ status: "stopped", stoppedAt: now, updatedAt: now })
          .where(eq(schema.agents.id, existingAgent.id))
          .run();

        roomManager.broadcast("team", teamId, {
          type: "agent:removed",
          agentId: existingAgent.id,
          teamId,
        });
        roomManager.broadcast("activity", "global", {
          type: "activity:new",
          entry: {
            id: createId(),
            projectId,
            teamId,
            agentId: existingAgent.id,
            type: "agent_stopped",
            title: `Teammate left: ${existingAgent.name}`,
            severity: "info",
            read: false,
            createdAt: now,
          },
        });
      }
    }
  });

  // Watch for task changes
  fileWatcher.watchTeamTasks(teamName, (_eventType, filename, data) => {
    if (!filename.endsWith(".json") || !data || typeof data !== "object") return;
    const taskData = data as { id?: string; subject?: string; description?: string; status?: string; owner?: string; blockedBy?: string[]; blocks?: string[] };
    if (!taskData.subject) return;

    const taskId = taskData.id || `task_${filename.replace(".json", "")}`;
    const mappedStatus = mapTaskStatus(taskData.status);

    const existing = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
    const now = new Date().toISOString();

    if (existing) {
      db.update(schema.tasks).set({
        subject: taskData.subject,
        description: taskData.description || "",
        status: mappedStatus,
        updatedAt: now,
        ...(mappedStatus === "completed" ? { completedAt: now } : {}),
      }).where(eq(schema.tasks.id, taskId)).run();

      const updated = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
      if (updated) {
        roomManager.broadcast("tasks", projectId, { type: "task:updated", task: updated as import("@/lib/types").Task });
      }
    } else {
      db.insert(schema.tasks).values({
        id: taskId,
        projectId,
        teamId,
        subject: taskData.subject,
        description: taskData.description || "",
        status: mappedStatus,
        blockedBy: taskData.blockedBy || [],
        blocks: taskData.blocks || [],
      }).run();

      const created = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
      if (created) {
        roomManager.broadcast("tasks", projectId, { type: "task:created", task: created as import("@/lib/types").Task });
      }
    }
  });
}

function mapTaskStatus(status?: string): "pending" | "in_progress" | "completed" | "blocked" | "failed" {
  switch (status) {
    case "pending": return "pending";
    case "in_progress": return "in_progress";
    case "completed": return "completed";
    case "blocked": return "blocked";
    case "failed": return "failed";
    default: return "pending";
  }
}
