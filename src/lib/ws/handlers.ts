import type WebSocket from "ws";
import type { RoomManager } from "./rooms";
import { parseClientMessage, serializeServerMessage } from "./protocol";
import type { ProcessManager } from "@/lib/claude/process-manager";

export function handleClientMessage(
  ws: WebSocket,
  raw: string,
  rooms: RoomManager,
  processManager: ProcessManager
): void {
  const msg = parseClientMessage(raw);
  if (!msg) {
    ws.send(serializeServerMessage({ type: "error", message: "Invalid message format" }));
    return;
  }

  switch (msg.type) {
    case "ping":
      ws.send(serializeServerMessage({ type: "pong" }));
      break;

    case "subscribe":
      rooms.subscribe(ws, msg.channel, msg.id);
      ws.send(serializeServerMessage({ type: "subscribed", channel: msg.channel, id: msg.id }));
      break;

    case "unsubscribe":
      rooms.unsubscribe(ws, msg.channel, msg.id);
      ws.send(serializeServerMessage({ type: "unsubscribed", channel: msg.channel, id: msg.id }));
      break;

    case "terminal:input":
      processManager.sendInput(msg.agentId, msg.data);
      break;

    case "terminal:resize":
      processManager.resizeTerminal(msg.agentId, msg.cols, msg.rows);
      break;

    default:
      ws.send(serializeServerMessage({ type: "error", message: `Unknown message type` }));
  }
}
