/**
 * Scenario Run API - Trigger a scenario execution
 *
 * POST /api/scenarios/[id]/run   Execute a scenario
 */

import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '~/lib/api-keys/middleware';
import { checkAndDecrementQuota, executeScenario, getQuotaStatus } from '~/lib/scenarios/execute';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for scenario execution

const API_VERSION = '1.0.0';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    version: string;
    timestamp: string;
    requestId?: string;
  };
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/scenarios/[id]/run
 * Execute a scenario
 *
 * Requires authentication
 * Subject to daily quota limits
 */
export async function POST(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id: scenarioId } = await context.params;

  try {
    // Check authentication
    const authResult = await authenticateRequest();

    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 401 }
      );
    }

    // Check scenario exists
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      include: {
        collection: {
          select: {
            id: true,
            isPublic: true,
            userId: true,
          },
        },
      },
    });

    if (!scenario) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Scenario not found' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 404 }
      );
    }

    // Check access - must be owner or collection must be public
    const isOwner = scenario.collection?.userId === authResult.userId;
    const isPublic = scenario.collection?.isPublic ?? false;

    if (!isOwner && !isPublic) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 403 }
      );
    }

    // Check quota
    const quota = await checkAndDecrementQuota(authResult.userId);

    if (!quota.allowed) {
      const quotaStatus = await getQuotaStatus(authResult.userId);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: 'Daily scenario run quota exceeded. Try again tomorrow.',
            details: {
              used: quotaStatus.used,
              limit: quotaStatus.limit,
              resetsAt: quotaStatus.resetsAt.toISOString(),
            },
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 429 }
      );
    }

    // Execute the scenario
    const { run, success } = await executeScenario(scenario, authResult.userId);

    return NextResponse.json(
      {
        success: true,
        data: {
          runId: run.id,
          status: run.status,
          success,
          evaluator: {
            model: run.evaluatorModel,
            verdict: run.evaluatorVerdict,
            reason: run.evaluatorReason,
          },
          assertions: run.assertionResults,
          usage: {
            inputTokens: run.inputTokens,
            outputTokens: run.outputTokens,
            totalTokens: run.totalTokens,
            executionTimeMs: run.executionTimeMs,
          },
          timestamps: {
            startedAt: run.startedAt,
            completedAt: run.completedAt,
            createdAt: run.createdAt,
          },
          quotaRemaining: quota.remaining,
        },
        meta: {
          version: API_VERSION,
          timestamp: new Date().toISOString(),
          requestId,
          note: 'Execution uses simulated agent. Full agent integration coming soon.',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API Error] POST /api/scenarios/[id]/run:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to execute scenario' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
