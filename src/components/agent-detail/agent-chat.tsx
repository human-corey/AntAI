"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, User, Bot } from "lucide-react";
import { useWs } from "@/providers/websocket-provider";
import { useTranscriptStore } from "@/stores/transcript-store";
import { useAgentMessages } from "@/lib/api/hooks";
import type { TranscriptEntry } from "@/lib/claude/types";
import { cn } from "@/lib/utils/cn";
import ReactMarkdown from "react-markdown";
import { createClientLogger } from "@/lib/client-logger";

const log = createClientLogger("AgentChat");
const EMPTY_ENTRIES: TranscriptEntry[] = [];
const CHAT_TYPES = new Set(["message", "user_message", "error", "result"]);

interface AgentChatProps {
  agentId: string;
  teamId: string;
  projectId: string;
}

export function AgentChat({ agentId, teamId, projectId }: AgentChatProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const seededRef = useRef(false);
  const { send } = useWs();

  // Hydrate transcript store from DB on mount (once per agent)
  const { data: historicalMessages } = useAgentMessages(projectId, agentId);
  useEffect(() => {
    if (historicalMessages && historicalMessages.length > 0 && !seededRef.current) {
      seededRef.current = true;
      useTranscriptStore.getState().seedEntries(agentId, historicalMessages);
    }
  }, [historicalMessages, agentId]);

  const allEntries = useTranscriptStore((s) => s.entries[agentId]) ?? EMPTY_ENTRIES;
  const chatEntries = allEntries.filter((e) => CHAT_TYPES.has(e.type));

  // Reset sending state when an agent response arrives (new entry or streaming update)
  useEffect(() => {
    if (!sending) return;
    const lastEntry = chatEntries[chatEntries.length - 1];
    // Reset sending if a new non-user entry appeared, or count increased
    if (chatEntries.length > prevCountRef.current) {
      if (lastEntry && lastEntry.type !== "user_message") {
        setSending(false);
      }
    }
    prevCountRef.current = chatEntries.length;
  }, [chatEntries.length, sending, chatEntries]);

  const handleSend = () => {
    const text = message.trim();
    if (!text || sending) return;

    log.info("Sending via WebSocket", { agentId, contentLen: text.length });
    setSending(true);
    setMessage("");

    send({
      type: "chat:send",
      agentId,
      teamId,
      projectId,
      message: text,
    });
  };

  // Auto-scroll on new entries or streaming content updates
  const lastEntry = chatEntries[chatEntries.length - 1];
  const scrollKey = lastEntry ? `${lastEntry.id}_${lastEntry.content?.length ?? 0}` : "";
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [scrollKey]);

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-3">
          {chatEntries.length === 0 && (
            <p className="text-xs text-[var(--muted-foreground)]">
              Send a message to this agent. If the agent is idle, it will resume
              automatically.
            </p>
          )}
          {chatEntries.map((entry) => {
            const isUser = entry.type === "user_message";
            const isError = entry.type === "error";
            const isResult = entry.type === "result";

            if (isResult) {
              return (
                <div
                  key={entry.id}
                  className="text-center text-[0.65rem] text-[var(--muted-foreground)] py-1"
                >
                  Session complete
                  {entry.costUsd != null && ` · $${entry.costUsd.toFixed(4)}`}
                  {entry.numTurns != null && ` · ${entry.numTurns} turns`}
                </div>
              );
            }

            return (
              <div
                key={entry.id}
                className={cn("flex gap-2", isUser ? "flex-row-reverse" : "flex-row")}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    isUser
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                  )}
                >
                  {isUser ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                </div>
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-xs max-w-[85%]",
                    isUser
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : isError
                        ? "bg-red-500/10 border border-red-500/30 text-red-300"
                        : "bg-[var(--muted)] text-[var(--foreground)]"
                  )}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{entry.content}</p>
                  ) : (
                    <div className="prose prose-xs prose-invert max-w-none [&_p]:my-1 [&_pre]:my-1 [&_code]:text-[0.7rem] [&_p]:text-xs">
                      <ReactMarkdown>{entry.content || ""}</ReactMarkdown>
                      {entry.isStreaming && (
                        <span className="inline-block w-1.5 h-3 bg-[var(--foreground)] opacity-70 animate-pulse ml-0.5" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-[var(--border)] p-3 flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Send a message to this agent..."
          className="text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) handleSend();
          }}
          disabled={sending}
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!message.trim() || sending}
        >
          {sending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
