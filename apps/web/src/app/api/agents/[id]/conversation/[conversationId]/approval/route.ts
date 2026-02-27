/**
 * Tool Approval Endpoint
 *
 * POST: Submit an approval decision (approve/deny) for a pending tool call.
 * Used when a tool has "ask" permission and the user must confirm execution.
 */

import { prisma } from '@tpmjs/db';
import type { NextRequest } from 'next/server';
import { authenticateRequest } from '~/lib/api-keys/middleware';
import {
  apiError,
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  apiUnauthorized,
} from '~/lib/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string; conversationId: string }>;
};

/**
 * POST /api/agents/[id]/conversation/[conversationId]/approval
 * Submit an approval decision
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const authResult = await authenticateRequest();
    if (!authResult.authenticated || !authResult.userId) {
      return apiUnauthorized('Authentication required', requestId);
    }

    const { id: agentId } = await context.params;
    const body = await request.json();

    const { approvalId, decision } = body as { approvalId?: string; decision?: string };

    if (!approvalId || typeof approvalId !== 'string') {
      return apiError('BAD_REQUEST', 'approvalId is required', { requestId, status: 400 });
    }
    if (decision !== 'approve' && decision !== 'deny') {
      return apiError('BAD_REQUEST', 'decision must be "approve" or "deny"', {
        requestId,
        status: 400,
      });
    }

    // Fetch the approval and verify ownership via agent
    const approval = await prisma.toolApproval.findUnique({
      where: { id: approvalId },
      include: {
        conversation: {
          include: {
            agent: { select: { id: true, userId: true } },
          },
        },
      },
    });

    if (!approval) {
      return apiNotFound('Approval', requestId);
    }

    // Verify the agent matches
    if (approval.conversation.agent.id !== agentId) {
      return apiNotFound('Approval', requestId);
    }

    // Verify the user owns this agent
    if (approval.conversation.agent.userId !== authResult.userId) {
      return apiForbidden('Access denied', requestId);
    }

    // Check if already resolved
    if (approval.decision !== null) {
      return apiError('BAD_REQUEST', 'Approval already resolved', { requestId, status: 400 });
    }

    // Update the approval
    const updated = await prisma.toolApproval.update({
      where: { id: approvalId },
      data: {
        decision,
        resolvedAt: new Date(),
      },
    });

    return apiSuccess(
      {
        approvalId: updated.id,
        decision: updated.decision,
        resolvedAt: updated.resolvedAt,
      },
      { requestId }
    );
  } catch (error) {
    console.error('Failed to process approval:', error);
    return apiInternalError('Failed to process approval', requestId);
  }
}
