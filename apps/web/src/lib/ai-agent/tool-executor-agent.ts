/**
 * AI Agent service for executing TPMJS tools
 * Converts TPMJS metadata to Zod schemas and executes with AI SDK
 */

import { openai } from '@ai-sdk/openai';
import type { Tool } from '@tpmjs/db';
import { executePackage } from '@tpmjs/package-executor';
import { type CoreMessage, tool as aiTool, streamText } from 'ai';
import { z } from 'zod';

/**
 * Parameter from TPMJS metadata
 */
interface TPMJSParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: unknown;
}

/**
 * Token usage breakdown
 */
export interface TokenBreakdown {
  inputTokens: number;
  toolDescTokens: number;
  schemaTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

/**
 * Convert TPMJS parameter type to Zod schema
 */
function typeToZodSchema(type: string): z.ZodTypeAny {
  // Handle array types
  if (type.endsWith('[]')) {
    const baseType = type.slice(0, -2);
    return z.array(typeToZodSchema(baseType));
  }

  // Handle union types (e.g., 'markdown' | 'mdx')
  if (type.includes('|')) {
    const types = type.split('|').map((t) => t.trim().replace(/'/g, ''));
    return z.enum(types as [string, ...string[]]);
  }

  // Handle primitive types
  switch (type) {
    case 'string':
      return z.string();
    case 'number':
      return z.number();
    case 'boolean':
      return z.boolean();
    case 'object':
      return z.object({});
    default:
      // Default to string for unknown types
      return z.string();
  }
}

/**
 * Convert TPMJS parameters to Zod schema object
 */
// biome-ignore lint/suspicious/noExplicitAny: Zod requires any for dynamic schema objects
export function tpmjsParamsToZodSchema(parameters: TPMJSParameter[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const param of parameters) {
    let schema = typeToZodSchema(param.type);

    // Add description
    schema = schema.describe(param.description);

    // Make optional if not required
    if (!param.required) {
      schema = schema.optional();
    }

    shape[param.name] = schema;
  }

  return z.object(shape);
}

/**
 * Create AI SDK tool definition from TPMJS Tool
 */
export function createToolDefinition(tool: Tool) {
  const parameters = Array.isArray(tool.parameters)
    ? (tool.parameters as unknown as TPMJSParameter[])
    : [];
  const schema = tpmjsParamsToZodSchema(parameters);

  return aiTool({
    description: tool.description,
    parameters: schema,
    execute: async (params: Record<string, unknown>) => {
      // Execute the actual npm package in a sandbox
      const result = await executePackage(
        tool.npmPackageName,
        'default', // Most TPMJS packages export a default function
        params,
        { timeout: 5000 }
      );

      if (!result.success) {
        throw new Error(result.error || 'Package execution failed');
      }

      return result.output;
    },
    // biome-ignore lint/suspicious/noExplicitAny: AI SDK v5 type compatibility workaround
  } as any);
}

/**
 * Count tokens in text using character estimation
 * Uses rough estimation: ~4 characters per token
 * This is used instead of tiktoken to avoid WASM dependency issues in serverless
 */
function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate token breakdown for tool execution
 */
export function calculateTokenBreakdown(
  userPrompt: string,
  toolDescription: string,
  parameters: TPMJSParameter[],
  returns: unknown,
  output: string
): TokenBreakdown {
  const inputTokens = countTokens(userPrompt);
  const toolDescTokens = countTokens(toolDescription);
  const schemaTokens = countTokens(JSON.stringify({ parameters, returns }));
  const outputTokens = countTokens(output);
  const totalTokens = inputTokens + toolDescTokens + schemaTokens + outputTokens;

  // GPT-4 Turbo pricing (approximate)
  const inputCost = (inputTokens + toolDescTokens + schemaTokens) * (0.01 / 1000);
  const outputCost = outputTokens * (0.03 / 1000);
  const estimatedCost = inputCost + outputCost;

  return {
    inputTokens,
    toolDescTokens,
    schemaTokens,
    outputTokens,
    totalTokens,
    estimatedCost,
  };
}

/**
 * Execute tool with AI agent and streaming
 */
export async function executeToolWithAgent(
  tool: Tool,
  userPrompt: string,
  onChunk?: (chunk: string) => void,
  onTokenUpdate?: (tokens: Partial<TokenBreakdown>) => void
) {
  const toolDef = createToolDefinition(tool);
  const messages: CoreMessage[] = [
    {
      role: 'user',
      content: userPrompt,
    },
  ];

  let fullOutput = '';
  let agentSteps = 0;

  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages,
    tools: {
      [tool.npmPackageName]: toolDef,
    },
    // biome-ignore lint/suspicious/noExplicitAny: AI SDK v5 chunk type compatibility
    onChunk: ({ chunk }: { chunk: any }) => {
      if (chunk.type === 'text-delta') {
        const text = chunk.text || '';
        fullOutput += text;
        onChunk?.(text);
      }
    },
    onFinish: () => {
      agentSteps++;
    },
    // biome-ignore lint/suspicious/noExplicitAny: AI SDK v5 streaming configuration workaround
  } as any);

  // Wait for completion
  await result.text;

  // Calculate final token breakdown
  const parameters = Array.isArray(tool.parameters)
    ? (tool.parameters as unknown as TPMJSParameter[])
    : [];
  const tokenBreakdown = calculateTokenBreakdown(
    userPrompt,
    tool.description,
    parameters,
    tool.returns,
    fullOutput
  );

  onTokenUpdate?.(tokenBreakdown);

  return {
    output: fullOutput,
    tokenBreakdown,
    agentSteps,
  };
}
