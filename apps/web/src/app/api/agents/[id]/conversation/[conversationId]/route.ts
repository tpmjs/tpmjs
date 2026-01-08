/**
 * Agent Conversation Endpoint (ID-based version)
 *
 * POST: Send a message and stream the AI response
 * GET: Retrieve conversation history
 * DELETE: Delete a conversation
 *
 * This endpoint uses agent id directly for dashboard usage
 */

import { decryptApiKey } from '@/lib/crypto/api-keys';
import { Prisma, prisma } from '@tpmjs/db';
import type { AIProvider } from '@tpmjs/types/agent';
import { SendMessageSchema } from '@tpmjs/types/agent';
import type { LanguageModel, ModelMessage } from 'ai';
import { type NextRequest, NextResponse } from 'next/server';
import { type RateLimitConfig, checkRateLimit } from '~/lib/rate-limit';

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
export const maxDuration = 60; // Vercel Hobby plan max

type RouteContext = {
  params: Promise<{ id: string; conversationId: string }>;
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
 * POST /api/agents/[id]/conversation/[conversationId]
 * Send a message and stream the AI response via SSE
 */
export async function POST(request: NextRequest, context: RouteContext): Promise<Response> {
  // Check rate limit first to prevent expensive LLM calls
  const rateLimitResponse = checkRateLimit(request, CHAT_RATE_LIMIT);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { id: agentId, conversationId } = await context.params;

  try {
    const body = await request.json();
    const parsed = SendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Fetch agent with all tool relations using agent ID
    const { fetchAgentWithTools, buildAgentTools } = await import('@/lib/agents/build-tools');
    const agent = await fetchAgentWithTools(agentId);

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
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

    // Add conversation history - properly format for AI SDK
    for (const msg of recentMessages) {
      if (msg.role === 'USER') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'ASSISTANT') {
        // For assistant messages with tool calls, include ToolCallParts in content
        if (msg.toolCalls && Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0) {
          const toolCallParts = (
            msg.toolCalls as Array<{ toolCallId: string; toolName: string; args: unknown }>
          ).map((tc) => ({
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

    // Build tools from agent configuration
    const tools = buildAgentTools(agent);

    // Get the provider model
    const model = await getProviderModel(agent.provider, agent.modelId, apiKey);

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = (event: string, data: unknown) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

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
                  sendEvent('tool_result', {
                    toolCallId: tr.toolCallId,
                    output: tr.output,
                  });

                  // Collect tool results to save after assistant message
                  pendingToolResults.push({
                    toolCallId: tr.toolCallId,
                    toolName: tr.toolName,
                    output: tr.output,
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

          // Stream text chunks
          for await (const chunk of result.textStream) {
            fullContent += chunk;
            sendEvent('chunk', { type: 'text', text: chunk });
          }

          // Get final response data
          const finalUsage = await result.usage;

          // Convert tool calls map to array for storage
          const allToolCalls = Array.from(toolCallsMap.values());

          // Update token counts from final usage
          if (finalUsage) {
            inputTokens = finalUsage.inputTokens ?? inputTokens;
            outputTokens = finalUsage.outputTokens ?? outputTokens;
          }

          // Save assistant message FIRST (so it has earlier createdAt than tool results)
          const assistantMessage = await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: 'ASSISTANT',
              content: fullContent,
              // Cast to Prisma-compatible JSON type
              toolCalls:
                allToolCalls.length > 0
                  ? (allToolCalls as unknown as Prisma.InputJsonValue)
                  : Prisma.JsonNull,
              inputTokens,
              outputTokens,
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

          // Send completion event
          sendEvent('complete', {
            messageId: assistantMessage.id,
            conversationId: conversation.id,
            executionTimeMs,
          });
        } catch (error) {
          console.error('Agent conversation error:', error);
          sendEvent('error', {
            message: error instanceof Error ? error.message : 'Unknown error',
          });
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
 * GET /api/agents/[id]/conversation/[conversationId]
 * Retrieve conversation history with pagination
 *
 * Query params:
 * - limit: Max messages to return (default: 50, max: 100)
 * - before: Fetch messages created before this ISO timestamp (for loading older messages)
 * - after: Fetch messages created after this ISO timestamp (for loading newer messages)
 *
 * Default behavior (no before/after): Returns the most recent messages
 * With before: Returns messages older than the timestamp (for scrolling up)
 * With after: Returns messages newer than the timestamp (for refreshing)
 */
export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id: agentId, conversationId } = await context.params;
  const { searchParams } = new URL(request.url);

  const limit = Math.min(Number.parseInt(searchParams.get('limit') || '50', 10), 100);
  const before = searchParams.get('before');
  const after = searchParams.get('after');

  try {
    // Fetch agent by ID
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true },
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

    // Build the where clause based on cursor
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
 * DELETE /api/agents/[id]/conversation/[conversationId]
 * Delete a conversation
 */
export async function DELETE(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id: agentId, conversationId } = await context.params;

  try {
    // Fetch agent by ID
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
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
