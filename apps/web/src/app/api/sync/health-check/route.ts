import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '~/env';
import { performBatchHealthCheck } from '~/lib/health-check/health-check-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/sync/health-check
 * Daily health check for all tools
 *
 * This endpoint is called by Vercel Cron (daily at 2am UTC)
 * Requires Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (env.CRON_SECRET && token !== env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log('🏥 Daily health check cron job starting...');

    // Get all tools
    const tools = await prisma.tool.findMany({
      select: { id: true },
    });

    console.log(`📊 Found ${tools.length} tools to check`);

    const toolIds = tools.map((t) => t.id);

    // Perform batch health checks
    const result = await performBatchHealthCheck(toolIds, 'daily-cron', 5);

    const durationMs = Date.now() - startTime;

    // Log sync operation
    await prisma.syncLog.create({
      data: {
        source: 'health-check',
        status: result.errors > 0 ? 'partial' : 'success',
        processed: result.healthy + result.broken + result.unknown,
        skipped: 0,
        errors: result.errors,
        message: `Checked ${result.total} tools: ${result.healthy} healthy, ${result.broken} broken, ${result.unknown} unknown`,
        metadata: {
          durationMs,
          ...result,
        },
      },
    });

    console.log(`✅ Daily health check complete in ${durationMs}ms`);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
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
