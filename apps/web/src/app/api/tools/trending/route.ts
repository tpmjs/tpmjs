import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const API_VERSION = '1.0.0';

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
    hasMore: boolean;
  };
}

/**
 * GET /api/tools/trending
 * Get trending tools based on a composite score of downloads, ratings, and likes
 *
 * Trending score = (normalized_downloads * 0.4) + (average_rating * 0.3) + (like_count * 0.2) + (recency * 0.1)
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20));
    const offset = Math.max(0, Number(searchParams.get('offset')) || 0);
    const category = searchParams.get('category');
    const period = searchParams.get('period') || 'week'; // 'day', 'week', 'month', 'all'

    // Build where clause
    const where: Record<string, unknown> = {
      importHealth: 'HEALTHY',
    };

    if (category) {
      where.package = { category };
    }

    // Get date cutoff for recency boost
    const now = new Date();
    let recencyPeriodMs: number;
    switch (period) {
      case 'day':
        recencyPeriodMs = 24 * 60 * 60 * 1000;
        break;
      case 'week':
        recencyPeriodMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        recencyPeriodMs = 30 * 24 * 60 * 60 * 1000;
        break;
      case 'all':
      default:
        recencyPeriodMs = 365 * 24 * 60 * 60 * 1000; // 1 year
    }

    // Fetch tools with package data
    // For trending, we order by a combination of factors
    const tools = await prisma.tool.findMany({
      where,
      include: {
        package: {
          select: {
            id: true,
            npmPackageName: true,
            npmVersion: true,
            npmDescription: true,
            category: true,
            isOfficial: true,
            npmDownloadsLastMonth: true,
            githubStars: true,
            tier: true,
          },
        },
      },
      orderBy: [
        // Primary: quality score (includes downloads)
        { qualityScore: 'desc' },
        // Secondary: average rating
        { averageRating: 'desc' },
        // Tertiary: like count
        { likeCount: 'desc' },
        // Finally: recency
        { createdAt: 'desc' },
      ],
      take: limit + 1,
      skip: offset,
    });

    const hasMore = tools.length > limit;
    const actualTools = hasMore ? tools.slice(0, limit) : tools;

    // Calculate trending scores for display
    const maxDownloads = Math.max(
      ...actualTools.map((t) => t.package.npmDownloadsLastMonth || 0),
      1
    );
    const maxLikes = Math.max(...actualTools.map((t) => t.likeCount), 1);

    const toolsWithScores = actualTools.map((tool) => {
      const downloads = tool.package.npmDownloadsLastMonth || 0;
      const rating = tool.averageRating ? Number(tool.averageRating) : 0;
      const likes = tool.likeCount;
      const ageMs = now.getTime() - tool.createdAt.getTime();
      const recencyScore = Math.max(0, 1 - ageMs / recencyPeriodMs); // 0-1, higher for newer

      // Trending score calculation
      const trendingScore =
        (downloads / maxDownloads) * 0.4 +
        (rating / 5) * 0.3 +
        (likes / maxLikes) * 0.2 +
        recencyScore * 0.1;

      return {
        id: tool.id,
        name: tool.name,
        description: tool.description,
        qualityScore: tool.qualityScore ? Number(tool.qualityScore) : null,
        averageRating: tool.averageRating ? Number(tool.averageRating) : null,
        ratingCount: tool.ratingCount,
        reviewCount: tool.reviewCount,
        likeCount: tool.likeCount,
        importHealth: tool.importHealth,
        executionHealth: tool.executionHealth,
        trendingScore: Math.round(trendingScore * 100) / 100,
        createdAt: tool.createdAt.toISOString(),
        package: {
          id: tool.package.id,
          npmPackageName: tool.package.npmPackageName,
          npmVersion: tool.package.npmVersion,
          npmDescription: tool.package.npmDescription,
          category: tool.package.category,
          isOfficial: tool.package.isOfficial,
          npmDownloadsLastMonth: tool.package.npmDownloadsLastMonth,
          githubStars: tool.package.githubStars,
          tier: tool.package.tier,
        },
      };
    });

    // Sort by trending score
    toolsWithScores.sort((a, b) => b.trendingScore - a.trendingScore);

    return NextResponse.json({
      success: true,
      data: toolsWithScores,
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      pagination: {
        limit,
        offset,
        hasMore,
      },
    });
  } catch (error) {
    console.error('[API Error] GET /api/tools/trending:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get trending tools' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
