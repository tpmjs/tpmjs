/**
 * Scenario Similarity Service
 *
 * Uses OpenAI embeddings to detect similar scenarios.
 * Embeddings are stored in PostgreSQL JSONB for persistence.
 */

import { openai } from '@ai-sdk/openai';
import type { Scenario, ScenarioEmbedding } from '@prisma/client';
import { prisma } from '@tpmjs/db';
import { embed } from 'ai';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const SIMILARITY_THRESHOLD = 0.7; // 70% similarity triggers warning

/**
 * Compute embedding for a text string
 */
export async function computeEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: text,
  });
  return embedding;
}

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
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

export interface SimilarScenario {
  scenario: Scenario;
  similarity: number;
}

/**
 * Find scenarios similar to a given prompt
 *
 * @param prompt The prompt to check for similarity
 * @param collectionId The collection to search within
 * @param threshold Minimum similarity score (0-1), default 0.7
 * @param excludeScenarioId Optional scenario ID to exclude (for updates)
 */
export async function findSimilarScenarios(
  prompt: string,
  collectionId: string,
  threshold: number = SIMILARITY_THRESHOLD,
  excludeScenarioId?: string
): Promise<SimilarScenario[]> {
  // Compute embedding for the new prompt
  const newEmbedding = await computeEmbedding(prompt);

  // Get all scenarios with embeddings for this collection
  const scenarios = await prisma.scenario.findMany({
    where: {
      collectionId,
      ...(excludeScenarioId && { id: { not: excludeScenarioId } }),
      embedding: { isNot: null },
    },
    include: {
      embedding: true,
    },
  });

  // Calculate similarity scores
  const similar: SimilarScenario[] = [];

  for (const scenario of scenarios) {
    if (!scenario.embedding) continue;

    const existingEmbedding = scenario.embedding.embedding as number[];
    const similarity = cosineSimilarity(newEmbedding, existingEmbedding);

    if (similarity >= threshold) {
      // Remove embedding from returned scenario to keep response light
      const { embedding: _, ...scenarioWithoutEmbedding } = scenario;
      similar.push({
        scenario: scenarioWithoutEmbedding as Scenario,
        similarity,
      });
    }
  }

  // Sort by similarity descending
  return similar.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Store embedding for a scenario
 */
export async function storeScenarioEmbedding(
  scenarioId: string,
  embedding: number[]
): Promise<ScenarioEmbedding> {
  // Upsert to handle both create and update cases
  return prisma.scenarioEmbedding.upsert({
    where: { scenarioId },
    update: {
      embedding: embedding as unknown as object,
      model: EMBEDDING_MODEL,
    },
    create: {
      scenarioId,
      embedding: embedding as unknown as object,
      model: EMBEDDING_MODEL,
    },
  });
}

/**
 * Generate and store embedding for a scenario
 */
export async function generateAndStoreEmbedding(
  scenarioId: string,
  prompt: string
): Promise<ScenarioEmbedding> {
  const embedding = await computeEmbedding(prompt);
  return storeScenarioEmbedding(scenarioId, embedding);
}

/**
 * Check similarity and return warning if similar scenarios exist
 */
export interface SimilarityCheckResult {
  hasSimilar: boolean;
  maxSimilarity: number;
  similarScenarios: SimilarScenario[];
}

export async function checkSimilarity(
  prompt: string,
  collectionId: string,
  excludeScenarioId?: string
): Promise<SimilarityCheckResult> {
  const similar = await findSimilarScenarios(
    prompt,
    collectionId,
    SIMILARITY_THRESHOLD,
    excludeScenarioId
  );

  const firstSimilar = similar[0];
  return {
    hasSimilar: similar.length > 0,
    maxSimilarity: firstSimilar?.similarity ?? 0,
    similarScenarios: similar.slice(0, 5), // Return top 5 similar
  };
}
