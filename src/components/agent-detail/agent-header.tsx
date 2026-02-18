"use client";

import type { Agent } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Crown, Bot, Square, Play, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AgentHeaderProps {
  agent: Agent;
  onStop?: () => void;
  onResume?: () => void;
  onClose: () => void;
}

export function AgentHeader({ agent, onStop, onResume, onClose }: AgentHeaderProps) {
  const isRunning = agent.status === "running" || agent.status === "thinking" || agent.status === "tool_use";

  return (
    <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
          agent.isLead
            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
        )}
      >
        {agent.isLead ? <Crown className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold truncate">{agent.name}</h3>
          <StatusBadge status={agent.status} />
        </div>
        <p className="text-[10px] text-[var(--muted-foreground)]">
          {agent.role} &middot; {agent.model}
        </p>
      </div>

      <div className="flex items-center gap-1">
        {isRunning && onStop && (
          <Button variant="ghost" size="sm" onClick={onStop} title="Stop agent">
            <Square className="h-3.5 w-3.5" />
          </Button>
        )}
        {(agent.status === "stopped" || agent.status === "crashed") && onResume && (
          <Button variant="ghost" size="sm" onClick={onResume} title="Resume agent">
            <Play className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onClose} title="Close">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
