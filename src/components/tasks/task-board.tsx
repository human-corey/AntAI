"use client";

import { useMemo, useState } from "react";
import type { Task } from "@/lib/types";
import { TaskColumn } from "./task-column";
import { TaskDetailDialog } from "./task-detail-dialog";

interface TaskBoardProps {
  tasks: Task[];
}

export function TaskBoard({ tasks }: TaskBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const columns = useMemo(() => {
    const pending = tasks.filter((t) => t.status === "pending" || t.status === "blocked");
    const inProgress = tasks.filter((t) => t.status === "in_progress");
    const completed = tasks.filter((t) => t.status === "completed" || t.status === "failed");
    return { pending, inProgress, completed };
  }, [tasks]);

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        <TaskColumn
          title="Pending"
          tasks={columns.pending}
          color="var(--status-idle)"
          onTaskClick={setSelectedTask}
        />
        <TaskColumn
          title="In Progress"
          tasks={columns.inProgress}
          color="var(--status-thinking)"
          onTaskClick={setSelectedTask}
        />
        <TaskColumn
          title="Completed"
          tasks={columns.completed}
          color="var(--status-running)"
          onTaskClick={setSelectedTask}
        />
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
