export const APP_NAME = "AntAI";
export const APP_VERSION = "0.1.0";
export const APP_DESCRIPTION =
  "Visual GUI for Claude Code Agent Teams — an open source mycelium-inspired orchestrator";

export const DEFAULT_PORT = 3000;
export const WS_PATH = "/ws";

export const AGENT_STATUS = {
  IDLE: "idle",
  RUNNING: "running",
  THINKING: "thinking",
  TOOL_USE: "tool_use",
  ERROR: "error",
  STOPPED: "stopped",
  CRASHED: "crashed",
} as const;

export const TEAM_STATUS = {
  IDLE: "idle",
  STARTING: "starting",
  RUNNING: "running",
  STOPPING: "stopping",
  STOPPED: "stopped",
  ERROR: "error",
} as const;

export const TASK_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  BLOCKED: "blocked",
  FAILED: "failed",
} as const;

export const PROJECT_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
} as const;

export const WS_CHANNELS = {
  PROJECT: "project",
  TEAM: "team",
  AGENT: "agent",
  TERMINAL: "terminal",
  TASKS: "tasks",
  ACTIVITY: "activity",
} as const;

export const LOG_LEVELS = {
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  DEBUG: "debug",
  TOOL_USE: "tool_use",
  TOOL_RESULT: "tool_result",
} as const;

export const GRACEFUL_SHUTDOWN_TIMEOUT = 5000;
export const SIGKILL_TIMEOUT = 10000;
export const WS_PING_INTERVAL = 30000;
export const WS_RECONNECT_BASE_DELAY = 1000;
export const WS_RECONNECT_MAX_DELAY = 30000;
export const EDGE_ANIMATION_DURATION = 3000;
export const OUTPUT_BUFFER_FLUSH_INTERVAL = 16; // ~60fps
export const LOG_RETENTION_DAYS = 30;
