# AI SDK v6 Streaming Empty Response Issue

## Problem

Using AI SDK v6 Beta with OpenAI and `streamText()`, the API route returns a 200 OK response, but the streamed response body is **completely empty** when tools are involved.

- **Normal chat** (without tool calls): Works fine, streams text back
- **Tool calls** (when user asks "say hello world"): Returns empty response body, no error messages

## Environment

- **AI SDK Version**: `ai@6.0.0-beta.124`
- **OpenAI Provider**: `@ai-sdk/openai@3.0.0-beta.74`
- **OpenAI Library**: `openai@^6.9.1`
- **Next.js Version**: `next@^16.0.4` (App Router)
- **Runtime**: Node.js (`runtime = 'nodejs'`)
- **Model**: `gpt-4o-mini`

## API Route Implementation

Located at: `apps/playground/src/app/api/chat/route.ts`

```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, type CoreMessage, tool, jsonSchema } from 'ai';
import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { env } from '~/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Initialize OpenAI provider
const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Request schema
const RequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
});

// Simple inline test tool to verify streaming works
const testHelloTool = tool({
  description: 'Returns a simple hello world greeting',
  inputSchema: jsonSchema<{ includeTimestamp?: boolean }>({
    type: 'object',
    properties: {
      includeTimestamp: {
        type: 'boolean',
        description: 'Whether to include a timestamp',
      },
    },
    additionalProperties: false,
  }),
  async execute({ includeTimestamp = true }) {
    const response: any = { message: 'Hello, World!' };
    if (includeTimestamp) {
      response.timestamp = new Date().toISOString();
    }
    return response;
  },
});

/**
 * POST /api/chat
 * Chat with AI agent that can execute TPMJS tools
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = RequestSchema.parse(body);

    // Use simple inline tool for testing
    const tools = {
      testHello: testHelloTool,
    };

    // Create system prompt listing available tools
    const toolsList = Object.keys(tools)
      .map((name) => `- ${name}: ${tools[name]?.description}`)
      .join('\n');

    const systemMessage: CoreMessage = {
      role: 'system',
      content: `You are a helpful AI assistant that can use TPMJS tools to help users.

Available tools:
${toolsList}

Call tools as needed to answer user questions. When a user asks to say hello world or for a greeting, use the testHello tool.`,
    };

    // Stream the response
    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: [systemMessage, ...messages],
      tools,
    });

    // Return the stream as SSE
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request format',
          details: error.issues,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

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
```

## Client-Side Hook

Located at: `apps/playground/src/hooks/useChat.ts`

```typescript
'use client';

import { useCallback, useState } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Create assistant message placeholder
      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Send request to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Read the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is null');
      }

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        // Update the assistant message with accumulated content
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: accumulatedContent }
              : m
          )
        );
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
}
```

## Observed Behavior

### Working Case (Normal Chat)
- User types: "hi"
- API response: 200 OK
- Response body: Streams text chunks successfully
- UI shows: "Hi! How can I help you today?"

### Broken Case (Tool Call)
- User types: "say hello world"
- API response: 200 OK ✅
- Response body: **EMPTY** ❌ (no chunks, no data, nothing)
- UI shows: Empty message bubble
- Console: No errors logged

## HTTP Response Details

```
Request Method: POST
Status Code: 200 OK
URL: http://localhost:3001/api/chat
Content-Type: text/plain; charset=utf-8
Transfer-Encoding: chunked
```

The response headers look correct for a streaming response, but the body is completely empty.

## What We've Tried

1. ✅ Fixed OpenAI schema validation error (was `type: "None"`, now uses proper JSON Schema)
2. ✅ Using `tool()` and `jsonSchema()` from AI SDK
3. ✅ Simplified to a single inline test tool
4. ✅ Tool executes without errors (no schema validation issues)
5. ✅ Normal chat works fine (proves streaming infrastructure is correct)

## Questions

1. **Is `toTextStreamResponse()` the correct method for streaming with tools in AI SDK v6?**
   - Should we use a different method like `toDataStreamResponse()` for tool calls?

2. **Are we constructing the messages array correctly?**
   - We're sending `{ role: 'user' | 'assistant' | 'system', content: string }[]`
   - Do we need to include tool call messages or tool result messages?

3. **Does AI SDK v6 require a specific message format for tool calls?**
   - Should we be including `toolInvocations` or `tool_calls` in the message history?
   - Are we missing required fields in the `CoreMessage` type?

4. **Is the client-side streaming reader correct?**
   - We're reading chunks with `response.body.getReader()`
   - Should we be parsing SSE events differently for tool calls?

5. **Does `streamText()` with tools require `maxSteps` parameter?**
   - Do we need to set `maxSteps: 5` to allow multi-step reasoning?

6. **Are we handling the conversation history correctly?**
   - We're sending all previous messages on each request
   - Should we be including assistant messages with tool call results?

## AI SDK v6 Documentation References

We're following these patterns from the official docs:

- [streamText() API](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text)
- [tool() API](https://ai-sdk.dev/docs/reference/ai-sdk-core/tool)
- [Tool Calling Guide](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)

But we might be missing something specific about:
- How to handle streaming when tools are executed
- What response format tool calls produce
- How to parse the stream when tools are involved

## Suspected Issue

**The message format might be wrong.** We're sending:

```typescript
const systemMessage: CoreMessage = {
  role: 'system',
  content: `You are a helpful AI assistant...`,
};

const result = streamText({
  model: openai('gpt-4o-mini'),
  messages: [systemMessage, ...messages],
  tools,
});
```

But `CoreMessage` might need additional fields when tools are involved, or we might need to handle tool call results differently in the conversation history.

## What We Need

1. Correct message format for `streamText()` with tools
2. How to properly stream responses that include tool calls
3. Whether we need different client-side parsing for tool call streams
4. Example of a working Next.js API route using AI SDK v6 with `streamText()` and tools

## Repo Context

- Monorepo using Turborepo + pnpm workspaces
- Next.js 16 App Router with Turbopack
- TypeScript strict mode
- All UI components from internal `@tpmjs/ui` package
- Tools are imported from workspace package `@tpmjs/hello`
