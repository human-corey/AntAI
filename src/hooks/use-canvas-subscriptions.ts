"use client";

import { useEffect, useRef } from "react";
import { useWs } from "@/providers/websocket-provider";
import { useTeams } from "@/lib/api/hooks";
import { useAgentStore } from "@/stores/agent-store";

export function useCanvasSubscriptions(projectId: string) {
  const { subscribe, unsubscribe, connected } = useWs();
  const { data: teams } = useTeams(projectId);
  const agents = useAgentStore((s) => s.agents);
  const prevTeamIdsRef = useRef<string[]>([]);
  const prevAgentIdsRef = useRef<string[]>([]);

  // Subscribe to project + activity channels
  useEffect(() => {
    if (!connected || !projectId) return;
    subscribe("project", projectId);
    subscribe("activity", "global");
    return () => {
      unsubscribe("project", projectId);
      unsubscribe("activity", "global");
    };
  }, [connected, projectId, subscribe, unsubscribe]);

  // Subscribe to team channels (for agent:spawned, team:agent_added, team:status)
  useEffect(() => {
    if (!connected || !teams) return;
    const teamIds = teams.map((t) => t.id);
    const prevIds = prevTeamIdsRef.current;

    // Unsubscribe from removed teams
    for (const id of prevIds) {
      if (!teamIds.includes(id)) {
        unsubscribe("team", id);
      }
    }
    // Subscribe to new teams
    for (const id of teamIds) {
      if (!prevIds.includes(id)) {
        subscribe("team", id);
      }
    }
    prevTeamIdsRef.current = teamIds;

    return () => {
      for (const id of teamIds) {
        unsubscribe("team", id);
      }
      prevTeamIdsRef.current = [];
    };
  }, [connected, teams, subscribe, unsubscribe]);

  // Subscribe to agent channels (for agent:status, agent:exited, terminal:output)
  useEffect(() => {
    if (!connected) return;
    const agentIds = Object.keys(agents);
    const prevIds = prevAgentIdsRef.current;

    // Unsubscribe from removed agents
    for (const id of prevIds) {
      if (!agentIds.includes(id)) {
        unsubscribe("agent", id);
        unsubscribe("terminal", id);
      }
    }
    // Subscribe to new agents
    for (const id of agentIds) {
      if (!prevIds.includes(id)) {
        subscribe("agent", id);
        subscribe("terminal", id);
      }
    }
    prevAgentIdsRef.current = agentIds;

    return () => {
      for (const id of agentIds) {
        unsubscribe("agent", id);
        unsubscribe("terminal", id);
      }
      prevAgentIdsRef.current = [];
    };
  }, [connected, agents, subscribe, unsubscribe]);
}
