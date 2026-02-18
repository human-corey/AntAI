"use client";

import { useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
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
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

function TeamCanvasInner({ initialNodes = [], initialEdges = [] }: TeamCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { getLayoutedElements } = useAutoLayout();
  const { showMinimap, setShowMinimap, setNodes: syncNodesToStore } = useCanvasStore();
  const { openDrawer } = useUiStore();

  // Sync nodes to Zustand store so other components (like AgentDrawer) can access them
  useEffect(() => {
    syncNodesToStore(nodes);
  }, [nodes, syncNodesToStore]);

  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [nodes, edges, getLayoutedElements, setNodes, setEdges]);

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
