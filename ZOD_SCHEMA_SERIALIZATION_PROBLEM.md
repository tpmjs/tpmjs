# Zod Schema Serialization Problem - Dynamic Tool Loading System

## Architecture Overview

We have a dynamic tool loading system with the following architecture:

```
Next.js Playground (Vercel) → Railway Deno Service → esm.sh CDN → npm packages
                ↓
         AI SDK (OpenAI)
```

### Components:

1. **Next.js Playground** (`apps/playground`) - Runs on Vercel, hosts the AI chat interface
2. **Railway Deno Service** (`apps/railway-executor/server.ts`) - Runs on Railway, uses Deno's native HTTP import support
3. **Dynamic Tool Loader** (`apps/playground/src/lib/dynamic-tool-loader.ts`) - Client-side code that calls Railway

### Why We Need This Architecture:

- Next.js/Turbopack intercepts all `import()` calls and cannot import from HTTP URLs (like `https://esm.sh/package@version`)
- Deno natively supports HTTP imports via `import('https://...')`
- Tools are published to npm and loaded dynamically at runtime via esm.sh CDN
- We cannot bundle tools at build time - they must be discovered and loaded dynamically

## The Problem

AI SDK tools require a specific format with `description` and `inputSchema`:

```typescript
// AI SDK v6 Tool Format
const tool = {
  description: "Search the web for current information...",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
    numResults: z.number().optional(),
  }),
  execute: async (params) => {
    // ... execution logic
  }
}
```

**The Challenge:** We need to send tool definitions from Railway (Deno) to the Playground (Next.js) over HTTP, but Zod schemas cannot be JSON serialized.

### Error 1: `def.shape is not a function`

When we tried to send the Zod schema directly:

```typescript
// Railway server.ts - DOESN'T WORK
return Response.json({
  success: true,
  tool: {
    exportName: "searchTool",
    description: "...",
    inputSchema: toolModule.inputSchema, // ❌ Zod schema object
  }
});
```

The Zod schema object loses all its methods during JSON serialization, causing:
```
TypeError: def.shape is not a function
```

### Error 2: OpenAI Invalid Schema Error

When we removed `inputSchema` entirely:

```typescript
// dynamic-tool-loader.ts - DOESN'T WORK
const tool = {
  description: data.tool.description,
  // No inputSchema
  execute: async (params) => { ... }
};
```

OpenAI API rejects the tool:
```
Error [AI_APICallError]: Invalid schema for function 'firecrawl-aisdk-searchTool':
schema must be a JSON Schema of 'type: "object"', got 'type: "None"'.
```

## Requirements

1. ✅ **Must work with AI SDK v6** - Tools must have `description` + `inputSchema` format
2. ✅ **Must serialize over HTTP** - Railway → Playground communication is via fetch/HTTP
3. ✅ **Must support any Zod schema** - Tools use various Zod types (objects, arrays, unions, etc.)
4. ✅ **Must preserve validation** - The schema needs to work for OpenAI's function calling
5. ✅ **Must be efficient** - Schemas should be cached, not re-serialized on every request

## Current Code

### Railway Server (`apps/railway-executor/server.ts`)

```typescript
async function loadAndDescribe(req: Request): Promise<Response> {
  const { packageName, exportName, version, importUrl } = await req.json();
  const cacheKey = `${packageName}::${exportName}`;

  let toolModule;
  if (moduleCache.has(cacheKey)) {
    toolModule = moduleCache.get(cacheKey);
  } else {
    const url = importUrl || `https://esm.sh/${packageName}@${version}`;
    const module = await import(url); // Deno supports HTTP imports!
    toolModule = module[exportName];

    if (!toolModule.description || !toolModule.execute) {
      return Response.json({
        success: false,
        error: 'Invalid AI SDK tool structure'
      }, { status: 400 });
    }

    moduleCache.set(cacheKey, toolModule);
  }

  // ❌ PROBLEM: How to serialize inputSchema?
  return Response.json({
    success: true,
    tool: {
      exportName,
      description: toolModule.description,
      // Need to send inputSchema here somehow
      hasInputSchema: !!toolModule.inputSchema,
    },
  });
}

async function executeTool(req: Request): Promise<Response> {
  const { packageName, exportName, version, importUrl, params } = await req.json();
  const cacheKey = `${packageName}::${exportName}`;

  let toolModule;
  if (moduleCache.has(cacheKey)) {
    toolModule = moduleCache.get(cacheKey);
  } else {
    const url = importUrl || `https://esm.sh/${packageName}@${version}`;
    const module = await import(url);
    toolModule = module[exportName];
    moduleCache.set(cacheKey, toolModule);
  }

  const result = await toolModule.execute(params || {});

  return Response.json({
    success: true,
    output: result,
  });
}
```

### Dynamic Tool Loader (`apps/playground/src/lib/dynamic-tool-loader.ts`)

```typescript
export async function loadToolDynamically(
  packageName: string,
  exportName: string,
  version: string,
  importUrl?: string
): Promise<any | null> {
  const cacheKey = getCacheKey(packageName, exportName);

  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey);
  }

  // Call Railway to load and describe tool
  const response = await fetch(`${RAILWAY_SERVICE_URL}/load-and-describe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      packageName,
      exportName,
      version,
      importUrl: importUrl || `https://esm.sh/${packageName}@${version}`,
    }),
  });

  const data = await response.json();

  // ❌ PROBLEM: How to reconstruct inputSchema?
  const tool = {
    description: data.tool.description,
    // Need inputSchema here for OpenAI API
    execute: async (params: any) => {
      const execResponse = await fetch(`${RAILWAY_SERVICE_URL}/execute-tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName, exportName, version, importUrl, params }),
      });
      const result = await execResponse.json();
      return result.output;
    },
  };

  moduleCache.set(cacheKey, tool);
  return tool;
}
```

## Example Tool Schema

Here's an example of what we need to serialize:

```typescript
import { tool, jsonSchema } from 'ai';
import { z } from 'zod';

// AI SDK v6 format
export const searchTool = tool({
  description: 'Search the web for current information...',
  inputSchema: jsonSchema<{
    query: string;
    numResults?: number;
    category?: string;
  }>({
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query'
      },
      numResults: {
        type: 'number',
        description: 'Number of results',
        minimum: 1,
        maximum: 20,
        default: 10
      },
      category: {
        type: 'string',
        enum: ['search', 'web-scraping', 'data-extraction'],
        description: 'Filter by category'
      }
    },
    required: ['query']
  }),
  execute: async ({ query, numResults = 10, category }) => {
    // ... implementation
  }
});
```

The `inputSchema` is created via `jsonSchema<Type>()` which wraps a JSON Schema object.

## Potential Approaches to Consider

### Option 1: Serialize Zod Schema to JSON Schema

Use `zod-to-json-schema` library to convert Zod schemas to JSON Schema format:

```typescript
import { zodToJsonSchema } from 'zod-to-json-schema';

// In Railway server
const jsonSchema = zodToJsonSchema(toolModule.inputSchema);
return Response.json({ inputSchema: jsonSchema });
```

**Pros:**
- Standard approach
- Widely used library
- Preserves validation rules

**Cons:**
- Adds dependency to Railway service
- May not work with `jsonSchema()` wrapper from AI SDK
- Need to ensure it works with AI SDK v6 format

### Option 2: Extract JSON Schema from AI SDK's jsonSchema()

The AI SDK's `jsonSchema()` function wraps a plain JSON Schema object. Maybe we can extract it:

```typescript
// Investigate the structure of toolModule.inputSchema
console.log(JSON.stringify(toolModule.inputSchema, null, 2));

// Potentially:
const plainSchema = toolModule.inputSchema._def?.schema || toolModule.inputSchema;
```

**Pros:**
- No additional dependencies
- Uses the schema exactly as AI SDK expects it

**Cons:**
- Relies on internal structure (fragile)
- May break with AI SDK updates

### Option 3: Store Schema Separately and Reconstruct

Store the raw JSON Schema definition separately in the tool package:

```typescript
// In tool package
export const searchToolSchema = {
  type: 'object',
  properties: { ... }
};

export const searchTool = tool({
  description: '...',
  inputSchema: jsonSchema(searchToolSchema),
  execute: async (params) => { ... }
});
```

Then send `searchToolSchema` over HTTP and reconstruct.

**Pros:**
- Clean separation
- Easy to serialize

**Cons:**
- Requires tool authors to export schema separately
- Duplication of schema definition
- Breaks existing tools

### Option 4: Import Tool Directly in Playground (If Possible)

Try to make HTTP imports work in Next.js somehow:

- Webpack configuration hacks?
- Dynamic imports with custom loader?
- Build-time bundling of tools?

**Pros:**
- No serialization needed
- Direct access to tool objects

**Cons:**
- Next.js/Turbopack limitations are fundamental
- Defeats the purpose of dynamic loading
- May not be technically possible

### Option 5: Two-Way Communication - Send Schema Back

Instead of Railway → Playground, have Playground → Railway for schema:

1. Playground asks Railway: "Does this tool exist?"
2. Railway responds: "Yes, here's the description"
3. Playground asks Railway: "Execute this tool with these params"
4. Railway validates params against schema and executes

The schema stays on Railway side, never serialized.

**Pros:**
- Schema never leaves Railway
- No serialization issues

**Cons:**
- OpenAI API requires schema upfront for function calling
- Can't defer schema to execution time
- Doesn't solve the core problem

## Questions for Consideration

1. **Can we use `zod-to-json-schema` with AI SDK v6's `jsonSchema()` wrapper?**
   - How does `jsonSchema()` work internally?
   - Does it already store a plain JSON Schema somewhere?

2. **Does the AI SDK provide any serialization utilities?**
   - Is there a built-in way to serialize tool definitions?
   - Does Vercel have examples of this pattern?

3. **Can we modify the tool format to make serialization easier?**
   - Would it break compatibility with existing tools?
   - Is there a standardized way tools should export schemas?

4. **Is there a way to inspect the AI SDK's jsonSchema() structure?**
   - What properties does it have?
   - Can we extract the underlying JSON Schema object safely?

5. **Should we contribute back to the ecosystem?**
   - Is this a common problem?
   - Should there be a standard for serializable AI SDK tools?

## Current Status

- ✅ Railway service successfully imports tools from esm.sh via HTTP
- ✅ Railway can execute tools and return results
- ✅ Module caching works on Railway side
- ✅ Tool wrapper caching works on Playground side
- ❌ Cannot serialize Zod schemas over HTTP (this blocker)
- ❌ OpenAI API rejects tools without proper inputSchema

## Files to Reference

- `apps/railway-executor/server.ts` - Railway Deno service
- `apps/playground/src/lib/dynamic-tool-loader.ts` - Tool loader client
- `packages/tools/search-registry/src/index.ts` - Example tool using AI SDK v6

## Success Criteria

We need a solution that:
1. Sends complete tool definitions (description + inputSchema + execute capability) from Railway to Playground
2. Works with OpenAI's function calling API (requires valid JSON Schema)
3. Supports all Zod schema types used by AI SDK tools
4. Is maintainable and doesn't break with AI SDK updates
5. Doesn't require changes to existing published tool packages (if possible)
