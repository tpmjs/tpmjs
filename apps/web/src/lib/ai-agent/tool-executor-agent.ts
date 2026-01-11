/**
 * AI Agent service for executing TPMJS tools
 * Converts TPMJS metadata to Zod schemas and executes with AI SDK v6
 */

import { openai } from '@ai-sdk/openai';
import type { Package, Tool } from '@tpmjs/db';
import type { ExecutorConfig } from '@tpmjs/types/executor';
import { generateText, jsonSchema, type ModelMessage } from 'ai';
import { z } from 'zod';

import { executeWithExecutor } from '../executors';

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
 * Requires Tool with Package relation
 *
 * @param tool - The tool with its package relation
 * @param executorConfig - Optional executor config for custom executors
 * @param envVars - Optional environment variables to pass to the tool
 */
export function createToolDefinition(
  tool: Tool & { package: Package },
  executorConfig?: ExecutorConfig | null,
  envVars?: Record<string, string>
) {
  console.log('[createToolDefinition] Tool:', tool.package.npmPackageName, '/', tool.name);

  // Prefer full inputSchema if available (has nested object/array structures)
  // Fall back to legacy parameters array conversion if not
  const inputSchema =
    tool.inputSchema && typeof tool.inputSchema === 'object'
      ? // Use full JSON Schema directly - preserves nested array/object structures
        jsonSchema(tool.inputSchema as Parameters<typeof jsonSchema>[0])
      : // Legacy: convert flattened parameters array to Zod schema
        (() => {
          const parameters = Array.isArray(tool.parameters)
            ? (tool.parameters as unknown as TPMJSParameter[])
            : [];
          console.log('[createToolDefinition] Using legacy parameters:', parameters.length);
          return parameters.length > 0
            ? tpmjsParamsToZodSchema(parameters)
            : z.object({}).describe('No parameters required');
        })();

  const sanitizedName = sanitizeToolName(`${tool.package.npmPackageName}-${tool.name}`);

  // AI SDK v6 tool definition
  return {
    description: tool.description,
    inputSchema, // AI SDK v6 uses inputSchema
    execute: async (params: Record<string, unknown>) => {
      console.log('[Tool execute] Running:', sanitizedName, params);
      if (envVars && Object.keys(envVars).length > 0) {
        console.log('[Tool execute] With env vars:', Object.keys(envVars));
      }

      // Execute the actual npm package using resolved executor
      // Use the actual export name from the Tool record
      const result = await executeWithExecutor(executorConfig ?? null, {
        packageName: tool.package.npmPackageName,
        name: tool.name, // Use actual export name (e.g., "helloWorldTool", "default")
        params,
        env: envVars && Object.keys(envVars).length > 0 ? envVars : undefined,
      });

      if (!result.success) {
        throw new Error(result.error || 'Package execution failed');
      }

      console.log('[Tool execute] Result:', result.output);
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
 * Execute tool with AI agent using AI SDK v6
 * Requires Tool with Package relation
 */
export async function executeToolWithAgent(
  tool: Tool & { package: Package },
  userPrompt: string,
  onChunk?: (chunk: string) => void,
  onTokenUpdate?: (tokens: Partial<TokenBreakdown>) => void
) {
  const toolDef = createToolDefinition(tool);
  const sanitizedToolName = sanitizeToolName(`${tool.package.npmPackageName}-${tool.name}`);

  console.log('[executeToolWithAgent] Tool name:', sanitizedToolName);

  const messages: ModelMessage[] = [
    {
      role: 'user',
      content: userPrompt,
    },
  ];

  const toolsConfig = {
    [sanitizedToolName]: toolDef,
  };

  console.log('[executeToolWithAgent] Calling generateText');

  // Use generateText for tool execution
  const result = await generateText({
    model: openai('gpt-4-turbo'),
    messages,
    tools: toolsConfig,
  });

  console.log('[executeToolWithAgent] Result:', JSON.stringify(result, null, 2));

  // Extract tool results from the response
  let toolOutput: unknown = null;
  if (result.response?.messages) {
    for (const message of result.response.messages) {
      if (message.role === 'tool' && 'content' in message) {
        toolOutput = message.content;
        console.log('[executeToolWithAgent] Tool output found:', toolOutput);
        break;
      }
    }
  }

  // Format the output as JSON
  const fullOutput = toolOutput
    ? JSON.stringify(toolOutput, null, 2)
    : result.text || JSON.stringify(result, null, 2);

  console.log('[executeToolWithAgent] Final output:', fullOutput);

  // Stream the output (all at once since generateText is non-streaming)
  if (onChunk) {
    onChunk(fullOutput);
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
    agentSteps: result.steps?.length || 1,
  };
}
