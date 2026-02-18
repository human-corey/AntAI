"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { TaskDetailDialog } from "./task-detail-dialog";
import { formatDistanceToNow } from "date-fns";

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <>
      <div className="rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
              <th className="text-left px-4 py-2 font-medium text-[var(--muted-foreground)]">Subject</th>
              <th className="text-left px-4 py-2 font-medium text-[var(--muted-foreground)]">Status</th>
              <th className="text-left px-4 py-2 font-medium text-[var(--muted-foreground)]">Agent</th>
              <th className="text-left px-4 py-2 font-medium text-[var(--muted-foreground)]">Created</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="border-b border-[var(--border)] hover:bg-[var(--muted)] cursor-pointer transition-colors"
              >
                <td className="px-4 py-2.5 font-medium">{task.subject}</td>
                <td className="px-4 py-2.5"><StatusBadge status={task.status} /></td>
                <td className="px-4 py-2.5 text-[var(--muted-foreground)]">{task.agentId?.slice(-6) || "\u2014"}</td>
                <td className="px-4 py-2.5 text-[var(--muted-foreground)]">{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--muted-foreground)]">No tasks</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
        />
      )}
    </>
  );
}
