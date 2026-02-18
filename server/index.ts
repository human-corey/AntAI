import { createServer } from "http";
import next from "next";
import { parse } from "url";
import { setupWebSocketServer } from "../src/lib/ws/server";
import { ProcessManager } from "../src/lib/claude/process-manager";
import { ClaudeFileWatcher } from "../src/lib/claude/file-watcher";
import { DEFAULT_PORT, APP_NAME, APP_VERSION } from "../src/lib/constants";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || String(DEFAULT_PORT), 10);

const app = next({ dev });
const handle = app.getRequestHandler();

// Singletons
const processManager = new ProcessManager();
const fileWatcher = new ClaudeFileWatcher();

// Make processManager available globally for API routes
(globalThis as Record<string, unknown>).__antai_process_manager = processManager;

async function main() {
  await app.prepare();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || "/", true);
    handle(req, res, parsedUrl);
  });

  // Set up WebSocket
  const { rooms } = setupWebSocketServer(server, processManager);
  processManager.setRooms(rooms);

  // Make rooms available globally too
  (globalThis as Record<string, unknown>).__antai_rooms = rooms;

  server.listen(port, () => {
    console.log(`\n  ${APP_NAME} v${APP_VERSION}`);
    console.log(`  Ready on http://localhost:${port}`);
    console.log(`  WebSocket on ws://localhost:${port}/ws`);
    console.log(`  Mode: ${dev ? "development" : "production"}\n`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] Shutting down...`);
    fileWatcher.close();
    await processManager.shutdownAll();
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
    // Force exit after 15 seconds
    setTimeout(() => process.exit(1), 15000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
