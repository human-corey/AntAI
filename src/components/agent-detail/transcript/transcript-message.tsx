import ReactMarkdown from "react-markdown";
import type { TranscriptEntry } from "@/lib/claude/types";
import { cn } from "@/lib/utils/cn";
import { User, Bot } from "lucide-react";

interface TranscriptMessageProps {
  entry: TranscriptEntry;
}

export function TranscriptMessage({ entry }: TranscriptMessageProps) {
  const isUser = entry.type === "user_message";

  return (
    <div className={cn("flex gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
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
            : "bg-[var(--muted)] text-[var(--foreground)]"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{entry.content}</p>
        ) : (
          <div className="prose prose-xs prose-invert max-w-none [&_p]:my-1 [&_pre]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_code]:text-[0.7rem] [&_pre]:text-[0.7rem] [&_p]:text-xs">
            <ReactMarkdown>{entry.content || ""}</ReactMarkdown>
            {entry.isStreaming && (
              <span className="inline-block w-2 h-3.5 bg-[var(--foreground)] opacity-70 animate-pulse ml-0.5 -mb-0.5" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
