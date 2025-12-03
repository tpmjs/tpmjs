# Dynamic Tool Loading System - Product Requirements Document

## Executive Summary

Build a self-referential tool discovery system where AI agents can search the TPMJS registry, find relevant tools, and dynamically import them during conversation. This creates a "meta-tool" that makes the entire TPMJS ecosystem available to any agent at runtime.

**Core Innovation:** An AI agent can discover and load tools on-demand by searching the registry, rather than having all tools pre-loaded. This enables infinite tool extensibility without bundle size concerns.

---

## Problem Statement

### Current Limitations

1. **Static Tool Loading**: Playground requires all tools to be hardcoded in `tool-loader.ts`
2. **Bundle Size**: Loading many tools increases bundle size and initialization time
3. **Discovery Gap**: Agents can't discover new tools that match their current task
4. **Manual Updates**: Adding tools requires code changes and redeployment

### User Pain Points

- Users want agents to access the full TPMJS registry without manual configuration
- Developers want to publish tools that are immediately available to all agents
- Agents need context-aware tool selection based on the conversation

---

## Solution Overview

### The Meta-Tool: `searchTpmjsTools`

A TPMJS tool that searches the TPMJS registry and returns tool metadata needed for dynamic import.

**Flow:**
```
User: "Search Wikipedia for quantum computing"
  ↓
Agent: Calls searchTpmjsTools("wikipedia search")
  ↓
API: Returns tools matching "wikipedia" (BM25 search)
  ↓
Playground: Dynamically imports matching tools
  ↓
Agent: Now has Wikipedia tools available, uses them
```

### Key Components

1. **`@tpmjs/search-registry`** - NPM package exporting `searchTpmjsToolsTool`
2. **`/api/tools/search`** - New API endpoint with BM25 full-text search
3. **Playground Dynamic Loader** - Runtime tool import system
4. **Tool Import Strategy** - ESM CDN imports or bundled approach

---

## Technical Architecture

### Component 1: Search Tool Package

**Package:** `packages/tools/search-registry/`

```typescript
// packages/tools/search-registry/src/index.ts
import { tool } from 'ai';
import { z } from 'zod';

export const searchTpmjsToolsTool = tool({
  description: 'Search the TPMJS tool registry to find AI SDK tools. Use this when you need a tool that isn\'t currently available. Returns tool metadata including package names and descriptions.',
  parameters: z.object({
    query: z.string().describe('Search query (e.g., "weather", "database", "wikipedia")'),
    category: z.enum([
      'text-analysis',
      'code-generation',
      'data-processing',
      'image-generation',
      'audio-processing',
      'search',
      'integration',
      'other'
    ]).optional().describe('Filter by tool category'),
    limit: z.number().min(1).max(20).default(10).describe('Max number of tools to return'),
  }),
  execute: async ({ query, category, limit }) => {
    // Call TPMJS search API
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
      ...(category && { category }),
    });

    const response = await fetch(
      `https://tpmjs.com/api/tools/search?${params}`
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Return structured tool metadata
    return {
      query,
      matchCount: data.tools.length,
      tools: data.tools.map((tool: any) => ({
        packageName: tool.package.npmPackageName,
        exportName: tool.exportName,
        description: tool.description,
        category: tool.package.category,
        qualityScore: tool.qualityScore,
        frameworks: tool.package.frameworks,
        env: tool.package.env,
      })),
    };
  },
});
```

**Package Metadata:**

```json
{
  "name": "@tpmjs/search-registry",
  "version": "0.1.0",
  "description": "AI SDK tool for searching the TPMJS tool registry",
  "keywords": ["tpmjs-tool", "ai", "search"],
  "tpmjs": {
    "category": "search",
    "frameworks": ["vercel-ai"],
    "tools": [
      {
        "exportName": "searchTpmjsToolsTool",
        "description": "Search the TPMJS tool registry to find AI SDK tools by keyword, category, or description. Returns tool metadata for dynamic loading.",
        "parameters": [
          {
            "name": "query",
            "type": "string",
            "description": "Search query (keywords, tool names, descriptions)",
            "required": true
          },
          {
            "name": "category",
            "type": "string",
            "description": "Filter by category (text-analysis, search, etc.)",
            "required": false
          },
          {
            "name": "limit",
            "type": "number",
            "description": "Maximum number of results (1-20, default 10)",
            "required": false
          }
        ],
        "returns": {
          "type": "object",
          "description": "Search results with tool metadata for dynamic import"
        },
        "aiAgent": {
          "useCase": "Use this tool when you need a tool that isn't currently available. For example, if asked to search Wikipedia but you don't have a Wikipedia tool, search for 'wikipedia' to find and load it.",
          "examples": [
            "Search for 'weather' tools when asked about weather",
            "Search for 'database' tools when working with data",
            "Search for 'code' tools when generating code"
          ],
          "limitations": "Returns metadata only - the playground handles actual tool loading"
        }
      }
    ]
  }
}
```

---

### Component 2: BM25 Search API Endpoint

**File:** `apps/web/src/app/api/tools/search/route.ts`

**Requirements:**

1. **Full-Text Search with BM25**
   - Search across: tool description, package name, npm description, npm keywords
   - BM25 scoring for relevance ranking
   - Category filtering
   - Quality score boosting (rich tier tools rank higher)

2. **Search Implementation Options**

   **Option A: PostgreSQL Full-Text Search**
   ```sql
   -- Add tsvector column to tools table
   ALTER TABLE tools ADD COLUMN search_vector tsvector;

   -- Create GIN index for fast full-text search
   CREATE INDEX tools_search_idx ON tools USING GIN(search_vector);

   -- Update search vector on insert/update
   CREATE TRIGGER tools_search_update
   BEFORE INSERT OR UPDATE ON tools
   FOR EACH ROW EXECUTE FUNCTION
   tsvector_update_trigger(search_vector, 'pg_catalog.english',
                           description);
   ```

   **Option B: JavaScript BM25 Library**
   ```typescript
   import { BM25 } from 'bm25';

   // Load all tools into memory (cached)
   const tools = await prisma.tool.findMany({
     include: { package: true },
   });

   // Build BM25 index
   const documents = tools.map(tool => ({
     id: tool.id,
     text: `${tool.description} ${tool.package.npmPackageName} ${tool.package.npmDescription} ${tool.package.npmKeywords.join(' ')}`,
   }));

   const bm25 = new BM25(documents);
   const results = bm25.search(query);
   ```

   **Option C: Hybrid Approach**
   - Use PostgreSQL `LIKE` for exact matches (fastest)
   - Fall back to BM25 for fuzzy/semantic search
   - Cache search results in Redis

3. **API Response Format**

```typescript
// GET /api/tools/search?q=weather&category=integration&limit=10

{
  "success": true,
  "query": "weather",
  "filters": {
    "category": "integration"
  },
  "results": {
    "total": 23,
    "returned": 10,
    "tools": [
      {
        "id": "clx...",
        "exportName": "getWeatherTool",
        "description": "Get current weather data for any location using OpenWeatherMap API",
        "qualityScore": 0.85,
        "package": {
          "npmPackageName": "@tpmjs/weather",
          "npmVersion": "1.2.0",
          "category": "integration",
          "frameworks": ["vercel-ai"],
          "env": [
            {
              "name": "OPENWEATHER_API_KEY",
              "description": "OpenWeatherMap API key",
              "required": true
            }
          ],
          "npmRepository": {
            "type": "git",
            "url": "https://github.com/user/weather-tool"
          },
          "isOfficial": false
        },
        // Include everything needed for dynamic import
        "importUrl": "https://esm.sh/@tpmjs/weather@1.2.0",
        "cdnUrl": "https://cdn.jsdelivr.net/npm/@tpmjs/weather@1.2.0/+esm"
      }
      // ... more tools
    ]
  }
}
```

---

### Component 3: Dynamic Tool Loader (Playground)

**File:** `apps/playground/src/lib/dynamic-tool-loader.ts`

**Requirements:**

1. **Runtime ESM Import**
   ```typescript
   async function loadToolDynamically(
     packageName: string,
     exportName: string,
     version: string
   ) {
     // Option 1: ESM CDN (esm.sh, unpkg, jsdelivr)
     const cdnUrl = `https://esm.sh/${packageName}@${version}`;

     try {
       const module = await import(/* @vite-ignore */ cdnUrl);
       const tool = module[exportName];

       if (!isValidTool(tool)) {
         throw new Error(`Invalid tool: ${exportName}`);
       }

       return tool;
     } catch (error) {
       console.error(`Failed to load ${packageName}:`, error);
       return null;
     }
   }
   ```

2. **Tool Caching Strategy**
   ```typescript
   // Cache loaded tools to avoid redundant imports
   const toolCache = new Map<string, any>();

   function getCacheKey(packageName: string, exportName: string): string {
     return `${packageName}::${exportName}`;
   }

   async function loadToolWithCache(
     packageName: string,
     exportName: string,
     version: string
   ) {
     const key = getCacheKey(packageName, exportName);

     if (toolCache.has(key)) {
       return toolCache.get(key);
     }

     const tool = await loadToolDynamically(packageName, exportName, version);

     if (tool) {
       toolCache.set(key, tool);
     }

     return tool;
   }
   ```

3. **Tool Registry Integration**
   ```typescript
   // Merge static tools + dynamically loaded tools
   async function getAllAvailableTools(
     staticTools: Record<string, any>,
     searchResults: SearchResult[]
   ): Promise<Record<string, any>> {
     const allTools = { ...staticTools };

     // Load tools from search results
     for (const result of searchResults) {
       const tool = await loadToolWithCache(
         result.package.npmPackageName,
         result.exportName,
         result.package.npmVersion
       );

       if (tool) {
         const key = sanitizeToolName(
           `${result.package.npmPackageName}-${result.exportName}`
         );
         allTools[key] = tool;
       }
     }

     return allTools;
   }
   ```

---

### Component 4: Playground Chat Integration

**File:** `apps/playground/src/app/api/chat/route.ts`

**Flow:**

1. **Initial Tool Set**
   - Load static tools (hardcoded in tool-loader)
   - Always include `searchTpmjsToolsTool` in initial set

2. **Agent Invokes Search**
   - Agent calls `searchTpmjsToolsTool` with query
   - Search API returns matching tool metadata
   - Response includes tool metadata

3. **Dynamic Loading Trigger**
   - Detect when agent successfully calls `searchTpmjsToolsTool`
   - Extract tool metadata from response
   - Load tools dynamically before next agent turn

4. **Tool Availability Update**
   - Merge dynamically loaded tools into available tool set
   - Agent can now use newly loaded tools in subsequent turns

**Implementation:**

```typescript
// apps/playground/src/app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json();

  // 1. Load static tools + search tool
  let availableTools = await loadAllTools(); // static
  availableTools['searchTpmjsTools'] = searchTpmjsToolsTool; // meta-tool

  // 2. Create streamText with current tools
  const result = streamText({
    model: openai('gpt-4'),
    messages,
    tools: availableTools,
    maxSteps: 10, // Allow multiple tool call rounds

    onStepFinish: async (step) => {
      // 3. Check if agent called searchTpmjsToolsTool
      for (const toolCall of step.toolCalls) {
        if (toolCall.toolName === 'searchTpmjsTools') {
          const searchResults = toolCall.result?.tools || [];

          // 4. Dynamically load tools from search results
          console.log(`Loading ${searchResults.length} tools dynamically...`);

          for (const toolMeta of searchResults) {
            const tool = await loadToolWithCache(
              toolMeta.packageName,
              toolMeta.exportName,
              'latest' // or toolMeta.version
            );

            if (tool) {
              const key = sanitizeToolName(
                `${toolMeta.packageName}-${toolMeta.exportName}`
              );
              availableTools[key] = tool;
              console.log(`✅ Loaded: ${key}`);
            }
          }

          // 5. Update tool registry for subsequent steps
          // Note: This requires AI SDK to support dynamic tool updates
          // May need to restart the streamText with updated tools
        }
      }
    },
  });

  return result.toDataStreamResponse();
}
```

---

## Technical Challenges & Solutions

### Challenge 1: AI SDK Doesn't Support Dynamic Tool Updates Mid-Stream

**Problem:** Vercel AI SDK's `streamText` sets tools at initialization. Can't add tools after streaming starts.

**Solutions:**

**Option A: Multi-Turn Pattern**
```typescript
// Turn 1: Agent searches for tools
// Turn 2: Agent uses loaded tools

// Detect search tool call, return early
if (hasSearchToolCall) {
  return new Response(JSON.stringify({
    type: 'tools_loaded',
    tools: searchResults,
    message: 'Tools loaded. Please continue your request.',
  }));
}
```

**Option B: Pre-Flight Search (Recommended)**
```typescript
// Before calling streamText, analyze user message
const needsTools = await analyzeMessageForToolNeeds(userMessage);

if (needsTools.length > 0) {
  // Pre-load tools based on intent
  const searchResults = await searchTools(needsTools);
  const dynamicTools = await loadToolsFromResults(searchResults);
  availableTools = { ...staticTools, ...dynamicTools };
}

// Now call streamText with full tool set
const result = streamText({
  model,
  messages,
  tools: availableTools,
});
```

**Option C: Agent-Driven Two-Phase**
```typescript
// Phase 1: Planning
const planResult = await generateText({
  model,
  messages: [
    { role: 'system', content: 'Analyze this request and determine what tools are needed. Call searchTpmjsTools if needed.' },
    ...messages,
  ],
  tools: { searchTpmjsTools },
});

// Phase 2: Execution with loaded tools
const executionResult = await streamText({
  model,
  messages,
  tools: { ...staticTools, ...loadedTools },
});
```

---

### Challenge 2: ESM Dynamic Import in Browser vs Node.js

**Problem:** Dynamic `import()` works differently in browser vs server environments.

**Solutions:**

**Server-Side (Recommended):**
```typescript
// Use Node.js dynamic import
// Works with esm.sh CDN
const tool = await import(`https://esm.sh/${pkg}@${version}`);
```

**Client-Side (Avoid):**
```typescript
// Browser import() has CORS and CSP restrictions
// Would require:
// 1. CDN supports CORS
// 2. CSP allows script-src from CDN
// 3. Tools are browser-compatible (no Node.js APIs)
```

**Hybrid Approach:**
```typescript
// Load tools server-side, serialize to client
// Client displays available tools
// Server executes tool calls
```

---

### Challenge 3: Tool Dependencies & Environment Variables

**Problem:** Dynamically loaded tools may require:
- Environment variables (API keys)
- npm dependencies not in bundle
- Node.js-specific APIs

**Solutions:**

**Option A: Require Pre-Configuration**
```typescript
// Before loading, check if tool requirements are met
async function canLoadTool(toolMeta: ToolMetadata): Promise<boolean> {
  // Check required env vars
  for (const env of toolMeta.package.env || []) {
    if (env.required && !process.env[env.name]) {
      console.warn(`Missing required env: ${env.name}`);
      return false;
    }
  }

  return true;
}
```

**Option B: Graceful Degradation**
```typescript
// Load tool, catch errors, inform agent
try {
  const tool = await loadTool(packageName, exportName);
  return tool;
} catch (error) {
  return createStubTool(packageName, exportName, error);
}

function createStubTool(pkg: string, exp: string, error: Error) {
  return tool({
    description: `[UNAVAILABLE] ${exp} from ${pkg}: ${error.message}`,
    parameters: z.object({}),
    execute: async () => {
      throw new Error(`Cannot execute ${exp}: ${error.message}`);
    },
  });
}
```

**Option C: Proxy Through Server**
```typescript
// All tools execute server-side where env vars exist
// Client just displays tool calls, server handles execution
```

---

### Challenge 4: Security & Sandboxing

**Problem:** Dynamically importing arbitrary npm packages is a security risk.

**Solutions:**

**Option A: Allowlist Only**
```typescript
// Only load tools from TPMJS registry (already vetted)
const allowedPackages = await prisma.package.findMany({
  select: { npmPackageName: true }
});

if (!allowedPackages.includes(packageName)) {
  throw new Error('Package not in TPMJS registry');
}
```

**Option B: Version Pinning**
```typescript
// Only load specific versions from registry
// Don't use 'latest' to avoid supply chain attacks
const version = toolMeta.package.npmVersion; // e.g., "1.2.0"
const url = `https://esm.sh/${pkg}@${version}`;
```

**Option C: VM Sandbox (Advanced)**
```typescript
// Execute tools in isolated VM context
import { VM } from 'vm2';

const vm = new VM({
  timeout: 5000,
  sandbox: {
    fetch: safeFetch, // Wrapped fetch with rate limits
    console: safeConsole,
  },
});

const tool = vm.run(toolCode);
```

---

### Challenge 5: Performance & Bundle Size

**Problem:** Loading many tools dynamically could be slow.

**Solutions:**

**Option A: Lazy Loading**
```typescript
// Only load tools when agent decides to use them
// Not when they're discovered
```

**Option B: Parallel Loading**
```typescript
// Load multiple tools concurrently
const toolPromises = searchResults.map(result =>
  loadToolWithCache(result.package.npmPackageName, result.exportName, result.package.npmVersion)
);

const tools = await Promise.all(toolPromises);
```

**Option C: CDN Caching**
```typescript
// Use CDN with aggressive caching
// esm.sh has built-in caching
const url = `https://esm.sh/${pkg}@${version}?target=es2022&bundle`;
```

---

## Implementation Plan

### Phase 1: MVP (Week 1-2)

**Goal:** Prove dynamic loading works with simple prototype

1. **Create `@tpmjs/search-registry` package**
   - Implement `searchTpmjsToolsTool`
   - Publish to npm
   - Add to manual-tools registry

2. **Build `/api/tools/search` endpoint**
   - Start with simple PostgreSQL `LIKE` search
   - Return tool metadata with package info
   - Test with curl

3. **Implement basic dynamic loader**
   - Use esm.sh CDN for imports
   - Load tools server-side only
   - Cache in memory

4. **Playground integration - Two-Turn Pattern**
   - User asks question
   - Agent calls `searchTpmjsToolsTool`
   - Backend loads tools
   - Agent uses tools in next turn

**Success Criteria:**
- Agent can search registry
- Agent can use dynamically loaded tools
- End-to-end flow works for 1-2 example tools

---

### Phase 2: BM25 Search (Week 3)

**Goal:** Improve search relevance with BM25

1. **Research BM25 implementation options**
   - Test PostgreSQL full-text search
   - Test JavaScript BM25 libraries
   - Benchmark performance

2. **Implement chosen approach**
   - Add search vector column if using PostgreSQL
   - Create search index
   - Update search endpoint

3. **Test search quality**
   - Create test queries
   - Measure precision/recall
   - Compare to baseline `LIKE` search

**Success Criteria:**
- BM25 search returns more relevant results than LIKE
- Search latency < 100ms for 95th percentile
- Agent can find tools for diverse queries

---

### Phase 3: Production Hardening (Week 4)

**Goal:** Make system production-ready

1. **Error Handling**
   - Handle import failures gracefully
   - Validate tool schemas
   - Return helpful error messages to agent

2. **Security**
   - Implement package allowlist
   - Pin versions from registry
   - Add rate limiting to search API

3. **Performance**
   - Implement Redis caching for search results
   - Add CDN caching headers
   - Optimize tool loading parallelism

4. **Monitoring**
   - Log all dynamic tool loads
   - Track search queries and results
   - Monitor import success/failure rates

**Success Criteria:**
- System handles errors without crashing
- Security review passes
- Latency and reliability SLOs met

---

### Phase 4: Advanced Features (Week 5+)

**Goal:** Enhance UX and capabilities

1. **Pre-flight Search**
   - Analyze user message for intent
   - Proactively load tools before agent call
   - Reduce total turns needed

2. **Tool Recommendations**
   - "You might also need..." suggestions
   - Based on tool co-occurrence data
   - Help agent discover related tools

3. **Client-Side Tool Display**
   - Show which tools are available
   - Indicate dynamically loaded tools
   - Allow user to manually load tools

4. **Tool Versioning**
   - Support multiple versions of same tool
   - Let agent choose version
   - Handle breaking changes gracefully

---

## Success Metrics

### Technical Metrics

1. **Search Quality**
   - Precision@10 > 0.8 (80% of top 10 results are relevant)
   - Mean Reciprocal Rank (MRR) > 0.7
   - Search latency p95 < 100ms

2. **Tool Loading**
   - Import success rate > 95%
   - Tool load time p95 < 2 seconds
   - Cache hit rate > 70% after warmup

3. **End-to-End Performance**
   - Total conversation latency < 5 seconds (including tool search + load + execution)
   - Agent uses correct tools > 90% of time

### User Metrics

1. **Adoption**
   - % of playground sessions using dynamic tools > 30%
   - Number of unique tools loaded dynamically per week > 50

2. **Tool Coverage**
   - % of user queries satisfied with available tools > 80%
   - Tool search leading to successful task completion > 70%

---

## Open Questions

### 1. CDN Choice for ESM Imports

**Options:**
- **esm.sh** - Purpose-built for ESM imports, fast, reliable
- **unpkg** - Popular, simple, but slower
- **jsdelivr** - Fast CDN, good for production
- **Custom bundler** - Pre-bundle tools, serve from our CDN

**Recommendation:** Start with esm.sh for MVP, evaluate custom bundler for production.

---

### 2. When to Load Tools?

**Options:**
- **On-demand**: Load when agent calls search tool (current plan)
- **Pre-flight**: Analyze user message, load proactively
- **Lazy**: Load when agent tries to use tool (not when discovered)
- **Eager**: Load all tools from search results immediately

**Recommendation:** Start with on-demand (Phase 1), add pre-flight in Phase 4.

---

### 3. How to Handle Environment Variables?

**Problem:** Dynamically loaded tools may need API keys (e.g., OpenWeather API).

**Options:**
- **User provides**: UI for users to enter API keys (like playground settings)
- **Server-managed**: Admin pre-configures keys in .env
- **Graceful fail**: Load tool, but execution fails if env missing
- **Hybrid**: Some tools work without keys (free tier), others require keys

**Recommendation:** Start with graceful fail (Phase 1), add user-provided keys (Phase 4).

---

### 4. Should Tools Load Client-Side or Server-Side?

**Client-Side Pros:**
- Reduces server load
- Faster for subsequent uses
- Better for browser-compatible tools

**Client-Side Cons:**
- Requires CORS-enabled CDN
- CSP restrictions
- Many tools need Node.js APIs
- Exposing API keys in browser is insecure

**Server-Side Pros:**
- Access to Node.js APIs
- Secure environment variable access
- No CORS issues
- Easier to implement

**Server-Side Cons:**
- Requires server memory for caching
- Increases server load
- Cold starts for new tools

**Recommendation:** Server-side for MVP (Phase 1), evaluate client-side for browser-compatible tools (Phase 4+).

---

### 5. How to Handle Tool Dependencies?

**Problem:** Some tools depend on other npm packages (e.g., `axios`, `cheerio`).

**Options:**
- **Bundled**: CDN bundles dependencies (esm.sh does this)
- **Peer deps**: Require dependencies in playground package.json
- **Dynamic install**: npm install on-the-fly (slow, risky)
- **Pre-vetted**: Only allow tools with no/minimal dependencies

**Recommendation:** Use esm.sh bundling (Phase 1), bundle size limits if issues arise.

---

## Risk Assessment

### High Risk

1. **Security Vulnerability**
   - **Risk**: Malicious package in registry executes code
   - **Mitigation**: Allowlist registry packages, version pinning, VM sandboxing
   - **Owner**: Security team

2. **Performance Degradation**
   - **Risk**: Loading many tools causes timeout/slow response
   - **Mitigation**: Parallel loading, caching, lazy loading, timeouts
   - **Owner**: Backend team

### Medium Risk

3. **Import Failures**
   - **Risk**: CDN down, package incompatible, missing dependencies
   - **Mitigation**: Fallback CDNs, error handling, stub tools
   - **Owner**: Frontend team

4. **AI SDK Limitations**
   - **Risk**: Can't dynamically update tools mid-stream
   - **Mitigation**: Two-turn pattern, pre-flight search
   - **Owner**: AI team

### Low Risk

5. **Search Quality**
   - **Risk**: BM25 doesn't return relevant tools
   - **Mitigation**: A/B test search algorithms, collect feedback
   - **Owner**: Search team

---

## Future Enhancements

### 1. Tool Composition
- Agent can combine multiple tools
- Example: `searchTool` + `summarizeTool` = search and summarize

### 2. Tool Learning
- Track which tools are used together
- Recommend tool combinations
- "Users who used X also used Y"

### 3. Custom Tool Registry
- Users can add private tools
- Organization-specific tool registry
- Access control and permissions

### 4. Tool Marketplace
- Developers promote their tools
- Usage analytics and ratings
- Paid/premium tools

### 5. Agent Templates
- Pre-configured agents with tool sets
- "Research Agent" has search + summarize tools
- "Code Agent" has code generation tools

---

## Conclusion

This dynamic tool loading system represents a paradigm shift in how AI agents discover and use tools. By making the TPMJS registry itself searchable, we enable infinite extensibility without the limitations of static bundling.

**Key Innovation:** Self-referential tool discovery - a tool that searches for tools.

**Next Steps:**
1. Review this PRD with team
2. Validate technical feasibility with ChatGPT/Claude
3. Spike on BM25 search implementation
4. Spike on dynamic ESM import
5. Begin Phase 1 implementation

**Success Looks Like:**
- User: "Search Wikipedia for quantum computing"
- Agent: *searches registry, finds Wikipedia tool, loads it, uses it*
- User: Gets Wikipedia results without any manual tool configuration

This is a novel approach that could define how AI agents discover and use tools. Let's build it. 🚀
