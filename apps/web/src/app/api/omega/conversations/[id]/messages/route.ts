/**
 * Omega Messages Endpoint
 *
 * POST: Send a message and stream the AI response via SSE
 *
 * This endpoint implements the core Omega chat functionality with:
 * - Static tools: registrySearchTool and registryExecuteTool for external users
 * - Dynamic tool loading: tools found via search are injected as callable tools
 * - SSE streaming for real-time updates
 */

import { Prisma, prisma } from '@tpmjs/db';
import { registryExecuteTool } from '@tpmjs/registry-execute';
import { registrySearchTool } from '@tpmjs/registry-search';
import {
  jsonSchema,
  type ModelMessage,
  stepCountIs,
  streamText,
  tool,
  wrapLanguageModel,
} from 'ai';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '~/lib/api-keys/middleware';
import { decryptApiKey } from '~/lib/crypto/api-keys';
import { buildSystemPrompt } from '~/lib/omega/system-prompt';
import { checkRateLimit, type RateLimitConfig } from '~/lib/rate-limit';

// Devtools middleware - lazy loaded only in development
let devtools: ReturnType<typeof import('@ai-sdk/devtools').devToolsMiddleware> | null = null;
async function getDevtools() {
  if (process.env.NODE_ENV !== 'development') return null;
  if (!devtools) {
    const { devToolsMiddleware } = await import('@ai-sdk/devtools');
    devtools = devToolsMiddleware();
    console.log('[Omega] AI SDK DevTools middleware initialized');
  }
  return devtools;
}

/**
 * Warning about missing environment variables
 */
interface EnvVarWarning {
  toolId: string;
  toolName: string;
  packageName: string;
  envVar: {
    name: string;
    description: string;
    required: boolean;
  };
}

/**
 * Fetch and decrypt user's environment variables
 */
async function getUserEnvVarsDecrypted(userId: string): Promise<Record<string, string>> {
  try {
    const keys = await prisma.userApiKey.findMany({ where: { userId } });
    const result: Record<string, string> = {};
    for (const key of keys) {
      try {
        result[key.keyName] = decryptApiKey(key.encryptedKey, key.keyIv);
      } catch (error) {
        console.error(`Failed to decrypt env var ${key.keyName}:`, error);
        // Skip this key if decryption fails
      }
    }
    return result;
  } catch (error) {
    console.error('Failed to fetch user env vars:', error);
    return {};
  }
}

/**
 * Detect missing required environment variables for tools
 */
function detectMissingEnvVars(
  tools: Array<{
    toolId: string;
    packageName: string;
    name: string;
    env?: Array<{ name: string; description?: string; required?: boolean }> | null;
  }>,
  userEnvVars: Record<string, string>
): EnvVarWarning[] {
  const warnings: EnvVarWarning[] = [];
  const userEnvKeys = new Set(Object.keys(userEnvVars));

  for (const t of tools) {
    if (!t.env || !Array.isArray(t.env)) continue;

    for (const envVar of t.env) {
      // Only warn about required env vars that are not set
      if (envVar.required && !userEnvKeys.has(envVar.name)) {
        warnings.push({
          toolId: t.toolId,
          toolName: t.name,
          packageName: t.packageName,
          envVar: {
            name: envVar.name,
            description: envVar.description || '',
            required: true,
          },
        });
      }
    }
  }

  // Deduplicate by env var name (same env var might be needed by multiple tools)
  const seen = new Set<string>();
  return warnings.filter((w) => {
    if (seen.has(w.envVar.name)) return false;
    seen.add(w.envVar.name);
    return true;
  });
}

/**
 * Rate limit for Omega chat: 20 requests per minute
 * Stricter limit because this involves multiple tool executions
 */
const OMEGA_RATE_LIMIT: RateLimitConfig = {
  limit: 20,
  windowSeconds: 60,
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for complex tool chains

type RouteContext = {
  params: Promise<{ id: string }>;
};

const SendMessageSchema = z.object({
  message: z.string().min(1).max(10000),
});

// Executor service URL
const EXECUTOR_URL =
  process.env.TPMJS_EXECUTOR_URL ||
  process.env.RAILWAY_EXECUTOR_URL ||
  'https://executor.tpmjs.com';

// In-memory conversation state for dynamically loaded tools
// biome-ignore lint/suspicious/noExplicitAny: Tool types from AI SDK are complex
const conversationStates = new Map<string, { loadedTools: Record<string, any> }>();

/**
 * Search for relevant tools based on user query
 */
async function searchRelevantTools(
  query: string,
  limit = 15,
  requestUrl?: string
): Promise<
  Array<{
    toolId: string;
    packageName: string;
    name: string;
    description: string;
    version: string;
    importUrl: string;
    inputSchema?: unknown;
    env?: Array<{ name: string; description?: string; required?: boolean }>;
  }>
> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  // Determine base URL from request or environment
  let baseUrl: string;
  if (process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  } else if (requestUrl) {
    // Extract origin from the incoming request URL
    const url = new URL(requestUrl);
    baseUrl = url.origin;
  } else {
    // Fallback to PORT env var or default
    const port = process.env.PORT || '3000';
    baseUrl = `http://localhost:${port}`;
  }

  console.log(`🔍 Tool search using baseUrl: ${baseUrl}`);
  const response = await fetch(`${baseUrl}/api/tools/search?${params}`);

  if (!response.ok) {
    console.error(`Tool search failed: ${response.status} ${response.statusText}`);
    return [];
  }

  // biome-ignore lint/suspicious/noExplicitAny: API response types vary
  const data = (await response.json()) as any;
  const toolsArray = data.results?.tools || [];

  // biome-ignore lint/suspicious/noExplicitAny: API response types vary
  return toolsArray.map((t: any) => ({
    toolId: `${t.package.npmPackageName}::${t.name}`,
    packageName: t.package.npmPackageName,
    name: t.name,
    description: t.description || `Tool: ${t.name}`,
    version: t.package.npmVersion,
    importUrl: `https://esm.sh/${t.package.npmPackageName}@${t.package.npmVersion}`,
    inputSchema: t.inputSchema,
    env: t.package.env || [],
  }));
}

/**
 * Fetch the tool's inputSchema from the executor's loadAndDescribe endpoint.
 * This is used when the schema isn't available in the database yet.
 */
async function fetchSchemaFromExecutor(toolMeta: {
  packageName: string;
  name: string;
  version: string;
  importUrl: string;
}): Promise<unknown | null> {
  try {
    console.log(`📋 Fetching schema from executor for ${toolMeta.packageName}/${toolMeta.name}`);
    const response = await fetch(`${EXECUTOR_URL}/load-and-describe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageName: toolMeta.packageName,
        name: toolMeta.name,
        version: toolMeta.version,
        importUrl: toolMeta.importUrl,
      }),
    });

    if (!response.ok) {
      console.warn(
        `⚠️ Schema fetch failed (${response.status}) for ${toolMeta.packageName}/${toolMeta.name}`
      );
      return null;
    }

    // biome-ignore lint/suspicious/noExplicitAny: Executor response format varies
    const result = (await response.json()) as any;
    if (result.success && result.tool?.inputSchema) {
      console.log(`✅ Got schema from executor for ${toolMeta.packageName}/${toolMeta.name}`);
      return result.tool.inputSchema;
    }
    return null;
  } catch (error) {
    console.warn(`⚠️ Schema fetch error for ${toolMeta.packageName}/${toolMeta.name}:`, error);
    return null;
  }
}

/**
 * Create a dynamic tool wrapper that executes via the sandbox executor
 */
async function createDynamicTool(
  toolMeta: {
    toolId: string;
    packageName: string;
    name: string;
    description: string;
    version: string;
    importUrl: string;
    inputSchema?: unknown;
  },
  userEnvVars: Record<string, string>
) {
  // If inputSchema is missing from the database, fetch it from the executor
  let schema = toolMeta.inputSchema;
  if (!schema) {
    schema = await fetchSchemaFromExecutor(toolMeta);
  }

  return tool({
    description: toolMeta.description,
    inputSchema: schema
      ? jsonSchema(schema as Parameters<typeof jsonSchema>[0])
      : jsonSchema({
          type: 'object',
          properties: {},
          additionalProperties: true,
        }),
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic tool params
    execute: async (params: any) => {
      console.log(`🚀 Executing ${toolMeta.packageName}/${toolMeta.name} with params:`, params);

      try {
        const response = await fetch(`${EXECUTOR_URL}/execute-tool`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageName: toolMeta.packageName,
            name: toolMeta.name,
            version: toolMeta.version,
            importUrl: toolMeta.importUrl,
            params,
            env: userEnvVars,
          }),
        });

        // biome-ignore lint/suspicious/noExplicitAny: API response types vary
        const result = (await response.json()) as any;

        if (!result.success) {
          console.error(`❌ Tool execution failed: ${result.error}`);
          // Return error as result instead of throwing so AI can see it
          return {
            error: true,
            message: result.error || 'Tool execution failed',
            toolId: toolMeta.toolId,
          };
        }

        console.log(`✅ Tool executed in ${result.executionTimeMs}ms`);
        return result.output;
      } catch (error) {
        console.error(`❌ Tool execution error:`, error);
        return {
          error: true,
          message: error instanceof Error ? error.message : 'Unknown error during tool execution',
          toolId: toolMeta.toolId,
        };
      }
    },
  });
}

/**
 * Sanitize tool name to be a valid JS identifier.
 * OpenAI has a 64-character limit for tool names.
 */
function sanitizeToolName(name: string): string {
  const sanitized = name
    .replace(/@/g, '')
    .replace(/\//g, '_')
    .replace(/-/g, '_')
    .replace(/::/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '');

  // OpenAI API requires tool names <= 64 characters
  if (sanitized.length <= 64) {
    return sanitized;
  }

  // Truncate but try to keep the meaningful part (tool name at the end)
  // Use last 64 chars if it starts with a letter, otherwise use first 64
  const last64 = sanitized.slice(-64);
  if (/^[a-zA-Z]/.test(last64)) {
    return last64;
  }
  return sanitized.slice(0, 64);
}

/**
 * Add dynamically found tools to the conversation state (parallel schema fetching)
 */
async function addToolsToConversation(
  conversationId: string,
  toolMetas: Array<{
    toolId: string;
    packageName: string;
    name: string;
    description: string;
    version: string;
    importUrl: string;
    inputSchema?: unknown;
  }>,
  userEnvVars: Record<string, string>
): Promise<string[]> {
  if (!conversationStates.has(conversationId)) {
    conversationStates.set(conversationId, { loadedTools: {} });
  }
  // biome-ignore lint/style/noNonNullAssertion: We just ensured it exists
  const state = conversationStates.get(conversationId)!;

  // Filter to only tools not yet loaded
  const newToolMetas = toolMetas.filter((tm) => {
    const sanitizedName = sanitizeToolName(tm.toolId);
    return !state.loadedTools[sanitizedName];
  });

  if (newToolMetas.length === 0) return [];

  // Fetch schemas in parallel using Promise.allSettled
  const results = await Promise.allSettled(
    newToolMetas.map(async (toolMeta) => {
      const sanitizedName = sanitizeToolName(toolMeta.toolId);
      const dynamicTool = await createDynamicTool(toolMeta, userEnvVars);
      return { sanitizedName, dynamicTool };
    })
  );

  const addedTools: string[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { sanitizedName, dynamicTool } = result.value;
      state.loadedTools[sanitizedName] = dynamicTool;
      addedTools.push(sanitizedName);
      console.log(`✅ Added dynamic tool: ${sanitizedName}`);
    } else {
      console.error(`❌ Failed to create tool wrapper:`, result.reason);
    }
  }

  return addedTools;
}

/**
 * POST /api/omega/conversations/[id]/messages
 * Send a message and stream the AI response via SSE
 */
export async function POST(request: NextRequest, context: RouteContext): Promise<Response> {
  // --- Tier A: Auth, params, body in parallel ---
  const [authResult, { id: conversationId }, body] = await Promise.all([
    authenticateRequest(),
    context.params,
    request.json(),
  ]);

  if (!authResult.authenticated || !authResult.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check rate limit
  const rateLimitResponse = checkRateLimit(request, OMEGA_RATE_LIMIT);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const parsed = SendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const userId = authResult.userId;

  try {
    // --- Tier B: All user/conversation data in parallel ---
    const [conversation, user, userSettings, userEnvVars] = await Promise.all([
      prisma.omegaConversation.findUnique({
        where: { id: conversationId },
        include: { participants: { select: { userId: true } } },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      }),
      prisma.omegaUserSettings.findUnique({ where: { userId } }),
      getUserEnvVarsDecrypted(userId),
    ]);

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if user is owner or participant
    const isOwner = userId === conversation.ownerId;
    const isParticipant = conversation.participants.some((p) => p.userId === userId);

    if (!isOwner && !isParticipant) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    console.log(`🔑 Loaded ${Object.keys(userEnvVars).length} user env vars`);

    // Check OpenAI API key early before doing more work
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Omega is not configured. Missing OPENAI_API_KEY.' },
        { status: 500 }
      );
    }

    // --- Tier C: Write operations + tool search + recent messages in parallel ---
    const [, , relevantTools, recentMessages] = await Promise.all([
      prisma.omegaConversation.update({
        where: { id: conversationId },
        data: { executionState: 'running' },
      }),
      prisma.omegaMessage.create({
        data: {
          conversationId,
          role: 'USER',
          content: parsed.data.message,
          authorId: user?.id,
          authorEmail: user?.email,
          authorName: user?.name,
        },
      }),
      searchRelevantTools(parsed.data.message, 10, request.url),
      prisma.omegaMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    console.log(`📦 Found ${relevantTools.length} relevant tools via BM25`);
    recentMessages.reverse();

    // Initialize or get conversation state
    if (!conversationStates.has(conversationId)) {
      conversationStates.set(conversationId, { loadedTools: {} });
    }
    // biome-ignore lint/style/noNonNullAssertion: We just ensured it exists
    const state = conversationStates.get(conversationId)!;

    // Detect missing required environment variables (sync, no await needed)
    const missingEnvVars = detectMissingEnvVars(relevantTools, userEnvVars);
    if (missingEnvVars.length > 0) {
      console.log(
        `⚠️ Missing ${missingEnvVars.length} required env vars:`,
        missingEnvVars.map((w) => w.envVar.name)
      );
    }

    // Get the provider model (using OpenAI by default)
    const { createOpenAI } = await import('@ai-sdk/openai');
    const openai = createOpenAI({ apiKey });
    const baseModel = openai('gpt-4.1-mini');

    // Wrap with devtools middleware in development
    const devtoolsMiddleware = await getDevtools();
    const model = devtoolsMiddleware
      ? wrapLanguageModel({ model: baseModel, middleware: devtoolsMiddleware })
      : baseModel;

    if (devtoolsMiddleware) {
      console.log('[Omega] Model wrapped with DevTools middleware');
    }

    // Open SSE stream early — do tool loading inside start()
    const stream = new ReadableStream({
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex streaming logic
      async start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = (event: string, data: unknown) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        // Emit env var warnings at the start of the stream
        if (missingEnvVars.length > 0) {
          sendEvent('env.warning', { missingEnvVars });
        }

        try {
          // --- Status: searching for tools ---
          sendEvent('status', { phase: 'searching', message: 'Finding relevant tools...' });

          // Add auto-discovered tools to conversation state (parallel schema fetching)
          const autoAddedTools = await addToolsToConversation(
            conversationId,
            relevantTools,
            userEnvVars
          );
          console.log(`✨ Auto-added ${autoAddedTools.length} new tools`);

          // --- Status: tools loaded ---
          const dynamicToolCount = Object.keys(state.loadedTools).length;
          if (dynamicToolCount > 0) {
            sendEvent('status', {
              phase: 'loading',
              message: `Loading ${dynamicToolCount} tool${dynamicToolCount !== 1 ? 's' : ''}...`,
            });
          }

          // Build final tools object: static tools + dynamically loaded tools
          // biome-ignore lint/suspicious/noExplicitAny: Dynamic tool types
          const allTools: Record<string, any> = {
            registrySearchTool,
            registryExecuteTool,
            ...state.loadedTools,
          };

          console.log(
            `🔧 ${Object.keys(allTools).length} total tools available (2 static + ${dynamicToolCount} dynamic)`
          );

          // Build AI SDK messages
          const messages: ModelMessage[] = [];

          // Build tool list for system prompt
          const staticToolsList = [
            '- registrySearchTool: Search the TPMJS registry to find AI SDK tools by keyword. Returns toolIds for registryExecuteTool.',
            '- registryExecuteTool: Execute any tool from the TPMJS registry by toolId. Use registrySearchTool first to find tools.',
          ].join('\n');

          const dynamicToolsList = Object.entries(state.loadedTools)
            .map(([name, t]) => {
              const tl = t as { description?: string };
              return `- ${name}: ${tl.description || 'No description'}`;
            })
            .join('\n');

          // Add system prompt with available tools
          const baseSystemPrompt = buildSystemPrompt({
            customSystemPrompt: userSettings?.customSystemPrompt,
            pinnedToolIds: userSettings?.pinnedToolIds || [],
          });

          const systemPrompt = `${baseSystemPrompt}

## Static Tools (Always Available)

These tools let you access the entire TPMJS registry of 1M+ tools:

${staticToolsList}

## Dynamically Loaded Tools

These tools have been discovered and loaded for this conversation. Call them directly:

${dynamicToolsList || 'No tools loaded yet. Use registrySearchTool to find tools, or they will be auto-loaded based on your requests.'}

## How to Use Tools

1. **To find a tool**: Use registrySearchTool with a keyword (e.g., "weather", "web scraping", "database")
2. **To execute a found tool**: Use registryExecuteTool with the toolId returned from search
3. **Direct execution**: If a tool is already loaded above, call it directly by name

## Example Workflow

User: "Get the weather in Tokyo"
1. Use registrySearchTool to find weather tools
2. Use registryExecuteTool to execute the found tool
   OR call a loaded tool directly if available

Remember: Your value is in EXECUTING tools to get real results, not just describing what tools could do.`;

          messages.push({ role: 'system', content: systemPrompt });

          // Add conversation history
          for (const msg of recentMessages.slice(0, -1)) {
            // Exclude the message we just added
            if (msg.role === 'USER') {
              messages.push({ role: 'user', content: msg.content });
            } else if (msg.role === 'ASSISTANT') {
              if (msg.toolCalls && Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0) {
                const toolCallParts = (
                  msg.toolCalls as Array<{ toolCallId: string; toolName: string; args: unknown }>
                ).map((tc) => ({
                  type: 'tool-call' as const,
                  toolCallId: tc.toolCallId,
                  toolName: tc.toolName,
                  input: tc.args,
                }));

                const content: Array<
                  | { type: 'text'; text: string }
                  | { type: 'tool-call'; toolCallId: string; toolName: string; input: unknown }
                > = [];

                if (msg.content) {
                  content.push({ type: 'text', text: msg.content });
                }
                content.push(...toolCallParts);
                messages.push({ role: 'assistant', content });
              } else {
                messages.push({ role: 'assistant', content: msg.content });
              }
            } else if (msg.role === 'TOOL') {
              // Handle tool results (stored in toolCalls as a workaround)
              const toolResults = msg.toolCalls as Array<{
                toolCallId: string;
                toolName: string;
                output: unknown;
              }> | null;
              if (toolResults && toolResults.length > 0) {
                for (const tr of toolResults) {
                  messages.push({
                    role: 'tool',
                    content: [
                      {
                        type: 'tool-result' as const,
                        toolCallId: tr.toolCallId,
                        toolName: tr.toolName,
                        output: {
                          type: 'json' as const,
                          value: tr.output as Parameters<typeof JSON.stringify>[0],
                        },
                      },
                    ],
                  });
                }
              }
            }
          }

          // Add new user message
          messages.push({ role: 'user', content: parsed.data.message });

          // --- Status: streaming ---
          sendEvent('status', { phase: 'streaming', message: 'Generating response...' });

          // Track per-tool start times for accurate executionTimeMs
          const toolStartTimes = new Map<string, number>();

          let stepIndex = 0;
          let totalInputTokens = 0;
          let totalOutputTokens = 0;

          const result = streamText({
            model,
            messages,
            tools: Object.keys(allTools).length > 0 ? allTools : undefined,
            stopWhen: stepCountIs(10), // Allow up to 10 tool calls
            onChunk: async (chunk) => {
              // Handle tool call (complete tool call with args)
              if (chunk.chunk.type === 'tool-call') {
                const input =
                  'input' in chunk.chunk
                    ? chunk.chunk.input
                    : 'args' in chunk.chunk
                      ? (chunk.chunk as { args: unknown }).args
                      : {};

                // Track tool start time
                toolStartTimes.set(chunk.chunk.toolCallId, Date.now());

                // Fire-and-forget: create tool run record
                prisma.omegaToolRun
                  .create({
                    data: {
                      conversationId,
                      toolName: chunk.chunk.toolName,
                      input: input as Prisma.InputJsonValue,
                      status: 'running',
                    },
                  })
                  .catch(console.error);

                sendEvent('run.step.tool.started', {
                  toolCallId: chunk.chunk.toolCallId,
                  toolName: chunk.chunk.toolName,
                  input,
                });
              }
            },
            // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Chronological multi-step saving
            onStepFinish: async ({ text, toolCalls, toolResults, usage }) => {
              stepIndex++;
              console.log(`🏁 Step ${stepIndex} finished. Text length: ${text?.length || 0}, Tools: ${toolCalls?.length || 0}`);

              totalInputTokens += usage.inputTokens ?? 0;
              totalOutputTokens += usage.outputTokens ?? 0;

              // 1. Save Assistant Message for this step if it has text or tool calls
              if (text || (toolCalls && toolCalls.length > 0)) {
                const assistantMessage = await prisma.omegaMessage.create({
                  data: {
                    conversationId,
                    role: 'ASSISTANT',
                    content: text || '',
                    toolCalls:
                      toolCalls && toolCalls.length > 0
                        ? (toolCalls.map((tc) => ({
                            toolCallId: tc.toolCallId,
                            toolName: tc.toolName,
                            args: tc.args,
                          })) as unknown as Prisma.InputJsonValue)
                        : Prisma.JsonNull,
                    inputTokens: usage.inputTokens,
                    outputTokens: usage.outputTokens,
                  },
                });

                sendEvent('run.step.completed', {
                  stepIndex,
                  message: {
                    id: assistantMessage.id,
                    role: 'ASSISTANT',
                    content: text || '',
                    toolCalls: toolCalls?.map((tc) => ({
                      toolCallId: tc.toolCallId,
                      toolName: tc.toolName,
                      args: tc.args,
                    })),
                    createdAt: assistantMessage.createdAt,
                  },
                });
              }

              // 2. Save Tool Results for this step if present
              if (toolResults && toolResults.length > 0) {
                const toolResultEntries = toolResults.map((tr) => {
                  const isError = tr.output && typeof tr.output === 'object' && 'error' in tr.output;

                  // Update tool run record
                  const toolStart = toolStartTimes.get(tr.toolCallId);
                  const executionTimeMs = toolStart ? Date.now() - toolStart : 0;
                  toolStartTimes.delete(tr.toolCallId);

                  prisma.omegaToolRun
                    .updateMany({
                      where: {
                        conversationId,
                        toolName: tr.toolName,
                        status: 'running',
                      },
                      data: {
                        output: tr.output as Prisma.InputJsonValue,
                        status: isError ? 'error' : 'success',
                        completedAt: new Date(),
                        executionTimeMs,
                        error: isError ? String((tr.output as any).error) : null,
                      },
                    })
                    .catch(console.error);

                  sendEvent('run.step.tool.completed', {
                    toolCallId: tr.toolCallId,
                    toolName: tr.toolName,
                    output: tr.output,
                    isError,
                  });

                  return {
                    toolCallId: tr.toolCallId,
                    toolName: tr.toolName,
                    output: tr.output,
                  };
                });

                const toolMessage = await prisma.omegaMessage.create({
                  data: {
                    conversationId,
                    role: 'TOOL',
                    content: `Step ${stepIndex} results`,
                    toolCalls: toolResultEntries as unknown as Prisma.InputJsonValue,
                  },
                });

                sendEvent('run.step.completed', {
                  stepIndex,
                  message: {
                    id: toolMessage.id,
                    role: 'TOOL',
                    content: toolMessage.content,
                    toolCalls: toolResultEntries,
                    createdAt: toolMessage.createdAt,
                  },
                });

                // Handle dynamic tool injection from search results
                for (const tr of toolResults) {
                  if (tr.toolName === 'registrySearchTool' && tr.output && typeof tr.output === 'object') {
                    const searchOutput = tr.output as { tools?: any[] };
                    if (searchOutput.tools && Array.isArray(searchOutput.tools)) {
                      const toolMetas = searchOutput.tools.map((t) => ({
                        toolId: t.toolId,
                        packageName: t.package || t.toolId.split('::')[0],
                        name: t.name || t.toolId.split('::')[1],
                        description: t.description || `Tool: ${t.name}`,
                        version: 'latest',
                        importUrl: `https://esm.sh/${t.package || t.toolId.split('::')[0]}`,
                      }));

                      const newlyAdded = await addToolsToConversation(conversationId, toolMetas, userEnvVars);
                      if (newlyAdded.length > 0) {
                        sendEvent('tools.loaded', {
                          newTools: newlyAdded,
                          totalDynamicTools: Object.keys(state.loadedTools).length,
                        });
                      }
                    }
                  }
                }
              }
            },
          });

          // Stream text chunks
          for await (const chunk of result.textStream) {
            sendEvent('message.delta', { content: chunk });
          }

          // Update conversation total tokens and state
          await prisma.omegaConversation.update({
            where: { id: conversationId },
            data: {
              executionState: 'idle',
              inputTokensTotal: { increment: totalInputTokens },
              outputTokensTotal: { increment: totalOutputTokens },
              // Set title if it was the first message pair
              ...(recentMessages.length <= 1 && !conversation.title
                ? {
                    title:
                      parsed.data.message.slice(0, 50) +
                      (parsed.data.message.length > 50 ? '...' : ''),
                  }
                : {}),
            },
          });

          sendEvent('run.completed', {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            staticTools: ['registrySearchTool', 'registryExecuteTool'],
            dynamicToolsLoaded: Object.keys(state.loadedTools),
            autoDiscoveredTools: relevantTools.map((t) => ({
              toolId: t.toolId,
              name: t.name,
              packageName: t.packageName,
              description: t.description,
            })),
          });

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);

          // Update conversation state on error
          await prisma.omegaConversation.update({
            where: { id: conversationId },
            data: { executionState: 'idle' },
          });

          sendEvent('run.failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Message handler error:', error);

    // Reset conversation state
    await prisma.omegaConversation.update({
      where: { id: conversationId },
      data: { executionState: 'idle' },
    });

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
