import { createOpenAI } from '@ai-sdk/openai';
import { searchTpmjsToolsTool } from '@tpmjs/search-registry';
import {
  convertToModelMessages,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
  type Tool,
  type UIMessage,
} from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { env } from '~/env';
import {
  addConversationTools,
  loadToolsBatch,
  setConversationEnv,
} from '~/lib/dynamic-tool-loader';
import { loadAllTools, sanitizeToolName } from '~/lib/tool-loader';

const ChatRequestSchema = z.object({
  messages: z.unknown().optional().default([]),
  conversationId: z.string().trim().min(1).optional().default('default'),
  env: z.record(z.string(), z.string()).optional().default({}),
});

const ToolSearchResultSchema = z.object({
  query: z.string(),
  matchCount: z.number().int().nonnegative(),
  tools: z.array(
    z.object({
      packageName: z.string().min(1),
      name: z.string().min(1),
      version: z.string().min(1),
      importUrl: z.string().url().optional(),
    })
  ),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for complex tool loading

// Add conversation state tracking (in-memory for MVP)
type RuntimeToolSet = Record<string, Tool>;

const conversationStates = new Map<string, { loadedTools: RuntimeToolSet }>();

/**
 * POST /api/chat
 * Chat with AI agent that can execute TPMJS tools
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex chat handler with tool loading requires this complexity
export async function POST(request: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return Response.json(
        { success: false, error: 'Request body must be valid JSON.' },
        { status: 400 }
      );
    }

    const parsedBody = ChatRequestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return Response.json(
        { success: false, error: 'Request body has an invalid chat payload.' },
        { status: 400 }
      );
    }

    const validatedMessages = await safeValidateUIMessages<UIMessage>({
      messages: parsedBody.data.messages,
    });
    if (!validatedMessages.success) {
      return Response.json(
        { success: false, error: 'Request body contains invalid chat messages.' },
        { status: 400 }
      );
    }

    const messages = validatedMessages.data;
    const { conversationId, env: clientEnv } = parsedBody.data;

    console.log(`📥 Received ${messages.length} chat messages`);
    console.log(`🔑 Conversation ID: ${conversationId}`);
    console.log(
      `🔐 Client env vars: ${Object.keys(clientEnv).length} keys`,
      Object.keys(clientEnv)
    );

    // Store env vars for this conversation (so cached tools can access them)
    setConversationEnv(conversationId, clientEnv);

    // Initialize OpenAI with client-provided or server API key
    const apiKey = clientEnv.OPENAI_API_KEY || env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'OPENAI_API_KEY is required. Please add it in the Settings sidebar.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const openai = createOpenAI({
      apiKey,
    });

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
      inputSchema: typeof searchTpmjsToolsTool.inputSchema,
      execute: typeof searchTpmjsToolsTool.execute,
    });

    // 2. Extract user query and last 3 user messages for tool search
    const lastMessage = messages[messages.length - 1];
    let userQuery = '';
    if (lastMessage?.role === 'user') {
      // Extract text from message parts
      for (const part of lastMessage.parts) {
        if (part.type === 'text') {
          userQuery = part.text;
          break;
        }
      }
    }

    // Get last 3 user messages for context
    const recentUserMessages = messages
      .filter((msg) => msg.role === 'user')
      .slice(-3)
      .map((msg) => {
        // Extract text from parts
        for (const part of msg.parts) {
          if (part.type === 'text') {
            return part.text;
          }
        }
        return '';
      })
      .filter(Boolean);

    console.log(`💬 User query: "${userQuery}"`);
    console.log(`📝 Recent messages: ${recentUserMessages.length}`);

    const modelMessages = await convertToModelMessages(messages);

    // 3. Automatically search for relevant tools based on the user's message
    if (userQuery && userQuery.trim().length > 0) {
      console.log('🔎 Searching for relevant tools...');

      try {
        const executeSearch = searchTpmjsToolsTool.execute;
        if (!executeSearch) {
          throw new Error('The TPMJS search tool is not executable.');
        }

        const result = await executeSearch(
          {
            query: userQuery,
            limit: 5, // Get top 5 relevant tools
            recentMessages: recentUserMessages,
          },
          {
            toolCallId: `playground-search-${crypto.randomUUID()}`,
            messages: modelMessages,
          }
        );

        const searchResult = ToolSearchResultSchema.parse(result);

        console.log(`📦 Found ${searchResult.matchCount} matching tools`);

        if (searchResult.tools && searchResult.tools.length > 0) {
          console.log(
            '🔧 Tools found:',
            searchResult.tools.map((tool) => `${tool.packageName}/${tool.name}`)
          );

          // Dynamically load tools from esm.sh
          console.log(`📥 Loading ${searchResult.tools.length} tools dynamically...`);

          const toolsToLoad = searchResult.tools.map((meta) => ({
            packageName: meta.packageName,
            name: meta.name,
            version: meta.version,
            importUrl: meta.importUrl,
          }));

          try {
            const loadedTools = await loadToolsBatch(toolsToLoad, conversationId, clientEnv);
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
    const allTools: RuntimeToolSet = { ...staticTools, ...state.loadedTools };

    // 5. Build system prompt with available tools
    const toolsList = Object.keys(allTools)
      .map((name) => {
        const tool = allTools[name] as { description?: string } | undefined;
        return `- ${name}: ${tool?.description || 'No description'}`;
      })
      .join('\n');

    const system = `You are an AI assistant with access to a dynamic tool registry containing thousands of tools. Your job is to EXECUTE tools to help users accomplish tasks.

## Tool Execution Rules

1. **When a user asks you to "call", "use", "run", or "execute" a tool** - you MUST invoke that tool immediately. Do not just describe it or search for it.

2. **When a user asks a question that could be answered by a tool** - invoke the appropriate tool to get real data, don't make up answers.

3. **searchTpmjsTools is for DISCOVERY only** - use it when you need to find tools you don't have loaded yet. Once a tool is loaded (listed below), call it directly.

4. **Tool names are sanitized** - if user says "extractTool from @parallel-web/ai-sdk-tools", look for a loaded tool like "parallel-web_ai-sdk-tools-extractTool".

5. **Always execute, then explain** - after calling a tool, summarize the results for the user.

## Currently Loaded Tools
${toolsList}

## Examples

User: "call extractTool on https://example.com"
→ Invoke the extractTool with url parameter, then explain results

User: "search for web scraping tools"
→ Use searchTpmjsTools to find tools, then tell user what's available

User: "what's the weather in Tokyo"
→ Search for a weather tool, load it, then invoke it

Remember: Your value is in EXECUTING tools to get real results, not just describing what tools could do.`;

    // 6. Stream response with all available tools
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system,
      messages: modelMessages,
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
