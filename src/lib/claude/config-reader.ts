import fs from "fs";
import { getTeamConfigPath, getTeamTasksDir } from "@/lib/utils/paths";

export interface ClaudeTeamConfig {
  name: string;
  members: Array<{
    name: string;
    role?: string;
    model?: string;
    sessionId?: string;
  }>;
}

export interface ClaudeTaskFile {
  id: string;
  subject: string;
  description?: string;
  status: string;
  assignedTo?: string;
  blockedBy?: string[];
  blocks?: string[];
}

/**
 * Read a Claude team config from the filesystem.
 */
export function readTeamConfig(teamName: string): ClaudeTeamConfig | null {
  const configPath = getTeamConfigPath(teamName);
  try {
    if (!fs.existsSync(configPath)) return null;
    const content = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(content) as ClaudeTeamConfig;
  } catch {
    return null;
  }
}

/**
 * Read all task files from a team's task directory.
 */
export function readTeamTasks(teamId: string): ClaudeTaskFile[] {
  const taskDir = getTeamTasksDir(teamId);
  try {
    if (!fs.existsSync(taskDir)) return [];
    const files = fs.readdirSync(taskDir).filter((f) => f.endsWith(".json"));
    const tasks: ClaudeTaskFile[] = [];

    for (const file of files) {
      try {
        const content = fs.readFileSync(`${taskDir}/${file}`, "utf-8");
        tasks.push(JSON.parse(content) as ClaudeTaskFile);
      } catch {
        // Skip invalid files
      }
    }

    return tasks;
  } catch {
    return [];
  }
}
