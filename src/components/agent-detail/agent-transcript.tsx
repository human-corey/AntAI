"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranscriptStore } from "@/stores/transcript-store";
import type { TranscriptEntry } from "@/lib/claude/types";
import { TranscriptMessage } from "./transcript/transcript-message";
import { TranscriptToolUse } from "./transcript/transcript-tool-use";
import { TranscriptToolResult } from "./transcript/transcript-tool-result";
import { TranscriptThinking } from "./transcript/transcript-thinking";
import { TranscriptResult } from "./transcript/transcript-result";
import { TranscriptError } from "./transcript/transcript-error";
import { TranscriptStatus } from "./transcript/transcript-status";

function TranscriptEntryRenderer({ entry }: { entry: TranscriptEntry }) {
  switch (entry.type) {
    case "message":
    case "user_message":
      return <TranscriptMessage entry={entry} />;
    case "tool_use":
      return <TranscriptToolUse entry={entry} />;
    case "tool_result":
      return <TranscriptToolResult entry={entry} />;
    case "thinking":
      return <TranscriptThinking entry={entry} />;
    case "result":
      return <TranscriptResult entry={entry} />;
    case "error":
      return <TranscriptError entry={entry} />;
    case "status_change":
    case "agent_spawned":
      return <TranscriptStatus entry={entry} />;
    default:
      return null;
  }
}

const EMPTY_ENTRIES: TranscriptEntry[] = [];

interface AgentTranscriptProps {
  agentId: string;
}

export function AgentTranscript({ agentId }: AgentTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const storeEntries = useTranscriptStore((s) => s.entries[agentId]);
  const entries = storeEntries ?? EMPTY_ENTRIES;

  // Auto-scroll on new entries or streaming content updates
  const lastEntry = entries[entries.length - 1];
  const scrollKey = lastEntry ? `${lastEntry.id}_${(lastEntry.content?.length ?? 0)}` : "";
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length, scrollKey]);

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="p-4 space-y-2">
        {entries.length === 0 && (
          <p className="text-xs text-[var(--muted-foreground)] text-center py-8">
            No output yet. Start the team or send a message to see events here.
          </p>
        )}
        {entries.map((entry) => (
          <TranscriptEntryRenderer key={entry.id} entry={entry} />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
