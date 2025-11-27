import { type Prisma, prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // Validate and set defaults
    const limit = Math.min(
      Number.parseInt(limitParam || '20', 10),
      100 // Max 100 results per page
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

    // Execute query with pagination
    const [tools, totalCount] = await Promise.all([
      prisma.tool.findMany({
        where,
        orderBy: [
          { qualityScore: 'desc' },
          { npmDownloadsLastMonth: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.tool.count({ where }),
    ]);

    // Calculate pagination metadata
    const hasMore = offset + limit < totalCount;
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return NextResponse.json({
      success: true,
      data: tools,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore,
        totalPages,
        currentPage,
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
