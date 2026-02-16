/**
 * Workflow Execution Engine
 *
 * Executes a workflow by:
 * 1. Loading the workflow with nodes and edges
 * 2. Topological sorting to determine execution order
 * 3. Executing nodes level-by-level (parallel within each level)
 * 4. Resolving data mappings between nodes
 */

import { prisma } from '@tpmjs/db';
import { resolveParams } from './data-mapping';
import { executeAgent } from './node-executors/agent';
import { executeCondition } from './node-executors/condition';
import { executeLoop } from './node-executors/loop';
import { executeOutput } from './node-executors/output';
import { executeTool } from './node-executors/tool';
import { executeTransform } from './node-executors/transform';
import { executeTrigger } from './node-executors/trigger';
import { getUpstreamNodes, topologicalSort } from './topological-sort';

export interface WorkflowExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
}

type NodeStatusCallback = (
  nodeId: string,
  status: 'running' | 'completed' | 'failed' | 'skipped',
  output?: unknown,
  error?: string
) => void;

interface WorkflowNode {
  id: string;
  nodeId: string;
  type: string;
  label: string;
  config: Record<string, unknown> | null;
  toolId: string | null;
  agentId: string | null;
}

interface WorkflowEdge {
  id: string;
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceNode: { nodeId: string };
  targetNode: { nodeId: string };
  sourceHandle: string | null;
  targetHandle: string | null;
  dataMapping: Record<string, unknown> | null;
}

export async function executeWorkflow(
  workflowId: string,
  triggerInput: Record<string, unknown>,
  _userId: string,
  onNodeStatus: NodeStatusCallback
): Promise<WorkflowExecutionResult> {
  try {
    // Load the workflow with all nodes and edges
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        nodes: true,
        edges: {
          include: {
            sourceNode: { select: { nodeId: true } },
            targetNode: { select: { nodeId: true } },
          },
        },
      },
    });

    if (!workflow) {
      return { success: false, error: 'Workflow not found' };
    }

    if (workflow.nodes.length === 0) {
      return { success: false, error: 'Workflow has no nodes' };
    }

    // Build a map from DB node records using their React Flow nodeId
    const nodeMap = new Map<string, WorkflowNode>();
    for (const node of workflow.nodes) {
      nodeMap.set(node.nodeId, {
        id: node.id,
        nodeId: node.nodeId,
        type: node.type,
        label: node.label,
        config: node.config as Record<string, unknown> | null,
        toolId: node.toolId,
        agentId: node.agentId,
      });
    }

    // Build edges using React Flow nodeIds
    const rfEdges = (workflow.edges as unknown as WorkflowEdge[]).map((e) => ({
      source: e.sourceNode.nodeId,
      target: e.targetNode.nodeId,
      sourceHandle: e.sourceHandle,
    }));

    // Topological sort
    const sortedNodes = Array.from(nodeMap.values()).map((n) => ({
      id: n.nodeId,
    }));
    const levels = topologicalSort(sortedNodes, rfEdges);

    // Execution context: maps nodeId -> output
    const context = new Map<string, unknown>();

    // Track which branches are active (for condition nodes)
    const activeBranches = new Map<string, string>();

    let finalOutput: unknown;

    // Execute level by level
    for (const level of levels) {
      await Promise.all(
        level.map(async (nodeId) => {
          const node = nodeMap.get(nodeId);
          if (!node) return;

          // Check if this node should be skipped (condition branch routing)
          const upstreamEdges = rfEdges.filter((e) => e.target === nodeId);
          const shouldSkip = upstreamEdges.some((edge) => {
            if (!edge.sourceHandle) return false;
            const activeBranch = activeBranches.get(edge.source);
            return activeBranch !== undefined && activeBranch !== edge.sourceHandle;
          });

          if (shouldSkip) {
            onNodeStatus(nodeId, 'skipped');
            return;
          }

          onNodeStatus(nodeId, 'running');

          try {
            // Resolve input from upstream nodes
            const upstreamNodes = getUpstreamNodes(nodeId, rfEdges);
            let input: unknown;

            if (upstreamNodes.length === 1) {
              input = context.get(upstreamNodes[0]!.sourceId);
            } else if (upstreamNodes.length > 1) {
              // Merge multiple upstream outputs
              const merged: Record<string, unknown> = {};
              for (const upstream of upstreamNodes) {
                merged[upstream.sourceId] = context.get(upstream.sourceId);
              }
              input = merged;
            } else if (node.type === 'TRIGGER') {
              input = triggerInput;
            }

            // Resolve config params with template expressions
            const config = node.config || {};
            const resolvedConfig =
              config && typeof config === 'object' ? resolveParams(config, context, input) : config;

            // Execute the node based on type
            let output: unknown;
            switch (node.type) {
              case 'TRIGGER':
                output = await executeTrigger(resolvedConfig, input);
                break;
              case 'TOOL':
                if (!node.toolId) throw new Error('Tool node has no tool configured');
                output = await executeTool(resolvedConfig, input, node.toolId);
                break;
              case 'AGENT':
                if (!node.agentId) throw new Error('Agent node has no agent configured');
                output = await executeAgent(resolvedConfig, input, node.agentId);
                break;
              case 'CONDITION': {
                const condResult = await executeCondition(resolvedConfig, input);
                output = condResult;
                activeBranches.set(nodeId, condResult.branch);
                break;
              }
              case 'LOOP':
                output = await executeLoop(resolvedConfig, input);
                break;
              case 'TRANSFORM':
                output = await executeTransform(resolvedConfig, input);
                break;
              case 'OUTPUT':
                output = await executeOutput(resolvedConfig, input);
                finalOutput = output;
                break;
              case 'NOTE':
                // Notes don't execute
                output = input;
                break;
              default:
                throw new Error(`Unknown node type: ${node.type}`);
            }

            context.set(nodeId, output);
            onNodeStatus(nodeId, 'completed', output);
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            onNodeStatus(nodeId, 'failed', undefined, errorMessage);
            throw err;
          }
        })
      );
    }

    return {
      success: true,
      output: finalOutput ?? context.get(Array.from(context.keys()).pop() || ''),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
