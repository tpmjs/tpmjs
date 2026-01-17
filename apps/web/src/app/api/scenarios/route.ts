/**
 * Scenarios API - List and Create
 *
 * GET  /api/scenarios         List all public scenarios (paginated)
 * POST /api/scenarios         Create a new scenario
 */

import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '~/lib/api-keys/middleware';

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
}

// Validation schema for creating a scenario
const CreateScenarioSchema = z.object({
  collectionId: z.string().min(1, 'Collection ID is required'),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  name: z.string().max(200).optional(),
  description: z.string().optional(),
  assertions: z
    .object({
      regex: z.array(z.string()).optional(),
      schema: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * GET /api/scenarios
 * List all public scenarios (paginated)
 *
 * Query params:
 * - limit: Max results (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 * - collectionId: Filter by collection (optional)
 * - tags: Comma-separated tags to filter by (optional)
 * - sortBy: Sort field (default: 'qualityScore')
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(Number.parseInt(searchParams.get('limit') || '20', 10), 1),
      100
    );
    const offset = Math.max(Number.parseInt(searchParams.get('offset') || '0', 10), 0);
    const collectionId = searchParams.get('collectionId');
    const tagsParam = searchParams.get('tags');
    const sortBy = searchParams.get('sortBy') || 'qualityScore';

    // Build where clause
    const where: {
      collectionId?: string;
      tags?: { hasSome: string[] };
      collection?: { isPublic: boolean };
    } = {};

    if (collectionId) {
      where.collectionId = collectionId;
    } else {
      // Only show scenarios from public collections when not filtering by collectionId
      where.collection = { isPublic: true };
    }

    if (tagsParam) {
      where.tags = { hasSome: tagsParam.split(',').map((t) => t.trim()) };
    }

    // Build orderBy
    const orderByMap: Record<string, object> = {
      qualityScore: { qualityScore: 'desc' },
      totalRuns: { totalRuns: 'desc' },
      createdAt: { createdAt: 'desc' },
      lastRunAt: { lastRunAt: 'desc' },
    };
    const orderBy = orderByMap[sortBy] || orderByMap.qualityScore;

    // Fetch scenarios with pagination
    const scenarios = await prisma.scenario.findMany({
      where,
      orderBy,
      take: limit + 1,
      skip: offset,
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            slug: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
        _count: {
          select: { runs: true },
        },
      },
    });

    const hasMore = scenarios.length > limit;
    const data = hasMore ? scenarios.slice(0, limit) : scenarios;

    return NextResponse.json({
      success: true,
      data: data.map((s) => ({
        id: s.id,
        collectionId: s.collectionId,
        prompt: s.prompt,
        name: s.name,
        description: s.description,
        tags: s.tags,
        qualityScore: s.qualityScore,
        totalRuns: s.totalRuns,
        lastRunAt: s.lastRunAt,
        lastRunStatus: s.lastRunStatus,
        createdAt: s.createdAt,
        collection: s.collection
          ? {
              id: s.collection.id,
              name: s.collection.name,
              slug: s.collection.slug,
              username: s.collection.user.username,
            }
          : null,
        runCount: s._count.runs,
      })),
      meta: {
        version: API_VERSION,
        timestamp: new Date().toISOString(),
        requestId,
      },
      pagination: {
        limit,
        offset,
        hasMore,
      },
    });
  } catch (error) {
    console.error('[API Error] GET /api/scenarios:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch scenarios' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scenarios
 * Create a new scenario
 *
 * Requires authentication
 * User must own the collection
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();

  try {
    // Check authentication
    const authResult = await authenticateRequest();

    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = CreateScenarioSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: { errors: parseResult.error.flatten().fieldErrors },
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 400 }
      );
    }

    const { collectionId, prompt, name, description, assertions, tags } = parseResult.data;

    // Verify collection exists and user owns it
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { id: true, userId: true },
    });

    if (!collection) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Collection not found' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 404 }
      );
    }

    if (collection.userId !== authResult.userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not own this collection' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 403 }
      );
    }

    // Create the scenario
    const scenario = await prisma.scenario.create({
      data: {
        collectionId,
        prompt,
        name,
        description,
        assertions: assertions ? (assertions as object) : undefined,
        tags: tags || [],
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: scenario.id,
          collectionId: scenario.collectionId,
          prompt: scenario.prompt,
          name: scenario.name,
          description: scenario.description,
          assertions: scenario.assertions,
          tags: scenario.tags,
          qualityScore: scenario.qualityScore,
          totalRuns: scenario.totalRuns,
          createdAt: scenario.createdAt,
          collection: scenario.collection
            ? {
                id: scenario.collection.id,
                name: scenario.collection.name,
                slug: scenario.collection.slug,
              }
            : null,
        },
        meta: {
          version: API_VERSION,
          timestamp: new Date().toISOString(),
          requestId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API Error] POST /api/scenarios:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create scenario' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
