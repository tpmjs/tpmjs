/**
 * GET /:username/collections/:slug/skills.md
 * Generate skills documentation for a collection.
 *
 * Enhanced generation analyzes package source with a model. Registry-backed
 * generation remains available when that provider is unavailable. Large
 * collections use per-tool caching and recursive batch processing.
 */

import { prisma } from '@tpmjs/db';
import type { NextRequest } from 'next/server';

import {
  fetchMultiplePackageSources,
  fetchPackageSource,
  type PackageSource,
} from '~/lib/ai/package-source-fetcher';
import {
  generateRegistrySkillsSummary,
  generateRegistryToolSkills,
  generationErrorMessage,
} from '~/lib/ai/skills-fallback-generator';
import { generateSkillsMarkdown } from '~/lib/ai/skills-generator';
import { assembleSkillsDocument, generateSkillsSummary } from '~/lib/ai/skills-summary-generator';
import { generateToolSkillsBatch } from '~/lib/ai/tool-skills-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Extended for chunked generation (5 min)

// Cache for 1 week
const CACHE_DURATION_SECONDS = 7 * 24 * 60 * 60; // 604800 seconds

// Batch size for chunked generation
const BATCH_SIZE = 10;

// Threshold for using chunked generation (tools)
const CHUNKED_THRESHOLD = 20;

type RouteContext = {
  params: Promise<{ username: string; slug: string }>;
};

interface CollectionWithTools {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  isPublic: boolean;
  skillsMarkdown: string | null;
  skillsGeneratedAt: Date | null;
  tools: Array<{
    tool: {
      id: string;
      name: string;
      description: string;
      inputSchema: unknown;
      package: {
        npmPackageName: string;
        npmVersion: string;
      };
    };
  }>;
}

/**
 * Load collection with tools from database
 */
async function loadCollection(
  username: string,
  slug: string
): Promise<{ user: { username: string }; collection: CollectionWithTools } | Response> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true },
  });

  if (!user || !user.username) {
    return new Response('User not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const collection = await prisma.collection.findFirst({
    where: { slug, userId: user.id },
    include: {
      tools: {
        include: {
          tool: {
            select: {
              id: true,
              name: true,
              description: true,
              inputSchema: true,
              package: { select: { npmPackageName: true, npmVersion: true } },
            },
          },
        },
        orderBy: { position: 'asc' },
        take: 100,
      },
    },
  });

  if (!collection) {
    return new Response('Collection not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  if (!collection.isPublic) {
    return new Response('This collection is not public', {
      status: 403,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return { user: { username: user.username }, collection };
}

/**
 * Check cache and return cached response if valid
 */
function checkCache(collection: CollectionWithTools, cachebust: boolean): Response | null {
  if (cachebust || !collection.skillsMarkdown || !collection.skillsGeneratedAt) {
    return null;
  }

  const cacheAge = Date.now() - collection.skillsGeneratedAt.getTime();
  if (cacheAge >= CACHE_DURATION_SECONDS * 1000) {
    return null;
  }

  return new Response(collection.skillsMarkdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': `public, s-maxage=${CACHE_DURATION_SECONDS}, stale-while-revalidate=86400`,
      'X-Cache': 'HIT',
      'X-Cache-Age': Math.floor(cacheAge / 1000).toString(),
    },
  });
}

/**
 * GET /:username/collections/:slug/skills.md
 * Generate skills.md markdown for a collection
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { username: rawUsername, slug } = await context.params;
    const username = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;

    const cachebust = request.nextUrl.searchParams.has('cachebust');
    const batchIndex = request.nextUrl.searchParams.get('_batch');
    const jobId = request.nextUrl.searchParams.get('_jobId');

    // Handle batch continuation requests
    if (batchIndex !== null && jobId) {
      return handleBatchContinuation(jobId, parseInt(batchIndex, 10), username, slug);
    }

    // Load collection from database
    const result = await loadCollection(username, slug);
    if (result instanceof Response) return result;
    const { user, collection } = result;

    // Check cache
    const cachedResponse = checkCache(collection, cachebust);
    if (cachedResponse) return cachedResponse;

    if (collection.tools.length === 0) {
      return new Response('Collection has no tools', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Build MCP URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tpmjs.com';
    const mcpUrls = {
      http: `${baseUrl}/api/mcp/${username}/${slug}/http`,
      sse: `${baseUrl}/api/mcp/${username}/${slug}/sse`,
    };

    // Route to appropriate handler based on collection size
    if (collection.tools.length < CHUNKED_THRESHOLD) {
      return handleSmallCollection(collection, user.username, mcpUrls);
    }
    return handleLargeCollection(collection, user.username, mcpUrls, cachebust);
  } catch (error) {
    console.error('[Skills.md Error]:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate skills documentation';
    return new Response(`Error: ${message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * Handle small collections with the original monolithic approach
 */
async function handleSmallCollection(
  collection: CollectionWithTools,
  username: string,
  mcpUrls: { http: string; sse: string }
): Promise<Response> {
  const tools = collection.tools.map((ct) => ({
    id: ct.tool.id,
    name: ct.tool.name,
    description: ct.tool.description,
    packageName: ct.tool.package.npmPackageName,
    inputSchema: ct.tool.inputSchema,
  }));

  // Get unique packages to fetch
  const uniquePackages = [
    ...new Map(
      collection.tools.map((ct) => [
        ct.tool.package.npmPackageName,
        {
          name: ct.tool.package.npmPackageName,
          version: ct.tool.package.npmVersion,
        },
      ])
    ).values(),
  ];

  // Fetch package sources (limit to 5 packages for performance)
  const packageSources = await fetchMultiplePackageSources(uniquePackages.slice(0, 5));

  const collectionData = {
    id: collection.id,
    name: collection.name,
    slug: collection.slug || '',
    description: collection.description,
    username,
  };
  let generationMode: 'monolithic-ai' | 'registry-fallback' = 'monolithic-ai';
  let skillsMarkdown: string;

  try {
    skillsMarkdown = await generateSkillsMarkdown(collectionData, tools, packageSources, mcpUrls);
  } catch (error) {
    console.warn(
      `[Skills.md] Enhanced generation unavailable for ${username}/${collection.slug}; using available documentation: ${generationErrorMessage(error)}`
    );

    // Preserve a richer prior document if revalidation fails. The response is
    // explicitly marked stale and receives a bounded shared-cache lifetime.
    if (collection.skillsMarkdown) {
      return new Response(collection.skillsMarkdown, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': 'public, s-maxage=3600, stale-if-error=604800',
          Warning: '110 - "Enhanced generation unavailable; serving stale documentation"',
          'X-Cache': 'STALE',
          'X-Generation-Mode': 'stale-cache',
        },
      });
    }

    generationMode = 'registry-fallback';
    const toolSections = collection.tools.map((ct) =>
      generateRegistryToolSkills({
        name: ct.tool.name,
        description: ct.tool.description,
        packageName: ct.tool.package.npmPackageName,
        packageVersion: ct.tool.package.npmVersion,
        inputSchema: ct.tool.inputSchema,
      })
    );
    const packageNames = collection.tools.map((ct) => ct.tool.package.npmPackageName);
    const summary = generateRegistrySkillsSummary(
      collectionData,
      toolSections.length,
      packageNames
    );
    skillsMarkdown = assembleSkillsDocument(
      collectionData,
      toolSections,
      summary,
      mcpUrls,
      packageNames
    );
  }

  // Save to database for caching
  await prisma.collection.update({
    where: { id: collection.id },
    data: {
      skillsMarkdown,
      skillsGeneratedAt: new Date(),
    },
  });

  return new Response(skillsMarkdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': `public, s-maxage=${CACHE_DURATION_SECONDS}, stale-while-revalidate=86400`,
      'X-Cache': 'MISS',
      'X-Generation-Mode': generationMode,
    },
  });
}

/**
 * Handle large collections with chunked generation
 */
async function handleLargeCollection(
  collection: CollectionWithTools,
  username: string,
  mcpUrls: { http: string; sse: string },
  cachebust: boolean
): Promise<Response> {
  const toolIds = collection.tools.map((ct) => ct.tool.id);

  // Check for existing in-progress job
  const existingJob = await prisma.skillsGenerationJob.findFirst({
    where: {
      collectionId: collection.id,
      status: { in: ['pending', 'processing'] },
      // Only consider jobs from the last 10 minutes (prevent stuck jobs)
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
    },
  });

  if (existingJob) {
    // Job in progress - return 202 Accepted with retry hint
    return new Response(
      JSON.stringify({
        status: 'processing',
        message: 'Skills generation in progress',
        progress: {
          currentBatch: existingJob.currentBatch,
          totalBatches: existingJob.totalBatches,
          completedTools: existingJob.completedToolIds.length,
          totalTools: toolIds.length,
        },
      }),
      {
        status: 202,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '10',
        },
      }
    );
  }

  // Check which tools already have cached skills (unless cachebust)
  let toolsWithCache: string[] = [];
  if (!cachebust) {
    const cachedTools = await prisma.toolSkillsCache.findMany({
      where: { toolId: { in: toolIds } },
      select: { toolId: true },
    });
    toolsWithCache = cachedTools.map((c) => c.toolId);
  }

  const toolsNeedingGeneration = toolIds.filter((id) => !toolsWithCache.includes(id));

  // If all tools are cached, assemble final document
  if (toolsNeedingGeneration.length === 0) {
    return assembleFinalDocument(collection, username, mcpUrls);
  }

  // Create a new generation job
  const totalBatches = Math.ceil(toolsNeedingGeneration.length / BATCH_SIZE);
  const job = await prisma.skillsGenerationJob.create({
    data: {
      collectionId: collection.id,
      status: 'processing',
      currentBatch: 0,
      totalBatches,
      completedToolIds: toolsWithCache, // Include already-cached tools
    },
  });

  // Process the first batch synchronously
  try {
    await processBatch(job.id, 0, collection, toolsNeedingGeneration);
  } catch (error) {
    console.error('[Skills.md] Batch 0 failed:', error);
    await prisma.skillsGenerationJob.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }

  // Check if there are more batches to process
  if (totalBatches > 1) {
    // Trigger the next batch via recursive fetch
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tpmjs.com';
    const nextBatchUrl = `${baseUrl}/${username}/collections/${collection.slug}/skills.md?_batch=1&_jobId=${job.id}`;

    // Fire and forget - don't await
    fetch(nextBatchUrl, {
      method: 'GET',
      headers: { 'x-internal': 'true' },
    }).catch((err) => {
      console.error('[Skills.md] Failed to trigger batch 1:', err);
    });

    // Return 202 to indicate processing
    return new Response(
      JSON.stringify({
        status: 'processing',
        message: 'Skills generation started',
        progress: {
          currentBatch: 1,
          totalBatches,
          completedTools: BATCH_SIZE + toolsWithCache.length,
          totalTools: toolIds.length,
        },
      }),
      {
        status: 202,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '15',
        },
      }
    );
  }

  // Single batch - assemble and return final document
  return assembleFinalDocument(collection, username, mcpUrls);
}

/**
 * Handle batch continuation (recursive call)
 */
async function handleBatchContinuation(
  jobId: string,
  batchIndex: number,
  username: string,
  slug: string
): Promise<Response> {
  // Fetch the job
  const job = await prisma.skillsGenerationJob.findUnique({
    where: { id: jobId },
    include: {
      collection: {
        include: {
          tools: {
            include: {
              tool: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  inputSchema: true,
                  package: {
                    select: {
                      npmPackageName: true,
                      npmVersion: true,
                    },
                  },
                },
              },
            },
            orderBy: { position: 'asc' },
            take: 100,
          },
        },
      },
    },
  });

  if (!job || job.status === 'failed' || job.status === 'completed') {
    return new Response('Job not found or already completed', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const collection = job.collection;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tpmjs.com';
  const mcpUrls = {
    http: `${baseUrl}/api/mcp/${username}/${slug}/http`,
    sse: `${baseUrl}/api/mcp/${username}/${slug}/sse`,
  };

  // Get tools needing generation
  const allToolIds = collection.tools.map((ct) => ct.tool.id);
  const toolsNeedingGeneration = allToolIds.filter((id) => !job.completedToolIds.includes(id));

  try {
    await processBatch(job.id, batchIndex, collection, toolsNeedingGeneration);
  } catch (error) {
    console.error(`[Skills.md] Batch ${batchIndex} failed:`, error);
    await prisma.skillsGenerationJob.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    return new Response('Batch processing failed', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Check if there are more batches
  if (batchIndex + 1 < job.totalBatches) {
    // Trigger next batch
    const nextBatchUrl = `${baseUrl}/${username}/collections/${slug}/skills.md?_batch=${batchIndex + 1}&_jobId=${job.id}`;

    fetch(nextBatchUrl, {
      method: 'GET',
      headers: { 'x-internal': 'true' },
    }).catch((err) => {
      console.error(`[Skills.md] Failed to trigger batch ${batchIndex + 1}:`, err);
    });

    return new Response(
      JSON.stringify({
        status: 'processing',
        batchCompleted: batchIndex,
        nextBatch: batchIndex + 1,
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // All batches done - run final pass
  const result = await assembleFinalDocument(collection, username, mcpUrls);

  // Mark job as completed
  await prisma.skillsGenerationJob.update({
    where: { id: job.id },
    data: { status: 'completed' },
  });

  return result;
}

/**
 * Process a single batch of tools
 */
async function processBatch(
  jobId: string,
  batchIndex: number,
  collection: CollectionWithTools,
  toolsNeedingGeneration: string[]
): Promise<void> {
  const startIdx = batchIndex * BATCH_SIZE;
  const endIdx = Math.min(startIdx + BATCH_SIZE, toolsNeedingGeneration.length);
  const batchToolIds = toolsNeedingGeneration.slice(startIdx, endIdx);

  if (batchToolIds.length === 0) {
    return;
  }

  // Get tool data for this batch
  const batchTools = collection.tools
    .filter((ct) => batchToolIds.includes(ct.tool.id))
    .map((ct) => ({
      id: ct.tool.id,
      name: ct.tool.name,
      description: ct.tool.description,
      packageName: ct.tool.package.npmPackageName,
      packageVersion: ct.tool.package.npmVersion,
      inputSchema: ct.tool.inputSchema,
    }));

  // Get unique packages for this batch
  const uniquePackages = [...new Set(batchTools.map((t) => t.packageName))];

  // Fetch package sources for this batch (limit to 5 per batch)
  const packageSourceResults = await Promise.allSettled(
    uniquePackages
      .slice(0, 5)
      .map((name) =>
        fetchPackageSource(name, batchTools.find((t) => t.packageName === name)?.packageVersion)
      )
  );

  const packageSourcesMap = new Map<string, PackageSource>();
  for (const result of packageSourceResults) {
    if (result.status === 'fulfilled') {
      packageSourcesMap.set(result.value.packageName, result.value);
    }
  }

  // Generate skills for batch
  const results = await generateToolSkillsBatch(batchTools, packageSourcesMap);

  // Save to per-tool cache
  const cacheUpserts = Array.from(results.entries()).map(([toolId, result]) =>
    prisma.toolSkillsCache.upsert({
      where: { toolId },
      create: {
        toolId,
        skillsMarkdown: result.markdown,
      },
      // A provider outage must not replace richer cached AI documentation with
      // a fallback. The fallback is only created when no cache exists.
      update:
        result.generationMode === 'ai'
          ? {
              skillsMarkdown: result.markdown,
              generatedAt: new Date(),
            }
          : {},
    })
  );

  await Promise.all(cacheUpserts);

  // Update job progress
  const completedToolIds = [...batchToolIds];

  await prisma.skillsGenerationJob.update({
    where: { id: jobId },
    data: {
      currentBatch: batchIndex + 1,
      completedToolIds: { push: completedToolIds },
    },
  });
}

/**
 * Assemble the final document from cached tool sections
 */
async function assembleFinalDocument(
  collection: CollectionWithTools,
  username: string,
  mcpUrls: { http: string; sse: string }
): Promise<Response> {
  const toolIds = collection.tools.map((ct) => ct.tool.id);

  // Fetch all cached tool sections
  const cachedTools = await prisma.toolSkillsCache.findMany({
    where: { toolId: { in: toolIds } },
  });

  // Create a map for ordering
  const cacheMap = new Map(cachedTools.map((c) => [c.toolId, c.skillsMarkdown]));

  // Order sections by collection tool order
  const toolSections = collection.tools
    .map((ct) => cacheMap.get(ct.tool.id))
    .filter((section): section is string => !!section);

  // Get package names for summary
  const packageNames = collection.tools.map((ct) => ct.tool.package.npmPackageName);

  // Generate summary (second AI pass)
  const summary = await generateSkillsSummary(
    {
      id: collection.id,
      name: collection.name,
      slug: collection.slug || '',
      description: collection.description,
      username,
    },
    toolSections,
    mcpUrls,
    packageNames
  );

  // Assemble final document
  const skillsMarkdown = assembleSkillsDocument(
    {
      id: collection.id,
      name: collection.name,
      slug: collection.slug || '',
      description: collection.description,
      username,
    },
    toolSections,
    summary,
    mcpUrls,
    packageNames
  );

  // Save to database for caching
  await prisma.collection.update({
    where: { id: collection.id },
    data: {
      skillsMarkdown,
      skillsGeneratedAt: new Date(),
    },
  });

  return new Response(skillsMarkdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': `public, s-maxage=${CACHE_DURATION_SECONDS}, stale-while-revalidate=86400`,
      'X-Cache': 'MISS',
      'X-Generation-Mode':
        summary.generationMode === 'registry-fallback' ? 'chunked-fallback' : 'chunked-ai',
      'X-Tool-Count': toolSections.length.toString(),
    },
  });
}
