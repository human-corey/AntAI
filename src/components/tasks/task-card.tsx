"use client";

import type { Task } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils/cn";
import { Lock } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const isBlocked = task.blockedBy && task.blockedBy.length > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 transition-all",
        "hover:border-[var(--primary)] hover:shadow-sm",
        isBlocked && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-xs font-medium line-clamp-2">{task.subject}</h4>
        <StatusBadge status={task.status} />
      </div>

      {task.description && (
        <p className="text-[10px] text-[var(--muted-foreground)] line-clamp-2 mb-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center gap-2 text-[10px] text-[var(--muted-foreground)]">
        {task.agentId && (
          <span className="truncate max-w-[100px]">Agent: {task.agentId.slice(-6)}</span>
        )}
        {isBlocked && (
          <span className="flex items-center gap-0.5 text-[var(--destructive)]">
            <Lock className="h-2.5 w-2.5" />
            Blocked
          </span>
        )}
      </div>
    </button>
  );
}
