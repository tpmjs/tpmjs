import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '~/lib/api-keys/middleware';
import { checkApiKeyRateLimit, getRateLimitHeaders } from '~/lib/api-keys/rate-limit';
import { checkRateLimit, STRICT_RATE_LIMIT } from '~/lib/rate-limit';
import { calculateBM25, hasExactNameMatch, hasPackageNameMatch, tokenize } from '~/lib/search/bm25';
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

    // Extract search tokens for database-level pre-filtering
    const searchTokens = tokenize(query).filter((t) => t.length >= 2);
    const hasSearchQuery = searchTokens.length > 0;

    // Build database filter - pre-filter at DB level to reduce in-memory processing
    // Use OR conditions to find tools that match ANY search token
    const dbFilter = {
      // Exclude tools already in collection (if provided)
      ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
      ...(category && { package: { category } }),
      ...(tag && { tags: { has: tag } }),
      ...(hasSearchQuery && {
        OR: [
          // Match tool name
          { name: { contains: query, mode: 'insensitive' as const } },
          // Match tool description
          { description: { contains: query, mode: 'insensitive' as const } },
          // Match package name
          { package: { npmPackageName: { contains: query, mode: 'insensitive' as const } } },
          // Match package description
          { package: { npmDescription: { contains: query, mode: 'insensitive' as const } } },
          // Also try individual tokens for partial matches
          ...searchTokens
            .slice(0, 3)
            .flatMap((token) => [
              { name: { contains: token, mode: 'insensitive' as const } },
              { description: { contains: token, mode: 'insensitive' as const } },
            ]),
        ],
      }),
    };

    // Fetch filtered tools with package info (max 500 for BM25 scoring)
    const tools = await prisma.tool.findMany({
      include: { package: true },
      where: dbFilter,
      take: hasSearchQuery ? 500 : 100, // Limit results for performance
      orderBy: hasSearchQuery ? undefined : { qualityScore: 'desc' },
    });

    console.log(`📊 [SEARCH API] Found ${tools.length} tools in database`);

    // Combine query with recent messages for better context
    const fullQuery = [query, ...recentMessages].filter(Boolean).join(' ');
    console.log(`🔍 [SEARCH API] Full search context: "${fullQuery.slice(0, 100)}..."`);

    // Build all documents first (include tags in document text for BM25)
    const documents = tools.map((tool) => ({
      tool,
      text: [
        tool.description,
        tool.name,
        tool.package.npmPackageName,
        tool.package.npmDescription || '',
        ...(tool.package.npmKeywords || []),
        ...(tool.tags || []),
      ].join(' '),
    }));

    // Calculate document frequencies (IDF)
    const docFrequencies = new Map<string, number>();
    const queryTokens = tokenize(fullQuery);

    for (const term of queryTokens) {
      let count = 0;
      for (const doc of documents) {
        const docTokens = tokenize(doc.text);
        if (docTokens.includes(term)) {
          count++;
        }
      }
      docFrequencies.set(term, count);
    }

    // Calculate average document length
    const totalTokens = documents.reduce((sum, doc) => sum + tokenize(doc.text).length, 0);
    const avgDocLength = totalTokens / documents.length;

    // Calculate BM25 scores
    const scoredResults = documents.map(({ tool, text }) => {
      const bm25Score = calculateBM25(fullQuery, text, avgDocLength, tools.length, docFrequencies);
      const qualityBoost = Number(tool.qualityScore ?? 0) * 0.5;
      const downloadBoost = Math.log10((tool.package.npmDownloadsLastMonth || 0) + 1) * 0.1;

      // Massive boost for exact tool name match (when user mentions tool by name)
      const exactNameBoost = hasExactNameMatch(query, tool.name) ? 100 : 0;

      // Boost for package name match (when user searches by package name like @tpmjs/tools-unsandbox)
      const packageNameBoost = hasPackageNameMatch(query, tool.package.npmPackageName) ? 50 : 0;

      // Tag-match boost: +5 when a query token matches a tag exactly
      let tagBoost = 0;
      if (tool.tags && tool.tags.length > 0) {
        const qTokens = tokenize(query);
        for (const token of qTokens) {
          if (tool.tags.includes(token)) tagBoost += 5;
        }
      }

      const finalScore =
        bm25Score + qualityBoost + downloadBoost + exactNameBoost + packageNameBoost + tagBoost;

      return { tool, score: finalScore };
    });

    // Sort by score and take top N
    const topResults = scoredResults
      .filter(({ score }) => score > 0) // Only include results with matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit + 1);

    const hasMore = topResults.length > limit;
    const results = hasMore ? topResults.slice(0, limit) : topResults;

    console.log(`✅ [SEARCH API] Returning ${results.length} results (hasMore: ${hasMore})`);

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
          total: scoredResults.filter(({ score }) => score > 0).length,
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
