import type { Agent, Team, Task, ActivityEntry } from "@/lib/types";
import type { TranscriptEntry } from "@/lib/claude/types";

// Messages sent from client to server
export type ClientMessage =
  | { type: "subscribe"; channel: string; id: string }
  | { type: "unsubscribe"; channel: string; id: string }
  | { type: "terminal:input"; agentId: string; data: string }
  | { type: "terminal:resize"; agentId: string; cols: number; rows: number }
  | { type: "chat:send"; agentId: string; teamId: string; projectId: string; message: string }
  | { type: "ping" };

// Messages sent from server to client
export type ServerMessage =
  | { type: "subscribed"; channel: string; id: string }
  | { type: "unsubscribed"; channel: string; id: string }
  | { type: "terminal:output"; agentId: string; data: string }
  | { type: "agent:status"; agentId: string; status: Agent["status"]; currentTask?: string; lastOutput?: string }
  | { type: "agent:spawned"; agent: Agent }
  | { type: "agent:exited"; agentId: string; code: number }
  | { type: "agent:event"; agentId: string; event: TranscriptEntry }
  | { type: "chat:ack"; agentId: string; method: "stdin" | "resume"; ok: true }
  | { type: "chat:error"; agentId: string; error: string }
  | { type: "team:status"; teamId: string; status: Team["status"] }
  | { type: "team:agent_added"; teamId: string; agent: Agent }
  | { type: "agent:removed"; agentId: string; teamId: string }
  | { type: "task:created"; task: Task }
  | { type: "task:updated"; task: Task }
  | { type: "activity:new"; entry: ActivityEntry }
  | { type: "pong" }
  | { type: "error"; message: string };

export function parseClientMessage(raw: string): ClientMessage | null {
  try {
    const msg = JSON.parse(raw);
    if (!msg || typeof msg.type !== "string") return null;
    return msg as ClientMessage;
  } catch {
    return null;
  }
}

export function serializeServerMessage(msg: ServerMessage): string {
  return JSON.stringify(msg);
}
