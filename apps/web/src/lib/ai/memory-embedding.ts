/**
 * Memory Embedding Service
 *
 * Uses OpenAI text-embedding-3-large (3072 dims) for semantic
 * similarity search across user memories.
 */

import { openai } from '@ai-sdk/openai';
import { prisma } from '@tpmjs/db';
import { embed } from 'ai';
import { cosineSimilarity } from './skills-embedding';

const MEMORY_EMBEDDING_MODEL = 'text-embedding-3-large';
const DEFAULT_SIMILARITY_THRESHOLD = 0.4;

/**
 * Compute embedding for memory content
 */
export async function embedMemoryContent(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding(MEMORY_EMBEDDING_MODEL),
    value: text,
  });
  return embedding;
}

/**
 * Build embedding input text from memory fields.
 * Prepends namespace and tags to the summary for richer context.
 */
export function buildEmbeddingText(
  summary: string,
  namespace?: string | null,
  tags?: string[]
): string {
  const parts: string[] = [];
  if (namespace) parts.push(`[${namespace}]`);
  if (tags && tags.length > 0) parts.push(tags.join(', '));
  parts.push(summary);
  return parts.join(' ');
}

export interface SimilarMemory {
  id: string;
  content: unknown;
  summary: string;
  namespace: string | null;
  tags: string[];
  similarity: number;
  createdAt: Date;
}

/**
 * Find memories similar to a given query embedding
 */
export async function findSimilarMemories(
  queryEmbedding: number[],
  userId: string,
  options: {
    threshold?: number;
    limit?: number;
    namespace?: string;
    tags?: string[];
  } = {}
): Promise<SimilarMemory[]> {
  const { threshold = DEFAULT_SIMILARITY_THRESHOLD, limit = 10, namespace, tags } = options;

  const where: Record<string, unknown> = {
    userId,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };

  if (namespace) {
    where.namespace = namespace;
  }

  if (tags && tags.length > 0) {
    where.tags = { hasSome: tags };
  }

  const memories = await prisma.memory.findMany({
    where,
    select: {
      id: true,
      content: true,
      summary: true,
      namespace: true,
      tags: true,
      embedding: true,
      createdAt: true,
    },
  });

  const similar: SimilarMemory[] = [];

  for (const m of memories) {
    const existingEmbedding = m.embedding as number[];
    if (!existingEmbedding || existingEmbedding.length === 0) continue;

    const similarity = cosineSimilarity(queryEmbedding, existingEmbedding);

    if (similarity >= threshold) {
      similar.push({
        id: m.id,
        content: m.content,
        summary: m.summary,
        namespace: m.namespace,
        tags: m.tags,
        similarity,
        createdAt: m.createdAt,
      });
    }
  }

  return similar.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}
