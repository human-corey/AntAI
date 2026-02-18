import fs from "fs";
import path from "path";
import { CLAUDE_TEAMS_DIR, CLAUDE_TASKS_DIR } from "@/lib/utils/paths";

type WatchCallback = (eventType: string, filename: string, data?: unknown) => void;

export class ClaudeFileWatcher {
  private watchers: fs.FSWatcher[] = [];
  private pollIntervals: ReturnType<typeof setInterval>[] = [];
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Watch a team's task directory for changes.
   */
  watchTeamTasks(teamId: string, callback: WatchCallback): void {
    const taskDir = path.join(CLAUDE_TASKS_DIR, teamId);

    if (!fs.existsSync(taskDir)) {
      // Directory may not exist yet, poll for it
      const pollInterval = setInterval(() => {
        if (fs.existsSync(taskDir)) {
          clearInterval(pollInterval);
          this.startWatching(taskDir, "tasks", callback);
        }
      }, 2000);
      this.pollIntervals.push(pollInterval);
      return;
    }

    this.startWatching(taskDir, "tasks", callback);
  }

  /**
   * Watch a team's config file for member changes.
   */
  watchTeamConfig(teamName: string, callback: WatchCallback): void {
    const configDir = path.join(CLAUDE_TEAMS_DIR, teamName);

    if (!fs.existsSync(configDir)) {
      const pollInterval = setInterval(() => {
        if (fs.existsSync(configDir)) {
          clearInterval(pollInterval);
          this.startWatching(configDir, "config", callback);
        }
      }, 2000);
      this.pollIntervals.push(pollInterval);
      return;
    }

    this.startWatching(configDir, "config", callback);
  }

  private startWatching(dirPath: string, type: string, callback: WatchCallback): void {
    try {
      const watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;

        // Debounce rapid changes
        const key = `${dirPath}:${filename}`;
        const existing = this.debounceTimers.get(key);
        if (existing) clearTimeout(existing);

        this.debounceTimers.set(
          key,
          setTimeout(() => {
            this.debounceTimers.delete(key);

            // Read the changed file if it still exists
            const fullPath = path.join(dirPath, filename);
            let data: unknown;
            try {
              if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, "utf-8");
                data = JSON.parse(content);
              }
            } catch {
              // File may not be valid JSON
            }

            callback(eventType, filename, data);
          }, 300)
        );
      });

      watcher.on("error", (err) => {
        console.warn(`[FileWatcher] Watcher error on ${dirPath}:`, err);
      });

      this.watchers.push(watcher);
    } catch (err) {
      console.warn(`[FileWatcher] Failed to watch ${dirPath}:`, err);
    }
  }

  /**
   * Stop all watchers.
   */
  close(): void {
    for (const interval of this.pollIntervals) {
      clearInterval(interval);
    }
    this.pollIntervals = [];
    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }
}
