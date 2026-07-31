import { type NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '~/lib/api-keys/middleware';
import { checkApiKeyRateLimit, getRateLimitHeaders } from '~/lib/api-keys/rate-limit';
import { checkRateLimit, STRICT_RATE_LIMIT } from '~/lib/rate-limit';
import { searchTools } from '~/lib/search/tool-search';
import { trackSearch } from '~/lib/tracking/search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex search with multiple filters and scoring
export async function GET(request: NextRequest) {
  console.log('🔎 [SEARCH API] Request received');

  // --- Auth (optional) ---
  const authResult = await authenticateRequest();
  const isAuthenticated = authResult.authenticated && !!authResult.userId;

  // --- Rate Limiting ---
  if (isAuthenticated && authResult.userId) {
    const identifier = authResult.apiKeyId || authResult.userId;
    const rateResult = await checkApiKeyRateLimit(identifier, authResult.tier || 'FREE');
    if (!rateResult.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded' } },
        {
          status: 429,
          headers: getRateLimitHeaders(rateResult),
        }
      );
    }
  } else {
    const rateLimitResponse = checkRateLimit(request, STRICT_RATE_LIMIT);
    if (rateLimitResponse) return rateLimitResponse;
  }

  const searchStart = performance.now();

  try {
    const { searchParams } = new URL(request.url);
    // Accept both 'q' and 'query' parameters for flexibility
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const category = searchParams.get('category');
    const tag = searchParams.get('tag'); // Exact tag filter
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '10', 10), 100);

    // Parse excludeIds to filter out tools already in user's collection
    const excludeIdsParam = searchParams.get('excludeIds');
    const excludeIds = excludeIdsParam ? excludeIdsParam.split(',').filter(Boolean) : [];

    // Get recent messages for context (passed as JSON in 'messages' param)
    // Wrap in try-catch to handle malformed JSON gracefully
    const messagesParam = searchParams.get('messages');
    let recentMessages: string[] = [];
    if (messagesParam) {
      try {
        const parsed = JSON.parse(messagesParam);
        if (Array.isArray(parsed)) {
          recentMessages = parsed.filter((m): m is string => typeof m === 'string');
        }
      } catch {
        console.warn('[SEARCH API] Failed to parse messages param, ignoring');
      }
    }

    console.log(
      `🔎 [SEARCH API] Query: "${query}", Category: ${category}, Limit: ${limit}, Messages: ${recentMessages.length}`
    );

    // Unified registry search — the SAME ranking the MCP `search_tools` meta-tool
    // uses, so the REST and MCP surfaces can never diverge again (see
    // ~/lib/search/tool-search). It matches over tool name/description AND the
    // package description + npm keywords, and demotes broken tools below every
    // healthy match.
    const scored = await searchTools({
      query,
      category,
      tag,
      excludeIds,
      contextMessages: recentMessages,
    });

    const total = scored.length;
    const hasMore = total > limit;
    const results = scored.slice(0, limit);

    console.log(
      `✅ [SEARCH API] Returning ${results.length} of ${total} results (hasMore: ${hasMore})`
    );

    // Track search query (fire-and-forget)
    if (query) {
      const latencyMs = Math.round(performance.now() - searchStart);
      trackSearch({
        query,
        resultCount: results.length,
        latencyMs,
      });
    }

    // Build rate limit headers for authenticated users
    const responseHeaders: Record<string, string> = {};
    if (isAuthenticated && authResult.userId) {
      const identifier = authResult.apiKeyId || authResult.userId;
      const rateStatus = await checkApiKeyRateLimit(identifier, authResult.tier || 'FREE');
      Object.assign(responseHeaders, getRateLimitHeaders(rateStatus));
    }

    // Format response to match existing /api/tools structure
    return NextResponse.json(
      {
        success: true,
        query,
        filters: { category },
        results: {
          total,
          returned: results.length,
          tools: results.map(({ tool }) => ({
            id: tool.id,
            toolId: `${tool.package.npmPackageName}::${tool.name}`,
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            qualityScore: tool.qualityScore,
            tags: tool.tags,
            signature: tool.signature,
            importHealth: tool.importHealth,
            executionHealth: tool.executionHealth,
            consecutiveImportFailures: tool.consecutiveImportFailures,
            healthCheckError: tool.healthCheckError,
            lastHealthCheck: tool.lastHealthCheck,
            package: {
              npmPackageName: tool.package.npmPackageName,
              npmVersion: tool.package.npmVersion,
              category: tool.package.category,
              frameworks: tool.package.frameworks,
              env: tool.package.env,
              npmRepository: tool.package.npmRepository,
              isOfficial: tool.package.isOfficial,
              npmDownloadsLastMonth: tool.package.npmDownloadsLastMonth,
              npmKeywords: tool.package.npmKeywords,
            },
            importUrl: `https://esm.sh/${tool.package.npmPackageName}@${tool.package.npmVersion}`,
            cdnUrl: `https://cdn.jsdelivr.net/npm/${tool.package.npmPackageName}@${tool.package.npmVersion}/+esm`,
          })),
        },
        pagination: {
          limit,
          hasMore,
        },
      },
      { headers: responseHeaders }
    );
  } catch (error) {
    console.error('❌ [SEARCH API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: error instanceof Error ? error.message : 'Search failed',
        },
      },
      { status: 500 }
    );
  }
}
