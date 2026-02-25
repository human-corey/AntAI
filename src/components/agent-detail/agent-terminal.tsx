"use client";

import { useEffect, useRef, useMemo } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useTerminalStore } from "@/stores/terminal-store";
import { useWs } from "@/providers/websocket-provider";
import { useAgentStore } from "@/stores/agent-store";
import "@xterm/xterm/css/xterm.css";

interface AgentTerminalProps {
  agentId: string;
  teamId?: string;
  isLead?: boolean;
}

export function AgentTerminal({ agentId, teamId, isLead }: AgentTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const { subscribe, unsubscribe, send, connected } = useWs();
  const agents = useAgentStore((s) => s.agents);

  // Non-lead teammates share the lead's terminal (in-process mode)
  const terminalAgentId = useMemo(() => {
    if (isLead === false && teamId) {
      const lead = Object.values(agents).find((a) => a.teamId === teamId && a.isLead);
      return lead ? lead.id : agentId;
    }
    return agentId;
  }, [agentId, teamId, isLead, agents]);

  // Subscribe to terminal channel
  useEffect(() => {
    if (!connected) return;
    subscribe("terminal", terminalAgentId);
    return () => unsubscribe("terminal", terminalAgentId);
  }, [connected, terminalAgentId, subscribe, unsubscribe]);

  // Create terminal instance
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const fitAddon = new FitAddon();
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      theme: {
        background: "#121210",
        foreground: "#e8e5dd",
        cursor: "#e8e5dd",
        selectionBackground: "#3a3a30",
        black: "#1a1a17",
        red: "#e55c5c",
        green: "#7ec87e",
        yellow: "#d4b95e",
        blue: "#5c8ae5",
        magenta: "#b07ed8",
        cyan: "#5cc8c8",
        white: "#e8e5dd",
      },
      scrollback: 5000,
      convertEol: true,
    });

    terminal.loadAddon(fitAddon);
    terminal.open(el);

    // Fit after open
    try {
      fitAddon.fit();
    } catch { /* container may not be visible yet */ }

    termRef.current = terminal;
    fitRef.current = fitAddon;

    // Handle user input -> send to WebSocket (always target the terminal's agent)
    const inputDisposable = terminal.onData((data) => {
      send({ type: "terminal:input", agentId: terminalAgentId, data });
    });

    // Sync PTY dimensions after fitting
    const syncDimensions = () => {
      if (terminal.cols && terminal.rows) {
        send({ type: "terminal:resize", agentId: terminalAgentId, cols: terminal.cols, rows: terminal.rows });
      }
    };

    // Listen for incoming terminal data from the store
    const store = useTerminalStore.getState();
    const listener = (data: string) => {
      terminal.write(data);
    };
    store.addListener(terminalAgentId, listener);

    // Send initial dimensions to server after a brief layout settle
    setTimeout(syncDimensions, 100);

    // Resize observer for container — fit xterm.js AND sync PTY dims
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        syncDimensions();
      } catch { /* ignore resize errors */ }
    });
    resizeObserver.observe(el);

    return () => {
      inputDisposable.dispose();
      store.removeListener(terminalAgentId, listener);
      resizeObserver.disconnect();
      terminal.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, [terminalAgentId, send]);

  return (
    <div className="h-full flex flex-col bg-[#121210]">
      <div ref={containerRef} className="flex-1 min-h-0 p-1" />
    </div>
  );
}
