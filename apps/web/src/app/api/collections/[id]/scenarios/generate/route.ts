/**
 * Scenario Generation API
 *
 * POST /api/collections/[id]/scenarios/generate   Generate AI-powered scenarios for a collection
 */

import { prisma } from '@tpmjs/db';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '~/lib/api-keys/middleware';
import {
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  apiValidationError,
} from '~/lib/api-response';
import { AI_GENERATION_RATE_LIMIT, checkRateLimitDistributed } from '~/lib/rate-limit';
import { generateScenarios } from '~/lib/scenarios/generate-prompt';
import { checkSimilarity, generateAndStoreEmbedding } from '~/lib/scenarios/similarity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // AI generation + embeddings can take time

type RouteContext = {
  params: Promise<{ id: string }>;
};

const GenerateRequestSchema = z.object({
  count: z.number().int().min(1).max(10).default(1),
  skipSimilarityCheck: z.boolean().default(false),
});

/**
 * POST /api/collections/[id]/scenarios/generate
 * Generate AI-powered scenarios for a collection
 *
 * Body:
 * - count: Number of scenarios to generate (1-10, default: 1)
 * - skipSimilarityCheck: If true, skip duplicate warning (default: false)
 *
 * Returns generated scenarios with similarity warnings if applicable
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    // Check authentication
    const authResult = await authenticateRequest();

    if (!authResult.authenticated || !authResult.userId) {
      return apiForbidden('Authentication required to generate scenarios', requestId);
    }

    // Rate limit check (strict for AI operations)
    const rateLimitResponse = await checkRateLimitDistributed(request, AI_GENERATION_RATE_LIMIT);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { id } = await context.params;

    // Parse request body
    let body: { count?: number; skipSimilarityCheck?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine, use defaults
    }

    const parseResult = GenerateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return apiValidationError(
        'Invalid request body',
        { errors: parseResult.error.flatten().fieldErrors },
        requestId
      );
    }

    const { count, skipSimilarityCheck } = parseResult.data;

    // Fetch collection with tools
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        tools: {
          include: {
            tool: {
              select: {
                name: true,
                description: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!collection) {
      return apiNotFound('Collection', requestId);
    }

    // User must own the collection to generate scenarios
    if (collection.userId !== authResult.userId) {
      return apiForbidden('You can only generate scenarios for your own collections', requestId);
    }

    // Validate collection has tools
    if (collection.tools.length === 0) {
      return apiForbidden(
        'Collection must have at least one tool to generate scenarios',
        requestId
      );
    }

    // Prepare collection info for AI generation
    const collectionInfo = {
      name: collection.name,
      description: collection.description,
      tools: collection.tools.map((ct) => ({
        name: ct.tool.name,
        description: ct.tool.description,
      })),
    };

    // Generate scenarios with AI
    const generatedScenarios = await generateScenarios(collectionInfo, count);

    // Process each generated scenario
    const results: Array<{
      scenario: {
        id: string;
        prompt: string;
        name: string | null;
        tags: string[];
      };
      similarity?: {
        hasSimilar: boolean;
        maxSimilarity: number;
        similar: Array<{ id: string; name: string | null; similarity: number }>;
      };
    }> = [];

    for (const generated of generatedScenarios) {
      // Check similarity unless skipped
      let similarityResult: {
        hasSimilar: boolean;
        maxSimilarity: number;
        similarScenarios: Array<{
          scenario: { id: string; name: string | null };
          similarity: number;
        }>;
      } | null = null;

      if (!skipSimilarityCheck) {
        similarityResult = await checkSimilarity(generated.prompt, collection.id);
      }

      // Create the scenario
      const scenario = await prisma.scenario.create({
        data: {
          collectionId: collection.id,
          prompt: generated.prompt,
          name: generated.name,
          tags: generated.tags,
        },
      });

      // Generate and store embedding for future similarity checks
      await generateAndStoreEmbedding(scenario.id, generated.prompt);

      results.push({
        scenario: {
          id: scenario.id,
          prompt: scenario.prompt,
          name: scenario.name,
          tags: scenario.tags,
        },
        ...(similarityResult && similarityResult.hasSimilar
          ? {
              similarity: {
                hasSimilar: true,
                maxSimilarity: Math.round(similarityResult.maxSimilarity * 100),
                similar: similarityResult.similarScenarios.slice(0, 3).map((s) => ({
                  id: s.scenario.id,
                  name: s.scenario.name,
                  similarity: Math.round(s.similarity * 100),
                })),
              },
            }
          : {}),
      });
    }

    return apiSuccess(
      {
        scenarios: results,
        generatedAt: new Date().toISOString(),
      },
      { requestId, status: 201 }
    );
  } catch (error) {
    console.error('[API Error] POST /api/collections/[id]/scenarios/generate:', error);
    return apiInternalError('Failed to generate scenarios', requestId);
  }
}
