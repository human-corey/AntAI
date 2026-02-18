"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MoreVertical, Play, Square, Skull, Terminal } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { useState } from "react";

interface AgentActionsMenuProps {
  agentId: string;
  projectId: string;
  teamId: string;
  status: string;
  onResume?: () => void;
  onStop?: () => void;
  onKill?: () => void;
}

export function AgentActionsMenu({
  agentId,
  status,
  onResume,
  onStop,
  onKill,
}: AgentActionsMenuProps) {
  const { openDrawer } = useUiStore();
  const [killConfirmOpen, setKillConfirmOpen] = useState(false);

  const isRunning = status === "running" || status === "thinking" || status === "tool_use";
  const isStopped = status === "stopped" || status === "crashed" || status === "error";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => openDrawer(agentId)} className="gap-2">
            <Terminal className="h-3.5 w-3.5" />
            Open Terminal
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isStopped && onResume && (
            <DropdownMenuItem onClick={onResume} className="gap-2">
              <Play className="h-3.5 w-3.5" />
              Resume
            </DropdownMenuItem>
          )}
          {isRunning && onStop && (
            <DropdownMenuItem onClick={onStop} className="gap-2">
              <Square className="h-3.5 w-3.5" />
              Stop
            </DropdownMenuItem>
          )}
          {isRunning && onKill && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setKillConfirmOpen(true)}
                className="gap-2 text-[var(--status-error)]"
              >
                <Skull className="h-3.5 w-3.5" />
                Force Kill
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={killConfirmOpen}
        onOpenChange={setKillConfirmOpen}
        title="Force Kill Agent"
        description="This will forcefully terminate the agent process. Any unsaved work will be lost."
        confirmLabel="Kill"
        variant="destructive"
        onConfirm={() => {
          onKill?.();
          setKillConfirmOpen(false);
        }}
      />
    </>
  );
}
