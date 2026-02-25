"use client";

import { useMemo, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProjectAgents, useReconcileAgents } from "@/lib/api/hooks";
import { useAgentStore } from "@/stores/agent-store";
import { agentToNode, buildEdges } from "@/lib/utils/canvas";
import { queryKeys } from "@/lib/api/query-keys";

export function useCanvasAgents(projectId: string) {
  const { data: dbAgents, isLoading } = useProjectAgents(projectId);
  const agents = useAgentStore((s) => s.agents);
  const setAgents = useAgentStore((s) => s.setAgents);
  const queryClient = useQueryClient();
  const reconcileMutation = useReconcileAgents(projectId);
  const reconciledRef = useRef(false);

  // Seed store from DB whenever we get a fresh fetch with agents
  // (e.g. on mount, on refetch after WS-triggered invalidation)
  const lastSeededCountRef = useRef(-1);
  useEffect(() => {
    if (dbAgents && dbAgents.length > 0 && dbAgents.length !== lastSeededCountRef.current) {
      setAgents(dbAgents);
      lastSeededCountRef.current = dbAgents.length;
    }
  }, [dbAgents, setAgents]);

  // Reconcile stale agent statuses once on mount
  useEffect(() => {
    if (dbAgents && !reconciledRef.current) {
      reconciledRef.current = true;
      reconcileMutation.mutate(undefined, {
        onSuccess: (data) => {
          if (data.reconciled.length > 0) {
            queryClient.invalidateQueries({ queryKey: queryKeys.agents.byProject(projectId) });
          }
        },
      });
    }
  }, [dbAgents]); // eslint-disable-line react-hooks/exhaustive-deps

  const agentsList = useMemo(() => Object.values(agents), [agents]);

  // Track node count changes for relayout
  const prevCountRef = useRef(0);
  const shouldRelayout = agentsList.length !== prevCountRef.current;
  useEffect(() => {
    prevCountRef.current = agentsList.length;
  });

  const nodes = useMemo(() => agentsList.map((a) => agentToNode(a)), [agentsList]);
  const edges = useMemo(() => buildEdges(agentsList), [agentsList]);

  return {
    nodes,
    edges,
    isLoading,
    isEmpty: !isLoading && agentsList.length === 0,
    shouldRelayout,
  };
}
