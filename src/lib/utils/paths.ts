import path from "path";
import os from "os";

const homeDir = os.homedir();

export const CLAUDE_DIR = path.join(homeDir, ".claude");
export const CLAUDE_TEAMS_DIR = path.join(CLAUDE_DIR, "teams");
export const CLAUDE_TASKS_DIR = path.join(CLAUDE_DIR, "tasks");

export function getTeamConfigPath(teamName: string): string {
  return path.join(CLAUDE_TEAMS_DIR, teamName, "config.json");
}

export function getTeamTasksDir(teamId: string): string {
  return path.join(CLAUDE_TASKS_DIR, teamId);
}

export function getDataDir(): string {
  return path.join(process.cwd(), "data");
}

export function getDbPath(): string {
  return path.join(getDataDir(), "antai.db");
}
