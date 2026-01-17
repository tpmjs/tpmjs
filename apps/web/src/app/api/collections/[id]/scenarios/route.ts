/**
 * Collection Scenarios API
 *
 * GET /api/collections/[id]/scenarios   List scenarios for a collection
 */

import { prisma } from '@tpmjs/db';
import type { NextRequest } from 'next/server';
import { authenticateRequest } from '~/lib/api-keys/middleware';
import { apiForbidden, apiInternalError, apiNotFound, apiSuccess } from '~/lib/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/collections/[id]/scenarios
 * List scenarios for a collection
 *
 * Query params:
 * - limit: Max results (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 * - status: Filter by lastRunStatus (optional)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(Number.parseInt(searchParams.get('limit') || '50', 10), 1),
      100
    );
    const offset = Math.max(Number.parseInt(searchParams.get('offset') || '0', 10), 0);
    const statusFilter = searchParams.get('status');

    // Check authentication (optional - affects what data is shown)
    const authResult = await authenticateRequest();

    // Fetch collection
    const collection = await prisma.collection.findUnique({
      where: { id },
      select: {
        id: true,
        isPublic: true,
        userId: true,
        name: true,
      },
    });

    if (!collection) {
      return apiNotFound('Collection', requestId);
    }

    // Check access
    const isOwner = authResult.authenticated && collection.userId === authResult.userId;
    if (!collection.isPublic && !isOwner) {
      return apiForbidden('Access denied', requestId);
    }

    // Build where clause
    const where: {
      collectionId: string;
      lastRunStatus?: string;
    } = { collectionId: id };

    if (statusFilter) {
      where.lastRunStatus = statusFilter;
    }

    // Fetch scenarios with pagination
    const scenarios = await prisma.scenario.findMany({
      where,
      orderBy: [{ qualityScore: 'desc' }, { createdAt: 'desc' }],
      take: limit + 1,
      skip: offset,
      select: {
        id: true,
        prompt: true,
        name: true,
        description: true,
        tags: true,
        qualityScore: true,
        totalRuns: true,
        lastRunAt: true,
        lastRunStatus: true,
        consecutivePasses: true,
        consecutiveFails: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const hasMore = scenarios.length > limit;
    const data = hasMore ? scenarios.slice(0, limit) : scenarios;

    return apiSuccess(
      {
        collection: {
          id: collection.id,
          name: collection.name,
        },
        scenarios: data.map((s) => ({
          id: s.id,
          prompt: s.prompt.slice(0, 200) + (s.prompt.length > 200 ? '...' : ''),
          name: s.name,
          description: s.description,
          tags: s.tags,
          metrics: {
            qualityScore: s.qualityScore,
            totalRuns: s.totalRuns,
            consecutivePasses: s.consecutivePasses,
            consecutiveFails: s.consecutiveFails,
            lastRunStatus: s.lastRunStatus,
            lastRunAt: s.lastRunAt,
          },
          timestamps: {
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          },
        })),
      },
      {
        requestId,
        pagination: {
          limit,
          offset,
          hasMore,
        },
      }
    );
  } catch (error) {
    console.error('[API Error] GET /api/collections/[id]/scenarios:', error);
    return apiInternalError('Failed to fetch scenarios', requestId);
  }
}
