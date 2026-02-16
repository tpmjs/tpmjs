/**
 * Hook to resolve upstream node outputs for data mapping dropdowns
 */

import type { Edge, Node } from '@xyflow/react';
import { useMemo } from 'react';

interface UpstreamOutput {
  nodeId: string;
  label: string;
  type: string;
  paths: string[];
}

/**
 * Given a node ID and the current graph, walks backward through edges
 * to find all upstream nodes and their available output paths.
 */
export function useUpstreamOutputs(
  nodeId: string | null,
  nodes: Node[],
  edges: Edge[]
): UpstreamOutput[] {
  return useMemo(() => {
    if (!nodeId) return [];

    const upstream: UpstreamOutput[] = [];
    const visited = new Set<string>();
    const queue: string[] = [];

    // Find all direct and transitive upstream nodes
    const incomingEdges = edges.filter((e) => e.target === nodeId);
    for (const edge of incomingEdges) {
      if (!visited.has(edge.source)) {
        queue.push(edge.source);
        visited.add(edge.source);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = nodes.find((n) => n.id === current);
      if (!node) continue;

      const type = (node.data?.type as string) || 'unknown';
      const label = (node.data?.label as string) || current;

      // Generate available output paths based on node type
      const paths = getOutputPaths(type, node.data as Record<string, unknown>);

      upstream.push({
        nodeId: current,
        label,
        type,
        paths,
      });

      // Walk further upstream
      const parentEdges = edges.filter((e) => e.target === current);
      for (const edge of parentEdges) {
        if (!visited.has(edge.source)) {
          queue.push(edge.source);
          visited.add(edge.source);
        }
      }
    }

    return upstream;
  }, [nodeId, nodes, edges]);
}

function getOutputPaths(type: string, data: Record<string, unknown> | undefined): string[] {
  switch (type) {
    case 'TRIGGER':
      return ['output', 'output.body', 'output.headers', 'output.query'];
    case 'TOOL':
      return ['output', 'output.result', 'output.error'];
    case 'AGENT':
      return ['output', 'output.text', 'output.toolResults'];
    case 'CONDITION':
      return ['output', 'output.branch', 'output.value'];
    case 'LOOP':
      return ['output', 'output.items', 'output.count'];
    case 'TRANSFORM': {
      const config = data?.config as Record<string, unknown> | undefined;
      const mappings = (config?.mappings as Array<{ key: string }>) || [];
      const basePaths = ['output'];
      for (const m of mappings) {
        if (m.key) basePaths.push(`output.${m.key}`);
      }
      return basePaths;
    }
    default:
      return ['output'];
  }
}

/**
 * Build a template expression for referencing an upstream node's output
 */
export function buildTemplateExpression(nodeId: string, path: string): string {
  return `{{${nodeId}.${path}}}`;
}
