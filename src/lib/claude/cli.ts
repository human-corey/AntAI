import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import type { SpawnOptions } from "./types";

export function checkClaudeInstalled(): { installed: boolean; version?: string; error?: string } {
  try {
    const version = execSync("claude --version", {
      encoding: "utf-8",
      timeout: 5000,
      windowsHide: true,
    }).trim();
    return { installed: true, version };
  } catch {
    return { installed: false, error: "Claude CLI not found in PATH" };
  }
}

export function buildClaudeArgs(options: SpawnOptions): string[] {
  const args: string[] = [];

  if (options.sessionId) {
    // Resume existing session — skip model/systemPrompt
    args.push("--resume", options.sessionId);
  } else {
    // New session
    if (options.model) {
      args.push("--model", options.model);
    }
    if (options.systemPrompt) {
      args.push("--system-prompt", options.systemPrompt);
    }
  }

  // NOTE: Do NOT pass --output-format or --verbose in PTY mode.
  // Those flags corrupt the interactive TUI rendering and prevent prompt execution.
  // The output parser uses text-line heuristics to detect status from TUI output.

  // Required for headless/automated operation — skips permission prompts
  args.push("--dangerously-skip-permissions");

  // NOTE: Do NOT pass -p here. The CLI runs in interactive PTY mode.
  // The prompt is written directly to the PTY stdin in ProcessManager.

  return args;
}

export function getClaudePath(): string {
  // Try to find claude in PATH
  try {
    const which = process.platform === "win32" ? "where" : "which";
    const result = execSync(`${which} claude`, {
      encoding: "utf-8",
      timeout: 5000,
      windowsHide: true,
    }).trim();
    return result.split("\n")[0].trim();
  } catch {
    // Fallback: check common install locations on Windows
    if (process.platform === "win32") {
      const candidates = [
        path.join(process.env.APPDATA || "", "npm", "claude.cmd"),
        path.join(process.env.USERPROFILE || "", ".bun", "bin", "claude.exe"),
        path.join(process.env.LOCALAPPDATA || "", "Programs", "claude", "claude.exe"),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) return candidate;
      }
    }
    return "claude"; // Fall back to PATH resolution
  }
}
