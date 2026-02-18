"use client";

import { useParams } from "next/navigation";
import { useTasks } from "@/lib/api/hooks";
import { useUiStore } from "@/stores/ui-store";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskList } from "@/components/tasks/task-list";
import { ViewModeToggle } from "@/components/tasks/view-mode-toggle";
import { TaskFilters } from "@/components/tasks/task-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { ListTodo } from "lucide-react";
import { useState, useMemo } from "react";

export default function TasksPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { data: tasks, isLoading } = useTasks(projectId);
  const { activeViewMode } = useUiStore();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!tasks) return [];
    if (!search) return tasks;
    const q = search.toLowerCase();
    return tasks.filter(
      (t) => t.subject.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );
  }, [tasks, search]);

  if (isLoading) return <div className="p-6">Loading tasks...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <div className="flex items-center gap-3">
          <TaskFilters search={search} onSearchChange={setSearch} />
          <ViewModeToggle />
        </div>
      </div>

      {filtered.length === 0 && !search ? (
        <EmptyState icon={ListTodo} title="No tasks yet" description="Tasks will appear here when your agent teams create them." />
      ) : activeViewMode === "kanban" ? (
        <TaskBoard tasks={filtered} />
      ) : (
        <TaskList tasks={filtered} />
      )}
    </div>
  );
}
