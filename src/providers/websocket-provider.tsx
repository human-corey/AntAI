"use client";

import { createContext, useContext, useCallback } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAgentStore } from "@/stores/agent-store";
import { useNotificationStore } from "@/stores/notification-store";
import { useTerminalStore } from "@/stores/terminal-store";
import type { ServerMessage } from "@/lib/ws/protocol";
import { toast } from "sonner";

interface WebSocketContextValue {
  connected: boolean;
  subscribe: (channel: string, id: string) => void;
  unsubscribe: (channel: string, id: string) => void;
  send: (msg: Record<string, unknown>) => void;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  connected: false,
  subscribe: () => {},
  unsubscribe: () => {},
  send: () => {},
});

export function useWs() {
  return useContext(WebSocketContext);
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const agentStore = useAgentStore();
  const notificationStore = useNotificationStore();

  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case "terminal:output":
          useTerminalStore.getState().dispatch(msg.agentId, msg.data);
          break;

        case "agent:status":
          agentStore.updateAgentStatus(
            msg.agentId,
            msg.status,
            msg.currentTask,
            msg.lastOutput
          );
          break;

        case "agent:spawned":
          agentStore.setAgent(msg.agent);
          toast.info(`Agent spawned: ${msg.agent.name}`);
          break;

        case "agent:exited":
          agentStore.updateAgentStatus(msg.agentId, "stopped");
          if (msg.code !== 0) {
            toast.error(`Agent crashed (exit code: ${msg.code})`);
          }
          break;

        case "activity:new":
          notificationStore.addActivity(msg.entry);
          if (msg.entry.severity === "error") {
            toast.error(msg.entry.title);
          }
          break;

        case "task:created":
          toast.info(`Task created: ${msg.task.subject}`);
          break;

        case "task:updated":
          if (msg.task.status === "completed") {
            toast.success(`Task completed: ${msg.task.subject}`);
          }
          break;
      }
    },
    [agentStore, notificationStore]
  );

  const { connected, subscribe, unsubscribe, send } = useWebSocket({
    onMessage: handleMessage,
  });

  return (
    <WebSocketContext.Provider value={{ connected, subscribe, unsubscribe, send }}>
      {children}
    </WebSocketContext.Provider>
  );
}
