import { Prisma, prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireCronAuth } from '~/lib/cron-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for cron jobs

const DELETE_SLICE = 1_000;

/**
 * POST /api/sync/cleanup-activity
 * Delete activity records older than 90 days
 *
 * This endpoint is called by Vercel Cron (daily at 3 AM UTC)
 * Requires Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;

  const startTime = Date.now();

  try {
    // Calculate the cutoff date (90 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    // A single unbounded DELETE creates a large transaction, WAL burst, and
    // vacuum debt when activity is abundant. Reclaim one indexed slice; later
    // timer invocations continue until no eligible row remains.
    const deleted = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      DELETE FROM user_activities
      WHERE id IN (
        SELECT id
        FROM user_activities
        WHERE created_at < ${cutoffDate}
        ORDER BY created_at, id
        FOR UPDATE SKIP LOCKED
        LIMIT ${DELETE_SLICE}
      )
      RETURNING id
    `);
    const moreEligible =
      (await prisma.userActivity.findFirst({
        where: { createdAt: { lt: cutoffDate } },
        select: { id: true },
      })) !== null;

    const durationMs = Date.now() - startTime;

    // Log the cleanup to syncLog
    await prisma.syncLog.create({
      data: {
        source: 'cleanup-activity',
        status: 'success',
        processed: deleted.length,
        skipped: 0,
        errors: 0,
        message: `Deleted bounded slice ${deleted.length}/${DELETE_SLICE} older than 90 days`,
        metadata: {
          durationMs,
          cutoffDate: cutoffDate.toISOString(),
        },
      },
    });

    // Update checkpoint with last run timestamp
    await prisma.syncCheckpoint.upsert({
      where: { source: 'cleanup-activity' },
      create: {
        source: 'cleanup-activity',
        checkpoint: {
          lastRun: new Date().toISOString(),
          deletedCount: deleted.length,
          moreEligible,
        },
      },
      update: {
        checkpoint: {
          lastRun: new Date().toISOString(),
          deletedCount: deleted.length,
          moreEligible,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        deleted: deleted.length,
        limit: DELETE_SLICE,
        moreEligible,
        cutoffDate: cutoffDate.toISOString(),
        durationMs,
      },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log the error to syncLog
    await prisma.syncLog
      .create({
        data: {
          source: 'cleanup-activity',
          status: 'error',
          processed: 0,
          skipped: 0,
          errors: 1,
          message: errorMessage,
          metadata: { durationMs },
        },
      })
      .catch(console.error);

    console.error('[Cleanup Activity Error]', error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        data: { durationMs },
      },
      { status: 500 }
    );
  }
}
