import { createOpenAI } from '@ai-sdk/openai';
import { type UIMessage, convertToModelMessages, stepCountIs, streamText } from 'ai';
import type { NextRequest } from 'next/server';
import { env } from '~/env';
import { loadAllTools } from '~/lib/tool-loader';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Initialize OpenAI provider
const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
});

/**
 * POST /api/chat
 * Chat with AI agent that can execute TPMJS tools
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const messages: UIMessage[] = body.messages || [];

    // Load all available TPMJS tools
    const tools = await loadAllTools();

    // Create system prompt listing available tools
    const toolsList = Object.keys(tools)
      .map((name) => {
        const tool = tools[name] as { description?: string } | undefined;
        return `- ${name}: ${tool?.description || 'No description'}`;
      })
      .join('\n');

    const system = `You are a helpful AI assistant that can use TPMJS tools to help users.

Available tools:
${toolsList}

When you use a tool, you MUST always follow up with a natural language answer to the user summarizing the result.`;

    // Stream the response with multi-step tool usage enabled
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system,
      messages: convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(5), // Allow model to call tools AND generate text response
    });

    // Return UI message stream with tool calls and text
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
