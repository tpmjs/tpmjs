/**
 * AI Prompt Generation Service
 *
 * Uses GPT-4o-mini to generate realistic test scenario prompts
 * for collections based on their tools.
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const GENERATOR_MODEL = 'gpt-4o-mini';

interface Tool {
  name: string;
  description: string | null;
}

interface Collection {
  name: string;
  description: string | null;
  tools: Tool[];
}

/**
 * Generate multiple scenario prompts with metadata
 */
export interface GeneratedScenario {
  prompt: string;
  name: string;
  tags: string[];
}

const GeneratedScenarioSchema = z.object({
  prompt: z.string().describe('The specific task prompt'),
  name: z.string().describe('A short descriptive name for the scenario (max 50 chars)'),
  tags: z.array(z.string()).max(5).describe('Relevant tags for categorization'),
});

const GeneratedScenariosSchema = z.object({
  scenarios: z.array(GeneratedScenarioSchema),
});

/**
 * Generate multiple scenarios with names and tags
 */
export async function generateScenarios(
  collection: Collection,
  count: number = 1
): Promise<GeneratedScenario[]> {
  const toolDescriptions = collection.tools
    .map((t) => `- ${t.name}: ${t.description || 'No description'}`)
    .join('\n');

  const { object } = await generateObject({
    model: openai(GENERATOR_MODEL),
    schema: GeneratedScenariosSchema,
    prompt: `Generate ${count} realistic test scenario${count > 1 ? 's' : ''} for this tool collection.

Collection: ${collection.name}
Description: ${collection.description || 'No description provided'}

Available tools:
${toolDescriptions}

For each scenario:
1. Write a specific, achievable task using the available tools
2. Include concrete example data (URLs, file paths, values) where helpful
3. Provide a short descriptive name (max 50 characters)
4. Add 1-5 relevant tags for categorization

${count > 1 ? 'Make the scenarios diverse - cover different use cases and tool combinations.' : ''}`,
  });

  return object.scenarios;
}
