"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentHeader } from "./agent-header";
import { AgentLogs } from "./agent-logs";
import { AgentTerminal } from "./agent-terminal";
import { useKillAgent, useResumeAgent } from "@/lib/api/hooks";
import { useParams } from "next/navigation";

import { AgentTasks } from "./agent-tasks";
import { AgentChat } from "./agent-chat";
import { useUiStore } from "@/stores/ui-store";
import { useAgentStore } from "@/stores/agent-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { TerminalSquare, ListTodo, MessageSquare, FileText } from "lucide-react";
import type { AgentNodeData } from "@/lib/types";

export function AgentDrawer() {
  const { drawerOpen, drawerAgentId, closeDrawer } = useUiStore();
  const { agents } = useAgentStore();
  const { nodes } = useCanvasStore();
  const params = useParams();
  const projectId = params.projectId as string;

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

  const killAgent = useKillAgent(
    projectId || "",
    displayAgent?.teamId || "",
    displayAgent?.id || ""
  );
  const resumeAgent = useResumeAgent(
    projectId || "",
    displayAgent?.teamId || "",
    displayAgent?.id || ""
  );

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
            <AgentHeader
              agent={displayAgent}
              onStop={() => killAgent.mutate()}
              onResume={() => resumeAgent.mutate()}
              onClose={closeDrawer}
            />

            <Tabs defaultValue="output" className="flex-1 flex flex-col min-h-0">
              <TabsList className="mx-4 mt-2 bg-[var(--muted)]">
                <TabsTrigger value="output" className="gap-1.5 text-xs">
                  <TerminalSquare className="h-3 w-3" />
                  Terminal
                </TabsTrigger>
                <TabsTrigger value="logs" className="gap-1.5 text-xs">
                  <FileText className="h-3 w-3" />
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

              <TabsContent value="output" className="flex-1 flex flex-col min-h-0 overflow-hidden m-0 mt-2">
                <AgentTerminal agentId={displayAgent.id} teamId={displayAgent.teamId} isLead={displayAgent.isLead} />
              </TabsContent>
              <TabsContent value="logs" className="flex-1 flex flex-col min-h-0 overflow-hidden m-0">
                <AgentLogs agentId={displayAgent.id} />
              </TabsContent>
              <TabsContent value="tasks" className="flex-1 flex flex-col min-h-0 overflow-hidden m-0">
                <AgentTasks agentId={displayAgent.id} />
              </TabsContent>
              <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 overflow-hidden m-0">
                <AgentChat
                  agentId={displayAgent.id}
                  teamId={displayAgent.teamId}
                  projectId={projectId}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
