import { Prisma, prisma } from '@tpmjs/db';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { authenticateRequest } from '~/lib/api-keys/middleware';
import {
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
} from '~/lib/api-response';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ id: string }>;
};

const NodeSchema = z.object({
  nodeId: z.string().max(100),
  type: z.enum(['TRIGGER', 'TOOL', 'AGENT', 'CONDITION', 'LOOP', 'TRANSFORM', 'OUTPUT', 'NOTE']),
  label: z.string().max(200),
  positionX: z.number(),
  positionY: z.number(),
  config: z.record(z.string(), z.unknown()).optional().nullable(),
  toolId: z.string().optional().nullable(),
  agentId: z.string().optional().nullable(),
});

const EdgeSchema = z.object({
  edgeId: z.string().max(100),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  sourceHandle: z.string().max(50).optional().nullable(),
  targetHandle: z.string().max(50).optional().nullable(),
  dataMapping: z.record(z.string(), z.unknown()).optional().nullable(),
});

const SaveGraphSchema = z.object({
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  canvasViewport: z
    .object({
      x: z.number(),
      y: z.number(),
      zoom: z.number(),
    })
    .optional()
    .nullable(),
});

/**
 * PUT /api/workflows/[id]/graph
 * Bulk save all nodes and edges (replace strategy)
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const authResult = await authenticateRequest();
    if (!authResult.authenticated || !authResult.userId) {
      return apiUnauthorized('Authentication required', requestId);
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = SaveGraphSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(
        'Invalid graph data',
        { errors: parsed.error.flatten().fieldErrors },
        requestId
      );
    }

    // Check ownership
    const existing = await prisma.workflow.findUnique({
      where: { id },
      select: { userId: true, version: true },
    });
    if (!existing) {
      return apiNotFound('Workflow', requestId);
    }
    if (existing.userId !== authResult.userId) {
      return apiForbidden('Access denied', requestId);
    }

    const { nodes, edges, canvasViewport } = parsed.data;

    // Transaction: delete all existing nodes/edges, create new ones, increment version
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing edges first (they reference nodes)
      await tx.workflowEdge.deleteMany({ where: { workflowId: id } });
      // Delete existing nodes
      await tx.workflowNode.deleteMany({ where: { workflowId: id } });

      // Create new nodes
      if (nodes.length > 0) {
        await tx.workflowNode.createMany({
          data: nodes.map((node) => ({
            workflowId: id,
            nodeId: node.nodeId,
            type: node.type,
            label: node.label,
            positionX: node.positionX,
            positionY: node.positionY,
            config: node.config ? (node.config as Prisma.InputJsonValue) : Prisma.JsonNull,
            toolId: node.toolId ?? undefined,
            agentId: node.agentId ?? undefined,
          })),
        });
      }

      // Look up created node IDs for edge foreign keys
      const createdNodes = await tx.workflowNode.findMany({
        where: { workflowId: id },
        select: { id: true, nodeId: true },
      });
      const nodeIdMap = new Map(createdNodes.map((n) => [n.nodeId, n.id]));

      // Create new edges
      if (edges.length > 0) {
        const edgeData = edges
          .map((edge) => {
            const sourceId = nodeIdMap.get(edge.sourceNodeId);
            const targetId = nodeIdMap.get(edge.targetNodeId);
            if (!sourceId || !targetId) return null;
            return {
              workflowId: id,
              edgeId: edge.edgeId,
              sourceNodeId: sourceId,
              targetNodeId: targetId,
              sourceHandle: edge.sourceHandle ?? undefined,
              targetHandle: edge.targetHandle ?? undefined,
              dataMapping: edge.dataMapping
                ? (edge.dataMapping as Prisma.InputJsonValue)
                : Prisma.JsonNull,
            };
          })
          .filter((e): e is NonNullable<typeof e> => e !== null);

        if (edgeData.length > 0) {
          await tx.workflowEdge.createMany({ data: edgeData });
        }
      }

      // Update workflow version and canvas viewport
      const updated = await tx.workflow.update({
        where: { id },
        data: {
          version: existing.version + 1,
          canvasViewport: canvasViewport
            ? (canvasViewport as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
        select: {
          id: true,
          version: true,
          updatedAt: true,
        },
      });

      return updated;
    });

    return apiSuccess(
      {
        ...result,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
      { requestId }
    );
  } catch (error) {
    console.error('Failed to save workflow graph:', error);
    return apiInternalError('Failed to save workflow graph', requestId);
  }
}
