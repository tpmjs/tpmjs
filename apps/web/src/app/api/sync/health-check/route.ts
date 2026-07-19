import { randomUUID } from 'node:crypto';
import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireCronAuth } from '~/lib/cron-auth';
import { performBatchHealthCheck } from '~/lib/health-check/health-check-service';
import {
  boundedPositiveInt,
  HEALTH_SLICE_DEFAULT,
  HEALTH_SLICE_MAX,
  leaseDueToolIds,
} from '~/lib/maintenance/bounded-work';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/sync/health-check
 * Bounded health-maintenance slice ordered by durable next-due time.
 *
 * Polled by the on-box systemd timer; an empty due queue is a cheap no-op.
 * Requires Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;

  const startTime = Date.now();

  try {
    const limit = boundedPositiveInt(
      request.nextUrl.searchParams.get('limit'),
      HEALTH_SLICE_DEFAULT,
      HEALTH_SLICE_MAX
    );
    const leaseOwner = `health:${process.pid}:${randomUUID()}`;
    const toolIds = await leaseDueToolIds(leaseOwner, limit);

    console.log(`🏥 Health slice leased ${toolIds.length}/${limit} due tools`);

    // Perform batch health checks
    const result = await performBatchHealthCheck(toolIds, 'scheduled-slice', 5, leaseOwner);

    const durationMs = Date.now() - startTime;

    // Log sync operation
    await prisma.syncLog.create({
      data: {
        source: 'health-check',
        status: result.errors > 0 ? 'partial' : 'success',
        processed: result.healthy + result.broken + result.unknown,
        skipped: 0,
        errors: result.errors,
        message: `Bounded slice checked ${result.total}/${limit}: ${result.healthy} healthy, ${result.broken} broken, ${result.unknown} unknown`,
        metadata: {
          durationMs,
          limit,
          ...result,
        },
      },
    });

    console.log(`✅ Health slice complete in ${durationMs}ms`);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        limit,
        durationMs,
      },
    });
  } catch (error) {
    console.error('❌ Health check cron failed:', error);

    const durationMs = Date.now() - startTime;

    await prisma.syncLog.create({
      data: {
        source: 'health-check',
        status: 'error',
        processed: 0,
        skipped: 0,
        errors: 1,
        message: error instanceof Error ? error.message : 'Unknown error',
        metadata: { durationMs },
      },
    });

    return NextResponse.json({ success: false, error: 'Health check failed' }, { status: 500 });
  }
}
