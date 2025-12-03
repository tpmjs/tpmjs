# useChat Hook Returns Undefined Input Property

## Problem

Using `@ai-sdk/react`'s `useChat` hook, the `input` property is returning `undefined`, causing the application to crash when trying to call `.trim()` on it.

## Error

```
TypeError: Cannot read properties of undefined (reading 'trim')

at ChatInput (src/components/chat/ChatInput.tsx:41:48)
```

**Code that fails:**
```typescript
<Button type="submit" disabled={!input.trim() || isLoading} loading={isLoading} size="lg">
```

## Environment

- **AI SDK Version**: `ai@6.0.0-beta.124`
- **AI SDK React**: `@ai-sdk/react` (latest version installed via pnpm)
- **OpenAI Provider**: `@ai-sdk/openai@3.0.0-beta.74`
- **Next.js**: `16.0.4` (App Router with Turbopack)
- **React**: `19.0.0`
- **Zod**: `4.0.0` (required, not downgrading)
- **TypeScript**: `5.9.3`

## Current Implementation

### Custom useChat Hook Wrapper

Located at: `apps/playground/src/hooks/useChat.ts`

```typescript
'use client';

import { useChat as useAISDKChat } from '@ai-sdk/react';

/**
 * Custom chat hook that wraps the official @ai-sdk/react useChat
 * Handles SSE streaming with tool calls and UI message protocol
 */
export function useChat() {
  const chat = useAISDKChat({
    api: '/api/chat',
  });

  return {
    messages: chat.messages,
    input: chat.input,
    isLoading: chat.isLoading,
    error: chat.error,
    handleInputChange: chat.handleInputChange,
    handleSubmit: chat.handleSubmit,
    setInput: chat.setInput,
    reload: chat.reload,
    stop: chat.stop,
  };
}
```

### API Route

Located at: `apps/playground/src/app/api/chat/route.ts`

```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { type NextRequest } from 'next/server';
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
    const { messages }: { messages: UIMessage[] } = await request.json();

    // Load all available TPMJS tools
    const tools = await loadAllTools();

    // Create system prompt listing available tools
    const toolsList = Object.keys(tools)
      .map((name) => `- ${name}: ${tools[name]?.description}`)
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
```

### Component Using the Hook

Located at: `apps/playground/src/components/chat/ChatInterface.tsx`

```typescript
'use client';

import { useChat } from '~/hooks/useChat';
import { ChatInput } from './ChatInput';
import { ChatMessages } from './ChatMessages';

export function ChatInterface(): React.ReactElement {
  const { messages, input, isLoading, handleInputChange, handleSubmit, setInput } = useChat();

  return (
    <div className="flex flex-1 flex-col">
      <ChatMessages messages={messages} />
      <ChatInput
        input={input}
        isLoading={isLoading}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        setInput={setInput}
      />
    </div>
  );
}
```

### ChatInput Component

Located at: `apps/playground/src/components/chat/ChatInput.tsx`

```typescript
'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Textarea } from '@tpmjs/ui/Textarea/Textarea';
import type { FormEvent } from 'react';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  setInput: (value: string) => void;
}

export function ChatInput({ input, isLoading, onInputChange, onSubmit }: ChatInputProps): React.ReactElement {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        // Trigger form submission
        const form = e.currentTarget.form;
        if (form) {
          form.requestSubmit();
        }
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="border-t border-border bg-background p-4">
      <div className="mx-auto flex max-w-4xl gap-2">
        <Textarea
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask me to tell you a fish joke..."
          className="min-h-[60px] flex-1 resize-none"
          disabled={isLoading}
          rows={3}
        />
        <Button type="submit" disabled={!input.trim() || isLoading} loading={isLoading} size="lg">
          Send
        </Button>
      </div>
    </form>
  );
}
```

## Tool Definition (Working)

The tools are defined using `tool()` and `jsonSchema()` from AI SDK to avoid Zod 4 compatibility issues:

Located at: `packages/tools/hello/src/index.ts`

```typescript
import { jsonSchema, tool } from 'ai';

type HelloWorldInput = {
  includeTimestamp?: boolean;
};

export const helloWorldTool = tool({
  description: 'Returns a simple "Hello, World!" greeting message',
  inputSchema: jsonSchema<HelloWorldInput>({
    type: 'object',
    properties: {
      includeTimestamp: {
        type: 'boolean',
        description: 'Whether to include a timestamp in the response',
      },
    },
    additionalProperties: false,
  }),
  async execute({ includeTimestamp = true }) {
    const response: any = {
      message: 'Hello, World!',
    };

    if (includeTimestamp) {
      response.timestamp = new Date().toISOString();
    }

    return response;
  },
});

type HelloNameInput = {
  name: string;
};

export const helloNameTool = tool({
  description: 'Returns a personalized greeting with the provided name',
  inputSchema: jsonSchema<HelloNameInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name of the person to greet',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute({ name }) {
    return {
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
    };
  },
});
```

## What's Working

1. ✅ API route receives requests correctly
2. ✅ Tools are loaded and registered successfully
3. ✅ `streamText()` with `stopWhen: stepCountIs(5)` configured
4. ✅ `toUIMessageStreamResponse()` returns proper SSE stream
5. ✅ curl test shows tools are called correctly with proper JSON Schema
6. ✅ Stream format includes `tool-input-start`, `tool-output-available`, `text-delta` events

## What's NOT Working

1. ❌ `input` property from `useChat` is `undefined`
2. ❌ Application crashes when trying to access `input.trim()`
3. ❌ Can't type in the chat input field

## curl Test (Successful)

```bash
curl -N http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"say hello thomas"}]}'
```

**Response:**
```
data: {"type":"start"}
data: {"type":"start-step"}
data: {"type":"tool-input-start","toolCallId":"call_...","toolName":"helloName"}
data: {"type":"tool-input-delta","toolCallId":"call_...","inputTextDelta":"{\""}
data: {"type":"tool-input-delta","toolCallId":"call_...","inputTextDelta":"name"}
data: {"type":"tool-input-delta","toolCallId":"call_...","inputTextDelta":"\":\""}
data: {"type":"tool-input-delta","toolCallId":"call_...","inputTextDelta":"Thomas"}
data: {"type":"tool-input-delta","toolCallId":"call_...","inputTextDelta":"\"}"}
data: {"type":"tool-input-available","toolCallId":"call_...","toolName":"helloName","input":{"name":"Thomas"},"providerMetadata":{...}}
data: {"type":"tool-output-available","toolCallId":"call_...","output":{"message":"Hello, Thomas!","timestamp":"2025-12-03T16:07:31.366Z"}}
data: {"type":"finish-step"}
data: {"type":"start-step"}
data: {"type":"text-start","id":"msg_...","providerMetadata":{...}}
data: {"type":"text-delta","id":"msg_...","delta":"Hello"}
data: {"type":"text-delta","id":"msg_...","delta":","}
data: {"type":"text-delta","id":"msg_...","delta":" Thomas"}
data: {"type":"text-delta","id":"msg_...","delta":"!"}
data: {"type":"text-end","id":"msg_...","providerMetadata":{...}}
data: {"type":"finish-step"}
data: {"type":"finish","finishReason":"stop"}
data: [DONE]
```

The API works perfectly - tools are called, results are returned, text is generated. The issue is purely on the React client side.

## Questions

1. **Is `@ai-sdk/react`'s `useChat` compatible with AI SDK v6 Beta (6.0.0-beta.124)?**
   - Should we be using a different version of `@ai-sdk/react`?
   - Are there known compatibility issues with AI SDK v6 Beta?

2. **Why is `input` undefined?**
   - Does `useChat` require specific initialization options?
   - Do we need to provide `initialMessages` or `initialInput`?
   - Is there a required prop we're missing?

3. **Is the API route format correct for `@ai-sdk/react`'s `useChat`?**
   - Should the API accept a different request format?
   - Is `UIMessage[]` the correct type for messages?
   - Should we use `toDataStreamResponse()` instead of `toUIMessageStreamResponse()`?

4. **Do we need to handle client-side state differently?**
   - Should we initialize `input` with a default value?
   - Is there a provider or context missing?
   - Do we need to wrap the component tree with any providers?

5. **Is there a version mismatch between packages?**
   - `ai@6.0.0-beta.124`
   - `@ai-sdk/openai@3.0.0-beta.74`
   - `@ai-sdk/react@?` (unknown version)

6. **Does Zod 4 affect the client-side hook?**
   - We fixed the server-side tool schemas using `jsonSchema()`
   - Could there be client-side Zod 4 issues affecting `useChat`?

## Expected Behavior

The `useChat` hook should return:
- `input: string` - Current input value (should be empty string initially)
- `handleInputChange: (e) => void` - Update input value
- `handleSubmit: (e) => void` - Submit form and send message
- `messages: Message[]` - Array of messages
- `isLoading: boolean` - Loading state

## Actual Behavior

- `input: undefined` ❌
- Everything else appears to be defined
- Crash on first render when trying to access `input.trim()`

## Monorepo Context

- Turborepo monorepo with pnpm workspaces
- Next.js 16 App Router with Turbopack
- TypeScript strict mode
- `@tpmjs/ui` package for UI components
- `@tpmjs/hello` package for tools
- Using workspace protocol (`workspace:*`) for internal dependencies

## Related Documentation

- [AI SDK Core: streamText](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text)
- [AI SDK React: useChat](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)
- [AI SDK UI: Stream Protocol](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol)

## What We Need

1. Correct version compatibility information for AI SDK v6 Beta + @ai-sdk/react
2. Why `input` is undefined and how to fix it
3. Whether our API route format is correct for the React hook
4. Any missing initialization or configuration for `useChat`
5. Whether there are alternative approaches (custom SSE parsing, different hook, etc.)

We must keep Zod 4 and cannot downgrade. The server-side tools are working correctly with `jsonSchema()` workaround.
