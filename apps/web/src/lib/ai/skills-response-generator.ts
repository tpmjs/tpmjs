/**
 * Skills Response Generator
 *
 * Uses GPT-4.1-mini to generate skill responses using RAG
 * from stored questions and collection context.
 */

import type { Collection, Tool } from '@prisma/client';
import { generateText, streamText } from 'ai';
import { textModel } from './provider';
import type { SimilarQuestion } from './skills-embedding';

const TEMPERATURE = 0.3;

export interface CollectionContext {
  collection: Collection;
  tools: Array<
    Tool & {
      package: { npmPackageName: string };
    }
  >;
  skillsMarkdown?: string | null;
}

export interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateResponseParams {
  question: string;
  collectionContext: CollectionContext;
  similarQuestions: SimilarQuestion[];
  sessionHistory?: SessionMessage[];
  tags?: string[];
  stream?: boolean;
}

/**
 * Build the system prompt for skill response generation
 */
function buildSystemPrompt(params: GenerateResponseParams): string {
  const { collectionContext, similarQuestions, tags } = params;
  const { collection, tools, skillsMarkdown } = collectionContext;

  // Build tool descriptions
  const toolDescriptions = tools
    .map((t) => {
      return `- **${t.name}** (${t.package.npmPackageName}): ${t.description}`;
    })
    .join('\n');

  // Build similar Q&A context for RAG
  const ragContext =
    similarQuestions.length > 0
      ? similarQuestions
          .map((q, i) => {
            return `### Previous Question ${i + 1} (${Math.round(q.similarity * 100)}% similar)
**Q:** ${q.question}
**A:** ${q.answer}`;
          })
          .join('\n\n')
      : 'No similar questions have been asked yet.';

  // Optional tag hints
  const tagHints =
    tags && tags.length > 0 ? `\nThe user has tagged this question with: ${tags.join(', ')}` : '';

  return `You are a helpful assistant that answers questions about using the tools in the "${collection.name}" collection.

## Collection Description
${collection.description || 'No description provided.'}

## Available Tools
${toolDescriptions}

${skillsMarkdown ? `## Skills Documentation\n${skillsMarkdown.slice(0, 4000)}` : ''}

## Previous Related Questions & Answers (Use for context)
${ragContext}
${tagHints}

## Response Guidelines

1. **Be specific and practical** - Provide concrete examples and code snippets when helpful
2. **Reference the tools** - When relevant, mention which tools from the collection can help
3. **Build on previous answers** - If similar questions exist, use them as context but provide a fresh, tailored response
4. **Use markdown formatting** - Format your response with headers, code blocks, and lists as appropriate
5. **Be concise** - Get to the point quickly while being thorough
6. **Admit limitations** - If you're unsure or the collection doesn't have tools for something, say so

Your response will be stored and used to help future users, so make it clear and reusable.`;
}

/**
 * Build the user prompt with session context
 */
function buildUserPrompt(params: GenerateResponseParams): string {
  const { question, sessionHistory } = params;

  // Include session history for multi-turn conversations
  if (sessionHistory && sessionHistory.length > 0) {
    const historyText = sessionHistory
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    return `Previous conversation:
${historyText}

Current question: ${question}`;
  }

  return question;
}

export interface GenerateResponseResult {
  answer: string;
  tokensUsed: number;
}

/**
 * Generate a skill response (non-streaming)
 */
export async function generateSkillResponse(
  params: GenerateResponseParams
): Promise<GenerateResponseResult> {
  const systemPrompt = buildSystemPrompt(params);
  const userPrompt = buildUserPrompt(params);

  const { text, usage } = await generateText({
    model: textModel(),
    system: systemPrompt,
    prompt: userPrompt,
    temperature: TEMPERATURE,
  });

  return {
    answer: text,
    tokensUsed: usage?.totalTokens ?? 0,
  };
}

/**
 * Generate a skill response with streaming
 * Returns a ReadableStream for SSE
 */
export async function generateSkillResponseStream(
  params: GenerateResponseParams
): Promise<ReadableStream> {
  const systemPrompt = buildSystemPrompt(params);
  const userPrompt = buildUserPrompt(params);

  const result = streamText({
    model: textModel(),
    system: systemPrompt,
    prompt: userPrompt,
    temperature: TEMPERATURE,
  });

  return result.textStream as unknown as ReadableStream;
}

/**
 * Generate suggested follow-up questions based on the response
 */
export async function generateFollowupSuggestions(
  question: string,
  answer: string,
  collectionName: string
): Promise<string[]> {
  const { text } = await generateText({
    model: textModel(),
    system: `You suggest follow-up questions based on a Q&A about the "${collectionName}" tool collection.
Return exactly 3 short follow-up questions, one per line. No numbering or bullets.`,
    prompt: `Original question: ${question}

Answer given: ${answer.slice(0, 1000)}

Suggest 3 follow-up questions:`,
    temperature: 0.5,
  });

  return text
    .split('\n')
    .map((q) => q.trim())
    .filter((q) => q.length > 0 && q.endsWith('?'))
    .slice(0, 3);
}

/**
 * Infer confidence score based on RAG context quality
 */
export function calculateConfidence(
  similarQuestions: SimilarQuestion[],
  hasSkillsMarkdown: boolean
): number {
  let confidence = 0.3; // Base confidence

  // Boost for similar questions (RAG context)
  if (similarQuestions.length > 0) {
    const avgSimilarity =
      similarQuestions.reduce((sum, q) => sum + q.similarity, 0) / similarQuestions.length;
    confidence += avgSimilarity * 0.4; // Up to 0.4 boost
  }

  // Boost for having skills documentation
  if (hasSkillsMarkdown) {
    confidence += 0.2;
  }

  // Boost for multiple similar questions
  if (similarQuestions.length >= 3) {
    confidence += 0.1;
  }

  return Math.min(1.0, confidence);
}
