"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useTerminalStore } from "@/stores/terminal-store";
import { useWs } from "@/providers/websocket-provider";
import "@xterm/xterm/css/xterm.css";

interface AgentTerminalProps {
  agentId: string;
}

export function AgentTerminal({ agentId }: AgentTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const { subscribe, unsubscribe, send, connected } = useWs();

  // Subscribe to terminal channel
  useEffect(() => {
    if (!connected) return;
    subscribe("terminal", agentId);
    return () => unsubscribe("terminal", agentId);
  }, [connected, agentId, subscribe, unsubscribe]);

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

    // Handle user input -> send to WebSocket
    const inputDisposable = terminal.onData((data) => {
      send({ type: "terminal:input", agentId, data });
    });

    // Listen for incoming terminal data from the store
    const store = useTerminalStore.getState();
    const listener = (data: string) => {
      terminal.write(data);
    };
    store.addListener(agentId, listener);

    // Resize observer for container
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch { /* ignore resize errors */ }
    });
    resizeObserver.observe(el);

    return () => {
      inputDisposable.dispose();
      store.removeListener(agentId, listener);
      resizeObserver.disconnect();
      terminal.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, [agentId, send]);

  return (
    <div className="h-full flex flex-col bg-[#121210]">
      <div ref={containerRef} className="flex-1 min-h-0 p-1" />
    </div>
  );
}
