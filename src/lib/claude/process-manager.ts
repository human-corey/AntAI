import { spawn as ptySpawn } from "node-pty";
import type { ManagedProcess, SpawnOptions, OutputEvent, TranscriptEntry } from "./types";
import { OutputParser } from "./output-parser";
import { buildClaudeArgs, getClaudePath } from "./cli";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createAgentId, createId } from "@/lib/utils/id";
import type { RoomManager } from "@/lib/ws/rooms";
import { GRACEFUL_SHUTDOWN_TIMEOUT, SIGKILL_TIMEOUT } from "@/lib/constants";
import { processLog } from "@/lib/logger";

export class ProcessManager {
  private processes = new Map<string, ManagedProcess>();
  private parsers = new Map<string, OutputParser>();
  private rooms: RoomManager | null = null;
  /** Tracks whether a message event was already emitted for each agent run */
  private messageEmitted = new Set<string>();

  setRooms(rooms: RoomManager): void {
    this.rooms = rooms;
  }

  /**
   * Spawn a team lead agent via Claude CLI using a PTY.
   * The PTY gives us a real terminal so the CLI runs in interactive mode
   * with live streaming output rendered directly by xterm.js on the client.
   */
  async spawnTeamLead(options: SpawnOptions): Promise<ManagedProcess> {
    const claudePath = getClaudePath();
    const args = buildClaudeArgs(options);
    const agentId = options.agentId || createAgentId();

    processLog.info("Spawning team lead (PTY)", { claudePath, args: args.join(" "), agentId, teamId: options.teamId });

    // Strip Claude nesting detection env vars to allow spawning from within Claude Code,
    // and ensure agent teams are enabled
    const { CLAUDECODE: _a, CLAUDE_CODE_ENTRYPOINT: _b, ...cleanEnv } = process.env;

    let proc;
    try {
      proc = ptySpawn(claudePath, args, {
        name: "xterm-256color",
        cols: 120,
        rows: 40,
        cwd: options.workingDir,
        env: {
          ...cleanEnv,
          CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1",
        },
      });
    } catch (err) {
      processLog.error("Failed to spawn agent PTY", { agentId, error: String(err) });
      this.rooms?.broadcast("agent", agentId, {
        type: "agent:exited",
        agentId,
        code: -1,
      });
      throw new Error(`Failed to spawn Claude CLI PTY: ${err}`);
    }

    const managed: ManagedProcess = {
      agentId,
      teamId: options.teamId,
      process: proc,
      pid: proc.pid,
      isLead: options.isLead ?? true,
      startedAt: new Date().toISOString(),
    };

    this.processes.set(agentId, managed);
    this.messageEmitted.delete(agentId);

    // Create output parser for structured events (still useful for status tracking)
    const parser = new OutputParser();
    this.parsers.set(agentId, parser);

    // Create or update agent record in DB (update if resuming an existing agent)
    const now = new Date().toISOString();
    const existing = db.select().from(schema.agents).where(eq(schema.agents.id, agentId)).get();
    if (existing) {
      db.update(schema.agents)
        .set({ status: "running", pid: proc.pid, startedAt: now, stoppedAt: null, updatedAt: now })
        .where(eq(schema.agents.id, agentId))
        .run();
    } else {
      db.insert(schema.agents)
        .values({
          id: agentId,
          teamId: options.teamId,
          name: options.isLead ? "Team Lead" : `Agent ${agentId.slice(-4)}`,
          role: options.isLead ? "lead" : "teammate",
          model: options.model || "claude-sonnet-4-6",
          status: "running",
          isLead: options.isLead ?? true,
          pid: proc.pid,
          sessionId: options.sessionId || null,
          startedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }

    // Wire PTY output — single stream, broadcast raw data for xterm.js rendering
    proc.onData((data: string) => {
      // Broadcast raw terminal output for xterm.js
      this.rooms?.broadcast("terminal", agentId, {
        type: "terminal:output",
        agentId,
        data,
      });

      // Also try to parse structured events for status tracking
      const events = parser.parse(data);
      for (const event of events) {
        this.handleOutputEvent(agentId, options.teamId, event);
      }
    });

    // Handle PTY exit
    proc.onExit(({ exitCode, signal }) => {
      processLog.info("Agent PTY exited", { agentId, exitCode, signal });
      this.processes.delete(agentId);
      this.parsers.delete(agentId);
      this.messageEmitted.delete(agentId);

      const agentRow = db.select().from(schema.agents).where(eq(schema.agents.id, agentId)).get();
      const exitStatus = exitCode === 0 && agentRow?.sessionId ? "idle" : exitCode === 0 ? "stopped" : "crashed";
      const exitNow = new Date().toISOString();

      db.update(schema.agents)
        .set({ status: exitStatus as "idle" | "stopped" | "crashed", stoppedAt: exitNow, updatedAt: exitNow })
        .where(eq(schema.agents.id, agentId))
        .run();

      this.rooms?.broadcast("agent", agentId, {
        type: "agent:exited",
        agentId,
        code: exitCode,
      });

      this.rooms?.broadcast("activity", "global", {
        type: "activity:new",
        entry: {
          id: createId(),
          teamId: options.teamId,
          agentId,
          type: exitCode === 0 ? "agent_stopped" : "agent_error",
          title: exitCode === 0 ? "Agent stopped" : "Agent crashed",
          detail: `Exit code: ${exitCode}, signal: ${signal}`,
          severity: exitCode === 0 ? "info" : "error",
          read: false,
          createdAt: exitNow,
        },
      });

      // Check if this was the last agent in the team
      const remainingInTeam = [...this.processes.values()].filter(
        (mp) => mp.teamId === options.teamId
      );
      if (remainingInTeam.length === 0) {
        const teamNow = new Date().toISOString();
        db.update(schema.teams)
          .set({ status: "stopped", updatedAt: teamNow })
          .where(eq(schema.teams.id, options.teamId))
          .run();
        this.rooms?.broadcast("team", options.teamId, {
          type: "team:status",
          teamId: options.teamId,
          status: "stopped",
        });
      }
    });

    // Write prompt to PTY once the CLI is ready for input.
    // Detection: wait for output to settle (no new data for 500ms after first output).
    // This handles both fresh starts and --resume (which replays session history).
    if (options.prompt) {
      const prompt = options.prompt;
      let promptWritten = false;
      let lastOutputTime = 0;

      const readyWatcher = proc.onData(() => {
        lastOutputTime = Date.now();
      });

      const checkInterval = setInterval(() => {
        if (promptWritten) return;
        // Wait for output to appear and then go silent for 500ms
        if (lastOutputTime > 0 && Date.now() - lastOutputTime > 500) {
          promptWritten = true;
          clearInterval(checkInterval);
          readyWatcher.dispose();
          processLog.info("CLI ready (output settled), writing prompt", { agentId, promptLen: prompt.length });
          try {
            proc.write(prompt);
            // Send Enter separately — ink's input handler needs it as a distinct event
            setTimeout(() => {
              try {
                proc.write("\r");
              } catch (err) {
                processLog.error("Failed to write Enter to PTY", { agentId, error: String(err) });
              }
            }, 100);
          } catch (err) {
            processLog.error("Failed to write prompt to PTY", { agentId, error: String(err) });
          }
        }
      }, 100);

      // Absolute fallback — write after 15s no matter what
      setTimeout(() => {
        if (!promptWritten) {
          promptWritten = true;
          clearInterval(checkInterval);
          readyWatcher.dispose();
          processLog.warn("Prompt readiness timeout, writing anyway", { agentId, promptLen: prompt.length });
          try {
            proc.write(prompt);
            setTimeout(() => {
              try {
                proc.write("\r");
              } catch (err) {
                processLog.error("Failed to write Enter to PTY (fallback)", { agentId, error: String(err) });
              }
            }, 100);
          } catch (err) {
            processLog.error("Failed to write prompt to PTY (fallback)", { agentId, error: String(err) });
          }
        }
      }, 15000);
    }

    // Broadcast agent spawned
    const agent = db
      .select()
      .from(schema.agents)
      .where(eq(schema.agents.id, agentId))
      .get();

    if (agent) {
      this.rooms?.broadcast("team", options.teamId, {
        type: "agent:spawned",
        agent,
      });
    }

    return managed;
  }

  /**
   * Send raw input to an agent's PTY (used for terminal:input passthrough).
   */
  sendInput(agentId: string, data: string): void {
    const managed = this.processes.get(agentId);
    if (!managed) {
      processLog.warn("No process found for agent", { agentId });
      return;
    }
    try {
      managed.process.write(data);
    } catch (err) {
      processLog.error("Failed to write to PTY", { agentId, error: String(err) });
      this.rooms?.broadcast("agent", agentId, {
        type: "agent:status",
        agentId,
        status: "error",
        lastOutput: "Failed to write to PTY",
      });
    }
  }

  /**
   * Send a chat message to the PTY.  Writes the text first, then sends
   * Enter (\r) as a separate write after a short delay — the CLI's ink-based
   * input handler expects keystrokes individually (like xterm.js sends them).
   */
  sendMessage(agentId: string, message: string): void {
    const managed = this.processes.get(agentId);
    if (!managed) {
      processLog.warn("No process found for agent", { agentId });
      return;
    }
    try {
      processLog.info("sendMessage: writing text", { agentId, len: message.length });
      managed.process.write(message);
      setTimeout(() => {
        try {
          processLog.info("sendMessage: writing Enter", { agentId });
          managed.process.write("\r");
        } catch (err) {
          processLog.error("Failed to write Enter to PTY", { agentId, error: String(err) });
        }
      }, 100);
    } catch (err) {
      processLog.error("Failed to write message to PTY", { agentId, error: String(err) });
    }
  }

  /**
   * Resize PTY terminal dimensions.
   */
  resizeTerminal(agentId: string, cols: number, rows: number): void {
    const managed = this.processes.get(agentId);
    if (!managed) return;
    try {
      managed.process.resize(cols, rows);
    } catch (err) {
      processLog.error("Failed to resize PTY", { agentId, error: String(err) });
    }
  }

  /**
   * Gracefully stop an agent.
   */
  async stopAgent(agentId: string): Promise<void> {
    const managed = this.processes.get(agentId);
    if (!managed) return;

    db.update(schema.agents)
      .set({ status: "stopped", updatedAt: new Date().toISOString() })
      .where(eq(schema.agents.id, agentId))
      .run();

    // Send Ctrl+C via PTY to gracefully interrupt
    try {
      managed.process.write("\x03");
    } catch { /* PTY may be closing */ }

    // Force kill after timeout
    setTimeout(() => {
      if (this.processes.has(agentId)) {
        try {
          managed.process.kill();
        } catch { /* already dead */ }
      }
    }, GRACEFUL_SHUTDOWN_TIMEOUT);
  }

  /**
   * Force kill an agent immediately.
   */
  killAgent(agentId: string): void {
    const managed = this.processes.get(agentId);
    if (!managed) return;

    try {
      managed.process.kill();
    } catch { /* already dead */ }
    this.processes.delete(agentId);
    this.parsers.delete(agentId);

    db.update(schema.agents)
      .set({ status: "stopped", stoppedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(eq(schema.agents.id, agentId))
      .run();
  }

  /**
   * Stop all agents in a team.
   */
  async stopTeam(teamId: string): Promise<void> {
    const teamProcesses = [...this.processes.entries()].filter(
      ([_, mp]) => mp.teamId === teamId
    );

    for (const [agentId] of teamProcesses) {
      await this.stopAgent(agentId);
    }
  }

  /**
   * Shut down all processes (for server cleanup).
   */
  async shutdownAll(): Promise<void> {
    processLog.info("Shutting down all processes", { count: this.processes.size });
    const promises = [...this.processes.keys()].map((id) => this.stopAgent(id));
    await Promise.allSettled(promises);

    // Force kill anything still running
    setTimeout(() => {
      for (const [id, mp] of this.processes) {
        processLog.warn("Force killing", { agentId: id });
        try {
          mp.process.kill();
        } catch { /* already dead */ }
      }
      this.processes.clear();
      this.parsers.clear();
    }, SIGKILL_TIMEOUT);
  }

  /**
   * Check if an agent has a running process.
   */
  isRunning(agentId: string): boolean {
    return this.processes.has(agentId);
  }

  /**
   * Get the count of running processes.
   */
  getRunningCount(): number {
    return this.processes.size;
  }

  private eventToTranscriptEntry(event: OutputEvent): TranscriptEntry | null {
    const base = { id: createId(), timestamp: new Date().toISOString() };
    switch (event.type) {
      case "message":
        return { ...base, type: "message", content: event.content };
      case "thinking":
        return { ...base, type: "thinking", content: event.content };
      case "tool_use":
        return { ...base, type: "tool_use", tool: event.tool, toolInput: event.input };
      case "tool_result":
        return { ...base, type: "tool_result", toolResult: event.result };
      case "error":
        return { ...base, type: "error", content: event.message, isError: true };
      case "result":
        return {
          ...base,
          type: "result",
          sessionId: event.sessionId,
          costUsd: event.costUsd,
          numTurns: event.numTurns,
          isError: event.isError,
          content: event.resultText,
        };
      case "status_change":
        return { ...base, type: "status_change", status: event.status };
      case "agent_spawned":
        return { ...base, type: "agent_spawned", agentName: event.name };
      case "message_delta":
        return { ...base, id: `stream_msg_${event.blockId}`, type: "message", content: event.content, isStreaming: !event.isFinal };
      case "thinking_delta":
        return { ...base, id: `stream_think_${event.blockId}`, type: "thinking", content: event.content, isStreaming: !event.isFinal };
      case "output_line":
      case "task_activity":
        return null;
      default:
        return null;
    }
  }

  private handleOutputEvent(agentId: string, teamId: string, event: OutputEvent): void {
    processLog.debug("Output event", { agentId, type: event.type });

    // Broadcast transcript entry for all meaningful events
    const entry = this.eventToTranscriptEntry(event);
    if (entry) {
      this.rooms?.broadcast("agent", agentId, {
        type: "agent:event",
        agentId,
        event: entry,
      });
    }

    switch (event.type) {
      case "status_change":
        db.update(schema.agents)
          .set({ status: event.status as "running", updatedAt: new Date().toISOString() })
          .where(eq(schema.agents.id, agentId))
          .run();
        this.rooms?.broadcast("agent", agentId, {
          type: "agent:status",
          agentId,
          status: event.status as "running",
        });
        break;

      case "agent_spawned":
        this.rooms?.broadcast("activity", "global", {
          type: "activity:new",
          entry: {
            id: createId(),
            teamId,
            agentId,
            type: "agent_spawned",
            title: `Agent spawned: ${event.name}`,
            severity: "info",
            read: false,
            createdAt: new Date().toISOString(),
          },
        });
        break;

      case "error":
        processLog.error("Agent error", { agentId, message: event.message });
        this.rooms?.broadcast("agent", agentId, {
          type: "agent:status",
          agentId,
          status: "error",
          lastOutput: event.message,
        });
        break;

      case "tool_use":
        this.rooms?.broadcast("agent", agentId, {
          type: "agent:status",
          agentId,
          status: "tool_use",
          currentTask: event.tool,
        });
        break;

      case "thinking":
      case "thinking_delta":
        this.rooms?.broadcast("agent", agentId, {
          type: "agent:status",
          agentId,
          status: "thinking",
        });
        break;

      case "message_delta":
        if (!this.messageEmitted.has(agentId)) {
          this.rooms?.broadcast("agent", agentId, {
            type: "agent:status",
            agentId,
            status: "running",
          });
        }
        if (event.isFinal && event.content) {
          this.messageEmitted.add(agentId);
          processLog.info("Streamed message complete", { agentId, contentLen: event.content.length });
          db.insert(schema.messages).values({
            id: createId(),
            teamId,
            fromAgentId: agentId,
            content: event.content,
            type: "agent",
          }).run();
        }
        break;

      case "message":
        this.messageEmitted.add(agentId);
        processLog.info("Agent message", { agentId, contentLen: event.content.length });
        db.insert(schema.messages).values({
          id: createId(),
          teamId,
          fromAgentId: agentId,
          content: event.content,
          type: "agent",
        }).run();
        break;

      case "result": {
        const resultNow = new Date().toISOString();
        if (event.sessionId) {
          db.update(schema.agents)
            .set({ sessionId: event.sessionId, updatedAt: resultNow })
            .where(eq(schema.agents.id, agentId))
            .run();
          processLog.info("Session ID saved", { agentId, sessionId: event.sessionId });
        }
        if (event.resultText && !this.messageEmitted.has(agentId)) {
          processLog.info("Result text (fallback message)", { agentId, contentLen: event.resultText.length });
          db.insert(schema.messages).values({
            id: createId(),
            teamId,
            fromAgentId: agentId,
            content: event.resultText,
            type: "agent",
          }).run();
        }
        this.messageEmitted.delete(agentId);
        break;
      }
    }
  }
}
