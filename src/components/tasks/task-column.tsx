"use client";

import type { Task } from "@/lib/types";
import { TaskCard } from "./task-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  color?: string;
  onTaskClick?: (task: Task) => void;
}

export function TaskColumn({ title, tasks, color, onTaskClick }: TaskColumnProps) {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px]">
      <div className="flex items-center gap-2 mb-3 px-1">
        {color && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          {title}
        </h3>
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
          {tasks.length}
        </Badge>
      </div>
      <div className="flex-1 space-y-2 overflow-auto">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
        ))}
        {tasks.length === 0 && (
          <p className="text-[10px] text-[var(--muted-foreground)] text-center py-8 opacity-50">
            No tasks
          </p>
        )}
      </div>
    </div>
  );
}
