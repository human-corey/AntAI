import type { Node, Edge } from "@xyflow/react";
import type { Agent, AgentNodeData } from "@/lib/types";

const ACTIVE_STATUSES = new Set(["running", "thinking", "tool_use"]);

export function agentToNode(
  agent: Agent,
  options?: { position?: { x: number; y: number } }
): Node {
  return {
    id: agent.id,
    type: "agent",
    position: options?.position ?? { x: 0, y: 0 },
    data: {
      agent,
      isSelected: false,
      isCompact: false,
      tasks: [],
    } satisfies AgentNodeData,
  };
}

export function buildEdges(agents: Agent[]): Edge[] {
  const edges: Edge[] = [];

  // Group agents by team
  const byTeam = new Map<string, Agent[]>();
  for (const agent of agents) {
    const group = byTeam.get(agent.teamId) || [];
    group.push(agent);
    byTeam.set(agent.teamId, group);
  }

  for (const teamAgents of byTeam.values()) {
    const lead = teamAgents.find((a) => a.isLead);
    if (!lead) continue;

    const teammates = teamAgents.filter((a) => !a.isLead);
    for (const mate of teammates) {
      edges.push({
        id: `e-${lead.id}-${mate.id}`,
        source: lead.id,
        target: mate.id,
        type: "tunnel",
        data: {
          isActive: ACTIVE_STATUSES.has(lead.status) && ACTIVE_STATUSES.has(mate.status),
        },
      });
    }
  }

  return edges;
}
