/**
 * Featured Scenarios API
 *
 * GET /api/scenarios/featured   Get featured scenarios for homepage showcase
 */

import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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

/**
 * GET /api/scenarios/featured
 * Get featured scenarios for homepage showcase
 *
 * Returns an algorithmic mix of:
 * - High quality scenarios (by qualityScore)
 * - Diverse scenarios (different collections/tags)
 * - Fresh scenarios (recently created)
 *
 * Query params:
 * - limit: Max results (default: 6, max: 20)
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number.parseInt(searchParams.get('limit') || '6', 10), 1), 20);

    // Get high quality scenarios (top 40%)
    const highQuality = await prisma.scenario.findMany({
      where: {
        collection: { isPublic: true },
        qualityScore: { gte: 0.3 },
        totalRuns: { gte: 1 },
      },
      orderBy: { qualityScore: 'desc' },
      take: Math.ceil(limit * 0.4),
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            slug: true,
            user: { select: { username: true } },
          },
        },
      },
    });

    // Get diverse scenarios - different collections (30%)
    const seenCollections = new Set(highQuality.map((s) => s.collectionId));
    const diverse = await prisma.scenario.findMany({
      where: {
        collection: { isPublic: true },
        collectionId: { notIn: Array.from(seenCollections).filter(Boolean) as string[] },
        totalRuns: { gte: 1 },
      },
      orderBy: { qualityScore: 'desc' },
      take: Math.ceil(limit * 0.3),
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            slug: true,
            user: { select: { username: true } },
          },
        },
      },
    });

    // Get fresh scenarios (30%)
    const seenIds = new Set([...highQuality, ...diverse].map((s) => s.id));
    const fresh = await prisma.scenario.findMany({
      where: {
        collection: { isPublic: true },
        id: { notIn: Array.from(seenIds) },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.ceil(limit * 0.3),
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            slug: true,
            user: { select: { username: true } },
          },
        },
      },
    });

    // Combine and shuffle slightly for variety
    const combined = [...highQuality, ...diverse, ...fresh];

    // Simple shuffle to mix the categories
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = combined[i];
      const swapWith = combined[j];
      if (temp !== undefined && swapWith !== undefined) {
        combined[i] = swapWith;
        combined[j] = temp;
      }
    }

    // Take only the requested limit
    const featured = combined.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: featured.map((s) => ({
        id: s.id,
        name: s.name,
        prompt: s.prompt.slice(0, 150) + (s.prompt.length > 150 ? '...' : ''),
        tags: s.tags.slice(0, 3),
        qualityScore: s.qualityScore,
        totalRuns: s.totalRuns,
        lastRunStatus: s.lastRunStatus,
        collection: s.collection
          ? {
              id: s.collection.id,
              name: s.collection.name,
              slug: s.collection.slug,
              username: s.collection.user.username,
            }
          : null,
      })),
      meta: {
        version: API_VERSION,
        timestamp: new Date().toISOString(),
        requestId,
        algorithm: 'mixed-quality-diversity-freshness',
      },
    });
  } catch (error) {
    console.error('[API Error] GET /api/scenarios/featured:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch featured scenarios' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
