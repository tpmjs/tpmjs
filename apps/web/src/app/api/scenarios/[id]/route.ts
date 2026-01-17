/**
 * Scenario API - Get, Update, Delete individual scenario
 *
 * GET    /api/scenarios/[id]   Get scenario details
 * PATCH  /api/scenarios/[id]   Update scenario
 * DELETE /api/scenarios/[id]   Delete scenario
 */

import { Prisma, prisma } from '@tpmjs/db';
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

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Validation schema for updating a scenario
const UpdateScenarioSchema = z.object({
  prompt: z.string().min(10).optional(),
  name: z.string().max(200).nullish(),
  description: z.string().nullish(),
  assertions: z
    .object({
      regex: z.array(z.string()).optional(),
      schema: z.record(z.string(), z.unknown()).optional(),
    })
    .nullish(),
  tags: z.array(z.string()).optional(),
});

/**
 * GET /api/scenarios/[id]
 * Get scenario details with recent runs
 *
 * Query params:
 * - runsLimit: Max runs to return (default: 10, max: 50)
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;

  try {
    const { searchParams } = new URL(request.url);
    const runsLimit = Math.min(
      Math.max(Number.parseInt(searchParams.get('runsLimit') || '10', 10), 1),
      50
    );

    // Check authentication (optional - affects what data is shown)
    const authResult = await authenticateRequest();

    const scenario = await prisma.scenario.findUnique({
      where: { id },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            slug: true,
            isPublic: true,
            userId: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
        runs: {
          orderBy: { createdAt: 'desc' },
          take: runsLimit,
          select: {
            id: true,
            status: true,
            evaluatorVerdict: true,
            executionTimeMs: true,
            totalTokens: true,
            startedAt: true,
            completedAt: true,
            createdAt: true,
          },
        },
        _count: {
          select: { runs: true },
        },
      },
    });

    if (!scenario) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Scenario not found' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 404 }
      );
    }

    // Check access - collection must be public OR user must own it
    const isOwner = authResult.authenticated && scenario.collection?.userId === authResult.userId;
    const isPublic = scenario.collection?.isPublic ?? false;

    if (!isOwner && !isPublic) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
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
        consecutivePasses: scenario.consecutivePasses,
        consecutiveFails: scenario.consecutiveFails,
        totalRuns: scenario.totalRuns,
        lastRunAt: scenario.lastRunAt,
        lastRunStatus: scenario.lastRunStatus,
        createdAt: scenario.createdAt,
        updatedAt: scenario.updatedAt,
        isOwner,
        collection: scenario.collection
          ? {
              id: scenario.collection.id,
              name: scenario.collection.name,
              slug: scenario.collection.slug,
              username: scenario.collection.user.username,
            }
          : null,
        recentRuns: scenario.runs,
        runCount: scenario._count.runs,
      },
      meta: {
        version: API_VERSION,
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  } catch (error) {
    console.error('[API Error] GET /api/scenarios/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch scenario' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/scenarios/[id]
 * Update a scenario
 *
 * Requires authentication and ownership of the collection
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;

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

    // Find scenario and check ownership
    const existing = await prisma.scenario.findUnique({
      where: { id },
      include: {
        collection: {
          select: { userId: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Scenario not found' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 404 }
      );
    }

    if (existing.collection?.userId !== authResult.userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = UpdateScenarioSchema.safeParse(body);

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

    const { prompt, name, description, assertions, tags } = parseResult.data;

    // Update scenario (transform null to Prisma.JsonNull for JSON fields)
    const scenario = await prisma.scenario.update({
      where: { id },
      data: {
        ...(prompt !== undefined && { prompt }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(assertions !== undefined && {
          assertions:
            assertions === null
              ? Prisma.JsonNull
              : (assertions as unknown as Prisma.InputJsonValue),
        }),
        ...(tags !== undefined && { tags }),
      },
    });

    return NextResponse.json({
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
        updatedAt: scenario.updatedAt,
      },
      meta: {
        version: API_VERSION,
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  } catch (error) {
    console.error('[API Error] PATCH /api/scenarios/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update scenario' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scenarios/[id]
 * Delete a scenario
 *
 * Requires authentication and ownership of the collection
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;

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

    // Find scenario and check ownership
    const existing = await prisma.scenario.findUnique({
      where: { id },
      include: {
        collection: {
          select: { userId: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Scenario not found' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 404 }
      );
    }

    if (existing.collection?.userId !== authResult.userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 403 }
      );
    }

    // Delete scenario (cascade will delete runs and embedding)
    await prisma.scenario.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
      meta: {
        version: API_VERSION,
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  } catch (error) {
    console.error('[API Error] DELETE /api/scenarios/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete scenario' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
