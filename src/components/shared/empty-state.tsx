import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <Icon className="h-12 w-12 text-[var(--muted-foreground)] mb-4 opacity-40" />
      <h3 className="text-lg font-medium text-[var(--muted-foreground)]">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--muted-foreground)] mt-1 max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
