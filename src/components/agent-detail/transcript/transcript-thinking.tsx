"use client";

import { useState } from "react";
import type { TranscriptEntry } from "@/lib/claude/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Brain, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TranscriptThinkingProps {
  entry: TranscriptEntry;
}

export function TranscriptThinking({ entry }: TranscriptThinkingProps) {
  const [open, setOpen] = useState(false);
  const content = entry.content || "";
  const hasContent = content.length > 0 && content !== "Thinking" && content !== "thinking...";
  const preview = content.length > 80 ? content.slice(0, 80) + "..." : content;

  if (!hasContent || (entry.isStreaming && content.length === 0)) {
    return (
      <div className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-[var(--muted-foreground)]">
        <Brain className="h-3 w-3 animate-pulse text-purple-400" />
        <span className="italic opacity-70">Thinking...</span>
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md border border-purple-500/20 bg-purple-500/5 px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:bg-purple-500/10 transition-colors">
        <Brain className={cn("h-3 w-3 shrink-0 text-purple-400", entry.isStreaming && "animate-pulse")} />
        <span className="font-medium text-purple-300">
          {entry.isStreaming ? "Thinking..." : "Thinking"}
        </span>
        {!open && (
          <span className="truncate opacity-50 ml-1 italic">{preview}</span>
        )}
        <ChevronRight
          className={cn(
            "ml-auto h-3 w-3 shrink-0 transition-transform",
            open && "rotate-90"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="mt-1 rounded-md border border-purple-500/20 bg-purple-500/5 p-3 text-[0.65rem] leading-relaxed text-[var(--muted-foreground)] overflow-x-auto max-h-80 overflow-y-auto font-mono whitespace-pre-wrap break-words italic">
          {content}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}
