import { createServer } from "http";
import next from "next";
import { parse } from "url";
import { setupWebSocketServer } from "../src/lib/ws/server";
import { ProcessManager } from "../src/lib/claude/process-manager";
import { ClaudeFileWatcher } from "../src/lib/claude/file-watcher";
import { DEFAULT_PORT, APP_NAME, APP_VERSION } from "../src/lib/constants";
import { initServerContext } from "../src/lib/server-context";
import { serverLog } from "../src/lib/logger";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || String(DEFAULT_PORT), 10);

const app = next({ dev });
const handle = app.getRequestHandler();

// Singletons
const processManager = new ProcessManager();
const fileWatcher = new ClaudeFileWatcher();

async function main() {
  await app.prepare();
  serverLog.info("Next.js prepared", { mode: dev ? "development" : "production" });

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || "/", true);
    handle(req, res, parsedUrl);
  });

  // Set up WebSocket
  const { rooms } = setupWebSocketServer(server, processManager);
  processManager.setRooms(rooms);
  initServerContext({ processManager, roomManager: rooms, fileWatcher });

  server.listen(port, () => {
    serverLog.info(`${APP_NAME} v${APP_VERSION} ready`, { port, ws: `ws://localhost:${port}/ws` });
    console.log(`\n  ${APP_NAME} v${APP_VERSION}`);
    console.log(`  Ready on http://localhost:${port}`);
    console.log(`  WebSocket on ws://localhost:${port}/ws`);
    console.log(`  Logs: data/antai.log`);
    console.log(`  Mode: ${dev ? "development" : "production"}\n`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    serverLog.info("Shutting down", { signal });
    fileWatcher.close();
    await processManager.shutdownAll();
    server.close(() => {
      serverLog.info("Server closed");
      process.exit(0);
    });
    // Force exit after 15 seconds
    setTimeout(() => process.exit(1), 15000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  serverLog.error("Failed to start server", { error: err.message });
  console.error("Failed to start server:", err);
  process.exit(1);
});
