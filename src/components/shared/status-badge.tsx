import { cn } from "@/lib/utils/cn";

const statusColors: Record<string, string> = {
  active: "bg-[var(--status-running)] text-white",
  archived: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  idle: "bg-[var(--status-idle)] text-white",
  starting: "bg-[var(--status-thinking)] text-[var(--primary-foreground)]",
  running: "bg-[var(--status-running)] text-white",
  stopping: "bg-[var(--status-thinking)] text-[var(--primary-foreground)]",
  stopped: "bg-[var(--status-stopped)] text-white",
  error: "bg-[var(--status-error)] text-white",
  crashed: "bg-[var(--status-error)] text-white",
  thinking: "bg-[var(--status-thinking)] text-[var(--primary-foreground)]",
  tool_use: "bg-[var(--status-tool-use)] text-white",
  pending: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  in_progress: "bg-[var(--status-thinking)] text-[var(--primary-foreground)]",
  completed: "bg-[var(--status-running)] text-white",
  blocked: "bg-[var(--status-error)] text-white",
  failed: "bg-[var(--status-error)] text-white",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        statusColors[status] || "bg-[var(--muted)] text-[var(--muted-foreground)]",
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
