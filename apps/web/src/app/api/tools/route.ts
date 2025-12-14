import { type Prisma, prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '~/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Build health filters from query parameters
 */
function buildHealthFilters(
  brokenParam: string | null,
  importHealth: string | null,
  executionHealth: string | null
): Prisma.ToolWhereInput[] {
  const healthFilters: Prisma.ToolWhereInput[] = [];

  if (brokenParam === 'true') {
    // Shorthand: at least one health check failed
    healthFilters.push({
      OR: [{ importHealth: 'BROKEN' }, { executionHealth: 'BROKEN' }],
    });
  } else {
    // Individual health status filters
    if (importHealth && ['HEALTHY', 'BROKEN', 'UNKNOWN'].includes(importHealth)) {
      healthFilters.push({ importHealth: importHealth as 'HEALTHY' | 'BROKEN' | 'UNKNOWN' });
    }
    if (executionHealth && ['HEALTHY', 'BROKEN', 'UNKNOWN'].includes(executionHealth)) {
      healthFilters.push({
        executionHealth: executionHealth as 'HEALTHY' | 'BROKEN' | 'UNKNOWN',
      });
    }
  }

  return healthFilters;
}

/**
 * Build package filters from query parameters
 */
function buildPackageFilter(
  category: string | null,
  officialParam: string | null
): Prisma.PackageWhereInput {
  const packageFilter: Prisma.PackageWhereInput = {};

  if (category) {
    packageFilter.category = category;
  }

  if (officialParam !== null) {
    packageFilter.isOfficial = officialParam === 'true';
  }

  return packageFilter;
}

/**
 * Build where clause for tool query
 */
function buildWhereClause(
  query: string | null,
  packageFilter: Prisma.PackageWhereInput,
  healthFilters: Prisma.ToolWhereInput[]
): Prisma.ToolWhereInput {
  const where: Prisma.ToolWhereInput = {};

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

  // Apply health filters as AND conditions
  if (healthFilters.length > 0) {
    where.AND = healthFilters;
  }

  return where;
}

/**
 * GET /api/tools
 * Search and list tools with filtering, sorting, and pagination
 *
 * Query params:
 * - q: Search query (searches package name, tool description)
 * - category: Filter by category
 * - official: Filter by official status (true/false)
 * - importHealth: Filter by import health (HEALTHY, BROKEN, UNKNOWN)
 * - executionHealth: Filter by execution health (HEALTHY, BROKEN, UNKNOWN)
 * - broken: Shorthand for "at least one health check failed" (true/false)
 * - limit: Results per page (default: 20, max: 50)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const officialParam = searchParams.get('official');
    const importHealth = searchParams.get('importHealth');
    const executionHealth = searchParams.get('executionHealth');
    const brokenParam = searchParams.get('broken');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Validate and set defaults
    const limit = Math.min(Number.parseInt(limitParam || '20', 10), 50);
    const offset = Math.max(Number.parseInt(offsetParam || '0', 10), 0);

    // Build filters
    const packageFilter = buildPackageFilter(category, officialParam);
    const healthFilters = buildHealthFilters(brokenParam, importHealth, executionHealth);
    const where = buildWhereClause(query, packageFilter, healthFilters);

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
