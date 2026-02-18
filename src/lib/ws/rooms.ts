import type WebSocket from "ws";
import { serializeServerMessage, type ServerMessage } from "./protocol";

type RoomKey = string; // e.g. "project:proj_abc", "terminal:agent_xyz"

export class RoomManager {
  private rooms = new Map<RoomKey, Set<WebSocket>>();
  private clientRooms = new Map<WebSocket, Set<RoomKey>>();

  subscribe(ws: WebSocket, channel: string, id: string): void {
    const key = `${channel}:${id}`;

    if (!this.rooms.has(key)) {
      this.rooms.set(key, new Set());
    }
    this.rooms.get(key)!.add(ws);

    if (!this.clientRooms.has(ws)) {
      this.clientRooms.set(ws, new Set());
    }
    this.clientRooms.get(ws)!.add(key);
  }

  unsubscribe(ws: WebSocket, channel: string, id: string): void {
    const key = `${channel}:${id}`;

    this.rooms.get(key)?.delete(ws);
    if (this.rooms.get(key)?.size === 0) {
      this.rooms.delete(key);
    }

    this.clientRooms.get(ws)?.delete(key);
  }

  removeClient(ws: WebSocket): void {
    const rooms = this.clientRooms.get(ws);
    if (rooms) {
      for (const key of rooms) {
        this.rooms.get(key)?.delete(ws);
        if (this.rooms.get(key)?.size === 0) {
          this.rooms.delete(key);
        }
      }
    }
    this.clientRooms.delete(ws);
  }

  broadcast(channel: string, id: string, message: ServerMessage): void {
    const key = `${channel}:${id}`;
    const clients = this.rooms.get(key);
    if (!clients) return;

    const data = serializeServerMessage(message);
    for (const ws of clients) {
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      }
    }
  }

  broadcastToAll(message: ServerMessage): void {
    const data = serializeServerMessage(message);
    const seen = new Set<WebSocket>();

    for (const clients of this.rooms.values()) {
      for (const ws of clients) {
        if (!seen.has(ws) && ws.readyState === ws.OPEN) {
          ws.send(data);
          seen.add(ws);
        }
      }
    }
  }

  getRoomSize(channel: string, id: string): number {
    return this.rooms.get(`${channel}:${id}`)?.size ?? 0;
  }

  getClientCount(): number {
    return this.clientRooms.size;
  }
}
