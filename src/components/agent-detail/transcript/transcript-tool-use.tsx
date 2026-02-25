"use client";

import { useState } from "react";
import type { TranscriptEntry } from "@/lib/claude/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Wrench, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TranscriptToolUseProps {
  entry: TranscriptEntry;
}

export function TranscriptToolUse({ entry }: TranscriptToolUseProps) {
  const [open, setOpen] = useState(false);

  const inputPreview = entry.toolInput
    ? entry.toolInput.length > 120
      ? entry.toolInput.slice(0, 120) + "..."
      : entry.toolInput
    : null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--muted)]/50 px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors">
        <Wrench className="h-3 w-3 shrink-0 text-[var(--chart-4)]" />
        <span className="font-mono font-medium text-[var(--foreground)]">{entry.tool || "unknown"}</span>
        {!open && inputPreview && (
          <span className="truncate opacity-60 ml-1">{inputPreview}</span>
        )}
        <ChevronRight
          className={cn(
            "ml-auto h-3 w-3 shrink-0 transition-transform",
            open && "rotate-90"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        {entry.toolInput && (
          <pre className="mt-1 rounded-md border border-[var(--border)] bg-[var(--card)] p-2 text-[0.65rem] leading-relaxed text-[var(--muted-foreground)] overflow-x-auto max-h-60 overflow-y-auto font-mono whitespace-pre-wrap break-all">
            {entry.toolInput}
          </pre>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
