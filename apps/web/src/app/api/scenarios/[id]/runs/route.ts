/**
 * Scenario Runs API - List run history
 *
 * GET /api/scenarios/[id]/runs   Get all runs for a scenario (paginated)
 */

import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '~/lib/api-keys/middleware';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
 * GET /api/scenarios/[id]/runs
 * Get run history for a scenario
 *
 * Query params:
 * - limit: Max results (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 * - status: Filter by status (optional)
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id: scenarioId } = await context.params;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(Number.parseInt(searchParams.get('limit') || '20', 10), 1),
      100
    );
    const offset = Math.max(Number.parseInt(searchParams.get('offset') || '0', 10), 0);
    const statusFilter = searchParams.get('status');

    // Check authentication (optional - affects what data is shown)
    const authResult = await authenticateRequest();

    // Verify scenario exists and check access
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      include: {
        collection: {
          select: {
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

    // Check access
    const isOwner = authResult.authenticated && scenario.collection?.userId === authResult.userId;
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

    // Build where clause
    const where: { scenarioId: string; status?: string } = { scenarioId };
    if (statusFilter) {
      where.status = statusFilter;
    }

    // Fetch runs
    const runs = await prisma.scenarioRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip: offset,
      select: {
        id: true,
        status: true,
        retryCount: true,
        evaluatorModel: true,
        evaluatorVerdict: true,
        evaluatorReason: true,
        assertionResults: true,
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        executionTimeMs: true,
        estimatedCost: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        // Only include sensitive data if owner
        ...(isOwner && {
          output: true,
          errorLog: true,
          conversation: true,
        }),
      },
    });

    const hasMore = runs.length > limit;
    const data = hasMore ? runs.slice(0, limit) : runs;

    return NextResponse.json({
      success: true,
      data: data.map((run) => ({
        id: run.id,
        status: run.status,
        retryCount: run.retryCount,
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
          estimatedCost: run.estimatedCost,
        },
        timestamps: {
          startedAt: run.startedAt,
          completedAt: run.completedAt,
          createdAt: run.createdAt,
        },
        // Only include if owner
        ...('output' in run && {
          output: run.output,
          errorLog: run.errorLog,
          conversation: run.conversation,
        }),
      })),
      meta: {
        version: API_VERSION,
        timestamp: new Date().toISOString(),
        requestId,
      },
      pagination: {
        limit,
        offset,
        hasMore,
      },
    });
  } catch (error) {
    console.error('[API Error] GET /api/scenarios/[id]/runs:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch runs' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
