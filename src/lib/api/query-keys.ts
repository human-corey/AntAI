export const queryKeys = {
  projects: {
    all: ["projects"] as const,
    detail: (id: string) => ["projects", id] as const,
  },
  teams: {
    all: (projectId: string) => ["projects", projectId, "teams"] as const,
    detail: (projectId: string, teamId: string) =>
      ["projects", projectId, "teams", teamId] as const,
  },
  agents: {
    all: (projectId: string, teamId: string) =>
      ["projects", projectId, "teams", teamId, "agents"] as const,
    detail: (agentId: string) => ["agents", agentId] as const,
  },
  tasks: {
    all: (projectId: string) => ["projects", projectId, "tasks"] as const,
    detail: (taskId: string) => ["tasks", taskId] as const,
  },
  templates: {
    all: ["templates"] as const,
    detail: (id: string) => ["templates", id] as const,
  },
  logs: {
    all: (projectId: string) => ["projects", projectId, "logs"] as const,
  },
  settings: {
    all: ["settings"] as const,
  },
  health: {
    all: ["health"] as const,
  },
} as const;
