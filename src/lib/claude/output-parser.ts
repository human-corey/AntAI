import type { OutputEvent } from "./types";

/**
 * Stateful parser that processes raw terminal output lines from Claude CLI
 * and emits structured events. Strips ANSI escape codes.
 */
export class OutputParser {
  private buffer = "";

  /**
   * Feed raw data from PTY and get back structured events.
   */
  parse(rawData: string): OutputEvent[] {
    const events: OutputEvent[] = [];
    this.buffer += rawData;

    // Process complete lines
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || ""; // Keep incomplete last line in buffer

    for (const rawLine of lines) {
      const line = stripAnsi(rawLine).trim();
      if (!line) continue;

      const event = this.parseLine(line);
      if (event) {
        events.push(event);
      }

      // Always emit the raw line too
      events.push({ type: "output_line", line: rawLine });
    }

    return events;
  }

  private parseJsonEvent(line: string): OutputEvent | null {
    try {
      const obj = JSON.parse(line);
      if (!obj || typeof obj.type !== "string") return null;

      switch (obj.type) {
        case "assistant":
          return obj.content ? { type: "message", content: obj.content } : null;
        case "tool_use":
          return { type: "tool_use", tool: obj.name || "unknown", input: obj.input };
        case "tool_result":
          return { type: "tool_result", result: typeof obj.content === "string" ? obj.content : JSON.stringify(obj.content) };
        case "error":
          return { type: "error", message: obj.message || obj.error || line };
        case "system":
          if (obj.status) return { type: "status_change", status: obj.status };
          return null;
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  private parseLine(line: string): OutputEvent | null {
    // Try JSON parsing first (for --output-format stream-json)
    const jsonEvent = this.parseJsonEvent(line);
    if (jsonEvent) return jsonEvent;

    // Detect agent spawning
    if (line.includes("Spawning agent") || line.includes("Creating teammate")) {
      const nameMatch = line.match(/(?:agent|teammate)\s+['"]?(\w[\w-]*)['"]?/i);
      return {
        type: "agent_spawned",
        name: nameMatch?.[1] || "unknown",
      };
    }

    // Detect tool use
    if (line.includes("Tool:") || line.match(/^[A-Z]\w+(?:Tool|Action):/)) {
      const toolMatch = line.match(/(?:Tool:|^)(\w+)/);
      return {
        type: "tool_use",
        tool: toolMatch?.[1] || "unknown",
        input: line,
      };
    }

    // Detect task activity
    if (line.includes("Task") && (line.includes("created") || line.includes("completed") || line.includes("started"))) {
      const statusMatch = line.match(/(created|completed|started|failed)/);
      return {
        type: "task_activity",
        subject: line,
        status: statusMatch?.[1],
      };
    }

    // Detect errors
    if (line.includes("Error:") || line.includes("error:") || line.startsWith("ERR")) {
      return { type: "error", message: line };
    }

    // Detect thinking
    if (line.includes("Thinking") || line.includes("thinking...")) {
      return { type: "thinking", content: line };
    }

    // Detect status changes
    if (line.includes("Status:") || line.includes("status:")) {
      const statusMatch = line.match(/(?:status:|Status:)\s*(\w+)/i);
      if (statusMatch) {
        return { type: "status_change", status: statusMatch[1].toLowerCase() };
      }
    }

    return null;
  }

  /**
   * Flush any remaining buffered content.
   */
  flush(): OutputEvent[] {
    if (!this.buffer.trim()) return [];
    const line = stripAnsi(this.buffer).trim();
    this.buffer = "";
    if (!line) return [];
    return [{ type: "output_line", line }];
  }
}

/**
 * Strip ANSI escape codes from a string.
 */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "").replace(/\x1b\][^\x07]*\x07/g, "");
}
