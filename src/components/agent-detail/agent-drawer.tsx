"use client";

import dynamic from "next/dynamic";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentHeader } from "./agent-header";
import { AgentLogs } from "./agent-logs";

const AgentTerminal = dynamic(
  () => import("./agent-terminal").then((m) => m.AgentTerminal),
  {
    ssr: false,
    loading: () => (
      <div className="h-full bg-[#121210]" />
    ),
  }
);
import { AgentTasks } from "./agent-tasks";
import { AgentChat } from "./agent-chat";
import { useUiStore } from "@/stores/ui-store";
import { useAgentStore } from "@/stores/agent-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { Terminal, ScrollText, ListTodo, MessageSquare } from "lucide-react";
import type { AgentNodeData } from "@/lib/types";

export function AgentDrawer() {
  const { drawerOpen, drawerAgentId, closeDrawer } = useUiStore();
  const { agents } = useAgentStore();
  const { nodes } = useCanvasStore();

  const agent = drawerAgentId ? agents[drawerAgentId] : null;

  // Try to get agent data from canvas nodes (for demo/static data)
  const canvasAgent = drawerAgentId
    ? (() => {
        const node = nodes.find((n) => n.id === drawerAgentId);
        if (node?.data) {
          const nodeData = node.data as unknown as AgentNodeData;
          return nodeData.agent;
        }
        return null;
      })()
    : null;

  // If we have no agent data yet, show a minimal placeholder
  const placeholderAgent = drawerAgentId
    ? {
        id: drawerAgentId,
        teamId: "",
        name: `Agent ${drawerAgentId.slice(-6)}`,
        role: "teammate",
        model: "claude-sonnet-4-6",
        status: "idle" as const,
        isLead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    : null;

  const displayAgent = agent || canvasAgent || placeholderAgent;

  return (
    <Sheet open={drawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent
        side="right"
        className="w-[480px] sm:w-[540px] p-0 flex flex-col bg-[var(--card)]"
        showCloseButton={false}
      >
        <SheetTitle className="sr-only">
          {displayAgent ? displayAgent.name : "Agent Details"}
        </SheetTitle>
        {displayAgent && (
          <>
            <AgentHeader agent={displayAgent} onClose={closeDrawer} />

            <Tabs defaultValue="terminal" className="flex-1 flex flex-col min-h-0">
              <TabsList className="mx-4 mt-2 bg-[var(--muted)]">
                <TabsTrigger value="terminal" className="gap-1.5 text-xs">
                  <Terminal className="h-3 w-3" />
                  Terminal
                </TabsTrigger>
                <TabsTrigger value="logs" className="gap-1.5 text-xs">
                  <ScrollText className="h-3 w-3" />
                  Logs
                </TabsTrigger>
                <TabsTrigger value="tasks" className="gap-1.5 text-xs">
                  <ListTodo className="h-3 w-3" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="chat" className="gap-1.5 text-xs">
                  <MessageSquare className="h-3 w-3" />
                  Chat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="terminal" className="flex-1 min-h-0 m-0 mt-2">
                <AgentTerminal agentId={displayAgent.id} />
              </TabsContent>
              <TabsContent value="logs" className="flex-1 min-h-0 m-0">
                <AgentLogs agentId={displayAgent.id} />
              </TabsContent>
              <TabsContent value="tasks" className="flex-1 min-h-0 m-0">
                <AgentTasks agentId={displayAgent.id} />
              </TabsContent>
              <TabsContent value="chat" className="flex-1 min-h-0 m-0">
                <AgentChat agentId={displayAgent.id} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
