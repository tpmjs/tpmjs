/**
 * AI-powered use case generation for tool collections
 * Uses Vercel AI SDK with structured output to generate realistic workflows
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Schema for structured output
const ToolStepSchema = z.object({
  toolName: z.string().describe('Name of the tool being invoked'),
  packageName: z.string().describe('NPM package name containing the tool'),
  purpose: z.string().describe('Why this tool is called at this step (max 100 chars)'),
  order: z.number().int().min(1).describe('Execution order (1-based)'),
});

const UseCaseOutputSchema = z.object({
  id: z.string().describe('Unique identifier for this use case'),
  userPrompt: z
    .string()
    .describe('Example user prompt that would trigger this workflow (30-200 chars)'),
  description: z.string().describe('Brief description of what this accomplishes (50-150 chars)'),
  toolSequence: z.array(ToolStepSchema).min(1).max(10).describe('Ordered sequence of tool calls'),
});

const UseCasesOutputSchema = z.object({
  useCases: z.array(UseCaseOutputSchema).min(6).max(6).describe('Array of EXACTLY 6 use cases'),
});

export type GeneratedUseCase = z.infer<typeof UseCaseOutputSchema>;
export type GeneratedUseCases = z.infer<typeof UseCasesOutputSchema>;

interface ToolInfo {
  name: string;
  description: string;
  packageName: string;
  inputSchema: unknown;
}

function buildSystemPrompt(): string {
  return `You are an expert at understanding AI tool collections and generating practical use cases.

Your task is to analyze a collection of MCP (Model Context Protocol) tools and suggest realistic use cases that demonstrate how an AI agent would use these tools together to accomplish tasks.

Guidelines for generating use cases:
1. Each use case should have a realistic, natural user prompt (what a human would actually ask)
2. The tool sequence should show logical orchestration - how tools would be called in order
3. Focus on practical, achievable workflows that make sense for the tools available
4. Tools can be called multiple times if needed
5. Consider data flow between tools - output from one tool may inform the next
6. Keep descriptions concise but informative
7. Generate unique IDs using the pattern "uc-" followed by a short descriptive slug

Important:
- Only use tools that are actually in the collection
- Be creative but realistic - suggest workflows users would actually want
- Vary the complexity - some simple (1-2 tools), some more complex (3-5 tools)`;
}

function buildUserPrompt(
  collectionName: string,
  collectionDescription: string | null,
  tools: ToolInfo[]
): string {
  const toolsDescription = tools
    .map(
      (t) => `
**${t.name}** (from ${t.packageName})
Description: ${t.description}
${t.inputSchema ? `Input Schema: ${JSON.stringify(t.inputSchema, null, 2)}` : 'No input schema available'}`
    )
    .join('\n---\n');

  return `Generate EXACTLY 6 different use cases for this tool collection. You MUST return exactly 6 use cases.

**Collection Name:** ${collectionName}
${collectionDescription ? `**Description:** ${collectionDescription}` : ''}

**Available Tools (${tools.length} total):**
${toolsDescription}

IMPORTANT: Create EXACTLY 6 use cases with this structure:

**First 3 use cases - SIMPLE (1-2 tools each):**
- Quick, focused tasks that use just 1 or 2 tools
- Straightforward user prompts
- Good for showing basic capabilities

**Last 3 use cases - COMPLEX (3-5 tools each):**
- Multi-step workflows that chain 3-5 tools together
- More sophisticated user prompts
- Show how tools can work together for advanced tasks

Each use case should have a unique purpose and demonstrate different capabilities of the collection.`;
}

/**
 * Generate use cases for a collection of tools using AI
 */
export async function generateUseCases(
  collectionName: string,
  collectionDescription: string | null,
  tools: ToolInfo[]
): Promise<GeneratedUseCases> {
  if (tools.length === 0) {
    throw new Error('Collection must have at least one tool to generate use cases');
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(collectionName, collectionDescription, tools);

  const result = await generateObject({
    model: openai('gpt-4.1-mini'),
    schema: UseCasesOutputSchema,
    system: systemPrompt,
    prompt: userPrompt,
  });

  return result.object;
}
