import { type Prisma, prisma } from '@tpmjs/db';
import { kv } from '@vercel/kv';
import { type NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '~/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Cache configuration
const CACHE_TTL = 300; // 5 minutes
const CACHE_PREFIX = 'tools:';

/**
 * Try to get cached response, returns null if KV not configured or cache miss
 */
async function getCached<T>(key: string): Promise<T | null> {
  try {
    if (!process.env.KV_REST_API_URL) return null;
    return await kv.get<T>(key);
  } catch {
    return null;
  }
}

/**
 * Try to set cache, silently fails if KV not configured
 */
async function setCache<T>(key: string, value: T, ttl: number): Promise<void> {
  try {
    if (!process.env.KV_REST_API_URL) return;
    await kv.set(key, value, { ex: ttl });
  } catch {
    // Silently ignore cache errors
  }
}

// Constants
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 1000;
const MIN_LIMIT = 1;
const API_VERSION = '1.0.0';

// Valid enum values
const VALID_HEALTH_STATUSES = ['HEALTHY', 'BROKEN', 'UNKNOWN'] as const;
type HealthStatus = (typeof VALID_HEALTH_STATUSES)[number];

/**
 * Standard API response structure
 */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    version: string;
    timestamp: string;
    requestId?: string;
  };
  pagination?: {
    limit: number;
    offset: number;
    count: number;
    hasMore: boolean;
  };
}

/**
 * Validation error details
 */
interface ValidationError {
  field: string;
  message: string;
  received?: unknown;
}

/**
 * Validate health status parameter
 */
function validateHealthStatus(value: string | null, fieldName: string): HealthStatus | null {
  if (!value) return null;
  if (VALID_HEALTH_STATUSES.includes(value as HealthStatus)) {
    return value as HealthStatus;
  }
  throw new Error(`Invalid ${fieldName}: must be one of ${VALID_HEALTH_STATUSES.join(', ')}`);
}

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
    healthFilters.push({
      OR: [{ importHealth: 'BROKEN' }, { executionHealth: 'BROKEN' }],
    });
  } else {
    const validImportHealth = validateHealthStatus(importHealth, 'importHealth');
    const validExecutionHealth = validateHealthStatus(executionHealth, 'executionHealth');

    if (validImportHealth) {
      healthFilters.push({ importHealth: validImportHealth });
    }
    if (validExecutionHealth) {
      healthFilters.push({ executionHealth: validExecutionHealth });
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
 * Create standardized error response
 */
function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        version: API_VERSION,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Validate and parse pagination parameters
 */
function validatePagination(
  limitParam: string | null,
  offsetParam: string | null
): { limit: number; offset: number } {
  const limit = limitParam ? Number.parseInt(limitParam, 10) : DEFAULT_LIMIT;
  const offset = offsetParam ? Number.parseInt(offsetParam, 10) : 0;

  const validationErrors: ValidationError[] = [];

  if (Number.isNaN(limit)) {
    validationErrors.push({
      field: 'limit',
      message: 'Must be a valid number',
      received: limitParam,
    });
  } else if (limit < MIN_LIMIT) {
    validationErrors.push({
      field: 'limit',
      message: `Must be at least ${MIN_LIMIT}`,
      received: limit,
    });
  } else if (limit > MAX_LIMIT) {
    validationErrors.push({
      field: 'limit',
      message: `Must not exceed ${MAX_LIMIT}`,
      received: limit,
    });
  }

  if (Number.isNaN(offset)) {
    validationErrors.push({
      field: 'offset',
      message: 'Must be a valid number',
      received: offsetParam,
    });
  } else if (offset < 0) {
    validationErrors.push({ field: 'offset', message: 'Must be non-negative', received: offset });
  }

  if (validationErrors.length > 0) {
    throw new Error(JSON.stringify(validationErrors));
  }

  return {
    limit: Math.min(Math.max(limit, MIN_LIMIT), MAX_LIMIT),
    offset: Math.max(offset, 0),
  };
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
 * - limit: Results per page (default: 20, max: 1000, min: 1)
 * - offset: Pagination offset (default: 0, min: 0)
 *
 * @returns {ApiResponse} Standardized API response with tools data
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

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

    // Build cache key from query params
    const cacheKey = `${CACHE_PREFIX}${searchParams.toString() || 'default'}`;

    // Try cache first (only for simple queries without search)
    if (!query) {
      const cached = await getCached<ApiResponse>(cacheKey);
      if (cached) {
        return NextResponse.json(cached, {
          status: 200,
          headers: {
            'X-Request-ID': requestId,
            'X-Cache': 'HIT',
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        });
      }
    }

    // Validate pagination parameters
    let limit: number;
    let offset: number;
    try {
      const pagination = validatePagination(limitParam, offsetParam);
      limit = pagination.limit;
      offset = pagination.offset;
    } catch (error) {
      const validationErrors = JSON.parse(error instanceof Error ? error.message : '[]');
      return createErrorResponse('VALIDATION_ERROR', 'Invalid request parameters', 400, {
        validationErrors,
      });
    }

    // Build filters with validation
    let packageFilter: Prisma.PackageWhereInput;
    let healthFilters: Prisma.ToolWhereInput[];
    let where: Prisma.ToolWhereInput;

    try {
      packageFilter = buildPackageFilter(category, officialParam);
      healthFilters = buildHealthFilters(brokenParam, importHealth, executionHealth);
      where = buildWhereClause(query, packageFilter, healthFilters);
    } catch (error) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        error instanceof Error ? error.message : 'Invalid filter parameters',
        400
      );
    }

    // Execute query - fetch tools with package relation
    // We fetch limit+1 to check if there are more results (avoid expensive count)
    const tools = await prisma.tool.findMany({
      where,
      include: {
        package: {
          select: {
            id: true,
            npmPackageName: true,
            npmVersion: true,
            npmDescription: true,
            npmRepository: true,
            npmHomepage: true,
            npmLicense: true,
            npmKeywords: true,
            npmPublishedAt: true,
            category: true,
            env: true,
            frameworks: true,
            tier: true,
            isOfficial: true,
            npmDownloadsLastMonth: true,
            githubStars: true,
            // Explicitly exclude npmReadme, npmAuthor, npmMaintainers to reduce payload
          },
        },
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
    const processingTime = Date.now() - startTime;

    // Build standardized response
    const response: ApiResponse = {
      success: true,
      data: actualTools,
      meta: {
        version: API_VERSION,
        timestamp: new Date().toISOString(),
        requestId,
      },
      pagination: {
        limit,
        offset,
        count: actualTools.length,
        hasMore,
      },
    };

    // Cache response for non-search queries
    if (!query) {
      await setCache(cacheKey, response, CACHE_TTL);
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Processing-Time': `${processingTime}ms`,
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[API Error] /api/tools:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestId,
    });

    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred while fetching tools',
      500,
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      }
    );
  }
}
