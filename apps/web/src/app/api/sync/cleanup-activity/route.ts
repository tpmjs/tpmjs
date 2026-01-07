import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '~/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for cron jobs

/**
 * POST /api/sync/cleanup-activity
 * Delete activity records older than 90 days
 *
 * This endpoint is called by Vercel Cron (daily at 3 AM UTC)
 * Requires Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (env.CRON_SECRET && token !== env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Calculate the cutoff date (90 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    // Delete activities older than 90 days
    const result = await prisma.userActivity.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    const durationMs = Date.now() - startTime;

    // Log the cleanup to syncLog
    await prisma.syncLog.create({
      data: {
        source: 'cleanup-activity',
        status: 'success',
        processed: result.count,
        skipped: 0,
        errors: 0,
        message: `Deleted ${result.count} activities older than 90 days`,
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
          deletedCount: result.count,
        },
      },
      update: {
        checkpoint: {
          lastRun: new Date().toISOString(),
          deletedCount: result.count,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        deleted: result.count,
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
