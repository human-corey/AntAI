"use client";

import { createContext, useContext, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAgentStore } from "@/stores/agent-store";
import { useNotificationStore } from "@/stores/notification-store";
import { useTerminalStore } from "@/stores/terminal-store";
import { useTranscriptStore } from "@/stores/transcript-store";
import { queryKeys } from "@/lib/api/query-keys";
import type { ServerMessage } from "@/lib/ws/protocol";
import { toast } from "sonner";
import { createClientLogger } from "@/lib/client-logger";

const log = createClientLogger("WS-Provider");

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
  const queryClient = useQueryClient();
  // Stable ref so the callback doesn't change on every render
  const qcRef = useRef(queryClient);
  qcRef.current = queryClient;

  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      log.debug("Received", { type: msg.type });

      switch (msg.type) {
        case "terminal:output":
          useTerminalStore.getState().dispatch(msg.agentId, msg.data);
          break;

        case "agent:status":
          log.info("Agent status change", { agentId: msg.agentId, status: msg.status });
          agentStore.updateAgentStatus(
            msg.agentId,
            msg.status,
            msg.currentTask,
            msg.lastOutput
          );
          break;

        case "agent:spawned":
          log.info("Agent spawned", { agentId: msg.agent.id, name: msg.agent.name });
          agentStore.setAgent(msg.agent);
          // Invalidate project agents query so canvas picks it up
          qcRef.current.invalidateQueries({ queryKey: ["agents"] });
          toast.info(`Agent spawned: ${msg.agent.name}`);
          break;

        case "agent:exited": {
          log.info("Agent exited", { agentId: msg.agentId, code: msg.code });
          const exitedAgent = agentStore.agents[msg.agentId];
          // Auto-remove non-lead (teammate) agents from canvas when they exit
          if (exitedAgent && !exitedAgent.isLead) {
            if (msg.code !== 0) {
              toast.error(`Teammate "${exitedAgent.name}" crashed (exit code: ${msg.code})`);
            }
            log.info("Auto-removing teammate after exit", { agentId: msg.agentId });
            agentStore.removeAgent(msg.agentId);
          } else if (msg.code === 0) {
            agentStore.updateAgentStatus(msg.agentId, "idle");
          } else {
            agentStore.updateAgentStatus(msg.agentId, "stopped");
            toast.error(`Agent crashed (exit code: ${msg.code})`);
          }
          // Invalidate to get latest DB state (sessionId, stoppedAt, etc.)
          qcRef.current.invalidateQueries({ queryKey: ["agents"] });
          break;
        }

        case "agent:event": {
          log.debug("Agent event", { agentId: msg.agentId, entryType: msg.event.type });
          const store = useTranscriptStore.getState();
          // Remove processing indicator when a real agent event arrives
          if (msg.event.type !== "user_message" && msg.event.type !== "status_change") {
            store.removeEntry(msg.agentId, `processing_${msg.agentId}`);
          }
          store.addEntry(msg.agentId, msg.event);
          break;
        }

        case "chat:ack":
          log.info("Chat ack", { agentId: msg.agentId, method: msg.method });
          // Add a processing indicator while waiting for the agent's response
          useTranscriptStore.getState().addEntry(msg.agentId, {
            id: `processing_${msg.agentId}`,
            timestamp: new Date().toISOString(),
            type: "thinking",
            content: "",
          });
          break;

        case "chat:error":
          log.warn("Chat error", { agentId: msg.agentId, error: msg.error });
          useTranscriptStore.getState().removeEntry(msg.agentId, `processing_${msg.agentId}`);
          useTranscriptStore.getState().addEntry(msg.agentId, {
            id: `err_${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: "error",
            content: msg.error,
            isError: true,
          });
          break;

        case "team:agent_added":
          log.info("Teammate added", { agentId: msg.agent.id, name: msg.agent.name });
          agentStore.setAgent(msg.agent);
          qcRef.current.invalidateQueries({ queryKey: ["agents"] });
          toast.info(`New teammate: ${msg.agent.name}`);
          break;

        case "agent:removed":
          log.info("Agent removed", { agentId: msg.agentId, teamId: msg.teamId });
          agentStore.removeAgent(msg.agentId);
          qcRef.current.invalidateQueries({ queryKey: ["agents"] });
          toast.info("Teammate left the team");
          break;

        case "team:status":
          log.info("Team status", { teamId: msg.teamId, status: msg.status });
          qcRef.current.invalidateQueries({ queryKey: ["teams"] });
          break;

        case "activity:new":
          notificationStore.addActivity(msg.entry);
          if (msg.entry.severity === "error") {
            toast.error(msg.entry.title);
          }
          break;

        case "task:created":
          log.info("Task created", { subject: msg.task.subject });
          qcRef.current.invalidateQueries({ queryKey: ["tasks"] });
          toast.info(`Task created: ${msg.task.subject}`);
          break;

        case "task:updated":
          qcRef.current.invalidateQueries({ queryKey: ["tasks"] });
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
