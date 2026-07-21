import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireCronAuth } from '~/lib/cron-auth';
import { cleanupOldExecutionEvents } from '~/lib/tracking/executions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * POST /api/sync/cleanup-executions
 * Delete execution events older than 90 days
 *
 * Called by authenticated scheduled automation.
 * Requires Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;

  const startTime = Date.now();

  try {
    const deletedCount = await cleanupOldExecutionEvents(90);
    const durationMs = Date.now() - startTime;

    await prisma.syncLog.create({
      data: {
        source: 'cleanup-executions',
        status: 'success',
        processed: deletedCount,
        skipped: 0,
        errors: 0,
        message: `Deleted ${deletedCount} execution events older than 90 days`,
        metadata: { durationMs },
      },
    });

    await prisma.syncCheckpoint.upsert({
      where: { source: 'cleanup-executions' },
      create: {
        source: 'cleanup-executions',
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
          source: 'cleanup-executions',
          status: 'error',
          processed: 0,
          skipped: 0,
          errors: 1,
          message: errorMessage,
          metadata: { durationMs },
        },
      })
      .catch(console.error);

    console.error('[Cleanup Executions Error]', error);

    return NextResponse.json(
      { success: false, error: errorMessage, data: { durationMs } },
      { status: 500 }
    );
  }
}
