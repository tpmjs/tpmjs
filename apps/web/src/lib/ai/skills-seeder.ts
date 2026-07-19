/**
 * Skills Seeder
 *
 * Lazy seeding of synthetic questions on first access.
 * Generates questions from:
 * - Existing skills.md documentation
 * - Tool capabilities and descriptions
 * - Common use case patterns
 */

import type { Collection, Tool } from '@prisma/client';
import { prisma } from '@tpmjs/db';
import { generateObject } from 'ai';
import { z } from 'zod';
import { textModel } from './provider';
import { embedQuestion } from './skills-embedding';
import { updateSkillGraph } from './skills-graph-updater';
import { type CollectionContext, generateSkillResponse } from './skills-response-generator';

const SEED_BATCH_SIZE = 5;
const SEEDING_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export interface CollectionWithTools extends Collection {
  tools: Array<
    Tool & {
      package: { npmPackageName: string };
    }
  >;
}

/**
 * Generate synthetic questions from skills markdown
 */
async function generateQuestionsFromSkillsMarkdown(
  skillsMarkdown: string,
  collectionName: string,
  count: number = 5
): Promise<string[]> {
  const { object } = await generateObject({
    model: textModel(),
    schema: z.object({
      questions: z.array(z.string()),
    }),
    system: `You generate realistic questions that users might ask about a tool collection.
Generate practical, specific questions based on the skills documentation.
Questions should be natural and varied - some simple, some complex.`,
    prompt: `Collection: ${collectionName}

Skills Documentation:
${skillsMarkdown.slice(0, 4000)}

Generate ${count} questions that someone using these tools might ask:`,
    temperature: 0.7,
  });

  return object.questions;
}

/**
 * Generate synthetic questions from tool descriptions
 */
async function generateQuestionsFromTools(
  tools: Array<Tool & { package: { npmPackageName: string } }>,
  count: number = 5
): Promise<string[]> {
  const toolInfo = tools
    .slice(0, 10) // Limit to first 10 tools
    .map((t) => `- ${t.name}: ${t.description}`)
    .join('\n');

  const { object } = await generateObject({
    model: textModel(),
    schema: z.object({
      questions: z.array(z.string()),
    }),
    system: `You generate realistic questions that users might ask when learning to use tools.
Questions should cover:
- How to use specific tools
- Error handling
- Common use cases
- Integration patterns
- Edge cases`,
    prompt: `Available tools:
${toolInfo}

Generate ${count} practical questions about using these tools:`,
    temperature: 0.7,
  });

  return object.questions;
}

/**
 * Generate common use case questions
 */
async function generateCommonUseCaseQuestions(
  collectionName: string,
  collectionDescription: string | null,
  count: number = 3
): Promise<string[]> {
  const { object } = await generateObject({
    model: textModel(),
    schema: z.object({
      questions: z.array(z.string()),
    }),
    system: `You generate common, beginner-friendly questions about tool collections.
Focus on:
- Getting started
- Best practices
- Common pitfalls
- When to use vs alternatives`,
    prompt: `Collection: ${collectionName}
Description: ${collectionDescription || 'A collection of tools'}

Generate ${count} common questions someone new might ask:`,
    temperature: 0.7,
  });

  return object.questions;
}

/**
 * Check if seeding is already in progress (with timeout)
 */
async function isSeeding(collectionId: string): Promise<boolean> {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { skillsSeedingAt: true },
  });

  if (!collection?.skillsSeedingAt) return false;

  // Check if seeding has timed out
  const elapsed = Date.now() - collection.skillsSeedingAt.getTime();
  if (elapsed > SEEDING_LOCK_TIMEOUT_MS) {
    // Clear stale lock
    await prisma.collection.update({
      where: { id: collectionId },
      data: { skillsSeedingAt: null },
    });
    return false;
  }

  return true;
}

/**
 * Seed a collection with synthetic questions
 * Returns true if seeding was performed, false if skipped
 */
export async function seedCollectionSkills(collection: CollectionWithTools): Promise<{
  seeded: boolean;
  questionsCreated: number;
  reason?: string;
}> {
  // Check if already seeded
  if (collection.skillsSeeded) {
    return { seeded: false, questionsCreated: 0, reason: 'Already seeded' };
  }

  // Check if seeding is in progress
  if (await isSeeding(collection.id)) {
    return { seeded: false, questionsCreated: 0, reason: 'Seeding in progress' };
  }

  // Acquire seeding lock
  await prisma.collection.update({
    where: { id: collection.id },
    data: { skillsSeedingAt: new Date() },
  });

  try {
    const allQuestions: string[] = [];

    // 1. Generate from skills.md if available
    if (collection.skillsMarkdown) {
      const skillsQuestions = await generateQuestionsFromSkillsMarkdown(
        collection.skillsMarkdown,
        collection.name,
        5
      );
      allQuestions.push(...skillsQuestions);
    }

    // 2. Generate from tool descriptions
    if (collection.tools.length > 0) {
      const toolQuestions = await generateQuestionsFromTools(collection.tools, 5);
      allQuestions.push(...toolQuestions);
    }

    // 3. Generate common use case questions
    const useCaseQuestions = await generateCommonUseCaseQuestions(
      collection.name,
      collection.description,
      3
    );
    allQuestions.push(...useCaseQuestions);

    // Deduplicate questions
    const uniqueQuestions = [...new Set(allQuestions)];

    // 4. Process questions in batches
    let questionsCreated = 0;
    const collectionContext: CollectionContext = {
      collection,
      tools: collection.tools,
      skillsMarkdown: collection.skillsMarkdown,
    };

    for (let i = 0; i < uniqueQuestions.length; i += SEED_BATCH_SIZE) {
      const batch = uniqueQuestions.slice(i, i + SEED_BATCH_SIZE);

      for (const question of batch) {
        try {
          // Generate embedding
          const embedding = await embedQuestion(question);

          // Generate answer
          const { answer, tokensUsed } = await generateSkillResponse({
            question,
            collectionContext,
            similarQuestions: [], // No similar questions for seed
            stream: false,
          });

          // Store the question
          const stored = await prisma.skillQuestion.create({
            data: {
              collectionId: collection.id,
              question,
              embedding: embedding as unknown as object,
              answer,
              answerTokens: tokensUsed,
              agentName: 'seed-bot',
              confidence: 0.5, // Medium confidence for synthetic
              tags: ['synthetic', 'seed'],
            },
          });

          // Update skill graph (best-effort)
          try {
            await updateSkillGraph({
              questionId: stored.id,
              collectionId: collection.id,
              question,
              answer,
              tools: collection.tools,
            });
          } catch {
            // Don't fail seeding if graph update fails
          }

          questionsCreated++;
        } catch (error) {
          console.error(`Failed to seed question: "${question}"`, error);
          // Continue with other questions
        }
      }
    }

    // Mark as seeded
    await prisma.collection.update({
      where: { id: collection.id },
      data: {
        skillsSeeded: true,
        skillsSeedingAt: null,
      },
    });

    return { seeded: true, questionsCreated };
  } catch (error) {
    // Clear seeding lock on error
    await prisma.collection.update({
      where: { id: collection.id },
      data: { skillsSeedingAt: null },
    });
    throw error;
  }
}

/**
 * Check seeding status for a collection
 */
export async function getSeedingStatus(collectionId: string): Promise<{
  isSeeded: boolean;
  isSeeding: boolean;
  questionCount: number;
}> {
  const [collection, questionCount] = await Promise.all([
    prisma.collection.findUnique({
      where: { id: collectionId },
      select: { skillsSeeded: true, skillsSeedingAt: true },
    }),
    prisma.skillQuestion.count({ where: { collectionId } }),
  ]);

  if (!collection) {
    return { isSeeded: false, isSeeding: false, questionCount: 0 };
  }

  const isCurrentlySeeding =
    collection.skillsSeedingAt &&
    Date.now() - collection.skillsSeedingAt.getTime() < SEEDING_LOCK_TIMEOUT_MS;

  return {
    isSeeded: collection.skillsSeeded,
    isSeeding: !!isCurrentlySeeding,
    questionCount,
  };
}

/**
 * Reset seeding status (for manual re-seeding)
 */
export async function resetSeedingStatus(collectionId: string): Promise<void> {
  await prisma.collection.update({
    where: { id: collectionId },
    data: {
      skillsSeeded: false,
      skillsSeedingAt: null,
    },
  });
}
