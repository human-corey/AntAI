import type { TranscriptEntry } from "@/lib/claude/types";
import { ArrowRightLeft, UserPlus } from "lucide-react";

interface TranscriptStatusProps {
  entry: TranscriptEntry;
}

export function TranscriptStatus({ entry }: TranscriptStatusProps) {
  const isSpawned = entry.type === "agent_spawned";

  return (
    <div className="flex items-center justify-center gap-1.5 text-[0.65rem] text-[var(--muted-foreground)] py-0.5">
      {isSpawned ? (
        <>
          <UserPlus className="h-2.5 w-2.5" />
          <span>Agent spawned: {entry.agentName || "unknown"}</span>
        </>
      ) : (
        <>
          <ArrowRightLeft className="h-2.5 w-2.5" />
          <span>Status: {entry.status || "unknown"}</span>
        </>
      )}
    </div>
  );
}
