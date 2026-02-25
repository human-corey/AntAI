import type { TranscriptEntry } from "@/lib/claude/types";
import { AlertCircle } from "lucide-react";

interface TranscriptErrorProps {
  entry: TranscriptEntry;
}

export function TranscriptError({ entry }: TranscriptErrorProps) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs">
      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
      <span className="text-red-300 whitespace-pre-wrap">{entry.content}</span>
    </div>
  );
}
