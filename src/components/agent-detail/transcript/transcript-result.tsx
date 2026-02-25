import type { TranscriptEntry } from "@/lib/claude/types";
import { CheckCircle2, XCircle, DollarSign, RotateCw, Hash } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TranscriptResultProps {
  entry: TranscriptEntry;
}

export function TranscriptResult({ entry }: TranscriptResultProps) {
  const isError = entry.isError;

  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 text-xs",
        isError
          ? "border-red-500/30 bg-red-500/5"
          : "border-green-500/30 bg-green-500/5"
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {isError ? (
          <XCircle className="h-3.5 w-3.5 text-red-400" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
        )}
        <span className="font-medium text-[var(--foreground)]">
          {isError ? "Completed with error" : "Completed"}
        </span>
      </div>
      <div className="flex flex-wrap gap-3 text-[0.65rem] text-[var(--muted-foreground)]">
        {entry.sessionId && (
          <span className="flex items-center gap-1">
            <Hash className="h-2.5 w-2.5" />
            {entry.sessionId.slice(0, 8)}...
          </span>
        )}
        {entry.costUsd != null && (
          <span className="flex items-center gap-1">
            <DollarSign className="h-2.5 w-2.5" />
            ${entry.costUsd.toFixed(4)}
          </span>
        )}
        {entry.numTurns != null && (
          <span className="flex items-center gap-1">
            <RotateCw className="h-2.5 w-2.5" />
            {entry.numTurns} turns
          </span>
        )}
      </div>
    </div>
  );
}
