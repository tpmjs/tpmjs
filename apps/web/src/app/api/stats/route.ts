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
    const [totalTools, officialTools, recentCount, packages] = await Promise.all([
      // Total tools count
      prisma.tool.count(),

      // Official tools count (isOfficial is at package level)
      prisma.tool.count({
        where: {
          package: { isOfficial: true }
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

      // Get all packages with their tool counts and download stats
      prisma.package.findMany({
        select: {
          category: true,
          npmDownloadsLastMonth: true,
          _count: {
            select: { tools: true },
          },
        },
      }),
    ]);

    // Calculate stats from packages
    const categories: Record<string, number> = {};
    let totalDownloads = 0;

    for (const pkg of packages) {
      // Count tools by category
      if (pkg.category) {
        categories[pkg.category] = (categories[pkg.category] || 0) + pkg._count.tools;
      }

      // Sum downloads
      totalDownloads += pkg.npmDownloadsLastMonth || 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalTools,
        officialTools,
        categories,
        recentTools: recentCount,
        totalDownloads,
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
