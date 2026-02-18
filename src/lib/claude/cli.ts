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

  // Resume existing session
  if (options.sessionId) {
    args.push("--resume", options.sessionId);
    return args;
  }

  // Model selection
  if (options.model) {
    args.push("--model", options.model);
  }

  // System prompt
  if (options.systemPrompt) {
    args.push("--system-prompt", options.systemPrompt);
  }

  // Output format for structured JSON events
  args.push("--output-format", "stream-json");
  args.push("--verbose");

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
