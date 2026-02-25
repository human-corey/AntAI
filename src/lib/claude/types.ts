import type { IPty } from "node-pty";

export interface ManagedProcess {
  agentId: string;
  teamId: string;
  process: IPty;
  pid: number;
  isLead: boolean;
  startedAt: string;
}

export interface SpawnOptions {
  teamId: string;
  agentId: string;
  workingDir: string;
  prompt: string;
  model?: string;
  systemPrompt?: string;
  enableThinking?: boolean;
  isLead?: boolean;
  sessionId?: string; // for resume
}

export type OutputEvent =
  | { type: "output_line"; line: string }
  | { type: "status_change"; status: string }
  | { type: "tool_use"; tool: string; input?: string }
  | { type: "tool_result"; result: string }
  | { type: "task_activity"; taskId?: string; subject?: string; status?: string }
  | { type: "agent_spawned"; name: string; role?: string }
  | { type: "message"; content: string }
  | { type: "error"; message: string }
  | { type: "thinking"; content: string }
  | { type: "result"; sessionId: string; costUsd?: number; numTurns?: number; isError?: boolean; resultText?: string }
  | { type: "message_delta"; blockId: string; content: string; isFinal: boolean }
  | { type: "thinking_delta"; blockId: string; content: string; isFinal: boolean };

export type TranscriptEntryType =
  | "message"
  | "user_message"
  | "tool_use"
  | "tool_result"
  | "thinking"
  | "error"
  | "result"
  | "status_change"
  | "agent_spawned";

export interface TranscriptEntry {
  id: string;
  timestamp: string;
  type: TranscriptEntryType;
  content?: string;
  tool?: string;
  toolInput?: string;
  toolResult?: string;
  sessionId?: string;
  costUsd?: number;
  numTurns?: number;
  isError?: boolean;
  isStreaming?: boolean;
  status?: string;
  agentName?: string;
}
