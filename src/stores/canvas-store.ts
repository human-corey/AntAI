import { create } from "zustand";
import type { Node, Edge, Viewport } from "@xyflow/react";

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  autoLayoutEnabled: boolean;
  showMinimap: boolean;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateNode: (id: string, data: Partial<Node>) => void;
  updateEdge: (id: string, data: Partial<Edge>) => void;
  addNode: (node: Node) => void;
  removeNode: (id: string) => void;
  setViewport: (viewport: Viewport) => void;
  setAutoLayout: (enabled: boolean) => void;
  setShowMinimap: (show: boolean) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  autoLayoutEnabled: true,
  showMinimap: true,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  updateNode: (id, data) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...data } : n)),
    })),
  updateEdge: (id, data) =>
    set((s) => ({
      edges: s.edges.map((e) => (e.id === id ? { ...e, ...data } : e)),
    })),
  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),
  removeNode: (id) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
    })),
  setViewport: (viewport) => set({ viewport }),
  setAutoLayout: (enabled) => set({ autoLayoutEnabled: enabled }),
  setShowMinimap: (show) => set({ showMinimap: show }),
}));
