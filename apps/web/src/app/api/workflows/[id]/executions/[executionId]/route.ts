import { prisma } from '@tpmjs/db';
import type { NextRequest } from 'next/server';

import { authenticateRequest } from '~/lib/api-keys/middleware';
import {
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  apiUnauthorized,
} from '~/lib/api-response';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ id: string; executionId: string }>;
};

/**
 * GET /api/workflows/[id]/executions/[executionId]
 * Get a single execution with all node results
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const authResult = await authenticateRequest();
    if (!authResult.authenticated || !authResult.userId) {
      return apiUnauthorized('Authentication required', requestId);
    }

    const { id, executionId } = await context.params;

    // Check workflow ownership
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!workflow) {
      return apiNotFound('Workflow', requestId);
    }
    if (workflow.userId !== authResult.userId) {
      return apiForbidden('Access denied', requestId);
    }

    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        nodeExecutions: {
          include: {
            node: {
              select: {
                nodeId: true,
                type: true,
                label: true,
              },
            },
          },
          orderBy: { startedAt: 'asc' },
        },
      },
    });

    if (!execution || execution.workflowId !== id) {
      return apiNotFound('Execution', requestId);
    }

    return apiSuccess(execution, { requestId });
  } catch (error) {
    console.error('Failed to get workflow execution:', error);
    return apiInternalError('Failed to get workflow execution', requestId);
  }
}
