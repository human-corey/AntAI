"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils/cn";
import { StatusBadge } from "@/components/shared/status-badge";
import type { AgentNodeData } from "@/lib/types";
import { Bot, Crown, Cpu } from "lucide-react";

function AgentNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as AgentNodeData;
  const { agent, isCompact } = nodeData;
  const isLead = agent.isLead;

  if (isCompact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-[var(--node-bg)] px-3 py-2 transition-all",
          selected ? "border-[var(--primary)] shadow-lg shadow-[var(--glow)]" : "border-[var(--node-border)]",
          agent.status === "running" && "animate-glow-pulse"
        )}
      >
        <Handle type="target" position={Position.Top} className="!bg-[var(--edge-idle)] !w-2 !h-2" />
        <div
          className={cn(
            "h-2.5 w-2.5 rounded-full shrink-0",
            agent.status === "running" && "bg-[var(--status-running)]",
            agent.status === "thinking" && "bg-[var(--status-thinking)] animate-status-pulse",
            agent.status === "tool_use" && "bg-[var(--status-tool-use)]",
            agent.status === "error" && "bg-[var(--status-error)]",
            agent.status === "idle" && "bg-[var(--status-idle)]",
            agent.status === "stopped" && "bg-[var(--status-stopped)]",
            agent.status === "crashed" && "bg-[var(--status-error)]"
          )}
        />
        <span className="text-xs font-medium truncate max-w-[120px]">{agent.name}</span>
        <Handle type="source" position={Position.Bottom} className="!bg-[var(--edge-idle)] !w-2 !h-2" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-[240px] rounded-2xl border bg-[var(--node-bg)] shadow-sm transition-all animate-node-appear",
        selected ? "border-[var(--primary)] shadow-lg shadow-[var(--glow)]" : "border-[var(--node-border)]",
        agent.status === "running" && "animate-glow-pulse",
        isLead && "w-[280px]"
      )}
      style={{
        borderRadius: isLead
          ? "24px 24px 20px 20px"
          : "18px 22px 20px 16px",
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[var(--edge-idle)] !w-2.5 !h-2.5 !-top-1" />

      {/* Header */}
      <div className={cn(
        "flex items-center gap-2 px-4 pt-3 pb-2",
        isLead && "border-b border-[var(--border)] pb-3"
      )}>
        <div className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg shrink-0",
          isLead ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
        )}>
          {isLead ? <Crown className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{agent.name}</p>
          <p className="text-[10px] text-[var(--muted-foreground)]">{agent.role}</p>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      {/* Body */}
      <div className="px-4 py-2 space-y-1.5">
        {agent.currentTask && (
          <div className="flex items-start gap-1.5">
            <Cpu className="h-3 w-3 text-[var(--muted-foreground)] mt-0.5 shrink-0" />
            <p className="text-[10px] text-[var(--muted-foreground)] line-clamp-2">{agent.currentTask}</p>
          </div>
        )}
        {agent.lastOutput && (
          <p className="text-[10px] text-[var(--muted-foreground)] line-clamp-2 font-mono opacity-70">
            {agent.lastOutput}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 pb-3 pt-1 text-[9px] text-[var(--muted-foreground)]">
        <span>{agent.model}</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-[var(--edge-idle)] !w-2.5 !h-2.5 !-bottom-1" />
    </div>
  );
}

export const AgentNode = memo(AgentNodeComponent);
