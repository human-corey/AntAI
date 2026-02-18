import type { ChildProcess } from "child_process";

export interface ManagedProcess {
  agentId: string;
  teamId: string;
  process: ChildProcess;
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
  | { type: "thinking"; content: string };
