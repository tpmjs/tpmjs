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
  params: Promise<{ id: string }>;
};

/**
 * GET /api/workflows/[id]/executions
 * List execution history for a workflow
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const authResult = await authenticateRequest();
    if (!authResult.authenticated || !authResult.userId) {
      return apiUnauthorized('Authentication required', requestId);
    }

    const { id } = await context.params;

    // Check ownership
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

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10);

    const executions = await prisma.workflowExecution.findMany({
      where: { workflowId: id },
      select: {
        id: true,
        status: true,
        triggeredBy: true,
        startedAt: true,
        completedAt: true,
        durationMs: true,
        error: true,
        workflowVersion: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip: offset,
    });

    const hasMore = executions.length > limit;
    const data = hasMore ? executions.slice(0, limit) : executions;

    return apiSuccess(data, {
      requestId,
      pagination: { limit, offset, count: data.length, hasMore },
    });
  } catch (error) {
    console.error('Failed to list workflow executions:', error);
    return apiInternalError('Failed to list workflow executions', requestId);
  }
}
