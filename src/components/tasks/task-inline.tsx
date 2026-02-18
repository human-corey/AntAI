"use client";

import type { Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface TaskInlineProps {
  tasks: Task[];
  maxVisible?: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-[var(--muted-foreground)]/20 text-[var(--muted-foreground)]",
  in_progress: "bg-[var(--status-running)]/20 text-[var(--status-running)]",
  completed: "bg-[var(--secondary)]/20 text-[var(--secondary)]",
  failed: "bg-[var(--status-error)]/20 text-[var(--status-error)]",
  blocked: "bg-[var(--status-thinking)]/20 text-[var(--status-thinking)]",
};

export function TaskInline({ tasks, maxVisible = 3 }: TaskInlineProps) {
  if (tasks.length === 0) return null;

  const visible = tasks.slice(0, maxVisible);
  const remaining = tasks.length - maxVisible;

  return (
    <div className="space-y-1 mt-2 pt-2 border-t border-[var(--border)]/50">
      {visible.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-1.5 text-[10px]"
        >
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full shrink-0",
              task.status === "completed"
                ? "bg-[var(--secondary)]"
                : task.status === "in_progress"
                ? "bg-[var(--status-running)]"
                : task.status === "failed"
                ? "bg-[var(--status-error)]"
                : "bg-[var(--muted-foreground)]"
            )}
          />
          <span className="truncate text-[var(--muted-foreground)]">
            {task.subject}
          </span>
          <Badge variant="outline" className={cn("text-[8px] h-3.5 px-1 ml-auto shrink-0", statusColors[task.status])}>
            {task.status.replace("_", " ")}
          </Badge>
        </div>
      ))}
      {remaining > 0 && (
        <div className="text-[9px] text-[var(--muted-foreground)] pl-3">
          +{remaining} more
        </div>
      )}
    </div>
  );
}
