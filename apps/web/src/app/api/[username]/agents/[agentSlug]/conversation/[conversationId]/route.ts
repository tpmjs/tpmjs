/**
 * Agent Conversation Endpoint (Username/Slug-based version)
 *
 * POST: Send a message and stream the AI response
 * GET: Retrieve conversation history
 * DELETE: Delete a conversation
 *
 * This endpoint uses username and agent slug for public-friendly URLs.
 * Example: /api/ajax/agents/tpmjs-discord/conversation/my-conv-1
 *
 * Authentication: Supports both session auth and TPMJS API key auth.
 * Requires 'agent:chat' scope for API key access.
 */

import { randomUUID } from 'node:crypto';
import { Prisma, prisma } from '@tpmjs/db';
import type { AIProvider } from '@tpmjs/types/agent';
import { SendMessageSchema } from '@tpmjs/types/agent';
import type { LanguageModel, ModelMessage } from 'ai';
import { type NextRequest, NextResponse } from 'next/server';
import { decryptApiKey } from '@/lib/crypto/api-keys';
import { logActivity } from '~/lib/activity';
import { authenticateRequest, hasScope } from '~/lib/api-keys/middleware';
import { trackUsage } from '~/lib/api-keys/usage';
import { checkRateLimit, type RateLimitConfig } from '~/lib/rate-limit';
import { inferErrorCategory } from '~/lib/tracking/error-categories';
import { trackExecution } from '~/lib/tracking/executions';

/**
 * Rate limit for chat messages: 30 requests per minute
 * This is stricter than default because chat involves expensive LLM calls
 */
const CHAT_RATE_LIMIT: RateLimitConfig = {
  limit: 30,
  windowSeconds: 60,
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for long agentic runs

type RouteContext = {
  params: Promise<{ username: string; agentSlug: string; conversationId: string }>;
};

/**
 * Get AI provider SDK based on provider type
 */
async function getProviderModel(
  provider: AIProvider,
  modelId: string,
  apiKey: string
): Promise<LanguageModel> {
  switch (provider) {
    case 'OPENAI': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      return createOpenAI({ apiKey })(modelId);
    }
    case 'ANTHROPIC': {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      return createAnthropic({ apiKey })(modelId);
    }
    case 'GOOGLE': {
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
      return createGoogleGenerativeAI({ apiKey })(modelId);
    }
    case 'GROQ': {
      const { createGroq } = await import('@ai-sdk/groq');
      return createGroq({ apiKey })(modelId);
    }
    case 'MISTRAL': {
      const { createMistral } = await import('@ai-sdk/mistral');
      return createMistral({ apiKey })(modelId);
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * POST /api/[username]/agents/[agentSlug]/conversation/[conversationId]
 * Send a message and stream the AI response via SSE
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex streaming logic required
export async function POST(request: NextRequest, context: RouteContext): Promise<Response> {
  const startTime = Date.now();

  // Authenticate request (supports both session and API key)
  const authResult = await authenticateRequest().catch((error: unknown) => {
    console.error('[Agent] Auth middleware error (PrismaClientInitializationError or similar):', error);
    return null;
  });

  if (!authResult) {
    return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
  }

  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check scope for API key auth
  if (authResult.authenticated && !authResult.isSessionAuth) {
    if (!hasScope(authResult, 'agent:chat')) {
      return NextResponse.json(
        { error: 'API key does not have agent:chat scope' },
        { status: 403 }
      );
    }
  }

  // Check rate limit (after auth so we can track by user if needed)
  const rateLimitResponse = checkRateLimit(request, CHAT_RATE_LIMIT);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { username, agentSlug, conversationId } = await context.params;

  try {
    const body = await request.json();
    const parsed = SendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Fetch agent by username and slug with all tool relations
    const { fetchAgentByUsernameAndUidWithTools, buildAgentTools } = await import(
      '@/lib/agents/build-tools'
    );
    const agent = await fetchAgentByUsernameAndUidWithTools(username, agentSlug);

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    // Owner-only enforcement: Only the agent owner can chat with the agent
    if (authResult.userId !== agent.userId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Fork this agent to use it. Only the agent owner can chat with agents. ' +
            'Visit the agent page to fork it to your account.',
        },
        { status: 403 }
      );
    }

    // Map provider to expected key name format
    const providerKeyNames: Record<string, string> = {
      OPENAI: 'OPENAI_API_KEY',
      ANTHROPIC: 'ANTHROPIC_API_KEY',
      GOOGLE: 'GOOGLE_API_KEY',
      GROQ: 'GROQ_API_KEY',
      MISTRAL: 'MISTRAL_API_KEY',
    };
    const keyName = providerKeyNames[agent.provider];

    if (!keyName) {
      return NextResponse.json(
        { success: false, error: `Unsupported provider: ${agent.provider}` },
        { status: 400 }
      );
    }

    // Get user's API key for this provider
    const userApiKey = await prisma.userApiKey.findUnique({
      where: {
        userId_keyName: {
          userId: agent.userId,
          keyName,
        },
      },
    });

    if (!userApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: `No API key configured for ${agent.provider}. Please add your API key in settings.`,
        },
        { status: 400 }
      );
    }

    // Decrypt the API key
    const apiKey = decryptApiKey(userApiKey.encryptedKey, userApiKey.keyIv);

    // Get or create conversation
    let conversation = await prisma.conversation.findUnique({
      where: {
        agentId_slug: {
          agentId: agent.id,
          slug: conversationId,
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          agentId: agent.id,
          slug: conversationId,
          title: parsed.data.message.slice(0, 100),
        },
      });

      // Log activity for new conversation (fire-and-forget)
      if (agent.userId) {
        logActivity({
          userId: agent.userId,
          type: 'AGENT_CONVERSATION_STARTED',
          targetName: agent.name,
          targetType: 'agent',
          agentId: agent.id,
        });
      }
    }

    // Fetch recent messages for context
    const recentMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: agent.maxMessagesInContext,
    });

    // Reverse to get chronological order
    recentMessages.reverse();

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: parsed.data.message,
      },
    });

    // Build AI SDK messages from conversation history
    const { streamText, stepCountIs } = await import('ai');

    const messages: ModelMessage[] = [];

    // Add system prompt if defined
    if (agent.systemPrompt) {
      messages.push({
        role: 'system',
        content: agent.systemPrompt,
      });
    }

    // Build a set of tool call IDs that have corresponding tool results
    // This is needed because AI SDK requires every tool call to have a matching tool result
    const toolResultIds = new Set(
      recentMessages.filter((m) => m.role === 'TOOL' && m.toolCallId).map((m) => m.toolCallId)
    );

    // Add conversation history - properly format for AI SDK
    for (const msg of recentMessages) {
      if (msg.role === 'USER') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'ASSISTANT') {
        // For assistant messages with tool calls, include ToolCallParts in content
        if (msg.toolCalls && Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0) {
          // Only include tool calls that have matching tool results
          // AI SDK fails if there's a tool call without a corresponding tool result
          const validToolCalls = (
            msg.toolCalls as Array<{ toolCallId: string; toolName: string; args: unknown }>
          ).filter((tc) => toolResultIds.has(tc.toolCallId));

          if (validToolCalls.length > 0) {
            const toolCallParts = validToolCalls.map((tc) => ({
              type: 'tool-call' as const,
              toolCallId: tc.toolCallId,
              toolName: tc.toolName,
              input: tc.args,
            }));
            // Content includes text (if any) plus tool call parts
            const content: Array<
              | { type: 'text'; text: string }
              | { type: 'tool-call'; toolCallId: string; toolName: string; input: unknown }
            > = [];
            if (msg.content) {
              content.push({ type: 'text', text: msg.content });
            }
            content.push(...toolCallParts);
            messages.push({
              role: 'assistant',
              content,
            });
          } else {
            // All tool calls are missing results, just include text content
            messages.push({
              role: 'assistant',
              content: msg.content || '',
            });
          }
        } else {
          messages.push({
            role: 'assistant',
            content: msg.content,
          });
        }
      } else if (msg.role === 'TOOL') {
        // Tool results use the 'tool' role with content array
        messages.push({
          role: 'tool',
          content: [
            {
              type: 'tool-result' as const,
              toolCallId: msg.toolCallId || '',
              toolName: msg.toolName || '',
              output: {
                type: 'json' as const,
                value: msg.toolResult,
              },
            },
          ],
        });
      }
    }

    // Add new user message
    messages.push({ role: 'user', content: parsed.data.message });

    // Set up sandbox session if agent has sandbox enabled
    let sessionId: string | undefined;
    let _sandboxUrl: string | undefined;
    let _sandboxApiKey: string | undefined;
    if (agent.sandboxEnabled) {
      const { getSandboxConfig, createSandboxSession } = await import('@/lib/executors');
      const { url: sandboxUrl, apiKey: sandboxApiKey } = getSandboxConfig();
      if (!sandboxUrl) {
        return NextResponse.json(
          {
            success: false,
            error: 'Sandbox not available. AGENT_SANDBOX_URL is not configured.',
          },
          { status: 502 }
        );
      }
      _sandboxUrl = sandboxUrl;
      _sandboxApiKey = sandboxApiKey;
      sessionId = `${agent.id}:${conversationId}`;
      try {
        await createSandboxSession(sandboxUrl, sandboxApiKey, sessionId);
      } catch (error) {
        console.error('[Sandbox] Failed to create session:', error);
        return NextResponse.json(
          {
            success: false,
            error: `Failed to create sandbox session: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
          { status: 502 }
        );
      }
    }

    // Set up approval handler for tools with "ask" permission
    const { parseToolPermissions } = await import('@/lib/agents/permissions');
    const permissions = parseToolPermissions(agent.toolPermissions);
    const hasPendingApprovals = permissions !== null;
    let approvalSendEvent: ((event: string, data: unknown) => void) | null = null;

    async function handleToolApproval(toolName: string, input: unknown): Promise<boolean> {
      const toolCallId = randomUUID();
      const approval = await prisma.toolApproval.create({
        data: {
          conversationId: conversation!.id,
          agentId: agent!.id,
          toolCallId,
          toolName,
          inputArgs: input as object,
        },
      });
      if (approvalSendEvent) {
        approvalSendEvent('approval_request', { approvalId: approval.id, toolName, input });
      }
      const POLL_INTERVAL = 2000;
      const TIMEOUT = 120000;
      const start = Date.now();
      while (Date.now() - start < TIMEOUT) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
        const updated = await prisma.toolApproval.findUnique({
          where: { id: approval.id },
          select: { decision: true },
        });
        if (updated?.decision) {
          if (approvalSendEvent) {
            approvalSendEvent('approval_resolved', {
              approvalId: approval.id,
              decision: updated.decision,
            });
          }
          return updated.decision === 'approve';
        }
      }
      await prisma.toolApproval.update({
        where: { id: approval.id },
        data: { decision: 'deny', resolvedAt: new Date() },
      });
      if (approvalSendEvent) {
        approvalSendEvent('approval_timeout', { approvalId: approval.id, toolName });
      }
      return false;
    }
    const approvalHandler = hasPendingApprovals ? handleToolApproval : undefined;

    // Build tools from agent configuration
    const tools = buildAgentTools(
      agent,
      undefined,
      sessionId,
      _sandboxUrl,
      _sandboxApiKey,
      approvalHandler
    );
    const toolCount = Object.keys(tools).length;
    const toolNames = Object.keys(tools);

    console.log('[Agent] Built tools:', { toolCount, toolNames, agentId: agent.id });

    // Get the provider model
    const model = await getProviderModel(agent.provider, agent.modelId, apiKey);

    // Create SSE stream
    const stream = new ReadableStream({
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex streaming logic
      async start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = (event: string, data: unknown) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        // Bind approval SSE sender
        approvalSendEvent = sendEvent;

        // ML tracking: declared outside try so they're accessible in catch
        const sequenceId = randomUUID();
        const contextMessageCount = messages.length;
        const contextTokenCount = Math.round(
          messages.reduce((sum, m) => {
            const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
            return sum + content.length;
          }, 0) / 4
        );

        try {
          const startTime = Date.now();
          let fullContent = '';
          // Accumulate tool calls with their input args
          const toolCallsMap: Map<string, { toolCallId: string; toolName: string; args: unknown }> =
            new Map();
          // Collect tool results to save AFTER assistant message (for correct chronological order)
          const pendingToolResults: Array<{
            toolCallId: string;
            toolName: string;
            output: unknown;
          }> = [];
          let inputTokens = 0;
          let outputTokens = 0;
          const streamErrors: string[] = [];
          let turnIndex = 0;

          // Send debug info so the client knows the stream configuration
          sendEvent('debug', {
            provider: agent.provider,
            model: agent.modelId,
            toolCount,
            toolNames,
            messageCount: messages.length,
            sandboxEnabled: agent.sandboxEnabled,
          });

          // Stream the response with agentic loop control
          const result = await streamText({
            model,
            messages,
            tools,
            stopWhen: stepCountIs(agent.maxToolCallsPerTurn),
            onChunk: async ({ chunk }) => {
              // Stream tool calls as they come in and capture their inputs
              if (chunk.type === 'tool-call') {
                const input = 'args' in chunk ? chunk.args : chunk.input;

                // Log tool call for debugging
                console.log('[Agent] Tool call initiated:', {
                  toolName: chunk.toolName,
                  toolCallId: chunk.toolCallId,
                  input: JSON.stringify(input).slice(0, 500),
                });

                // Store tool call with input for later persistence
                toolCallsMap.set(chunk.toolCallId, {
                  toolCallId: chunk.toolCallId,
                  toolName: chunk.toolName,
                  args: input,
                });
                sendEvent('tool_call', {
                  toolCallId: chunk.toolCallId,
                  toolName: chunk.toolName,
                  input,
                });
              }
            },
            // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex callback
            onStepFinish: async ({ toolCalls, toolResults, usage }) => {
              // Capture tool calls from step finish (backup in case onChunk missed any)
              if (toolCalls && Array.isArray(toolCalls)) {
                for (const tc of toolCalls) {
                  if (!toolCallsMap.has(tc.toolCallId)) {
                    // Use 'input' from DynamicToolCall or fall back to type assertion for typed calls
                    const args =
                      'input' in tc ? tc.input : 'args' in tc ? (tc as { args: unknown }).args : {};
                    toolCallsMap.set(tc.toolCallId, {
                      toolCallId: tc.toolCallId,
                      toolName: tc.toolName,
                      args,
                    });
                  }
                }
              }

              // Send tool results via SSE but don't save yet (save after assistant message for correct order)
              if (toolResults && toolResults.length > 0) {
                for (const tr of toolResults) {
                  // Check if this is an error result (AI SDK wraps errors in the output)
                  const isError =
                    tr.output && typeof tr.output === 'object' && 'error' in tr.output;

                  // Log tool results for debugging
                  if (isError) {
                    console.error('[Agent] Tool execution failed:', {
                      toolName: tr.toolName,
                      toolCallId: tr.toolCallId,
                      error: tr.output,
                    });
                  } else {
                    console.log('[Agent] Tool execution success:', {
                      toolName: tr.toolName,
                      toolCallId: tr.toolCallId,
                      outputPreview: JSON.stringify(tr.output).slice(0, 200),
                    });
                  }

                  sendEvent('tool_result', {
                    toolCallId: tr.toolCallId,
                    output: tr.output,
                    isError,
                  });

                  // Collect tool results to save after assistant message
                  pendingToolResults.push({
                    toolCallId: tr.toolCallId,
                    toolName: tr.toolName,
                    output: tr.output,
                  });

                  // Track each tool call execution event with ML training fields
                  const toolCallArgs = toolCallsMap.get(tr.toolCallId)?.args;
                  trackExecution({
                    eventType: 'tool_call',
                    source: 'agent_chat',
                    userId: authResult.userId ?? undefined,
                    apiKeyId: authResult.apiKeyId ?? undefined,
                    agentId: agent.id,
                    toolName: tr.toolName,
                    status: isError ? 'error' : 'success',
                    errorMessage:
                      isError && tr.output && typeof tr.output === 'object' && 'error' in tr.output
                        ? String((tr.output as { error: unknown }).error)
                        : undefined,
                    // ML training data
                    sequenceId,
                    turnIndex: turnIndex++,
                    conversationId: conversation.id,
                    inputArgs: toolCallArgs,
                    outputSummary: tr.output,
                    availableToolCount: toolCount,
                    contextMessageCount,
                    contextTokenCount,
                  });
                }
              }

              // Track token usage
              if (usage) {
                inputTokens += usage.inputTokens ?? 0;
                outputTokens += usage.outputTokens ?? 0;
              }
            },
          });

          // Consume the full stream to catch errors that textStream silently swallows.
          // The AI SDK's textStream only yields text chunks and hides provider errors,
          // causing a generic "No output generated" when the actual error is e.g. a 401.
          for await (const part of result.fullStream) {
            if (part.type === 'text-delta') {
              fullContent += part.text;
              sendEvent('chunk', { type: 'text', text: part.text });
            } else if (part.type === 'error') {
              // This is the actual provider error (e.g. 401, 429, invalid model)
              const streamError = part.error;
              const errMsg =
                streamError instanceof Error ? streamError.message : String(streamError);
              streamErrors.push(errMsg);
              console.error('[Agent] Stream error part:', streamError);
              sendEvent('stream_error', {
                message: errMsg,
                raw: JSON.stringify(
                  streamError,
                  Object.getOwnPropertyNames(streamError || {})
                ).slice(0, 2000),
              });
            }
          }

          // Get final response data (may throw NoOutputGeneratedError if stream had 0 steps)
          let finalUsage: { inputTokens?: number; outputTokens?: number } | undefined;
          try {
            finalUsage = await result.usage;
          } catch (usageError) {
            // If usage rejects with NoOutputGeneratedError, the real error was already
            // captured via the fullStream 'error' part above. Log but don't re-throw.
            const cause =
              usageError instanceof Error ? (usageError as { cause?: unknown }).cause : undefined;
            const causeMsg =
              cause instanceof Error ? cause.message : cause ? String(cause) : undefined;
            if (causeMsg) streamErrors.push(causeMsg);
            console.warn('[Agent] Usage rejected (stream produced 0 steps):', {
              error: usageError instanceof Error ? usageError.message : String(usageError),
              cause: causeMsg,
            });
          }

          // Convert tool calls map to array for storage
          const allToolCalls = Array.from(toolCallsMap.values());

          // Update token counts from final usage
          if (finalUsage) {
            inputTokens = finalUsage.inputTokens ?? inputTokens;
            outputTokens = finalUsage.outputTokens ?? outputTokens;
          }

          // If there were stream errors and no content, save errors as the content
          const savedContent =
            fullContent ||
            (streamErrors.length > 0 ? `[Stream Error] ${streamErrors.join('\n')}` : '');

          // Save assistant message FIRST (so it has earlier createdAt than tool results)
          const assistantMessage = await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: 'ASSISTANT',
              content: savedContent,
              // Cast to Prisma-compatible JSON type
              toolCalls:
                allToolCalls.length > 0
                  ? (allToolCalls as unknown as Prisma.InputJsonValue)
                  : Prisma.JsonNull,
              inputTokens,
              outputTokens,
              // ML training data
              availableToolCount: toolCount,
              availableToolNames: toolNames as unknown as Prisma.InputJsonValue,
              sequenceId,
              contextMessageCount,
              contextTokenCount,
            },
          });

          // Now save TOOL messages (after assistant, for correct chronological order)
          for (const tr of pendingToolResults) {
            await prisma.message.create({
              data: {
                conversationId: conversation.id,
                role: 'TOOL',
                content: JSON.stringify(tr.output),
                toolCallId: tr.toolCallId,
                toolName: tr.toolName,
                toolResult: tr.output as object,
              },
            });
          }

          // Update conversation timestamp
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
          });

          const executionTimeMs = Date.now() - startTime;

          // Send token usage
          sendEvent('tokens', {
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
          });

          // Warn if the response was completely empty (no text, no tool calls)
          if (!fullContent && allToolCalls.length === 0) {
            const streamErrorSummary =
              streamErrors.length > 0 ? `\nStream errors: ${streamErrors.join('; ')}` : '';
            console.warn('[Agent] Empty response from model:', {
              agentId: agent.id,
              provider: agent.provider,
              model: agent.modelId,
              toolCount,
              messageCount: messages.length,
              inputTokens,
              outputTokens,
              streamErrors,
            });
            sendEvent('warning', {
              type: 'empty_response',
              message: `Model returned no text and made no tool calls.${streamErrorSummary} Provider: ${agent.provider}, Model: ${agent.modelId}, Tools: ${toolCount}`,
              debug: {
                inputTokens,
                outputTokens,
                toolCount,
                provider: agent.provider,
                model: agent.modelId,
                streamErrors,
              },
            });
          }

          // Send completion event
          sendEvent('complete', {
            messageId: assistantMessage.id,
            conversationId: conversation.id,
            executionTimeMs,
            hasContent: !!fullContent,
            toolCallCount: allToolCalls.length,
          });

          // Track agent run execution event
          trackExecution({
            eventType: 'agent_run',
            source: 'agent_chat',
            userId: authResult.userId ?? undefined,
            apiKeyId: authResult.apiKeyId ?? undefined,
            agentId: agent.id,
            status: 'success',
            durationMs: executionTimeMs,
            tokensIn: inputTokens,
            tokensOut: outputTokens,
            // ML training data
            sequenceId,
            conversationId: conversation.id,
            availableToolCount: toolCount,
            contextMessageCount,
            contextTokenCount,
          });

          // Track usage
          if (authResult.userId) {
            trackUsage({
              apiKeyId: authResult.apiKeyId ?? undefined,
              userId: authResult.userId,
              endpoint: `/api/${username}/agents/${agentSlug}/conversation/${conversationId}`,
              method: 'POST',
              statusCode: 200,
              latencyMs: executionTimeMs,
              resourceType: 'agent',
              resourceId: agent.id,
              tokensIn: inputTokens,
              tokensOut: outputTokens,
              model: agent.modelId,
            });
          }
        } catch (error) {
          // Extract rich error details from provider SDK errors
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;

          // In production, class names get minified (e.g. "aB" instead of "APICallError").
          // Try to infer the real error type from its properties.
          const err = error as Record<string, unknown>;
          const inferredType =
            err.statusCode || err.responseBody
              ? 'APICallError'
              : err.url && err.requestBodyValues
                ? 'APIRequestError'
                : error instanceof Error
                  ? error.constructor.name
                  : 'UnknownError';

          // AI SDK and provider errors often have additional properties
          const errorDetails: Record<string, unknown> = {
            type: inferredType,
            message: errorMessage,
            agentId: agent.id,
            provider: agent.provider,
            model: agent.modelId,
            toolCount,
          };

          // Extract HTTP status and response body from provider errors
          if (err.statusCode) errorDetails.statusCode = err.statusCode;
          if (err.status) errorDetails.status = err.status;
          if (err.responseBody) errorDetails.responseBody = String(err.responseBody).slice(0, 1000);
          if (err.url) errorDetails.url = err.url;
          if (err.requestBodyValues)
            errorDetails.requestBodyValues = JSON.stringify(err.requestBodyValues).slice(0, 500);
          if (err.cause) {
            const cause = err.cause as Record<string, unknown>;
            errorDetails.cause = cause.message || String(err.cause);
            if (cause.code) errorDetails.causeCode = cause.code;
          }
          if (err.data) errorDetails.data = err.data;
          if (err.responseHeaders)
            errorDetails.responseHeaders = JSON.stringify(err.responseHeaders).slice(0, 500);

          // Log full error for server debugging
          console.error('[Agent] Conversation stream error:', {
            error: errorMessage,
            stack: errorStack,
            ...errorDetails,
          });

          // Warn about orphaned sandbox session (TTL cleanup will handle it)
          if (sessionId && _sandboxUrl) {
            console.warn('[Sandbox] Stream error with active session — will expire via TTL:', {
              sessionId,
              sandboxUrl: _sandboxUrl,
            });
          }

          // Save error as an ASSISTANT message so it appears in conversation history and JSON export
          try {
            await prisma.message.create({
              data: {
                conversationId: conversation.id,
                role: 'ASSISTANT',
                content: `[Error] ${errorMessage}`,
                toolCalls: Prisma.JsonNull,
                inputTokens: 0,
                outputTokens: 0,
              },
            });
          } catch (saveErr) {
            console.error('[Agent] Failed to save error message:', saveErr);
          }

          // Send rich error event to client
          sendEvent('error', {
            message: errorMessage,
            type: inferredType,
            details: errorDetails,
          });

          // Track agent run error with ML training data
          const errMsg = error instanceof Error ? error.message : 'Unknown error';
          const errStatusCode = typeof err.statusCode === 'number' ? err.statusCode : undefined;
          trackExecution({
            eventType: 'agent_run',
            source: 'agent_chat',
            userId: authResult.userId ?? undefined,
            apiKeyId: authResult.apiKeyId ?? undefined,
            agentId: agent.id,
            status: 'error',
            durationMs: Date.now() - startTime,
            errorMessage: errMsg,
            errorCategory: inferErrorCategory({
              errorMessage: errMsg,
              statusCode: errStatusCode,
            }),
            // ML training data
            sequenceId,
            conversationId: conversation.id,
            availableToolCount: toolCount,
            contextMessageCount,
            contextTokenCount,
          });

          // Update conversation status to error
          prisma.conversation
            .update({
              where: { id: conversation.id },
              data: { status: 'error' },
            })
            .catch(() => {});

          // Track error
          if (authResult.userId) {
            trackUsage({
              apiKeyId: authResult.apiKeyId ?? undefined,
              userId: authResult.userId,
              endpoint: `/api/${username}/agents/${agentSlug}/conversation/${conversationId}`,
              method: 'POST',
              statusCode: 500,
              latencyMs: Date.now() - startTime,
              resourceType: 'agent',
              resourceId: agent.id,
              errorCode: 'STREAM_ERROR',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Failed to process message:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process message',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/[username]/agents/[agentSlug]/conversation/[conversationId]
 * Retrieve conversation history with pagination
 */
export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { username, agentSlug, conversationId } = await context.params;
  const { searchParams } = new URL(request.url);

  const format = searchParams.get('format');
  const limit = Math.min(Number.parseInt(searchParams.get('limit') || '50', 10), 100);
  const before = searchParams.get('before');
  const after = searchParams.get('after');

  try {
    // Fetch agent by username and slug
    const agent = await prisma.agent.findFirst({
      where: {
        uid: agentSlug,
        user: { username },
      },
      select: {
        id: true,
        uid: true,
        name: true,
        provider: true,
        modelId: true,
        sandboxEnabled: true,
        executorType: true,
        executorConfig: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    // Fetch conversation
    const conversation = await prisma.conversation.findUnique({
      where: {
        agentId_slug: {
          agentId: agent.id,
          slug: conversationId,
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // For JSON format, return all messages with full details
    if (format === 'json') {
      const allMessages = await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'asc' },
      });

      const response = {
        _meta: {
          exportedAt: new Date().toISOString(),
          format: 'tpmjs-conversation-log',
          version: '1.0',
        },
        agent: {
          id: agent.id,
          uid: agent.uid,
          name: agent.name,
          provider: agent.provider,
          modelId: agent.modelId,
          executorType: agent.executorType,
          executorConfig: agent.executorConfig,
        },
        conversation: {
          id: conversation.id,
          slug: conversation.slug,
          title: conversation.title,
          status: conversation.status,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          messageCount: allMessages.length,
        },
        messages: allMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          toolCalls: m.toolCalls,
          toolCallId: m.toolCallId,
          toolName: m.toolName,
          toolResult: m.toolResult,
          inputTokens: m.inputTokens,
          outputTokens: m.outputTokens,
          // ML training fields
          availableToolCount: m.availableToolCount,
          availableToolNames: m.availableToolNames,
          sequenceId: m.sequenceId,
          contextMessageCount: m.contextMessageCount,
          contextTokenCount: m.contextTokenCount,
          createdAt: m.createdAt,
        })),
        stats: {
          totalMessages: allMessages.length,
          userMessages: allMessages.filter((m) => m.role === 'USER').length,
          assistantMessages: allMessages.filter((m) => m.role === 'ASSISTANT').length,
          toolResults: allMessages.filter((m) => m.role === 'TOOL').length,
          totalInputTokens: allMessages.reduce((sum, m) => sum + (m.inputTokens || 0), 0),
          totalOutputTokens: allMessages.reduce((sum, m) => sum + (m.outputTokens || 0), 0),
        },
      };

      // Return pretty-printed JSON with proper content type
      return new NextResponse(JSON.stringify(response, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `inline; filename="${conversation.slug}-logs.json"`,
        },
      });
    }

    // Standard paginated response
    const whereClause: {
      conversationId: string;
      createdAt?: { lt?: Date; gt?: Date };
    } = { conversationId: conversation.id };

    if (before) {
      whereClause.createdAt = { lt: new Date(before) };
    } else if (after) {
      whereClause.createdAt = { gt: new Date(after) };
    }

    // Determine fetch order:
    // - Default (no cursor) or "before": Fetch desc (newest first), then reverse for chronological order
    // - "after": Fetch asc (oldest first) to get messages after the cursor
    const shouldFetchDesc = !after;

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: shouldFetchDesc ? 'desc' : 'asc' },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    let paginatedMessages = hasMore ? messages.slice(0, limit) : messages;

    // Reverse if we fetched in desc order to maintain chronological order
    if (shouldFetchDesc) {
      paginatedMessages = paginatedMessages.reverse();
    }

    const mappedMessages = paginatedMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      toolCalls: m.toolCalls,
      toolCallId: m.toolCallId,
      toolName: m.toolName,
      toolResult: m.toolResult,
      inputTokens: m.inputTokens,
      outputTokens: m.outputTokens,
      availableToolCount: m.availableToolCount,
      availableToolNames: m.availableToolNames,
      sequenceId: m.sequenceId,
      contextMessageCount: m.contextMessageCount,
      contextTokenCount: m.contextTokenCount,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        id: conversation.id,
        slug: conversation.slug,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages: mappedMessages,
      },
      pagination: {
        limit,
        hasMore,
        ...(before && { before }),
        ...(after && { after }),
      },
    });
  } catch (error) {
    console.error('Failed to fetch conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/[username]/agents/[agentSlug]/conversation/[conversationId]
 * Delete a conversation
 */
export async function DELETE(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { username, agentSlug, conversationId } = await context.params;

  try {
    // Fetch agent by username and slug (include sandboxEnabled for cleanup)
    const agent = await prisma.agent.findFirst({
      where: {
        uid: agentSlug,
        user: { username },
      },
      select: { id: true, sandboxEnabled: true },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    // Destroy sandbox session if applicable (fire-and-forget)
    if (agent.sandboxEnabled) {
      const { getSandboxConfig, destroySandboxSession } = await import('@/lib/executors');
      const { url: sandboxUrl, apiKey: sandboxApiKey } = getSandboxConfig();
      if (sandboxUrl) {
        const sessionId = `${agent.id}:${conversationId}`;
        destroySandboxSession(sandboxUrl, sandboxApiKey, sessionId).catch(() => {});
      }
    }

    // Delete conversation (messages cascade)
    await prisma.conversation.deleteMany({
      where: {
        agentId: agent.id,
        slug: conversationId,
      },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
