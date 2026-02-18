import { WebSocketServer, type WebSocket } from "ws";
import type { Server } from "http";
import { RoomManager } from "./rooms";
import { handleClientMessage } from "./handlers";
import type { ProcessManager } from "@/lib/claude/process-manager";
import { WS_PATH, WS_PING_INTERVAL } from "@/lib/constants";

export function setupWebSocketServer(
  httpServer: Server,
  processManager: ProcessManager
): { wss: WebSocketServer; rooms: RoomManager } {
  const rooms = new RoomManager();

  const wss = new WebSocketServer({
    server: httpServer,
    path: WS_PATH,
  });

  // Heartbeat interval
  const pingInterval = setInterval(() => {
    for (const ws of wss.clients) {
      if ((ws as WebSocket & { isAlive?: boolean }).isAlive === false) {
        rooms.removeClient(ws as WebSocket);
        ws.terminate();
        continue;
      }
      (ws as WebSocket & { isAlive?: boolean }).isAlive = false;
      ws.ping();
    }
  }, WS_PING_INTERVAL);

  wss.on("connection", (ws: WebSocket) => {
    (ws as WebSocket & { isAlive?: boolean }).isAlive = true;

    ws.on("pong", () => {
      (ws as WebSocket & { isAlive?: boolean }).isAlive = true;
    });

    ws.on("message", (data) => {
      const raw = data.toString();
      handleClientMessage(ws, raw, rooms, processManager);
    });

    ws.on("close", () => {
      rooms.removeClient(ws);
    });

    ws.on("error", () => {
      rooms.removeClient(ws);
    });
  });

  wss.on("close", () => {
    clearInterval(pingInterval);
  });

  console.log(`[WS] WebSocket server ready on ${WS_PATH}`);

  return { wss, rooms };
}
