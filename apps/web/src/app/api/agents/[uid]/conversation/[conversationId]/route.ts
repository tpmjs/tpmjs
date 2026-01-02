/**
 * Agent Conversation Endpoint
 *
 * POST: Send a message and stream the AI response
 * GET: Retrieve conversation history
 * DELETE: Delete a conversation
 */

import { decryptApiKey } from '@/lib/crypto/api-keys';
import { Prisma, prisma } from '@tpmjs/db';
import type { AIProvider } from '@tpmjs/types/agent';
import { SendMessageSchema } from '@tpmjs/types/agent';
import type { LanguageModel } from 'ai';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for long agentic runs

type RouteContext = {
  params: Promise<{ uid: string; conversationId: string }>;
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
 * POST /api/agents/[uid]/conversation/[conversationId]
 * Send a message and stream the AI response via SSE
 */
export async function POST(request: NextRequest, context: RouteContext): Promise<Response> {
  const { uid, conversationId } = await context.params;

  try {
    const body = await request.json();
    const parsed = SendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Fetch agent with all tool relations
    const { fetchAgentByUidWithTools, buildAgentTools } = await import('@/lib/agents/build-tools');
    const agent = await fetchAgentByUidWithTools(uid);

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    // Get user's API key for this provider
    const userApiKey = await prisma.userApiKey.findUnique({
      where: {
        userId_provider: {
          userId: agent.userId,
          provider: agent.provider,
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

    // biome-ignore lint/suspicious/noExplicitAny: AI SDK message types
    const messages: any[] = [];

    // Add system prompt if defined
    if (agent.systemPrompt) {
      messages.push({
        role: 'system',
        content: agent.systemPrompt,
      });
    }

    // Add conversation history
    for (const msg of recentMessages) {
      if (msg.role === 'USER') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'ASSISTANT') {
        const assistantMsg: { role: string; content: string; toolCalls?: unknown[] } = {
          role: 'assistant',
          content: msg.content,
        };
        if (msg.toolCalls) {
          assistantMsg.toolCalls = msg.toolCalls as unknown[];
        }
        messages.push(assistantMsg);
      } else if (msg.role === 'TOOL') {
        messages.push({
          role: 'tool',
          toolCallId: msg.toolCallId,
          toolName: msg.toolName,
          result: msg.toolResult,
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
          // biome-ignore lint/suspicious/noExplicitAny: Dynamic tool call structure
          let allToolCalls: any[] = [];
          let inputTokens = 0;
          let outputTokens = 0;

          // Stream the response with agentic loop control
          const result = await streamText({
            model,
            messages,
            tools,
            stopWhen: stepCountIs(agent.maxToolCallsPerTurn),
            onChunk: async ({ chunk }) => {
              // Stream tool calls as they come in
              if (chunk.type === 'tool-call') {
                sendEvent('tool_call', {
                  toolCallId: chunk.toolCallId,
                  toolName: chunk.toolName,
                  input: 'args' in chunk ? chunk.args : chunk.input,
                });
              }
            },
            onStepFinish: async ({ toolResults, usage }) => {
              // Send tool results
              if (toolResults && toolResults.length > 0) {
                for (const tr of toolResults) {
                  sendEvent('tool_result', {
                    toolCallId: tr.toolCallId,
                    output: tr.output,
                  });

                  // Save tool message to database
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
          const finalResponse = await result.response;
          const finalUsage = await result.usage;

          // Extract tool calls from final response
          if (finalResponse.messages) {
            for (const msg of finalResponse.messages) {
              if ('toolCalls' in msg && msg.toolCalls && Array.isArray(msg.toolCalls)) {
                allToolCalls = [...allToolCalls, ...(msg.toolCalls as unknown[])];
              }
            }
          }

          // Update token counts from final usage
          if (finalUsage) {
            inputTokens = finalUsage.inputTokens ?? inputTokens;
            outputTokens = finalUsage.outputTokens ?? outputTokens;
          }

          // Save assistant message
          const assistantMessage = await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: 'ASSISTANT',
              content: fullContent,
              toolCalls: allToolCalls.length > 0 ? allToolCalls : Prisma.JsonNull,
              inputTokens,
              outputTokens,
            },
          });

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
 * GET /api/agents/[uid]/conversation/[conversationId]
 * Retrieve conversation history
 */
export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { uid, conversationId } = await context.params;

  try {
    // Fetch agent
    const agent = await prisma.agent.findUnique({
      where: { uid },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    // Fetch conversation with messages
    const conversation = await prisma.conversation.findUnique({
      where: {
        agentId_slug: {
          agentId: agent.id,
          slug: conversationId,
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: conversation.id,
        slug: conversation.slug,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages: conversation.messages.map((m) => ({
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
        })),
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
 * DELETE /api/agents/[uid]/conversation/[conversationId]
 * Delete a conversation
 */
export async function DELETE(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { uid, conversationId } = await context.params;

  try {
    // Fetch agent
    const agent = await prisma.agent.findUnique({
      where: { uid },
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
