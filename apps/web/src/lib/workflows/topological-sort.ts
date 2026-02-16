/**
 * Topological sort using Kahn's algorithm
 * Returns nodes grouped by execution level (same-level = can run in parallel)
 */

interface GraphNode {
  id: string;
  [key: string]: unknown;
}

interface GraphEdge {
  source: string;
  target: string;
  sourceHandle?: string | null;
}

export function topologicalSort(nodes: GraphNode[], edges: GraphEdge[]): string[][] {
  // Build adjacency list and in-degree map
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    const targets = adjacency.get(edge.source);
    if (targets) {
      targets.push(edge.target);
    }
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  // Find all nodes with in-degree 0 (starting nodes)
  const levels: string[][] = [];
  let currentLevel = nodes.filter((n) => (inDegree.get(n.id) || 0) === 0).map((n) => n.id);

  while (currentLevel.length > 0) {
    levels.push(currentLevel);

    const nextLevel: string[] = [];
    for (const nodeId of currentLevel) {
      for (const neighbor of adjacency.get(nodeId) || []) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          nextLevel.push(neighbor);
        }
      }
    }

    currentLevel = nextLevel;
  }

  // Check for cycles
  const sortedCount = levels.reduce((sum, level) => sum + level.length, 0);
  if (sortedCount !== nodes.length) {
    throw new Error('Workflow contains a cycle - cannot determine execution order');
  }

  return levels;
}

/**
 * Get upstream nodes for a given node
 */
export function getUpstreamNodes(
  nodeId: string,
  edges: GraphEdge[]
): Array<{ sourceId: string; sourceHandle?: string | null }> {
  return edges
    .filter((e) => e.target === nodeId)
    .map((e) => ({ sourceId: e.source, sourceHandle: e.sourceHandle }));
}
