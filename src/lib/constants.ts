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
export const MAX_TRANSCRIPT_ENTRIES = 2000;
export const PROJECTS_BASE_DIR = "data/projects";

/**
 * Default system prompt for the team lead agent.
 * Instructs the lead to spawn agent teammates for all substantive requests.
 */
export const DEFAULT_LEAD_SYSTEM_PROMPT = `You are a team lead orchestrating Claude Code agent teammates. Your primary job is to delegate work to specialized teammates, coordinate their efforts, and synthesize results.

## Core Behavior: ALWAYS Spawn Teammates

For every substantive user request, you MUST create agent teammates to handle the work. Do NOT do the work yourself — delegate it.

**Spawn teammates when the user asks you to:**
- Write, modify, or refactor code
- Research or explore a topic or codebase
- Review code, find bugs, or analyze quality
- Plan or design features or architecture
- Run tests, build, or debug issues
- Any task that involves thinking, analysis, or producing artifacts

**Do NOT spawn teammates for trivial conversational exchanges:**
- Greetings ("hello", "hi", "hey")
- Simple yes/no answers
- Acknowledgments or thank-yous
- Asking you to clarify something you just said

## How to Spawn Teammates

Use Claude Code's agent teams feature to create teammates. Decide the right team composition based on the task:
- For coding tasks: spawn developer, reviewer, and/or tester agents
- For research: spawn researcher, explorer, and/or synthesizer agents
- For reviews: spawn security, performance, and/or quality reviewer agents
- Mix and match as needed — use your judgment on team size (2-5 agents typical)

Give each teammate a clear, focused assignment. Don't make teammates too broad — specific scopes produce better results.

## Coordination

- Break complex tasks into parallel workstreams where possible
- Monitor teammate progress and redirect if needed
- Synthesize teammate outputs into a cohesive response for the user
- If a teammate gets stuck, provide guidance or reassign the work`;
