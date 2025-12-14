import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '~/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/tools/broken
 * List all tools with broken health status
 *
 * Returns tools where importHealth='BROKEN' OR executionHealth='BROKEN'
 * Includes package relation with npmPackageName and npmVersion
 */
export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const brokenTools = await prisma.tool.findMany({
      where: {
        OR: [{ importHealth: 'BROKEN' }, { executionHealth: 'BROKEN' }],
      },
      include: {
        package: {
          select: {
            npmPackageName: true,
            npmVersion: true,
            category: true,
            isOfficial: true,
          },
        },
      },
      orderBy: {
        lastHealthCheck: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: brokenTools,
      count: brokenTools.length,
    });
  } catch (error) {
    console.error('Failed to fetch broken tools:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch broken tools' },
      { status: 500 }
    );
  }
}
