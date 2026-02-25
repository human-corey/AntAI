"use client";

import { useState } from "react";
import type { TranscriptEntry } from "@/lib/claude/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TranscriptToolResultProps {
  entry: TranscriptEntry;
}

export function TranscriptToolResult({ entry }: TranscriptToolResultProps) {
  const result = entry.toolResult || "";
  const isLong = result.length > 200;
  const [open, setOpen] = useState(false);

  if (!isLong) {
    return (
      <div className="ml-5 border-l-2 border-[var(--border)] pl-3">
        <div className="flex items-center gap-1.5 text-[0.65rem] text-[var(--muted-foreground)]">
          <CheckCircle className="h-2.5 w-2.5 text-green-500" />
          <span>Result</span>
        </div>
        <pre className="mt-0.5 text-[0.65rem] text-[var(--muted-foreground)] font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
          {result}
        </pre>
      </div>
    );
  }

  return (
    <div className="ml-5 border-l-2 border-[var(--border)] pl-3">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center gap-1.5 text-[0.65rem] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <CheckCircle className="h-2.5 w-2.5 text-green-500" />
          <span>Result ({result.length} chars)</span>
          <ChevronRight
            className={cn("h-2.5 w-2.5 transition-transform", open && "rotate-90")}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <pre className="mt-0.5 text-[0.65rem] text-[var(--muted-foreground)] font-mono whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
            {result}
          </pre>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
