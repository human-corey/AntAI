"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/shared/status-badge";

interface AgentLogsProps {
  agentId: string;
}

export function AgentLogs({ agentId }: AgentLogsProps) {
  // Placeholder — will be wired to real log data from API
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        <p className="text-xs text-[var(--muted-foreground)]">
          Logs for agent {agentId.slice(-6)} will appear here when the agent is running.
        </p>
      </div>
    </ScrollArea>
  );
}
