"use client";

import { useCallback, useMemo, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  BackgroundVariant,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AgentNode } from "./agent-node";
import { TunnelEdge } from "./tunnel-edge";
import { CanvasControls } from "./canvas-controls";
import { useAutoLayout } from "@/hooks/use-auto-layout";
import { useCanvasStore } from "@/stores/canvas-store";
import { useUiStore } from "@/stores/ui-store";

const nodeTypes = { agent: AgentNode };
const edgeTypes = { tunnel: TunnelEdge };

interface TeamCanvasProps {
  projectId: string;
  nodes: Node[];
  edges: Edge[];
  shouldRelayout: boolean;
}

function TeamCanvasInner({ projectId, nodes: derivedNodes, edges: derivedEdges, shouldRelayout }: TeamCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { getLayoutedElements } = useAutoLayout();
  const { fitView } = useReactFlow();
  const { showMinimap, setShowMinimap, setNodes: syncNodesToStore } = useCanvasStore();
  const { openDrawer } = useUiStore();
  const prevNodeIdsRef = useRef("");

  // Sync derived data into React Flow state
  useEffect(() => {
    const currentIds = derivedNodes.map((n) => n.id).sort().join(",");
    const prevIds = prevNodeIdsRef.current;

    if (currentIds !== prevIds) {
      // Structural change: new agent added or removed — relayout
      const { nodes: layouted, edges: layoutedEdges } = getLayoutedElements(derivedNodes, derivedEdges);
      setNodes(layouted);
      setEdges(layoutedEdges);
      prevNodeIdsRef.current = currentIds;

      // Fit view after layout settles
      setTimeout(() => fitView({ padding: 0.2 }), 50);
    } else {
      // Data-only change: merge new data into existing nodes, preserve positions
      setNodes((prev) =>
        prev.map((node) => {
          const updated = derivedNodes.find((n) => n.id === node.id);
          if (updated) {
            return { ...node, data: updated.data };
          }
          return node;
        })
      );
      setEdges(derivedEdges);
    }
  }, [derivedNodes, derivedEdges, getLayoutedElements, setNodes, setEdges, fitView]);

  // Sync nodes to Zustand store for AgentDrawer access
  useEffect(() => {
    syncNodesToStore(nodes);
  }, [nodes, syncNodesToStore]);

  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [nodes, edges, getLayoutedElements, setNodes, setEdges, fitView]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      openDrawer(node.id);
    },
    [openDrawer]
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: "tunnel",
      animated: false,
    }),
    []
  );

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--border)"
        />
        {showMinimap && (
          <MiniMap
            nodeColor="var(--primary)"
            maskColor="var(--background)"
            style={{ background: "var(--card)" }}
          />
        )}
      </ReactFlow>
      <CanvasControls
        onAutoLayout={handleAutoLayout}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
      />
    </div>
  );
}

export function TeamCanvas(props: TeamCanvasProps) {
  return (
    <ReactFlowProvider>
      <TeamCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
