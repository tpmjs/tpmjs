import { prisma } from '@tpmjs/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/stats
 * Get aggregated statistics about tools in the registry
 *
 * Returns:
 * - totalTools: Total number of tools
 * - officialTools: Number of official tools (with tpmjs-tool keyword)
 * - categories: Breakdown by category with counts
 * - recentTools: Count of tools added in last 7 days
 * - totalDownloads: Sum of all npm downloads
 */
export async function GET() {
  try {
    // Run all aggregations in parallel
    const [totalTools, officialTools, categoryStats, recentCount, downloadSum] = await Promise.all([
      // Total tools count
      prisma.tool.count(),

      // Official tools count
      prisma.tool.count({
        where: { isOfficial: true },
      }),

      // Group by category
      prisma.tool.groupBy({
        by: ['category'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      }),

      // Recent tools (last 7 days)
      prisma.tool.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Sum of all downloads
      prisma.tool.aggregate({
        _sum: {
          npmDownloadsLastMonth: true,
        },
      }),
    ]);

    // Format category stats
    const categories = categoryStats.reduce<Record<string, number>>((acc, stat) => {
      if (stat.category) {
        acc[stat.category] = stat._count.id;
      }
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        totalTools,
        officialTools,
        categories,
        recentTools: recentCount,
        totalDownloads: downloadSum._sum.npmDownloadsLastMonth || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
