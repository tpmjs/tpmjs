import { Prisma } from '@prisma/client';
import { prisma } from '@tpmjs/db';
import { NextResponse } from 'next/server';
import { buildEmbeddingText, embedMemoryContent } from '~/lib/ai/memory-embedding';
import { API_KEY_SCOPES } from '~/lib/api-keys';
import { requireAuth } from '~/lib/api-keys/middleware';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_CONTENT_SIZE = 100 * 1024; // 100KB

/**
 * POST /api/memories - Create a new memory
 */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuth(API_KEY_SCOPES.MEMORY_WRITE);
  if (errorResponse) return errorResponse;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { content, summary, namespace, tags, expiresAt, source, sourceAgent, sourceContext } =
    body as {
      content: unknown;
      summary?: string;
      namespace?: string;
      tags?: string[];
      expiresAt?: string;
      source?: string;
      sourceAgent?: string;
      sourceContext?: unknown;
    };

  if (content === undefined || content === null) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const contentStr = JSON.stringify(content);
  const contentSizeBytes = Buffer.byteLength(contentStr, 'utf-8');

  if (contentSizeBytes > MAX_CONTENT_SIZE) {
    return NextResponse.json(
      { error: `content exceeds maximum size of ${MAX_CONTENT_SIZE} bytes` },
      { status: 400 }
    );
  }

  // Auto-generate summary if not provided
  const memorySummary = summary || contentStr.slice(0, 500);

  // Build embedding text and generate embedding
  const embeddingText = buildEmbeddingText(memorySummary, namespace, tags);
  let embedding: number[];
  try {
    embedding = await embedMemoryContent(embeddingText);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Embedding service unavailable';
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const memory = await prisma.memory.create({
    data: {
      userId: auth!.userId!,
      content: content as Prisma.InputJsonValue,
      summary: memorySummary,
      namespace: namespace || null,
      tags: tags || [],
      embedding: embedding as unknown as Prisma.InputJsonValue,
      source: (source as string) || 'api',
      sourceAgent: sourceAgent || null,
      sourceContext: (sourceContext as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      contentSizeBytes,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    select: {
      id: true,
      content: true,
      summary: true,
      namespace: true,
      tags: true,
      source: true,
      sourceAgent: true,
      sourceContext: true,
      contentSizeBytes: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ success: true, data: memory }, { status: 201 });
}

/**
 * GET /api/memories - List memories
 */
export async function GET(request: Request) {
  const { auth, errorResponse } = await requireAuth(API_KEY_SCOPES.MEMORY_READ);
  if (errorResponse) return errorResponse;

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100);
  const offset = Number(url.searchParams.get('offset')) || 0;
  const namespace = url.searchParams.get('namespace');
  const tagsParam = url.searchParams.get('tags');

  const where: Record<string, unknown> = {
    userId: auth!.userId!,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };

  if (namespace) {
    where.namespace = namespace;
  }

  if (tagsParam) {
    const tags = tagsParam
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length > 0) {
      where.tags = { hasSome: tags };
    }
  }

  const memories = await prisma.memory.findMany({
    where,
    select: {
      id: true,
      content: true,
      summary: true,
      namespace: true,
      tags: true,
      source: true,
      sourceAgent: true,
      contentSizeBytes: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit + 1,
  });

  const hasMore = memories.length > limit;
  const data = hasMore ? memories.slice(0, limit) : memories;

  return NextResponse.json({
    success: true,
    data,
    pagination: { limit, offset, hasMore },
  });
}
