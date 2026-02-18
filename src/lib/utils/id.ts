import { nanoid } from "nanoid";

export function createId(size = 12): string {
  return nanoid(size);
}

export function createProjectId(): string {
  return `proj_${nanoid(12)}`;
}

export function createTeamId(): string {
  return `team_${nanoid(12)}`;
}

export function createAgentId(): string {
  return `agent_${nanoid(12)}`;
}

export function createTaskId(): string {
  return `task_${nanoid(12)}`;
}

export function createTemplateId(): string {
  return `tmpl_${nanoid(12)}`;
}
