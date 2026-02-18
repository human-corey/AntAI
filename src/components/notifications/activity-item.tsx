"use client";

import type { ActivityEntry } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils/cn";
import {
  Play,
  Square,
  Bot,
  AlertTriangle,
  CheckCircle,
  ListTodo,
  MessageSquare,
  Info,
} from "lucide-react";

const typeIcons: Record<string, React.ElementType> = {
  team_started: Play,
  team_stopped: Square,
  agent_spawned: Bot,
  agent_stopped: Square,
  agent_error: AlertTriangle,
  task_created: ListTodo,
  task_completed: CheckCircle,
  task_failed: AlertTriangle,
  message_sent: MessageSquare,
  system: Info,
};

const severityColors: Record<string, string> = {
  info: "text-[var(--muted-foreground)]",
  success: "text-[var(--status-running)]",
  warning: "text-[var(--status-thinking)]",
  error: "text-[var(--status-error)]",
};

interface ActivityItemProps {
  entry: ActivityEntry;
  onMarkRead?: () => void;
}

export function ActivityItem({ entry, onMarkRead }: ActivityItemProps) {
  const Icon = typeIcons[entry.type] || Info;

  return (
    <button
      onClick={onMarkRead}
      className={cn(
        "flex gap-3 w-full text-left px-4 py-2.5 hover:bg-[var(--muted)] transition-colors",
        !entry.read && "bg-[var(--muted)]/50"
      )}
    >
      <div className={cn("mt-0.5 shrink-0", severityColors[entry.severity])}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs", !entry.read && "font-medium")}>{entry.title}</p>
        {entry.detail && (
          <p className="text-[10px] text-[var(--muted-foreground)] truncate">{entry.detail}</p>
        )}
        <p className="text-[9px] text-[var(--muted-foreground)] mt-0.5">
          {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
        </p>
      </div>
      {!entry.read && (
        <div className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] mt-1.5 shrink-0" />
      )}
    </button>
  );
}
