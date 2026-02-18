"use client";

import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import type { TunnelEdgeData } from "@/lib/types";

function TunnelEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
}: EdgeProps) {
  const edgeData = data as unknown as TunnelEdgeData | undefined;
  const isActive = edgeData?.isActive ?? false;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isActive ? "var(--edge-active)" : "var(--edge-idle)",
          strokeWidth: isActive ? 2.5 : 1.5,
          strokeDasharray: isActive ? undefined : "6 4",
          ...style,
        }}
        className={isActive ? "animate-edge-dash" : ""}
      />
      {isActive && (
        <>
          <circle r="3" fill="var(--edge-active)">
            <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
          </circle>
          <circle r="3" fill="var(--edge-active)" opacity="0.5">
            <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} begin="0.7s" />
          </circle>
          <circle r="3" fill="var(--edge-active)" opacity="0.3">
            <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} begin="1.4s" />
          </circle>
        </>
      )}
    </>
  );
}

export const TunnelEdge = memo(TunnelEdgeComponent);
