"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { useWs } from "@/providers/websocket-provider";

interface AgentChatProps {
  agentId: string;
}

export function AgentChat({ agentId }: AgentChatProps) {
  const [message, setMessage] = useState("");
  const { send } = useWs();

  const handleSend = () => {
    if (!message.trim()) return;
    send({ type: "terminal:input", agentId, data: message + "\n" });
    setMessage("");
  };

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          <p className="text-xs text-[var(--muted-foreground)]">
            Chat messages with agent {agentId.slice(-6)} will appear here.
          </p>
        </div>
      </ScrollArea>

      <div className="border-t border-[var(--border)] p-3 flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Send a message to this agent..."
          className="text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <Button size="sm" onClick={handleSend} disabled={!message.trim()}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
