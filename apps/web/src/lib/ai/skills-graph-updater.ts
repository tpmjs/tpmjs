/**
 * Skills Graph Updater
 *
 * Handles real-time skill graph updates:
 * - Infers skills from questions using embeddings
 * - Creates/matches skill nodes
 * - Links questions to skills and tools
 * - Updates confidence scores
 */

import type { Skill, Tool } from '@prisma/client';
import { prisma } from '@tpmjs/db';
import { generateObject } from 'ai';
import { z } from 'zod';
import { textModel } from './provider';
import { cosineSimilarity, embedQuestion } from './skills-embedding';

const SKILL_MATCH_THRESHOLD = 0.75;

/**
 * Generate a URL-safe slug from a skill name
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

/**
 * Extract potential skills from a question using LLM
 */
export async function extractSkillsFromQuestion(
  question: string,
  tools: Tool[]
): Promise<
  Array<{
    name: string;
    description: string;
  }>
> {
  const toolNames = tools.map((t) => t.name).join(', ');

  const { object } = await generateObject({
    model: textModel(),
    schema: z.object({
      skills: z.array(
        z.object({
          name: z.string().describe('Short skill name (2-5 words), e.g., "API error handling"'),
          description: z.string().describe('One sentence describing what this skill enables'),
        })
      ),
    }),
    system: `You extract skills/capabilities from questions about tool collections.
Tools in this collection: ${toolNames}

A skill represents a specific capability or use case that the tools enable.
Examples: "API error handling", "Data transformation", "File parsing", "React state management"

Return 1-3 skills that this question relates to.`,
    prompt: question,
    temperature: 0.3,
  });

  return object.skills;
}

/**
 * Find existing skills that match by embedding similarity
 */
async function findMatchingSkills(
  skillEmbedding: number[],
  collectionId: string,
  threshold: number = SKILL_MATCH_THRESHOLD
): Promise<Array<{ skill: Skill; similarity: number }>> {
  const existingSkills = await prisma.skill.findMany({
    where: { collectionId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      embedding: true,
      questionCount: true,
      confidence: true,
      collectionId: true,
      parentSkillId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const matches: Array<{ skill: Skill; similarity: number }> = [];

  for (const skill of existingSkills) {
    const existingEmbedding = skill.embedding as number[];
    if (!existingEmbedding || existingEmbedding.length === 0) continue;

    const similarity = cosineSimilarity(skillEmbedding, existingEmbedding);
    if (similarity >= threshold) {
      matches.push({
        skill: skill as unknown as Skill,
        similarity,
      });
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Get or create a skill node
 */
async function getOrCreateSkill(
  collectionId: string,
  name: string,
  description: string
): Promise<Skill> {
  const slug = slugify(name);

  // Try to find existing skill by slug
  const existing = await prisma.skill.findUnique({
    where: {
      collectionId_slug: {
        collectionId,
        slug,
      },
    },
  });

  if (existing) {
    return existing;
  }

  // Check by embedding similarity
  const embedding = await embedQuestion(`${name}: ${description}`);
  const matches = await findMatchingSkills(embedding, collectionId);

  if (matches.length > 0 && matches[0]) {
    // Use existing skill if close match
    return matches[0].skill;
  }

  // Create new skill
  return prisma.skill.create({
    data: {
      collectionId,
      name,
      slug,
      description,
      embedding: embedding as unknown as object,
      questionCount: 0,
      confidence: 0,
    },
  });
}

export interface SkillLink {
  skillId: string;
  skillName: string;
  relevance: number;
}

export interface ToolLink {
  toolId: string;
  toolName: string;
  relevance: number;
}

export interface GraphUpdateResult {
  skillLinks: SkillLink[];
  toolLinks: ToolLink[];
}

/**
 * Extract tool mentions from question/answer text
 */
function extractToolMentions(
  text: string,
  tools: Tool[]
): Array<{ tool: Tool; relevance: number }> {
  const mentions: Array<{ tool: Tool; relevance: number }> = [];
  const lowerText = text.toLowerCase();

  for (const tool of tools) {
    // Check if tool name is mentioned
    if (lowerText.includes(tool.name.toLowerCase())) {
      mentions.push({ tool, relevance: 1.0 });
    }
  }

  return mentions;
}

/**
 * Update the skill graph after storing a new question
 *
 * This:
 * 1. Extracts skills from the question
 * 2. Matches or creates skill nodes
 * 3. Links the question to skills
 * 4. Links the question to mentioned tools
 * 5. Updates skill confidence scores
 */
export async function updateSkillGraph(params: {
  questionId: string;
  collectionId: string;
  question: string;
  answer: string;
  tools: Tool[];
}): Promise<GraphUpdateResult> {
  const { questionId, collectionId, question, answer, tools } = params;

  const skillLinks: SkillLink[] = [];
  const toolLinks: ToolLink[] = [];

  // 1. Extract skills from the question
  const extractedSkills = await extractSkillsFromQuestion(question, tools);

  // 2. Get or create skill nodes and link to question
  for (const extracted of extractedSkills) {
    try {
      const skill = await getOrCreateSkill(collectionId, extracted.name, extracted.description);

      // Link question to skill
      await prisma.skillQuestionSkill.upsert({
        where: {
          questionId_skillId: {
            questionId,
            skillId: skill.id,
          },
        },
        create: {
          questionId,
          skillId: skill.id,
          relevance: 1.0,
        },
        update: {
          relevance: 1.0,
        },
      });

      // Update skill question count
      await prisma.skill.update({
        where: { id: skill.id },
        data: {
          questionCount: { increment: 1 },
          // Increase confidence with more questions
          confidence: {
            increment: 0.05,
          },
        },
      });

      skillLinks.push({
        skillId: skill.id,
        skillName: skill.name,
        relevance: 1.0,
      });
    } catch (error) {
      // Log but don't fail - graph updates are best-effort
      console.error(`Failed to link skill "${extracted.name}":`, error);
    }
  }

  // 3. Extract and link tool mentions
  const combinedText = `${question} ${answer}`;
  const toolMentions = extractToolMentions(combinedText, tools);

  for (const { tool, relevance } of toolMentions) {
    try {
      await prisma.skillQuestionTool.upsert({
        where: {
          questionId_toolId: {
            questionId,
            toolId: tool.id,
          },
        },
        create: {
          questionId,
          toolId: tool.id,
          relevance,
        },
        update: {
          relevance,
        },
      });

      toolLinks.push({
        toolId: tool.id,
        toolName: tool.name,
        relevance,
      });
    } catch (error) {
      console.error(`Failed to link tool "${tool.name}":`, error);
    }
  }

  return { skillLinks, toolLinks };
}

/**
 * Get skill summary for a collection
 */
export async function getCollectionSkillsSummary(collectionId: string): Promise<{
  totalQuestions: number;
  totalSkills: number;
  topSkills: Array<{
    name: string;
    questionCount: number;
    confidence: number;
  }>;
}> {
  const [totalQuestions, totalSkills, topSkills] = await Promise.all([
    prisma.skillQuestion.count({ where: { collectionId } }),
    prisma.skill.count({ where: { collectionId } }),
    prisma.skill.findMany({
      where: { collectionId },
      orderBy: { questionCount: 'desc' },
      take: 10,
      select: {
        name: true,
        questionCount: true,
        confidence: true,
      },
    }),
  ]);

  return {
    totalQuestions,
    totalSkills,
    topSkills,
  };
}
