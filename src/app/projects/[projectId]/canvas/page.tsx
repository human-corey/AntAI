"use client";

import { useParams } from "next/navigation";
import { TeamCanvas } from "@/components/canvas/team-canvas";
import { StartTeamDialog } from "@/components/canvas/start-team-dialog";
import { useCanvasAgents } from "@/hooks/use-canvas-agents";
import { useCanvasSubscriptions } from "@/hooks/use-canvas-subscriptions";
import { Loader2, Users } from "lucide-react";

export default function CanvasPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  useCanvasSubscriptions(projectId);
  const { nodes, edges, isLoading, isEmpty, shouldRelayout } = useCanvasAgents(projectId);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-[var(--muted-foreground)]">
        <Users className="h-12 w-12" />
        <p className="text-sm">Start a team to see agents here</p>
        <StartTeamDialog projectId={projectId} />
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <div className="absolute top-3 right-3 z-10">
        <StartTeamDialog projectId={projectId} />
      </div>
      <TeamCanvas
        projectId={projectId}
        nodes={nodes}
        edges={edges}
        shouldRelayout={shouldRelayout}
      />
    </div>
  );
}
