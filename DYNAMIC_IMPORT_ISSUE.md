# Dynamic Import Issue: Cannot Import ESM Modules from CDN in Next.js Server-Side API Route

## Executive Summary

We're building a dynamic tool loading system where AI agents can discover and load tools at runtime from npm packages via esm.sh CDN. The system successfully searches and finds relevant tools, but fails when trying to dynamically import them using `import()` in a Next.js App Router API route.

**Error**: `Error: Cannot find module 'unknown'` with code `MODULE_NOT_FOUND`

**Critical Question**: How can we dynamically import ESM modules from external URLs (like esm.sh) in Next.js 16 App Router API routes running in Node.js runtime?

---

## System Architecture

### High-Level Flow

```
1. User sends message → "use firecrawl to search for ajax davis"
2. Chat API extracts query → "use firecrawl to search for ajax davis"
3. Pre-flight search → Calls searchTpmjsToolsTool.execute({ query, limit: 5 })
4. Search API returns → Top 5 matching tools from database (BM25-like scoring)
5. Dynamic loading → Tries to import tools from esm.sh URLs ❌ FAILS HERE
6. Agent uses tools → Would pass loaded tools to AI model
```

### Tech Stack

- **Framework**: Next.js 16.0.4
- **Build Tool**: Turbopack (default in Next.js 15+)
- **Runtime**: Node.js (not edge)
- **Package Manager**: pnpm (monorepo with workspaces)
- **Deployment Target**: Vercel (eventually, currently local dev)
- **AI SDK**: Vercel AI SDK v6.0.0-beta.124
- **Model**: OpenAI GPT-4o-mini via `streamText()`

### Monorepo Structure

```
tpmjs/
├── apps/
│   ├── playground/          # Next.js app with chat interface
│   │   └── src/
│   │       ├── app/api/chat/route.ts  # Where dynamic import fails
│   │       └── lib/dynamic-tool-loader.ts
│   └── web/                 # Tool registry website
│       └── src/app/api/tools/search/route.ts
└── packages/
    └── tools/
        ├── hello/           # Static tool (works fine)
        └── search-registry/ # Meta-tool for searching registry
```

---

## Detailed Code Implementation

### File 1: `apps/playground/src/lib/dynamic-tool-loader.ts`

**Purpose**: Load tools dynamically from esm.sh CDN

```typescript
// Cache for imported tool modules (process-level)
const moduleCache = new Map<string, any>();

// Cache for per-conversation active tools
const conversationTools = new Map<string, Set<string>>();

/**
 * Generate cache key for a tool
 */
function getCacheKey(packageName: string, exportName: string): string {
  return `${packageName}::${exportName}`;
}

/**
 * Validate that an import is a valid AI SDK tool
 */
function isValidTool(value: any): boolean {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.description === 'string' &&
    typeof value.execute === 'function'
  );
}

/**
 * Dynamically import a tool from ESM CDN
 *
 * THIS IS WHERE IT FAILS ❌
 */
export async function loadToolDynamically(
  packageName: string,
  exportName: string,
  version: string,
  importUrl?: string
): Promise<any | null> {
  const cacheKey = getCacheKey(packageName, exportName);

  // Check cache first
  if (moduleCache.has(cacheKey)) {
    console.log(`✅ Cache hit: ${cacheKey}`);
    return moduleCache.get(cacheKey);
  }

  // Build import URL
  const url = importUrl || `https://esm.sh/${packageName}@${version}`;

  try {
    console.log(`📦 Importing: ${url}`);
    // Example: https://esm.sh/firecrawl-aisdk@0.7.2

    // Dynamic import with @vite-ignore to bypass bundler
    const module = await import(/* @vite-ignore */ url);

    console.log(`🔍 Module imported successfully`);
    console.log(`🔍 Module type: ${typeof module}`);
    console.log(`🔍 Module keys: ${Object.keys(module).join(', ')}`);
    console.log(`🔍 Looking for export: "${exportName}"`);
    console.log(`🔍 Export exists: ${exportName in module}`);
    console.log(`🔍 Export type: ${typeof module[exportName]}`);

    // Get the specific export
    const tool = module[exportName];

    if (!tool) {
      console.error(`❌ Export "${exportName}" not found in module. Available exports:`, Object.keys(module));
      return null;
    }

    console.log(`🔍 Tool structure:`, {
      hasDescription: 'description' in tool,
      hasExecute: 'execute' in tool,
      hasInputSchema: 'inputSchema' in tool,
      keys: Object.keys(tool),
    });

    if (!isValidTool(tool)) {
      console.error(`❌ Invalid tool structure: ${exportName} from ${packageName}`);
      console.error(`   Tool:`, tool);
      return null;
    }

    // Cache successful import
    moduleCache.set(cacheKey, tool);
    console.log(`✅ Loaded: ${cacheKey}`);

    return tool;
  } catch (error) {
    console.error(`❌ Failed to load ${packageName}#${exportName}:`, error);
    console.error(`   URL: ${url}`);
    console.error(`   Stack:`, error instanceof Error ? error.stack : 'No stack trace');
    return null;
  }
}

/**
 * Load multiple tools in parallel
 */
export async function loadToolsBatch(
  toolMetadata: Array<{
    packageName: string;
    exportName: string;
    version: string;
    importUrl?: string;
  }>
): Promise<Record<string, any>> {
  const promises = toolMetadata.map((meta) =>
    loadToolDynamically(
      meta.packageName,
      meta.exportName,
      meta.version,
      meta.importUrl
    ).then((tool) => ({
      key: getCacheKey(meta.packageName, meta.exportName),
      tool,
    }))
  );

  const results = await Promise.all(promises);

  const tools: Record<string, any> = {};
  for (const { key, tool } of results) {
    if (tool) {
      tools[key] = tool;
    }
  }

  return tools;
}
```

### File 2: `apps/playground/src/app/api/chat/route.ts`

**Purpose**: Main chat API that orchestrates tool discovery and loading

```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { type UIMessage, convertToModelMessages, stepCountIs, streamText } from 'ai';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { env } from '~/env';
import { loadAllTools, sanitizeToolName } from '~/lib/tool-loader';
import { searchTpmjsToolsTool } from '@tpmjs/search-registry';
import {
  loadToolsBatch,
  addConversationTools,
} from '~/lib/dynamic-tool-loader';

export const runtime = 'nodejs';  // ⚠️ Important: We're using Node.js runtime, not edge
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Initialize OpenAI provider
const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Add conversation state tracking (in-memory for MVP)
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

    console.log(`🔑 Conversation ID: ${conversationId}`);

    // Get or create conversation state
    if (!conversationStates.has(conversationId)) {
      console.log('✨ Creating new conversation state');
      conversationStates.set(conversationId, { loadedTools: {} });
    }
    const state = conversationStates.get(conversationId)!;
    console.log(`📊 Current loaded tools in conversation: ${Object.keys(state.loadedTools).length}`);

    // 1. Load static tools + search tool
    const staticTools = await loadAllTools();
    console.log(`🔧 Loaded ${Object.keys(staticTools).length} static tools`);

    staticTools.searchTpmjsTools = searchTpmjsToolsTool;
    console.log('✅ Added searchTpmjsTools to static tools');

    // 2. Extract user query from last message for tool search
    const lastMessage = messages[messages.length - 1];
    let userQuery = '';
    if (lastMessage?.role === 'user') {
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
        const searchResult = await searchTpmjsToolsTool.execute({
          query: userQuery,
          limit: 5, // Get top 5 relevant tools
        }, {} as any);

        console.log(`📦 Found ${searchResult.matchCount} matching tools`);

        if (searchResult.tools && searchResult.tools.length > 0) {
          console.log(`🔧 Tools found:`, searchResult.tools.map((t: any) => `${t.packageName}/${t.exportName}`));

          // Dynamically load tools from esm.sh
          console.log(`📥 Loading ${searchResult.tools.length} tools dynamically...`);

          const toolsToLoad = searchResult.tools.map((meta: any) => ({
            packageName: meta.packageName,
            exportName: meta.exportName,
            version: meta.version,
            importUrl: meta.importUrl,
          }));

          try {
            // ❌ THIS IS WHERE IT FAILS
            const loadedTools = await loadToolsBatch(toolsToLoad);
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
      stopWhen: stepCountIs(5),
    });

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

### File 3: Example Tool Metadata (from search API)

When we search for "firecrawl", the search API returns:

```json
{
  "success": true,
  "query": "firecrawl ajax davis",
  "results": {
    "total": 29,
    "returned": 5,
    "tools": [
      {
        "id": "cm4abc123",
        "exportName": "searchTool",
        "description": "Search the web using Firecrawl's search API",
        "qualityScore": 0.85,
        "package": {
          "npmPackageName": "firecrawl-aisdk",
          "npmVersion": "0.7.2",
          "category": "web-scraping",
          "frameworks": ["vercel-ai"],
          "env": "server"
        },
        "importUrl": "https://esm.sh/firecrawl-aisdk@0.7.2",
        "cdnUrl": "https://cdn.jsdelivr.net/npm/firecrawl-aisdk@0.7.2/+esm"
      }
    ]
  }
}
```

So we're trying to:
```typescript
const module = await import('https://esm.sh/firecrawl-aisdk@0.7.2');
const tool = module.searchTool; // Get the exported tool
```

---

## The Error

### Console Output

```
📥 Loading 5 tools dynamically...
📦 Importing: https://esm.sh/firecrawl-aisdk@0.7.2
❌ Failed to load firecrawl-aisdk#searchTool: Error: Cannot find module 'unknown'
    at <unknown> (.next/dev/server/chunks/[root-of-the-server]__746deca2._.js:357:23)
    at loadToolDynamically (.next/dev/server/chunks/[root-of-the-server]__746deca2._.js:360:11)
    at <unknown> (src/lib/dynamic-tool-loader.ts:108:5)
    at Array.map (<anonymous>)
    at loadToolsBatch (src/lib/dynamic-tool-loader.ts:107:33)
    at POST (src/app/api/chat/route.ts:104:53)
  {
    code: 'MODULE_NOT_FOUND'
  }
   URL: https://esm.sh/firecrawl-aisdk@0.7.2
   Stack: Error: Cannot find module 'unknown'
    at /Users/ajaxdavis/repos/tpmjs/tpmjs/apps/playground/.next/dev/server/chunks/[root-of-the-server]__746deca2._.js:357:23
    at loadToolDynamically (/Users/ajaxdavis/repos/tpmjs/tpmjs/apps/playground/.next/dev/server/chunks/[root-of-the-server]__746deca2._.js:360:11)
```

### Key Observations

1. **Error happens immediately** - Never gets to our debug logs after `await import()`
2. **Error is MODULE_NOT_FOUND** - Treating URL as a module path
3. **Error says "unknown"** - Not even using the actual module name
4. **Code is in .next/dev/server/chunks/** - Next.js/Turbopack transformed our code
5. **Same error for all packages** - firecrawl-aisdk, @exalabs/ai-sdk, etc.

---

## Verification: The URL Works

### Manual Test 1: Browser

```
Visit: https://esm.sh/firecrawl-aisdk@0.7.2
```

Returns valid ESM module:
```javascript
/* esm.sh - firecrawl-aisdk@0.7.2 */
import * as __1$ from "/v135/@ai-sdk/provider-utils@2.0.8/...";
// ... rest of module code
export { searchTool, scrapeTool, crawlTool };
```

### Manual Test 2: Plain Node.js Script

Create `test-import.mjs`:
```javascript
const module = await import('https://esm.sh/firecrawl-aisdk@0.7.2');
console.log('Module:', module);
console.log('Exports:', Object.keys(module));
```

Run: `node test-import.mjs`

**Expected**: Would work in plain Node.js with `--experimental-network-imports` flag
**In Next.js**: Can't even get this far

---

## What We've Tried

### Attempt 1: `/* @vite-ignore */` Comment
```typescript
const module = await import(/* @vite-ignore */ url);
```
**Result**: Still fails with MODULE_NOT_FOUND

### Attempt 2: `/* webpackIgnore: true */` Comment
```typescript
const module = await import(/* webpackIgnore: true */ url);
```
**Result**: Still fails with MODULE_NOT_FOUND

### Attempt 3: Force Dynamic Runtime
```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```
**Result**: Still fails (we're already using this)

### Attempt 4: Verify esm.sh Works
- Tested URLs in browser: ✅ Works
- All packages return valid ESM: ✅ Valid
- esm.sh is accessible: ✅ Reachable

### Attempt 5: Check Static Imports
```typescript
import { helloWorldTool } from '@tpmjs/hello';
```
**Result**: Works perfectly (but bundled at build time)

---

## Configuration Files

### `apps/playground/next.config.ts`

```typescript
import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@tpmjs/ui'],
  experimental: {
    turbo: {
      // Using Turbopack (Next.js 15+ default)
    },
  },
};

export default config;
```

### `apps/playground/package.json` (relevant parts)

```json
{
  "name": "@tpmjs/playground",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@ai-sdk/openai": "^1.0.15",
    "@tpmjs/hello": "workspace:*",
    "@tpmjs/search-registry": "workspace:*",
    "ai": "6.0.0-beta.124",
    "next": "16.0.4",
    "react": "19.0.0"
  }
}
```

### `turbo.json` (monorepo config)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    }
  }
}
```

---

## Why This Matters

### The Bigger Picture

We're building a **self-referential tool discovery system**:

1. **Tool Registry** (tpmjs.com) - Indexes all TPMJS-compatible tools from npm
2. **Search Tool** - AI SDK tool that searches the registry
3. **Dynamic Loader** - Loads found tools at runtime
4. **AI Agent** - Uses dynamically loaded tools

This creates infinite extensibility:
- No need to bundle all possible tools
- Tools can be published to npm independently
- System discovers and loads tools as needed
- Bundle size stays small

### Use Case Example

```
User: "Search Wikipedia for quantum computing"
  ↓
System searches registry: Finds "wikipedia-aisdk" tool
  ↓
System loads tool: import('https://esm.sh/wikipedia-aisdk@1.0.0')
  ↓
AI uses tool: wikipediaSearchTool.execute({ query: "quantum computing" })
  ↓
User gets answer with Wikipedia citations
```

---

## Possible Root Causes

### Hypothesis 1: Turbopack Doesn't Support Dynamic Import URLs
- Turbopack intercepts all `import()` calls
- Transforms them to module resolution
- Doesn't handle external URLs

### Hypothesis 2: Next.js Security Restriction
- Next.js blocks dynamic imports from external URLs for security
- Prevents arbitrary code execution
- No way to whitelist esm.sh

### Hypothesis 3: Dev Mode Only Issue
- Turbopack dev mode has more restrictions
- Production webpack build might work
- But we need dev mode to work too

### Hypothesis 4: Node.js Runtime Limitation in Next.js
- Next.js Node.js runtime is sandboxed
- Dynamic imports are intercepted before reaching Node.js
- Plain Node.js would work with --experimental-network-imports

---

## Alternative Approaches We're Considering

### Option A: Fetch + VM Module
```typescript
import { SourceTextModule } from 'vm';

const response = await fetch(url);
const code = await response.text();
const module = new SourceTextModule(code);
await module.link(() => {});
await module.evaluate();
const exports = module.namespace;
```

**Pros**: Bypasses import() entirely
**Cons**: Complex, security concerns, might not work in Next.js

### Option B: Separate Microservice
```typescript
// New service: tool-loader-service (Express or Fastify)
POST /load-tool
Body: { packageName, exportName, version }
Response: { tool: <serialized tool object> }
```

**Pros**: Full control, definitely works
**Cons**: Extra infrastructure, latency, complexity

### Option C: Switch to Edge Runtime
```typescript
export const runtime = 'edge'; // Instead of 'nodejs'
```

**Pros**: Edge might have different import behavior
**Cons**: Edge has limitations (no Node.js APIs), might still not work

### Option D: Pre-bundle Common Tools
```typescript
// Generate static imports for top 100 tools
import { tool1 } from 'package1';
import { tool2 } from 'package2';
// ... etc
```

**Pros**: Definitely works
**Cons**: Defeats the purpose, huge bundle size

### Option E: Use unpkg or jsdelivr with Different Strategy
```typescript
// Fetch raw code, eval in isolated context
const response = await fetch(`https://unpkg.com/${pkg}@${ver}/dist/index.mjs`);
const code = await response.text();
const exports = evalInContext(code);
```

**Pros**: More control
**Cons**: Same security/execution issues

---

## Specific Questions for ChatGPT

### Question 1: Is This Possible?
**Can Next.js 16 App Router API routes (Node.js runtime) dynamically import ESM modules from external URLs using `import()`?**

If yes:
- What configuration is needed?
- Are there security allowlists?
- Does it work in both dev and production?

If no:
- Why not?
- What's the recommended alternative?
- Is this a Turbopack limitation or Next.js design?

### Question 2: Turbopack Behavior
**Does Turbopack intercept all `import()` calls, even with magic comments?**

We've tried:
- `/* @vite-ignore */`
- `/* webpackIgnore: true */`

None work. Is there a Turbopack-specific comment or config?

### Question 3: Edge vs Node Runtime
**Would switching to edge runtime change import behavior?**

```typescript
export const runtime = 'edge'; // vs 'nodejs'
```

Does edge runtime allow dynamic imports from URLs?

### Question 4: Best Practice
**What's the recommended way to implement dynamic tool loading in Next.js?**

Given constraints:
- Need to load arbitrary npm packages at runtime
- Packages are ESM modules from CDN
- Can't pre-bundle all possibilities
- Need to work in production on Vercel

### Question 5: Security Model
**Is Next.js intentionally blocking this for security?**

- Is there a whitelist for allowed CDNs?
- Can we configure allowed import sources?
- Is this related to CSP or other security headers?

---

## Environment Details

### Versions
```json
{
  "next": "16.0.4",
  "react": "19.0.0",
  "turbo": "2.6.1",
  "pnpm": "9.15.0",
  "node": "v20.11.0",
  "ai": "6.0.0-beta.124"
}
```

### Operating System
- **OS**: macOS (Darwin 23.5.0)
- **Architecture**: arm64 (Apple Silicon)

### Development Commands
```bash
# Start dev server
pnpm dev --filter=@tpmjs/playground

# Output
▲ Next.js 16.0.4 (Turbopack)
- Local:         http://localhost:3001
- Network:       http://192.168.0.25:3001
✓ Ready in 2.5s
```

### Build Output Structure
```
apps/playground/.next/
├── dev/
│   └── server/
│       └── chunks/
│           └── [root-of-the-server]__746deca2._.js  # ← Error originates here
```

---

## Success Criteria

### What We Need Working

```typescript
// In Next.js API route (Node.js runtime)
const url = 'https://esm.sh/firecrawl-aisdk@0.7.2';
const module = await import(url);
const tool = module.searchTool;

console.log(tool.description); // "Search the web using Firecrawl's search API"
console.log(typeof tool.execute); // "function"

// Tool is ready to use with AI SDK
const result = await tool.execute({ query: "test" }, context);
```

### Acceptable Outcomes

1. ✅ **Best**: Dynamic `import()` works with configuration change
2. ✅ **Good**: Alternative approach that doesn't require microservice
3. ✅ **Acceptable**: Workaround that works in production even if dev is tricky
4. ❌ **Unacceptable**: "You can't do this in Next.js" without alternative

---

## Additional Context

### Why Not Just Bundle Everything?

Currently have ~30 tools in registry, growing to 100s or 1000s:
- Bundle size would be massive (10+ MB)
- Most tools won't be used in most conversations
- Tools are published independently by community
- Want instant availability of new tools without redeploying

### Why esm.sh Specifically?

- ✅ Converts any npm package to ESM
- ✅ Handles dependencies automatically
- ✅ Fast CDN with caching
- ✅ No build step required
- ✅ Version pinning built-in

But we're flexible - if jsdelivr, unpkg, or another approach works better, we'll use it.

### Static Imports Work Fine

This works perfectly (but defeats the purpose):
```typescript
import { searchTool } from 'firecrawl-aisdk';
```

The tools themselves are fine. We just can't load them dynamically.

---

## What We're Hoping For

### Ideal Answer Format

1. **Root cause**: Why it's failing
2. **Solution**: How to fix it (with code example)
3. **Configuration**: Any Next.js config needed
4. **Limitations**: What won't work / tradeoffs
5. **Alternatives**: If dynamic import truly impossible

### We're Happy to Try

- Different CDN (unpkg, jsdelivr, etc.)
- Different import strategy (fetch + eval, vm module, etc.)
- Different runtime (edge if it works)
- Different Next.js version (if specific version supports this)
- Webpack instead of Turbopack (if webpack handles this better)

We just need a path forward that enables runtime tool loading in a production Next.js app on Vercel.

---

## Files to Reference

All code is in this monorepo:
- `apps/playground/src/lib/dynamic-tool-loader.ts` - Import logic
- `apps/playground/src/app/api/chat/route.ts` - API route
- `apps/playground/next.config.ts` - Next.js config
- `DYNAMIC_IMPORT_ISSUE.md` - This document

---

## Thank You

This is a critical blocker for our dynamic tool loading system. Any insights, workarounds, or alternative approaches would be immensely helpful!
