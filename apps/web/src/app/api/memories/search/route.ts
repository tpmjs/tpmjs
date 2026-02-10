import { NextResponse } from 'next/server';
import { embedMemoryContent, findSimilarMemories } from '~/lib/ai/memory-embedding';
import { API_KEY_SCOPES } from '~/lib/api-keys';
import { requireAuth } from '~/lib/api-keys/middleware';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/memories/search - Semantic search across memories
 */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuth(API_KEY_SCOPES.MEMORY_READ);
  if (errorResponse) return errorResponse;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { query, namespace, tags, limit, threshold } = body as {
    query: string;
    namespace?: string;
    tags?: string[];
    limit?: number;
    threshold?: number;
  };

  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'query is required and must be a string' }, { status: 400 });
  }

  const queryEmbedding = await embedMemoryContent(query);

  const results = await findSimilarMemories(queryEmbedding, auth!.userId!, {
    threshold: threshold ?? 0.7,
    limit: Math.min(limit ?? 10, 50),
    namespace,
    tags,
  });

  return NextResponse.json({ success: true, data: results });
}
