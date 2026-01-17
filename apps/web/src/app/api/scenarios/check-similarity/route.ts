/**
 * Scenario Similarity Check API
 *
 * POST /api/scenarios/check-similarity   Check if a prompt is similar to existing scenarios
 */

import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '~/lib/api-keys/middleware';
import { checkSimilarity } from '~/lib/scenarios/similarity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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

const CheckSimilaritySchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  collectionId: z.string().min(1, 'Collection ID is required'),
  excludeScenarioId: z.string().optional(), // For updates, exclude the scenario being edited
});

/**
 * POST /api/scenarios/check-similarity
 * Check if a prompt is similar to existing scenarios
 *
 * Returns warning if similarity >= 70%
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
    const parseResult = CheckSimilaritySchema.safeParse(body);

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

    const { prompt, collectionId, excludeScenarioId } = parseResult.data;

    // Verify collection exists and user has access
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { id: true, userId: true, isPublic: true },
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

    // User must own the collection or it must be public
    if (collection.userId !== authResult.userId && !collection.isPublic) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 403 }
      );
    }

    // Check similarity
    const result = await checkSimilarity(prompt, collectionId, excludeScenarioId);

    return NextResponse.json({
      success: true,
      data: {
        hasSimilar: result.hasSimilar,
        maxSimilarity: Math.round(result.maxSimilarity * 100), // Return as percentage
        warningThreshold: 70,
        similar: result.similarScenarios.map((s) => ({
          id: s.scenario.id,
          name: s.scenario.name,
          prompt: s.scenario.prompt.slice(0, 200) + (s.scenario.prompt.length > 200 ? '...' : ''),
          similarity: Math.round(s.similarity * 100),
        })),
      },
      meta: {
        version: API_VERSION,
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  } catch (error) {
    console.error('[API Error] POST /api/scenarios/check-similarity:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to check similarity' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
