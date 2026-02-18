"use client";

import type { Task } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Separator } from "@/components/ui/separator";

interface TaskDetailDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <DialogTitle className="flex-1">{task.subject}</DialogTitle>
            <StatusBadge status={task.status} />
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {task.description && (
            <div>
              <h4 className="text-xs font-medium text-[var(--muted-foreground)] mb-1">Description</h4>
              <p className="text-sm">{task.description}</p>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[var(--muted-foreground)]">Agent:</span>
              <span className="ml-2">{task.agentId || "Unassigned"}</span>
            </div>
            <div>
              <span className="text-[var(--muted-foreground)]">Team:</span>
              <span className="ml-2">{task.teamId || "—"}</span>
            </div>
          </div>

          {task.blockedBy && task.blockedBy.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-[var(--muted-foreground)] mb-1">Blocked By</h4>
              <div className="flex gap-1 flex-wrap">
                {task.blockedBy.map((id) => (
                  <span key={id} className="text-[10px] bg-[var(--muted)] rounded px-1.5 py-0.5">{id}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
