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
 * - q: Search query (searches name, description, tags)
 * - category: Filter by category
 * - official: Filter by official status (true/false)
 * - limit: Results per page (default: 20, max: 100)
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

    // Validate and set defaults (reduced max from 100 to 50 for faster queries)
    const limit = Math.min(
      Number.parseInt(limitParam || '20', 10),
      50 // Reduced from 100 for better performance
    );
    const offset = Math.max(Number.parseInt(offsetParam || '0', 10), 0);

    // Build where clause
    const where: Prisma.ToolWhereInput = {};

    // Search filter (case-insensitive partial match)
    if (query) {
      where.OR = [
        { npmPackageName: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        {
          tags: {
            hasSome: [query],
          },
        },
      ];
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Official filter
    if (officialParam !== null) {
      where.isOfficial = officialParam === 'true';
    }

    // Execute queries - run count separately only if needed for pagination
    // For first page, we can skip count if we don't need total pages
    const tools = await prisma.tool.findMany({
      where,
      orderBy: [{ qualityScore: 'desc' }, { npmDownloadsLastMonth: 'desc' }, { createdAt: 'desc' }],
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
        // Only return count if explicitly requested
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
