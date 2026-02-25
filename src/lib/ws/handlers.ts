import type WebSocket from "ws";
import type { RoomManager } from "./rooms";
import { parseClientMessage, serializeServerMessage } from "./protocol";
import type { ProcessManager } from "@/lib/claude/process-manager";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createId } from "@/lib/utils/id";
import { wsLog } from "@/lib/logger";

export function handleClientMessage(
  ws: WebSocket,
  raw: string,
  rooms: RoomManager,
  processManager: ProcessManager
): void {
  const msg = parseClientMessage(raw);
  if (!msg) {
    wsLog.warn("Invalid message format", { raw: raw.slice(0, 100) });
    ws.send(serializeServerMessage({ type: "error", message: "Invalid message format" }));
    return;
  }

  switch (msg.type) {
    case "ping":
      ws.send(serializeServerMessage({ type: "pong" }));
      break;

    case "subscribe":
      wsLog.debug("Subscribe", { channel: msg.channel, id: msg.id });
      rooms.subscribe(ws, msg.channel, msg.id);
      ws.send(serializeServerMessage({ type: "subscribed", channel: msg.channel, id: msg.id }));
      break;

    case "unsubscribe":
      wsLog.debug("Unsubscribe", { channel: msg.channel, id: msg.id });
      rooms.unsubscribe(ws, msg.channel, msg.id);
      ws.send(serializeServerMessage({ type: "unsubscribed", channel: msg.channel, id: msg.id }));
      break;

    case "terminal:input":
      wsLog.debug("Terminal input", { agentId: msg.agentId, len: msg.data.length });
      processManager.sendInput(msg.agentId, msg.data);
      break;

    case "terminal:resize":
      processManager.resizeTerminal(msg.agentId, msg.cols, msg.rows);
      break;

    case "chat:send":
      handleChatSend(ws, msg, rooms, processManager).catch((err) => {
        wsLog.error("chat:send handler error", { error: String(err) });
        ws.send(serializeServerMessage({
          type: "chat:error",
          agentId: msg.agentId,
          error: "Internal server error",
        }));
      });
      break;

    default:
      ws.send(serializeServerMessage({ type: "error", message: `Unknown message type` }));
  }
}

async function handleChatSend(
  ws: WebSocket,
  msg: { agentId: string; teamId: string; projectId: string; message: string },
  rooms: RoomManager,
  processManager: ProcessManager
): Promise<void> {
  const { agentId, teamId, projectId, message } = msg;
  wsLog.info("chat:send", { agentId, teamId, contentLen: message.length });

  if (!message || typeof message !== "string") {
    ws.send(serializeServerMessage({ type: "chat:error", agentId, error: "Message is required" }));
    return;
  }

  const agent = db.select().from(schema.agents).where(eq(schema.agents.id, agentId)).get();
  if (!agent) {
    ws.send(serializeServerMessage({ type: "chat:error", agentId, error: "Agent not found" }));
    return;
  }

  // Broadcast user_message transcript entry so all subscribers see it
  const userEntry = {
    id: createId(),
    timestamp: new Date().toISOString(),
    type: "user_message" as const,
    content: message,
  };
  rooms.broadcast("agent", agentId, {
    type: "agent:event",
    agentId,
    event: userEntry,
  });

  // Save user message to messages table
  db.insert(schema.messages).values({
    id: createId(),
    teamId,
    content: message,
    type: "user",
    toAgentId: agentId,
  }).run();

  // Case 1: Process is alive (running or idle between turns) — write to stdin
  if (processManager.isRunning(agentId)) {
    wsLog.info("chat:send via stdin", { agentId });
    processManager.sendMessage(agentId, message);
    // Mark agent as running (important when it was idle between turns)
    const now = new Date().toISOString();
    db.update(schema.agents)
      .set({ status: "running", updatedAt: now })
      .where(eq(schema.agents.id, agentId))
      .run();
    rooms.broadcast("agent", agentId, {
      type: "agent:status",
      agentId,
      status: "running",
    });
    ws.send(serializeServerMessage({ type: "chat:ack", agentId, method: "stdin", ok: true }));
    return;
  }

  // Case 2: Agent is not running but has a sessionId — spawn with --resume
  if (agent.sessionId) {
    wsLog.info("chat:send via resume", { agentId, sessionId: agent.sessionId });
    const project = db.select().from(schema.projects).where(eq(schema.projects.id, projectId)).get();
    if (!project) {
      ws.send(serializeServerMessage({ type: "chat:error", agentId, error: "Project not found" }));
      return;
    }

    const now = new Date().toISOString();
    db.update(schema.agents)
      .set({ status: "running", updatedAt: now })
      .where(eq(schema.agents.id, agentId))
      .run();

    rooms.broadcast("agent", agentId, {
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

    ws.send(serializeServerMessage({ type: "chat:ack", agentId, method: "resume", ok: true }));
    return;
  }

  // Case 3: No running process, no sessionId — can't send
  wsLog.warn("chat:send: no process and no session", { agentId });
  ws.send(serializeServerMessage({
    type: "chat:error",
    agentId,
    error: "Agent is not running and has no session to resume",
  }));
}
