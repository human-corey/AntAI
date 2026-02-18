import { create } from "zustand";
import type { Agent } from "@/lib/types";

interface AgentState {
  agents: Record<string, Agent>;
  outputBuffers: Record<string, string>;

  setAgent: (agent: Agent) => void;
  updateAgentStatus: (agentId: string, status: Agent["status"], currentTask?: string, lastOutput?: string) => void;
  removeAgent: (agentId: string) => void;
  appendOutput: (agentId: string, data: string) => void;
  clearOutput: (agentId: string) => void;
  setAgents: (agents: Agent[]) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: {},
  outputBuffers: {},

  setAgent: (agent) =>
    set((s) => ({ agents: { ...s.agents, [agent.id]: agent } })),
  updateAgentStatus: (agentId, status, currentTask, lastOutput) =>
    set((s) => {
      const agent = s.agents[agentId];
      if (!agent) return s;
      return {
        agents: {
          ...s.agents,
          [agentId]: {
            ...agent,
            status,
            ...(currentTask !== undefined && { currentTask }),
            ...(lastOutput !== undefined && { lastOutput }),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }),
  removeAgent: (agentId) =>
    set((s) => {
      const { [agentId]: _, ...rest } = s.agents;
      const { [agentId]: __, ...restBuffers } = s.outputBuffers;
      return { agents: rest, outputBuffers: restBuffers };
    }),
  appendOutput: (agentId, data) =>
    set((s) => ({
      outputBuffers: {
        ...s.outputBuffers,
        [agentId]: (s.outputBuffers[agentId] || "") + data,
      },
    })),
  clearOutput: (agentId) =>
    set((s) => ({
      outputBuffers: { ...s.outputBuffers, [agentId]: "" },
    })),
  setAgents: (agents) =>
    set({
      agents: Object.fromEntries(agents.map((a) => [a.id, a])),
    }),
}));
