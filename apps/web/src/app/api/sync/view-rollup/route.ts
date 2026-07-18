import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireCronAuth } from '~/lib/cron-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * POST /api/sync/view-rollup
 * Daily cron: aggregates PageView counts into denormalized viewCount fields
 * on Tool, Collection, and Agent models.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: cron handler with sequential entity type processing
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;

  try {
    // Aggregate views by entity type and entity ID (all-time sum)
    const entityTypes = ['tool', 'collection', 'agent'] as const;
    let totalUpdated = 0;

    for (const entityType of entityTypes) {
      // Get aggregated view counts per entity
      const viewCounts = await prisma.pageView.groupBy({
        by: ['entityId'],
        where: { entityType },
        _sum: { viewCount: true },
      });

      // Update denormalized viewCount on each entity
      for (const vc of viewCounts) {
        const totalViews = vc._sum.viewCount || 0;
        if (totalViews === 0) continue;

        try {
          if (entityType === 'tool') {
            await prisma.tool.update({
              where: { id: vc.entityId },
              data: { viewCount: totalViews },
            });
          } else if (entityType === 'collection') {
            await prisma.collection.update({
              where: { id: vc.entityId },
              data: { viewCount: totalViews },
            });
          } else if (entityType === 'agent') {
            await prisma.agent.update({
              where: { id: vc.entityId },
              data: { viewCount: totalViews },
            });
          }
          totalUpdated++;
        } catch {
          // Entity may have been deleted - skip silently
        }
      }
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        totalUpdated,
        durationMs,
      },
    });
  } catch (error) {
    console.error('[sync/view-rollup] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
