"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/shared/status-badge";

interface AgentTasksProps {
  agentId: string;
}

export function AgentTasks({ agentId }: AgentTasksProps) {
  // Placeholder — will be wired to tasks filtered by agentId
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        <p className="text-xs text-[var(--muted-foreground)]">
          Tasks assigned to agent {agentId.slice(-6)} will appear here.
        </p>
      </div>
    </ScrollArea>
  );
}
