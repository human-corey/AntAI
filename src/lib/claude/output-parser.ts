import type { OutputEvent } from "./types";
import { parserLog } from "@/lib/logger";

/**
 * Stateful parser that processes raw terminal output lines from Claude CLI
 * and emits structured events. Strips ANSI escape codes.
 *
 * Supports both complete events (assistant, tool_use, result) and
 * streaming deltas (content_block_start/delta/stop) for real-time output.
 */
export class OutputParser {
  private buffer = "";
  /** Tracks active streaming content blocks by index */
  private activeBlocks = new Map<number, { type: string; text: string; id: string }>();
  private blockCounter = 0;

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
        if (Array.isArray(event)) {
          events.push(...event);
        } else {
          events.push(event);
        }
      }

      // Always emit the raw line too
      events.push({ type: "output_line", line: rawLine });
    }

    return events;
  }

  private parseJsonEvent(line: string): OutputEvent | OutputEvent[] | null {
    try {
      const obj = JSON.parse(line);
      if (!obj || typeof obj.type !== "string") return null;

      switch (obj.type) {
        // ── Streaming delta events (real-time, token-by-token) ──

        case "content_block_start": {
          const blockType = obj.content_block?.type;
          const blockId = `b${this.blockCounter++}`;
          this.activeBlocks.set(obj.index, { type: blockType || "text", text: "", id: blockId });
          parserLog.debug("Block start", { index: obj.index, blockType, blockId });
          // Emit an empty delta to signal start of streaming
          if (blockType === "thinking") {
            return { type: "thinking_delta", blockId, content: "", isFinal: false };
          }
          return null; // Don't emit for text blocks until we have content
        }

        case "content_block_delta": {
          const block = this.activeBlocks.get(obj.index);
          if (!block) return null;
          const deltaText = obj.delta?.text || obj.delta?.thinking || "";
          block.text += deltaText;
          if (block.type === "thinking") {
            return { type: "thinking_delta", blockId: block.id, content: block.text, isFinal: false };
          }
          return { type: "message_delta", blockId: block.id, content: block.text, isFinal: false };
        }

        case "content_block_stop": {
          const block = this.activeBlocks.get(obj.index);
          if (!block) return null;
          this.activeBlocks.delete(obj.index);
          parserLog.debug("Block stop", { index: obj.index, type: block.type, contentLen: block.text.length });
          if (block.type === "thinking") {
            return { type: "thinking_delta", blockId: block.id, content: block.text, isFinal: true };
          }
          if (block.text) {
            return { type: "message_delta", blockId: block.id, content: block.text, isFinal: true };
          }
          return null;
        }

        // ── Complete events (batch mode or turn-level summaries) ──

        case "assistant": {
          // CLI stream-json format: {"type":"assistant","message":{"content":[{"type":"thinking","thinking":"..."},{"type":"text","text":"..."}],...}}
          const contentSource = obj.message?.content ?? obj.content;
          const events: OutputEvent[] = [];

          if (typeof contentSource === "string") {
            events.push({ type: "message", content: contentSource });
          } else if (Array.isArray(contentSource)) {
            // Extract thinking blocks
            for (const block of contentSource) {
              if (block.type === "thinking" && block.thinking) {
                events.push({ type: "thinking", content: block.thinking });
              }
            }
            // Extract text blocks
            const text = contentSource
              .filter((b: { type: string }) => b.type === "text")
              .map((b: { text: string }) => b.text)
              .join("");
            if (text) {
              events.push({ type: "message", content: text });
            }
          }

          if (events.length > 0) {
            return events.length === 1 ? events[0] : events;
          }
          return null;
        }

        case "tool_use":
          return { type: "tool_use", tool: obj.name || "unknown", input: obj.input };

        case "tool_result":
          return { type: "tool_result", result: typeof obj.content === "string" ? obj.content : JSON.stringify(obj.content) };

        case "error":
          parserLog.warn("Parsed error event", { message: obj.message || obj.error });
          return { type: "error", message: obj.message || obj.error || line };

        case "result":
          parserLog.info("Parsed result", { sessionId: obj.session_id, costUsd: obj.total_cost_usd, numTurns: obj.num_turns });
          return {
            type: "result",
            sessionId: obj.session_id || "",
            costUsd: obj.total_cost_usd ?? obj.cost_usd,
            numTurns: obj.num_turns,
            isError: obj.is_error,
            resultText: typeof obj.result === "string" ? obj.result : undefined,
          };

        case "system":
          if (obj.status) return { type: "status_change", status: obj.status };
          return null;

        // Skip events we handle elsewhere or don't need
        case "user":
        case "rate_limit_event":
          return null;

        default:
          parserLog.debug("Unhandled JSON event type", { type: obj.type });
          return null;
      }
    } catch {
      return null;
    }
  }

  private parseLine(line: string): OutputEvent | OutputEvent[] | null {
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
