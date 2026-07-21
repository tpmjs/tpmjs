/**
 * Skills Embedding Service
 *
 * Uses OpenAI text-embedding-3-large (3072 dims) for high-quality
 * semantic similarity detection in the RealSkills endpoint.
 */

import { openai } from '@ai-sdk/openai';
import { prisma } from '@tpmjs/db';
import { embed } from 'ai';

export const SKILLS_EMBEDDING_MODEL = 'text-embedding-3-large';
export const DEFAULT_SIMILARITY_THRESHOLD = 0.8;
export const CACHE_HIT_THRESHOLD = 0.95;

/**
 * Compute embedding for a question or skill description
 */
export async function embedQuestion(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding(SKILLS_EMBEDDING_MODEL),
    value: text,
  });
  return embedding;
}

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const aVal = a[i] ?? 0;
    const bVal = b[i] ?? 0;
    dotProduct += aVal * bVal;
    normA += aVal * aVal;
    normB += bVal * bVal;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

export interface SimilarQuestion {
  id: string;
  question: string;
  answer: string;
  similarity: number;
  createdAt: Date;
}

/**
 * Find questions similar to a given query embedding
 */
export async function findSimilarQuestions(
  queryEmbedding: number[],
  collectionId: string,
  options: {
    threshold?: number;
    limit?: number;
    excludeId?: string;
  } = {}
): Promise<SimilarQuestion[]> {
  const { threshold = DEFAULT_SIMILARITY_THRESHOLD, limit = 5, excludeId } = options;

  // Fetch all questions for this collection
  const questions = await prisma.skillQuestion.findMany({
    where: {
      collectionId,
      ...(excludeId && { id: { not: excludeId } }),
    },
    select: {
      id: true,
      question: true,
      answer: true,
      embedding: true,
      createdAt: true,
    },
  });

  // Calculate similarity scores
  const similar: SimilarQuestion[] = [];

  for (const q of questions) {
    const existingEmbedding = q.embedding as number[];
    if (!existingEmbedding || existingEmbedding.length === 0) continue;

    const similarity = cosineSimilarity(queryEmbedding, existingEmbedding);

    if (similarity >= threshold) {
      similar.push({
        id: q.id,
        question: q.question,
        answer: q.answer,
        similarity,
        createdAt: q.createdAt,
      });
    }
  }

  // Sort by similarity descending and limit results
  return similar.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}

/**
 * Check for a cache hit (very similar question already answered)
 * Returns the cached answer if similarity > 95%
 */
export async function checkCacheHit(
  queryEmbedding: number[],
  collectionId: string
): Promise<SimilarQuestion | null> {
  const similar = await findSimilarQuestions(queryEmbedding, collectionId, {
    threshold: CACHE_HIT_THRESHOLD,
    limit: 1,
  });

  if (similar.length > 0 && similar[0]) {
    // Increment the similar count for analytics
    await prisma.skillQuestion.update({
      where: { id: similar[0].id },
      data: { similarCount: { increment: 1 } },
    });
    return similar[0];
  }

  return null;
}

export interface SimilarityResult {
  isCacheHit: boolean;
  cachedAnswer: string | null;
  similarQuestions: SimilarQuestion[];
  embedding: number[];
}

/**
 * Full similarity check for a new question
 * - Checks for cache hit (>95% similar)
 * - Returns similar questions for RAG context
 */
export async function checkQuestionSimilarity(
  question: string,
  collectionId: string
): Promise<SimilarityResult> {
  // Generate embedding for the question
  const embedding = await embedQuestion(question);

  // Check for cache hit first
  const cacheHit = await checkCacheHit(embedding, collectionId);
  if (cacheHit) {
    return {
      isCacheHit: true,
      cachedAnswer: cacheHit.answer,
      similarQuestions: [cacheHit],
      embedding,
    };
  }

  // Find similar questions for RAG context
  const similarQuestions = await findSimilarQuestions(embedding, collectionId, {
    threshold: DEFAULT_SIMILARITY_THRESHOLD,
    limit: 5,
  });

  return {
    isCacheHit: false,
    cachedAnswer: null,
    similarQuestions,
    embedding,
  };
}
