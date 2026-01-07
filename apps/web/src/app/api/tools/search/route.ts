import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { STRICT_RATE_LIMIT, checkRateLimit } from '~/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// BM25 parameters
const k1 = 1.5; // term frequency saturation parameter
const b = 0.75; // length normalization parameter

// Split camelCase and PascalCase into words
function splitCamelCase(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase -> camel Case
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2'); // XMLParser -> XML Parser
}

// Tokenize text into words (handles camelCase)
function tokenize(text: string): string[] {
  return splitCamelCase(text)
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

// Check for exact tool name match (case-insensitive)
function hasExactNameMatch(query: string, toolName: string): boolean {
  const queryLower = query.toLowerCase();
  const nameLower = toolName.toLowerCase();
  return queryLower.includes(nameLower) || nameLower.includes(queryLower);
}

// Calculate term frequency
function termFrequency(term: string, tokens: string[]): number {
  return tokens.filter((t) => t === term).length;
}

// Calculate BM25 score
function calculateBM25(
  query: string,
  document: string,
  avgDocLength: number,
  totalDocs: number,
  docFrequencies: Map<string, number>
): number {
  const queryTokens = tokenize(query);
  const docTokens = tokenize(document);
  const docLength = docTokens.length;

  let score = 0;

  for (const term of queryTokens) {
    const tf = termFrequency(term, docTokens);
    if (tf === 0) continue;

    // IDF calculation
    const docFreq = docFrequencies.get(term) || 0;
    const idf = Math.log((totalDocs - docFreq + 0.5) / (docFreq + 0.5) + 1);

    // BM25 formula
    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength));

    score += idf * (numerator / denominator);
  }

  return score;
}

export async function GET(request: NextRequest) {
  console.log('🔎 [SEARCH API] Request received');

  // Check rate limit (stricter limit for expensive search operations)
  const rateLimitResponse = checkRateLimit(request, STRICT_RATE_LIMIT);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    // Accept both 'q' and 'query' parameters for flexibility
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const category = searchParams.get('category');
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '10'), 50);

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
      ...(category && { package: { category } }),
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

    // Build all documents first
    const documents = tools.map((tool) => ({
      tool,
      text: [
        tool.description,
        tool.name,
        tool.package.npmPackageName,
        tool.package.npmDescription || '',
        ...(tool.package.npmKeywords || []),
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

      const finalScore = bm25Score + qualityBoost + downloadBoost + exactNameBoost;

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

    // Format response to match existing /api/tools structure
    return NextResponse.json({
      success: true,
      query,
      filters: { category },
      results: {
        total: scoredResults.filter(({ score }) => score > 0).length,
        returned: results.length,
        tools: results.map(({ tool }) => ({
          id: tool.id,
          name: tool.name,
          description: tool.description,
          qualityScore: tool.qualityScore,
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
          },
          importUrl: `https://esm.sh/${tool.package.npmPackageName}@${tool.package.npmVersion}`,
          cdnUrl: `https://cdn.jsdelivr.net/npm/${tool.package.npmPackageName}@${tool.package.npmVersion}/+esm`,
        })),
      },
      pagination: {
        limit,
        hasMore,
      },
    });
  } catch (error) {
    console.error('❌ [SEARCH API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      },
      { status: 500 }
    );
  }
}
