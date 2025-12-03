import { type Prisma, prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/tools
 * Search and list tools with filtering, sorting, and pagination
 *
 * Query params:
 * - q: Search query (searches package name, tool description)
 * - category: Filter by category
 * - official: Filter by official status (true/false)
 * - limit: Results per page (default: 20, max: 50)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const officialParam = searchParams.get('official');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Validate and set defaults
    const limit = Math.min(
      Number.parseInt(limitParam || '20', 10),
      50 // Max 50 for better performance
    );
    const offset = Math.max(Number.parseInt(offsetParam || '0', 10), 0);

    // Build where clause for Tool table
    const where: Prisma.ToolWhereInput = {};

    // Build package filter separately
    const packageFilter: Prisma.PackageWhereInput = {};

    // Category filter (category is at package level)
    if (category) {
      packageFilter.category = category;
    }

    // Official filter (isOfficial is at package level)
    if (officialParam !== null) {
      packageFilter.isOfficial = officialParam === 'true';
    }

    // Search filter (searches tool description and package name)
    if (query) {
      where.OR = [
        { description: { contains: query, mode: 'insensitive' } },
        { package: { npmPackageName: { contains: query, mode: 'insensitive' }, ...packageFilter } },
      ];
    } else if (Object.keys(packageFilter).length > 0) {
      // Apply package filter if no search query
      where.package = packageFilter;
    }

    // Execute query - fetch tools with package relation
    // We fetch limit+1 to check if there are more results (avoid expensive count)
    const tools = await prisma.tool.findMany({
      where,
      include: {
        package: true, // Include package data for each tool
      },
      orderBy: [
        { qualityScore: 'desc' }, // Tool quality score
        { package: { npmDownloadsLastMonth: 'desc' } }, // Package downloads
        { createdAt: 'desc' }, // Tool creation time
      ],
      take: limit + 1, // Fetch one extra to check if there are more
      skip: offset,
    });

    // Check if there are more results
    const hasMore = tools.length > limit;
    const actualTools = hasMore ? tools.slice(0, limit) : tools;

    return NextResponse.json({
      success: true,
      data: actualTools,
      pagination: {
        limit,
        offset,
        hasMore,
        // Note: total count omitted for performance (can be expensive)
      },
    });
  } catch (error) {
    console.error('Error fetching tools:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tools',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
