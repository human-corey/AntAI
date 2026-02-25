import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import type {
  Project,
  Team,
  Agent,
  Task,
  Template,
  AppSettings,
} from "@/lib/types";
import type { TranscriptEntry } from "@/lib/claude/types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// --- Projects ---

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: () => fetchJson<Project[]>("/api/projects"),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => fetchJson<Project>(`/api/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; workingDir?: string }) =>
      fetchJson<Project>("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Project>) =>
      fetchJson<Project>(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(id) });
    },
  });
}

export function useDeleteProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJson<void>(`/api/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
  });
}

// --- Teams ---

export function useTeams(projectId: string) {
  return useQuery({
    queryKey: queryKeys.teams.all(projectId),
    queryFn: () =>
      fetchJson<Team[]>(`/api/projects/${projectId}/teams`),
    enabled: !!projectId,
  });
}

export function useTeam(projectId: string, teamId: string) {
  return useQuery({
    queryKey: queryKeys.teams.detail(projectId, teamId),
    queryFn: () =>
      fetchJson<Team>(`/api/projects/${projectId}/teams/${teamId}`),
    enabled: !!projectId && !!teamId,
  });
}

export function useCreateTeam(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; config?: unknown; templateId?: string }) =>
      fetchJson<Team>(`/api/projects/${projectId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.teams.all(projectId) }),
  });
}

export function useStartTeam(projectId: string, teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { prompt: string }) =>
      fetchJson(`/api/projects/${projectId}/teams/${teamId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.teams.detail(projectId, teamId) }),
  });
}

export function useStopTeam(projectId: string, teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (_data?: Record<string, unknown>) =>
      fetchJson(`/api/projects/${projectId}/teams/${teamId}/stop`, {
        method: "POST",
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.teams.detail(projectId, teamId) }),
  });
}

// --- Agents ---

export function useAgents(projectId: string, teamId: string) {
  return useQuery({
    queryKey: queryKeys.agents.all(projectId, teamId),
    queryFn: () =>
      fetchJson<Agent[]>(
        `/api/projects/${projectId}/teams/${teamId}/agents`
      ),
    enabled: !!projectId && !!teamId,
  });
}

export function useProjectAgents(projectId: string) {
  return useQuery({
    queryKey: queryKeys.agents.byProject(projectId),
    queryFn: () => fetchJson<Agent[]>(`/api/projects/${projectId}/agents`),
    enabled: !!projectId,
  });
}

export function useAgentMessages(projectId: string, agentId: string) {
  return useQuery({
    queryKey: queryKeys.agents.messages(projectId, agentId),
    queryFn: () =>
      fetchJson<TranscriptEntry[]>(
        `/api/projects/${projectId}/agents/${agentId}/messages`
      ),
    enabled: !!projectId && !!agentId,
    staleTime: Infinity, // Only fetch once; WS handles live updates
  });
}

export function useReconcileAgents(projectId: string) {
  return useMutation({
    mutationFn: () =>
      fetchJson<{ reconciled: string[] }>(
        `/api/projects/${projectId}/agents/reconcile`,
        { method: "POST" }
      ),
  });
}

export function useKillAgent(projectId: string, teamId: string, agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJson(`/api/projects/${projectId}/teams/${teamId}/agents/${agentId}/kill`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents.all(projectId, teamId) });
      qc.invalidateQueries({ queryKey: queryKeys.agents.byProject(projectId) });
    },
  });
}

export function useResumeAgent(projectId: string, teamId: string, agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJson(`/api/projects/${projectId}/teams/${teamId}/agents/${agentId}/resume`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents.all(projectId, teamId) });
      qc.invalidateQueries({ queryKey: queryKeys.agents.byProject(projectId) });
    },
  });
}

export function useSendMessage(projectId: string, teamId: string, agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) =>
      fetchJson(`/api/projects/${projectId}/teams/${teamId}/agents/${agentId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agents.all(projectId, teamId) });
      qc.invalidateQueries({ queryKey: queryKeys.agents.byProject(projectId) });
    },
  });
}

// --- Tasks ---

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.all(projectId),
    queryFn: () => fetchJson<Task[]>(`/api/projects/${projectId}/tasks`),
    enabled: !!projectId,
  });
}

export function useUpdateTask(taskId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Task>) =>
      fetchJson<Task>(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all(projectId) }),
  });
}

// --- Templates ---

export function useTemplates() {
  return useQuery({
    queryKey: queryKeys.templates.all,
    queryFn: () => fetchJson<Template[]>("/api/templates"),
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: queryKeys.templates.detail(id),
    queryFn: () => fetchJson<Template>(`/api/templates/${id}`),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; config: unknown; tags?: string[] }) =>
      fetchJson<Template>("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.templates.all }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<void>(`/api/templates/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.templates.all }),
  });
}

// --- Logs ---

export function useLogs(projectId: string) {
  return useQuery({
    queryKey: queryKeys.logs.all(projectId),
    queryFn: () => fetchJson<import("@/lib/types").LogEntry[]>(`/api/projects/${projectId}/logs`),
    enabled: !!projectId,
    refetchInterval: 5000,
  });
}

// --- Settings ---

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: () => fetchJson<AppSettings>("/api/settings"),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AppSettings>) =>
      fetchJson<AppSettings>("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.settings.all }),
  });
}
