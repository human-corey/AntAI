"use client";

import { useReactFlow } from "@xyflow/react";
import { ZoomIn, ZoomOut, Maximize, Layout, Map } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CanvasControlsProps {
  onAutoLayout: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
}

export function CanvasControls({ onAutoLayout, showMinimap, onToggleMinimap }: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const buttons = [
    { icon: ZoomIn, onClick: () => zoomIn(), title: "Zoom In" },
    { icon: ZoomOut, onClick: () => zoomOut(), title: "Zoom Out" },
    { icon: Maximize, onClick: () => fitView({ padding: 0.2 }), title: "Fit View" },
    { icon: Layout, onClick: onAutoLayout, title: "Auto Layout" },
    { icon: Map, onClick: onToggleMinimap, title: "Toggle Minimap", active: showMinimap },
  ];

  return (
    <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1 shadow-md">
      {buttons.map(({ icon: Icon, onClick, title, active }) => (
        <button
          key={title}
          onClick={onClick}
          title={title}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
            active ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
