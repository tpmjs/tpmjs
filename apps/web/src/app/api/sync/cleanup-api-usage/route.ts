import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '~/env';
import { cleanupOldUsageRecords } from '~/lib/api-keys/usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * POST /api/sync/cleanup-api-usage
 * Delete API usage records older than 30 days
 *
 * Called by Vercel Cron (daily at 3:30 AM UTC)
 * Requires Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (env.CRON_SECRET && token !== env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const deletedCount = await cleanupOldUsageRecords(30);
    const durationMs = Date.now() - startTime;

    await prisma.syncLog.create({
      data: {
        source: 'cleanup-api-usage',
        status: 'success',
        processed: deletedCount,
        skipped: 0,
        errors: 0,
        message: `Deleted ${deletedCount} API usage records older than 30 days`,
        metadata: { durationMs },
      },
    });

    await prisma.syncCheckpoint.upsert({
      where: { source: 'cleanup-api-usage' },
      create: {
        source: 'cleanup-api-usage',
        checkpoint: { lastRun: new Date().toISOString(), deletedCount },
      },
      update: {
        checkpoint: { lastRun: new Date().toISOString(), deletedCount },
      },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: deletedCount, durationMs },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await prisma.syncLog
      .create({
        data: {
          source: 'cleanup-api-usage',
          status: 'error',
          processed: 0,
          skipped: 0,
          errors: 1,
          message: errorMessage,
          metadata: { durationMs },
        },
      })
      .catch(console.error);

    console.error('[Cleanup API Usage Error]', error);

    return NextResponse.json(
      { success: false, error: errorMessage, data: { durationMs } },
      { status: 500 }
    );
  }
}
