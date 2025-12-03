import { prisma } from '@tpmjs/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Simple text-based search scoring (fallback until BM25 is fixed)
function calculateTextScore(query: string, document: string): number {
  const queryTokens = query.toLowerCase().split(/\s+/);
  const docLower = document.toLowerCase();

  let score = 0;

  for (const token of queryTokens) {
    // Exact match in document
    if (docLower.includes(token)) {
      score += 1;
    }

    // Boost if token appears in beginning (likely more relevant)
    if (docLower.startsWith(token)) {
      score += 0.5;
    }
  }

  return score;
}

export async function GET(request: Request) {
  console.log('🔎 [SEARCH API] Request received');

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '10'), 50);

    console.log(`🔎 [SEARCH API] Query: "${query}", Category: ${category}, Limit: ${limit}`);

    // Fetch all tools with package info
    const tools = await prisma.tool.findMany({
      include: { package: true },
      where: category
        ? {
            package: { category },
          }
        : undefined,
    });

    console.log(`📊 [SEARCH API] Found ${tools.length} tools in database`);

    // Build searchable documents and calculate scores
    const scoredResults = tools.map((tool) => {
      const document = [
        tool.description,
        tool.exportName,
        tool.package.npmPackageName,
        tool.package.npmDescription || '',
        ...(tool.package.npmKeywords || []),
      ].join(' ');

      const textScore = calculateTextScore(query, document);
      const qualityBoost = Number.parseFloat(tool.qualityScore || '0') * 0.5;
      const downloadBoost = Math.log10((tool.package.npmDownloadsLastMonth || 0) + 1) * 0.1;
      const finalScore = textScore + qualityBoost + downloadBoost;

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
          exportName: tool.exportName,
          description: tool.description,
          qualityScore: tool.qualityScore,
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
