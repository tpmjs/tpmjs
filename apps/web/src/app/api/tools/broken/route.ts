import { prisma } from '@tpmjs/db';
import { NextResponse } from 'next/server';

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
export async function GET() {
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
