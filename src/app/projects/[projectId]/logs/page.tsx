"use client";

import { useParams } from "next/navigation";
import { useLogs } from "@/lib/api/hooks";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/empty-state";
import { ScrollText } from "lucide-react";
import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils/cn";

const levelColors: Record<string, string> = {
  info: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  warn: "bg-[var(--status-thinking)]/20 text-[var(--status-thinking)]",
  error: "bg-[var(--status-error)]/20 text-[var(--status-error)]",
  debug: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  tool_use: "bg-[var(--primary)]/20 text-[var(--primary)]",
  tool_result: "bg-[var(--secondary)]/20 text-[var(--secondary)]",
};

export default function LogsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { data: logs, isLoading } = useLogs(projectId);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (!logs) return [];
    let result = logs;
    if (levelFilter !== "all") {
      result = result.filter((l) => l.level === levelFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((l) => l.message.toLowerCase().includes(q));
    }
    return result;
  }, [logs, search, levelFilter]);

  if (isLoading) return <div className="p-6">Loading logs...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-[var(--border)]">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search logs..."
          className="max-w-xs h-8 text-xs"
        />
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="All levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warn">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="debug">Debug</SelectItem>
            <SelectItem value="tool_use">Tool Use</SelectItem>
            <SelectItem value="tool_result">Tool Result</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-[var(--muted-foreground)] ml-auto">
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No logs"
          description={search || levelFilter !== "all" ? "No logs match your filters." : "Logs will appear here when your agents start working."}
        />
      ) : (
        <ScrollArea className="flex-1">
          <div className="divide-y divide-[var(--border)]">
            {filtered.map((log) => (
              <div key={log.id} className="flex gap-3 px-4 py-2.5 hover:bg-[var(--muted)]/50 transition-colors">
                <Badge
                  variant="outline"
                  className={cn("text-[10px] h-5 px-1.5 shrink-0 mt-0.5", levelColors[log.level])}
                >
                  {log.level}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono whitespace-pre-wrap break-all">
                    {log.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {log.agentId && (
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        Agent: {log.agentId.slice(-6)}
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
