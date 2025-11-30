/**
 * AI Agent service for executing TPMJS tools
 * Converts TPMJS metadata to Zod schemas and executes with AI SDK v6
 */

import { openai } from '@ai-sdk/openai';
import type { Tool } from '@tpmjs/db';
import { executePackage } from '@tpmjs/package-executor';
import { type CoreMessage, streamText } from 'ai';
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
 * Create AI SDK v6 tool definition from TPMJS Tool
 */
export function createToolDefinition(tool: Tool) {
  const parameters = Array.isArray(tool.parameters)
    ? (tool.parameters as unknown as TPMJSParameter[])
    : [];

  console.log('[createToolDefinition] Tool:', tool.npmPackageName);
  console.log('[createToolDefinition] Parameters array:', JSON.stringify(parameters));
  console.log('[createToolDefinition] Parameters length:', parameters.length);

  // Ensure we have a valid schema - if no parameters, use an empty object
  const schema =
    parameters.length > 0
      ? tpmjsParamsToZodSchema(parameters)
      : z.object({}).describe('No parameters required');

  console.log('[createToolDefinition] Created Zod schema:', schema);
  console.log('[createToolDefinition] Schema type:', typeof schema);
  console.log('[createToolDefinition] Schema constructor:', schema.constructor.name);

  // AI SDK v6 beta tool definition - uses inputSchema instead of parameters
  return {
    description: tool.description,
    inputSchema: schema, // Changed from 'parameters' to 'inputSchema' in v6
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
  };
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
 * Sanitize npm package name to valid OpenAI tool name
 * OpenAI tool names must match: ^[a-zA-Z0-9_-]+
 * Converts: @tpmjs/createblogpost -> tpmjs-createblogpost
 */
function sanitizeToolName(npmPackageName: string): string {
  return npmPackageName.replace(/[@/]/g, '-').replace(/^-+/, '');
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
  const sanitizedToolName = sanitizeToolName(tool.npmPackageName);

  console.log('[executeToolWithAgent] Sanitized tool name:', sanitizedToolName);
  console.log('[executeToolWithAgent] Tool definition:', toolDef);

  const messages: CoreMessage[] = [
    {
      role: 'user',
      content: userPrompt,
    },
  ];

  let fullOutput = '';
  let agentSteps = 0;

  const toolsConfig = {
    [sanitizedToolName]: toolDef,
  };

  console.log(
    '[executeToolWithAgent] Tools config being sent to OpenAI:',
    JSON.stringify(toolsConfig, null, 2)
  );

  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages,
    tools: toolsConfig,
    onFinish: () => {
      agentSteps++;
    },
  });

  // Stream and collect text
  for await (const chunk of result.textStream) {
    fullOutput += chunk;
    onChunk?.(chunk);
  }

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
