import { spawn, type ChildProcess } from "child_process";
import type { ManagedProcess, SpawnOptions } from "./types";
import { OutputParser } from "./output-parser";
import { buildClaudeArgs, getClaudePath } from "./cli";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createAgentId, createId } from "@/lib/utils/id";
import type { RoomManager } from "@/lib/ws/rooms";
import { GRACEFUL_SHUTDOWN_TIMEOUT, SIGKILL_TIMEOUT } from "@/lib/constants";

export class ProcessManager {
  private processes = new Map<string, ManagedProcess>();
  private parsers = new Map<string, OutputParser>();
  private rooms: RoomManager | null = null;

  setRooms(rooms: RoomManager): void {
    this.rooms = rooms;
  }

  /**
   * Spawn a team lead agent via Claude CLI.
   */
  async spawnTeamLead(options: SpawnOptions): Promise<ManagedProcess> {
    const claudePath = getClaudePath();
    const args = buildClaudeArgs(options);
    const agentId = options.agentId || createAgentId();

    console.log(`[PM] Spawning team lead: ${claudePath} ${args.join(" ")}`);

    const proc = spawn(claudePath, args, {
      cwd: options.workingDir,
      env: {
        ...process.env,
        CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1",
      },
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

    proc.on("error", (err) => {
      console.error(`[PM] Failed to spawn agent ${agentId}:`, err);
      this.processes.delete(agentId);
      this.parsers.delete(agentId);

      this.rooms?.broadcast("agent", agentId, {
        type: "agent:exited",
        agentId,
        code: -1,
      });
    });

    if (!proc.pid) {
      throw new Error("Failed to spawn Claude CLI process");
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

    // Create output parser
    const parser = new OutputParser();
    this.parsers.set(agentId, parser);

    // Create agent record in DB
    const now = new Date().toISOString();
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

    // Wire stdout
    proc.stdout?.on("data", (data: Buffer) => {
      const raw = data.toString();

      // Broadcast raw terminal output
      this.rooms?.broadcast("terminal", agentId, {
        type: "terminal:output",
        agentId,
        data: raw,
      });

      // Parse structured events
      const events = parser.parse(raw);
      for (const event of events) {
        this.handleOutputEvent(agentId, options.teamId, event);
      }
    });

    // Wire stderr
    proc.stderr?.on("data", (data: Buffer) => {
      const raw = data.toString();
      this.rooms?.broadcast("terminal", agentId, {
        type: "terminal:output",
        agentId,
        data: raw,
      });
    });

    // Handle process exit
    proc.on("exit", (code, signal) => {
      console.log(`[PM] Agent ${agentId} exited with code=${code} signal=${signal}`);
      this.processes.delete(agentId);
      this.parsers.delete(agentId);

      const exitStatus = code === 0 ? "stopped" : "crashed";
      const now = new Date().toISOString();

      db.update(schema.agents)
        .set({ status: exitStatus as "stopped" | "crashed", stoppedAt: now, updatedAt: now })
        .where(eq(schema.agents.id, agentId))
        .run();

      this.rooms?.broadcast("agent", agentId, {
        type: "agent:exited",
        agentId,
        code: code ?? -1,
      });

      this.rooms?.broadcast("activity", "global", {
        type: "activity:new",
        entry: {
          id: createId(),
          teamId: options.teamId,
          agentId,
          type: code === 0 ? "agent_stopped" : "agent_error",
          title: code === 0 ? "Agent stopped" : "Agent crashed",
          detail: `Exit code: ${code}, signal: ${signal}`,
          severity: code === 0 ? "info" : "error",
          read: false,
          createdAt: now,
        },
      });
    });

    // Send the initial prompt after a short delay to let CLI initialize
    if (options.prompt && proc.stdin) {
      setTimeout(() => {
        try {
          if (proc.stdin?.writable) {
            proc.stdin.write(options.prompt + "\n");
          }
        } catch (err) {
          console.warn(`[PM] Failed to send initial prompt for ${agentId}:`, err);
        }
      }, 1000);
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
   * Send input to an agent's stdin.
   */
  sendInput(agentId: string, data: string): void {
    const managed = this.processes.get(agentId);
    if (!managed) {
      console.warn(`[PM] No process found for agent ${agentId}`);
      return;
    }
    try {
      if (managed.process.stdin?.writable) {
        managed.process.stdin.write(data);
      }
    } catch (err) {
      console.warn(`[PM] Failed to write to stdin for ${agentId}:`, err);
    }
  }

  /**
   * Resize terminal (no-op for basic child_process, needed for PTY).
   */
  resizeTerminal(_agentId: string, _cols: number, _rows: number): void {
    // PTY resize would go here when using node-pty
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

    // On Windows, send Ctrl+C to stdin before SIGTERM
    if (process.platform === "win32") {
      try {
        if (managed.process.stdin?.writable) {
          managed.process.stdin.write("\x03");
        }
      } catch { /* stdin may be closed */ }
    }
    managed.process.kill("SIGTERM");

    // Force kill after timeout
    setTimeout(() => {
      if (this.processes.has(agentId)) {
        managed.process.kill("SIGKILL");
      }
    }, GRACEFUL_SHUTDOWN_TIMEOUT);
  }

  /**
   * Force kill an agent immediately.
   */
  killAgent(agentId: string): void {
    const managed = this.processes.get(agentId);
    if (!managed) return;

    managed.process.kill("SIGKILL");
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
    console.log(`[PM] Shutting down ${this.processes.size} processes...`);
    const promises = [...this.processes.keys()].map((id) => this.stopAgent(id));
    await Promise.allSettled(promises);

    // Force kill anything still running
    setTimeout(() => {
      for (const [id, mp] of this.processes) {
        console.log(`[PM] Force killing ${id}`);
        mp.process.kill("SIGKILL");
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

  private handleOutputEvent(agentId: string, teamId: string, event: import("./types").OutputEvent): void {
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
        this.rooms?.broadcast("agent", agentId, {
          type: "agent:status",
          agentId,
          status: "thinking",
        });
        break;
    }
  }
}
