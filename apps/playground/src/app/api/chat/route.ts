import { createOpenAI } from '@ai-sdk/openai';
import { searchTpmjsToolsTool } from '@tpmjs/search-registry';
import { type UIMessage, convertToModelMessages, stepCountIs, streamText } from 'ai';
import type { NextRequest } from 'next/server';
import { env } from '~/env';
import { addConversationTools, loadToolsBatch } from '~/lib/dynamic-tool-loader';
import { loadAllTools, sanitizeToolName } from '~/lib/tool-loader';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Initialize OpenAI provider
const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Add conversation state tracking (in-memory for MVP)
// biome-ignore lint/suspicious/noExplicitAny: Tool types from AI SDK are complex
const conversationStates = new Map<string, { loadedTools: Record<string, any> }>();

/**
 * POST /api/chat
 * Chat with AI agent that can execute TPMJS tools
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 Request body:', JSON.stringify(body, null, 2));

    const messages: UIMessage[] = body.messages || [];
    const conversationId: string = body.conversationId || 'default';
    const clientEnv: Record<string, string> = body.env || {};

    console.log(`🔑 Conversation ID: ${conversationId}`);
    console.log(`🔐 Client env vars: ${Object.keys(clientEnv).length} keys`);

    // Get or create conversation state
    if (!conversationStates.has(conversationId)) {
      console.log('✨ Creating new conversation state');
      conversationStates.set(conversationId, { loadedTools: {} });
    }
    // biome-ignore lint/style/noNonNullAssertion: We just ensured the value exists above
    const state = conversationStates.get(conversationId)!;
    console.log(
      `📊 Current loaded tools in conversation: ${Object.keys(state.loadedTools).length}`
    );

    // 1. Load static tools + search tool
    const staticTools = await loadAllTools();
    console.log(`🔧 Loaded ${Object.keys(staticTools).length} static tools`);

    staticTools.searchTpmjsTools = searchTpmjsToolsTool;
    console.log('✅ Added searchTpmjsTools to static tools');

    // Debug: Check the search tool structure
    console.log('🔍 Search tool structure:', {
      description: searchTpmjsToolsTool.description,
      parameters: typeof searchTpmjsToolsTool.parameters,
      execute: typeof searchTpmjsToolsTool.execute,
    });

    // 2. Extract user query from last message for tool search
    const lastMessage = messages[messages.length - 1];
    let userQuery = '';
    if (lastMessage?.role === 'user') {
      // Extract text from message parts
      const parts = (lastMessage as any).parts || [];
      for (const part of parts) {
        if (part.type === 'text') {
          userQuery = part.text;
          break;
        }
      }
    }

    console.log(`💬 User query: "${userQuery}"`);

    // 3. Automatically search for relevant tools based on the user's message
    if (userQuery && userQuery.trim().length > 0) {
      console.log('🔎 Searching for relevant tools...');

      try {
        const searchResult = await searchTpmjsToolsTool.execute(
          {
            query: userQuery,
            limit: 5, // Get top 5 relevant tools
          },
          {} as any
        );

        console.log(`📦 Found ${searchResult.matchCount} matching tools`);

        if (searchResult.tools && searchResult.tools.length > 0) {
          console.log(
            '🔧 Tools found:',
            searchResult.tools.map((t: any) => `${t.packageName}/${t.exportName}`)
          );

          // Dynamically load tools from esm.sh
          console.log(`📥 Loading ${searchResult.tools.length} tools dynamically...`);

          const toolsToLoad = searchResult.tools.map((meta: any) => ({
            packageName: meta.packageName,
            exportName: meta.exportName,
            version: meta.version,
            importUrl: meta.importUrl,
          }));

          try {
            const loadedTools = await loadToolsBatch(toolsToLoad, clientEnv);
            console.log(`✅ Successfully loaded ${Object.keys(loadedTools).length} tools`);

            // Add sanitized tools to conversation state
            for (const [key, tool] of Object.entries(loadedTools)) {
              const [pkg, exp] = key.split('::');
              const sanitizedKey = sanitizeToolName(`${pkg}-${exp}`);
              state.loadedTools[sanitizedKey] = tool;
              console.log(`✅ Added to conversation: ${sanitizedKey}`);
            }

            // Track for this conversation
            addConversationTools(conversationId, Object.keys(state.loadedTools));
          } catch (error) {
            console.error('❌ Error loading tools:', error);
          }
        } else {
          console.log('ℹ️  No matching tools found for this query');
        }
      } catch (error) {
        console.error('❌ Error searching for tools:', error);
      }
    }

    // 4. Merge with conversation's dynamically loaded tools
    // biome-ignore lint/suspicious/noExplicitAny: Tool types from AI SDK are complex
    const allTools: Record<string, any> = { ...staticTools, ...state.loadedTools };

    // 5. Build system prompt with available tools
    const toolsList = Object.keys(allTools)
      .map((name) => {
        const tool = allTools[name] as { description?: string } | undefined;
        return `- ${name}: ${tool?.description || 'No description'}`;
      })
      .join('\n');

    const system = `You are a helpful AI assistant that can use TPMJS tools to help users.

Available tools:
${toolsList}

When you use a tool, you MUST always follow up with a natural language answer to the user summarizing the result.`;

    // 6. Stream response with all available tools
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system,
      messages: convertToModelMessages(messages),
      tools: allTools,
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
