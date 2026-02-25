import type { ProcessManager } from "@/lib/claude/process-manager";
import type { RoomManager } from "@/lib/ws/rooms";
import type { ClaudeFileWatcher } from "@/lib/claude/file-watcher";

interface ServerContext {
  processManager: ProcessManager;
  roomManager: RoomManager;
  fileWatcher: ClaudeFileWatcher;
}

const CONTEXT_KEY = Symbol.for("antai.server-context");
const g = globalThis as Record<symbol, ServerContext | undefined>;

export function initServerContext(ctx: ServerContext): void {
  g[CONTEXT_KEY] = ctx;
}

export function getServerContext(): ServerContext {
  const ctx = g[CONTEXT_KEY];
  if (!ctx) throw new Error("Server context not initialized — this should only be called from server-side code after server startup");
  return ctx;
}
