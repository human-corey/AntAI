// Project
export interface Project {
  id: string;
  name: string;
  description: string;
  workingDir: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

// Team
export interface Team {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: "idle" | "starting" | "running" | "stopping" | "stopped" | "error";
  config: TeamConfig;
  createdAt: string;
  updatedAt: string;
}

export interface TeamConfig {
  leadModel?: string;
  leadSystemPrompt?: string;
  enableThinking?: boolean;
  members: TeamMemberConfig[];
  initialTasks?: string[];
}

export interface TeamMemberConfig {
  name: string;
  role: string;
  model?: string;
  systemPrompt?: string;
}

// Agent (runtime instance of a team member)
export interface Agent {
  id: string;
  teamId: string;
  name: string;
  role: string;
  model: string;
  status: "idle" | "running" | "thinking" | "tool_use" | "error" | "stopped" | "crashed";
  isLead: boolean;
  pid?: number | null;
  sessionId?: string | null;
  currentTask?: string | null;
  lastOutput?: string | null;
  startedAt?: string | null;
  stoppedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Task
export interface Task {
  id: string;
  projectId: string;
  teamId?: string | null;
  agentId?: string | null;
  subject: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "blocked" | "failed";
  blockedBy: string[];
  blocks: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

// Message (between agents or user->agent)
export interface Message {
  id: string;
  teamId: string;
  fromAgentId?: string;
  toAgentId?: string;
  content: string;
  type: "user" | "agent" | "system" | "tool_use" | "tool_result";
  createdAt: string;
}

// Log entry
export interface LogEntry {
  id: string;
  projectId: string;
  teamId?: string;
  agentId?: string;
  level: "info" | "warn" | "error" | "debug" | "tool_use" | "tool_result";
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Canvas layout
export interface CanvasLayout {
  id: string;
  projectId: string;
  nodeId: string;
  x: number;
  y: number;
  collapsed: boolean;
  updatedAt: string;
}

// Template
export interface Template {
  id: string;
  name: string;
  description: string;
  config: TeamConfig;
  tags: string[];
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

// Activity log
export interface ActivityEntry {
  id: string;
  projectId?: string;
  teamId?: string;
  agentId?: string;
  type: "team_started" | "team_stopped" | "agent_spawned" | "agent_stopped" | "agent_error" | "task_created" | "task_completed" | "task_failed" | "message_sent" | "system";
  title: string;
  detail?: string;
  severity: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

// Settings
export interface AppSettings {
  theme: "dark" | "light" | "system";
  claudeCliPath?: string;
  defaultModel: string;
  enableThinking: boolean;
  autoLayout: boolean;
  showMinimap: boolean;
  edgeAnimations: boolean;
  notificationSounds: boolean;
  logRetentionDays: number;
}

// WebSocket protocol types
export type ClientMessage =
  | { type: "subscribe"; channel: string; id: string }
  | { type: "unsubscribe"; channel: string; id: string }
  | { type: "terminal:input"; agentId: string; data: string }
  | { type: "terminal:resize"; agentId: string; cols: number; rows: number }
  | { type: "ping" };

export type ServerMessage =
  | { type: "subscribed"; channel: string; id: string }
  | { type: "unsubscribed"; channel: string; id: string }
  | { type: "terminal:output"; agentId: string; data: string }
  | { type: "agent:status"; agentId: string; status: Agent["status"]; currentTask?: string; lastOutput?: string }
  | { type: "agent:spawned"; agent: Agent }
  | { type: "agent:exited"; agentId: string; code: number }
  | { type: "team:status"; teamId: string; status: Team["status"] }
  | { type: "team:agent_added"; teamId: string; agent: Agent }
  | { type: "task:created"; task: Task }
  | { type: "task:updated"; task: Task }
  | { type: "activity:new"; entry: ActivityEntry }
  | { type: "pong" }
  | { type: "error"; message: string };

// React Flow node/edge data types
export interface AgentNodeData {
  agent: Agent;
  isSelected: boolean;
  isCompact: boolean;
  tasks: Task[];
}

export interface TunnelEdgeData {
  isActive: boolean;
  messageDirection?: "forward" | "backward";
  lastActivity?: string;
}
