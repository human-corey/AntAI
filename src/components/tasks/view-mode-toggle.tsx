"use client";

import { LayoutGrid, List, Layers } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUiStore } from "@/stores/ui-store";

const modes = [
  { value: "kanban" as const, icon: LayoutGrid, label: "Kanban" },
  { value: "list" as const, icon: List, label: "List" },
  { value: "inline" as const, icon: Layers, label: "Inline" },
];

export function ViewModeToggle() {
  const { activeViewMode, setViewMode } = useUiStore();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
      {modes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setViewMode(value)}
          title={label}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
            activeViewMode === value
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
