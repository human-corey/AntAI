"use client";

import { TeamCanvas } from "@/components/canvas/team-canvas";
import type { Node, Edge } from "@xyflow/react";

// Demo nodes for development — will be replaced with real data from API
const demoNodes: Node[] = [
  {
    id: "lead-1",
    type: "agent",
    position: { x: 250, y: 0 },
    data: {
      agent: {
        id: "lead-1",
        teamId: "team-1",
        name: "Team Lead",
        role: "lead",
        model: "claude-sonnet-4-6",
        status: "running",
        isLead: true,
        currentTask: "Coordinating code review",
        lastOutput: "Analyzing project structure...",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isSelected: false,
      isCompact: false,
      tasks: [],
    },
  },
  {
    id: "agent-1",
    type: "agent",
    position: { x: 50, y: 200 },
    data: {
      agent: {
        id: "agent-1",
        teamId: "team-1",
        name: "Security Reviewer",
        role: "Security Analyst",
        model: "claude-sonnet-4-6",
        status: "thinking",
        isLead: false,
        currentTask: "Checking for XSS vulnerabilities",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isSelected: false,
      isCompact: false,
      tasks: [],
    },
  },
  {
    id: "agent-2",
    type: "agent",
    position: { x: 450, y: 200 },
    data: {
      agent: {
        id: "agent-2",
        teamId: "team-1",
        name: "Perf Reviewer",
        role: "Performance Analyst",
        model: "claude-sonnet-4-6",
        status: "tool_use",
        isLead: false,
        currentTask: "Running benchmarks",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isSelected: false,
      isCompact: false,
      tasks: [],
    },
  },
];

const demoEdges: Edge[] = [
  { id: "e-lead-agent1", source: "lead-1", target: "agent-1", type: "tunnel", data: { isActive: true } },
  { id: "e-lead-agent2", source: "lead-1", target: "agent-2", type: "tunnel", data: { isActive: false } },
];

export default function CanvasPage() {
  return <TeamCanvas initialNodes={demoNodes} initialEdges={demoEdges} />;
}
