import { Prisma, prisma } from '@tpmjs/db';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';

import { logActivity } from '~/lib/activity';
import { authenticateRequest } from '~/lib/api-keys/middleware';
import {
  apiConflict,
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

const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  triggerType: z.enum(['MANUAL', 'WEBHOOK', 'SCHEDULE']).optional(),
  triggerConfig: z.record(z.string(), z.unknown()).optional().nullable(),
  envVars: z.record(z.string(), z.unknown()).optional().nullable(),
});

/**
 * GET /api/workflows/[id]
 * Get a single workflow with its nodes and edges
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const authResult = await authenticateRequest();
    if (!authResult.authenticated || !authResult.userId) {
      return apiUnauthorized('Authentication required', requestId);
    }

    const { id } = await context.params;

    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        nodes: {
          orderBy: { createdAt: 'asc' },
          include: {
            tool: {
              select: {
                id: true,
                name: true,
                description: true,
                inputSchema: true,
                package: {
                  select: {
                    npmPackageName: true,
                    category: true,
                  },
                },
              },
            },
            agent: {
              select: {
                id: true,
                uid: true,
                name: true,
                description: true,
                provider: true,
                modelId: true,
              },
            },
          },
        },
        edges: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            nodes: true,
            edges: true,
            executions: true,
          },
        },
      },
    });

    if (!workflow) {
      return apiNotFound('Workflow', requestId);
    }

    if (workflow.userId !== authResult.userId) {
      return apiForbidden('Access denied', requestId);
    }

    return apiSuccess(
      {
        ...workflow,
        nodeCount: workflow._count.nodes,
        edgeCount: workflow._count.edges,
        executionCount: workflow._count.executions,
        _count: undefined,
      },
      { requestId }
    );
  } catch (error) {
    console.error('Failed to get workflow:', error);
    return apiInternalError('Failed to get workflow', requestId);
  }
}

/**
 * PATCH /api/workflows/[id]
 * Update workflow metadata
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const authResult = await authenticateRequest();
    if (!authResult.authenticated || !authResult.userId) {
      return apiUnauthorized('Authentication required', requestId);
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = UpdateWorkflowSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(
        'Invalid request body',
        { errors: parsed.error.flatten().fieldErrors },
        requestId
      );
    }

    // Check ownership
    const existing = await prisma.workflow.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) {
      return apiNotFound('Workflow', requestId);
    }
    if (existing.userId !== authResult.userId) {
      return apiForbidden('Access denied', requestId);
    }

    // Check name uniqueness if being changed
    if (parsed.data.name) {
      const existingByName = await prisma.workflow.findFirst({
        where: { userId: authResult.userId, name: parsed.data.name, id: { not: id } },
      });
      if (existingByName) {
        return apiConflict('A workflow with this name already exists', requestId);
      }
    }

    // Build update data
    const { triggerConfig, envVars, ...restData } = parsed.data;
    const updateData: Prisma.WorkflowUpdateInput = {
      ...restData,
      ...(triggerConfig !== undefined && {
        triggerConfig:
          triggerConfig === null ? Prisma.JsonNull : (triggerConfig as Prisma.InputJsonValue),
      }),
      ...(envVars !== undefined && {
        envVars: envVars === null ? Prisma.JsonNull : (envVars as Prisma.InputJsonValue),
      }),
    };

    const workflow = await prisma.workflow.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        uid: true,
        name: true,
        description: true,
        status: true,
        triggerType: true,
        triggerConfig: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log activity (fire-and-forget)
    logActivity({
      userId: authResult.userId,
      type: 'WORKFLOW_UPDATED',
      targetName: workflow.name,
      targetType: 'workflow',
    });

    return apiSuccess(workflow, { requestId });
  } catch (error) {
    console.error('Failed to update workflow:', error);
    return apiInternalError('Failed to update workflow', requestId);
  }
}

/**
 * DELETE /api/workflows/[id]
 * Delete a workflow and all its nodes, edges, and executions (cascade)
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const authResult = await authenticateRequest();
    if (!authResult.authenticated || !authResult.userId) {
      return apiUnauthorized('Authentication required', requestId);
    }

    const { id } = await context.params;

    // Check ownership and get name for activity log
    const existing = await prisma.workflow.findUnique({
      where: { id },
      select: { userId: true, name: true },
    });
    if (!existing) {
      return apiNotFound('Workflow', requestId);
    }
    if (existing.userId !== authResult.userId) {
      return apiForbidden('Access denied', requestId);
    }

    await prisma.workflow.delete({ where: { id } });

    // Log activity (fire-and-forget)
    logActivity({
      userId: authResult.userId,
      type: 'WORKFLOW_DELETED',
      targetName: existing.name,
      targetType: 'workflow',
    });

    return apiSuccess({ deleted: true }, { requestId });
  } catch (error) {
    console.error('Failed to delete workflow:', error);
    return apiInternalError('Failed to delete workflow', requestId);
  }
}
