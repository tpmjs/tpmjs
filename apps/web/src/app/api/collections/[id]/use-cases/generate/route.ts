import { prisma } from '@tpmjs/db';
import type { NextRequest } from 'next/server';

import { generateUseCases } from '~/lib/ai/use-cases-generator';
import { apiForbidden, apiInternalError, apiNotFound, apiSuccess } from '~/lib/api-response';
import { AI_GENERATION_RATE_LIMIT, checkRateLimitDistributed } from '~/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // AI generation can take time

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/collections/[id]/use-cases/generate
 * Generate AI-powered use cases for a public collection
 * Rate limited to 5 requests per hour per IP (expensive AI operation)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    // Rate limit check (strict for AI operations)
    const rateLimitResponse = await checkRateLimitDistributed(request, AI_GENERATION_RATE_LIMIT);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { id } = await context.params;

    // Fetch collection with tools
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        tools: {
          include: {
            tool: {
              include: {
                package: {
                  select: { npmPackageName: true },
                },
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

    // Only public collections can have use cases generated
    if (!collection.isPublic) {
      return apiForbidden('Use cases can only be generated for public collections', requestId);
    }

    // Validate collection has tools
    if (collection.tools.length === 0) {
      return apiForbidden(
        'Collection must have at least one tool to generate use cases',
        requestId
      );
    }

    // Prepare tool info for AI
    const toolsInfo = collection.tools.map((ct) => ({
      name: ct.tool.name,
      description: ct.tool.description,
      packageName: ct.tool.package.npmPackageName,
      inputSchema: ct.tool.inputSchema,
    }));

    // Generate use cases with AI (3 simple + 3 complex = 6 total)
    const result = await generateUseCases(collection.name, collection.description, toolsInfo);

    // Save to database
    const now = new Date();
    await prisma.collection.update({
      where: { id },
      data: {
        useCases: result.useCases,
        useCasesGeneratedAt: now,
      },
    });

    return apiSuccess(
      {
        useCases: result.useCases,
        generatedAt: now.toISOString(),
      },
      { requestId }
    );
  } catch (error) {
    console.error('[API Error] POST /api/collections/[id]/use-cases/generate:', error);
    return apiInternalError('Failed to generate use cases', requestId);
  }
}
