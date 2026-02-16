'use client';

import { BaseEdge, type EdgeProps, getBezierPath } from '@xyflow/react';

export function DataEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isAnimated = (data as Record<string, unknown>)?.animated === true;

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        ...style,
        strokeWidth: 2,
        stroke: isAnimated ? '#6366f1' : '#94a3b8',
        strokeDasharray: isAnimated ? '5 5' : undefined,
        animation: isAnimated ? 'dashmove 0.5s linear infinite' : undefined,
      }}
    />
  );
}
