# OpenAI Schema Validation Error - AI SDK v6

## ✅ RESOLVED

**Solution:** Use `tool()` and `jsonSchema()` from AI SDK instead of Zod for tool definitions.

## Error Message

```
Error [AI_APICallError]: Invalid schema for function 'helloWorld': schema must be a JSON Schema of 'type: "object"', got 'type: "None"'.
```

## Context

Building a Next.js playground app to test AI SDK v6 tool execution with OpenAI's GPT-4o-mini model. The error occurs when OpenAI validates the tool schema sent in the API request.

## Root Cause

Zod 4.0.0 generates JSON Schema with `allOf` + `$ref` at the root level instead of a direct `type: "object"`. OpenAI's API requires a JSON Schema with `type: "object"` at the root, so it rejects Zod 4 schemas with `type: "None"` error.

## Environment

- **AI SDK Version**: `ai@6.0.0-beta.124`
- **OpenAI Provider**: `@ai-sdk/openai@3.0.0-beta.74`
- **OpenAI Library**: `openai@^6.9.1`
- **Zod Version**: `zod@^4.0.0`
- **Next.js Version**: `next@^16.0.4`
- **Node.js**: Latest
- **TypeScript**: Strict mode enabled

## Tool Definition

Located at: `packages/tools/hello/src/index.ts`

```typescript
import { z } from 'zod';

/**
 * Hello World Tool
 * Returns a simple "Hello, World!" greeting
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const helloWorldTool = {
  description: 'Returns a simple "Hello, World!" greeting message',
  parameters: z.object({
    // OpenAI requires at least one optional parameter, can't be completely empty
    includeTimestamp: z.boolean().optional().describe('Whether to include a timestamp in the response'),
  }),
  execute: async ({ includeTimestamp = true }: { includeTimestamp?: boolean }) => {
    const response: any = {
      message: 'Hello, World!',
    };

    if (includeTimestamp) {
      response.timestamp = new Date().toISOString();
    }

    return response;
  },
};

/**
 * Hello Name Tool
 * Returns a personalized greeting with the provided name
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const helloNameTool = {
  description: 'Returns a personalized greeting with the provided name',
  parameters: z.object({
    name: z.string().describe('The name of the person to greet'),
  }),
  execute: async ({ name }: { name: string }) => {
    return {
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
    };
  },
};
```

## Tool Loading

Located at: `apps/playground/src/lib/tool-loader.ts`

```typescript
// Static imports for tools (required for Next.js/webpack)
import { helloWorldTool, helloNameTool } from '@tpmjs/hello';
import { scrapeTool, crawlTool, searchTool } from 'firecrawl-aisdk';

/**
 * Load a specific TPMJS tool by package name
 */
export async function loadTpmjsTool(packageName: string): Promise<any> {
  try {
    // Map package names to their tool functions
    switch (packageName) {
      case '@tpmjs/hello':
        // Hello has multiple tools, return all of them
        return {
          helloWorld: helloWorldTool,
          helloName: helloNameTool,
        };

      case 'firecrawl-aisdk':
        // Firecrawl has multiple tools, return all of them
        return {
          scrapeTool,
          crawlTool,
          searchTool,
        };

      default:
        throw new Error(`Unknown tool package: ${packageName}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load tool from package ${packageName}: ${error.message}`);
    }
    throw new Error(`Failed to load tool from package ${packageName}: Unknown error`);
  }
}

/**
 * Load all installed TPMJS tools
 */
export async function loadAllTools(): Promise<Record<string, any>> {
  const installedTools = ['@tpmjs/hello', 'firecrawl-aisdk'];

  const tools: Record<string, any> = {};

  for (const packageName of installedTools) {
    try {
      const tool = await loadTpmjsTool(packageName);

      // If the tool returns an object with multiple tools (like firecrawl), spread them
      if (tool && typeof tool === 'object' && !tool.description) {
        Object.assign(tools, tool);
      } else {
        // Single tool - use a cleaned name (remove hyphens, camelCase)
        const toolName = packageName.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase()).replace(/-/g, '');
        tools[toolName] = tool;
      }
    } catch (error) {
      console.error(`Failed to load tool ${packageName}:`, error);
      // Continue loading other tools even if one fails
    }
  }

  return tools;
}
```

## API Route

Located at: `apps/playground/src/app/api/chat/route.ts`

```typescript
import { loadAllTools } from '~/lib/tool-loader';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid request: messages array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Load all available tools
    const tools = await loadAllTools();

    console.log('Loaded tools:', Object.keys(tools));

    // Create system message
    const systemMessage = {
      role: 'system' as const,
      content: `You are a helpful AI assistant that can use TPMJS tools to help users.

Available tools:
${Object.entries(tools)
  .map(([name, tool]) => `- ${name}: ${tool.description}`)
  .join('\n')}

Call tools as needed to answer user questions. Execute tools directly.`,
    };

    // Stream the AI response with tools
    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: [systemMessage, ...messages],
      tools,
      maxSteps: 5,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
```

## Package Configuration

Located at: `packages/tools/hello/package.json`

```json
{
  "name": "@tpmjs/hello",
  "version": "0.0.1",
  "private": true,
  "description": "Example TPMJS tools - Hello World and Hello Name",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "type-check": "tsc --noEmit"
  },
  "keywords": [
    "tpmjs-tool",
    "ai-sdk",
    "hello",
    "example"
  ],
  "tpmjs": {
    "category": "text-analysis",
    "description": "Simple greeting tools - Hello World and personalized Hello Name greetings"
  },
  "dependencies": {
    "ai": "6.0.0-beta.124",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@tpmjs/tsconfig": "workspace:*",
    "typescript": "^5.9.3"
  },
  "files": [
    "dist",
    "README.md"
  ]
}
```

## TypeScript Configuration

Located at: `packages/tools/hello/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Compiled Output

Located at: `packages/tools/hello/dist/index.js`

```javascript
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloNameTool = exports.helloWorldTool = void 0;
const zod_1 = require("zod");
/**
 * Hello World Tool
 * Returns a simple "Hello, World!" greeting
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
exports.helloWorldTool = {
    description: 'Returns a simple "Hello, World!" greeting message',
    parameters: zod_1.z.object({
        // OpenAI requires at least one optional parameter, can't be completely empty
        includeTimestamp: zod_1.z.boolean().optional().describe('Whether to include a timestamp in the response'),
    }),
    execute: async ({ includeTimestamp = true }) => {
        const response = {
            message: 'Hello, World!',
        };
        if (includeTimestamp) {
            response.timestamp = new Date().toISOString();
        }
        return response;
    },
};
/**
 * Hello Name Tool
 * Returns a personalized greeting with the provided name
 *
 * This is a proper AI SDK v6 tool that can be used with streamTime()
 */
exports.helloNameTool = {
    description: 'Returns a personalized greeting with the provided name',
    parameters: zod_1.z.object({
        name: zod_1.z.string().describe('The name of the person to greet'),
    }),
    execute: async ({ name }) => {
        return {
            message: `Hello, ${name}!`,
            timestamp: new Date().toISOString(),
        };
    },
};
```

## Full Error Response from OpenAI

```json
{
  "error": {
    "message": "Invalid schema for function 'helloWorld': schema must be a JSON Schema of 'type: \"object\"', got 'type: \"None\"'.",
    "type": "invalid_request_error",
    "param": "tools[0].parameters",
    "code": "invalid_function_parameters"
  }
}
```

API endpoint: `https://api.openai.com/v1/responses`
Status code: 400

## Problem Analysis

1. **OpenAI expects JSON Schema format** - The `tools[0].parameters` field must be a valid JSON Schema object with `type: "object"`

2. **AI SDK v6 should convert Zod to JSON Schema** - The AI SDK is supposed to automatically convert Zod schemas to JSON Schema when sending to OpenAI, but it's producing `type: "None"` instead

3. **Potential causes**:
   - Zod 4.0.0 compatibility issue with AI SDK v6 beta
   - AI SDK not properly converting the Zod schema
   - Issue with how the tool object is structured
   - Problem with how tools are passed to `streamText()`

4. **Already tried**:
   - Added at least one parameter (even optional) to helloWorldTool
   - Used proper Zod schema with `.describe()` for descriptions
   - Followed AI SDK v6 tool definition format exactly
   - Built the package successfully (dist folder exists)

## AI SDK v6 Tool Format Reference

According to AI SDK v6 documentation, a tool should be defined as:

```typescript
{
  description: string,
  parameters: ZodSchema,
  execute: async (args) => Promise<any>
}
```

This matches our implementation exactly.

## Questions for ChatGPT

1. Is there a known compatibility issue between AI SDK v6 Beta (6.0.0-beta.124) and Zod 4.0.0?

2. Does the AI SDK v6 require a specific tool registration format when passing to `streamText()`?

3. Should tools be wrapped in a different structure (e.g., using `tool()` helper function)?

4. Is there a way to manually convert Zod schema to JSON Schema that OpenAI accepts?

5. Are there any known issues with using workspace packages (`@tpmjs/hello`) in Next.js API routes with dynamic imports?

6. Should we downgrade to Zod 3.x instead of Zod 4.0.0?

7. Is there a debug mode to see what JSON Schema is being sent to OpenAI?

## Additional Context

- The `firecrawl-aisdk` package works correctly with the same setup
- Build process completes successfully with no TypeScript errors
- The tool is being loaded and passed to `streamText()` correctly
- Error only occurs when OpenAI validates the tool schema
- This is a monorepo using pnpm workspaces and Turborepo

## Related Files

- Tool definition: `packages/tools/hello/src/index.ts`
- Tool loader: `apps/playground/src/lib/tool-loader.ts`
- API route: `apps/playground/src/app/api/chat/route.ts`
- Package config: `packages/tools/hello/package.json`
- Compiled output: `packages/tools/hello/dist/index.js`

## Expected Behavior

Tools should be automatically converted from Zod schema to JSON Schema by AI SDK v6 and accepted by OpenAI's API.

## Actual Behavior

OpenAI rejects the tool schema with error: `got 'type: "None"'` instead of a valid JSON Schema object.

---

## ✅ SOLUTION IMPLEMENTED

### What We Changed

Instead of using Zod schemas with `parameters`, we now use AI SDK's `tool()` helper with `jsonSchema()` for the input schema. This bypasses Zod's JSON Schema conversion entirely.

### Before (Broken with Zod 4)

```typescript
import { z } from 'zod';

export const helloWorldTool = {
  description: 'Returns a simple "Hello, World!" greeting message',
  parameters: z.object({
    includeTimestamp: z.boolean().optional().describe('Whether to include a timestamp'),
  }),
  execute: async ({ includeTimestamp = true }) => {
    // ...
  },
};
```

### After (Working with jsonSchema)

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
```

### Key Changes

1. **Import from `ai`**: Added `jsonSchema` and `tool` imports
2. **Define TypeScript types**: Created `HelloWorldInput` type for type safety
3. **Use `tool()` wrapper**: Wraps the entire tool definition
4. **Use `jsonSchema()` for schema**: Provides explicit JSON Schema with `type: "object"` at root
5. **Removed Zod dependency**: No longer need `zod` in package.json

### Benefits

- ✅ Works with OpenAI's strict schema validation
- ✅ Explicit control over JSON Schema structure
- ✅ Full TypeScript type safety with generic types
- ✅ No dependency on Zod (one less package to maintain)
- ✅ Follows AI SDK v6 best practices
- ✅ Guaranteed `type: "object"` at root level

### Updated Package Dependencies

```json
{
  "dependencies": {
    "ai": "6.0.0-beta.124"
  }
}
```

Zod is no longer needed in tool packages that use `jsonSchema()`.

### References

- [AI SDK Core: tool](https://ai-sdk.dev/docs/reference/ai-sdk-core/tool)
- [AI SDK Core: jsonSchema](https://ai-sdk.dev/docs/reference/ai-sdk-core/json-schema)
- [GitHub Issue: Zod 4 JSON Schema compatibility](https://github.com/vercel/ai/issues/10240)
