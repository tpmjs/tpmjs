# Building Dynamic Tool Discovery & Injection Systems for AI Agents

A comprehensive guide to building a system where AI agents can discover, load, and execute tools dynamically at runtime. Based on the TPMJS architecture.

---

## Table of Contents

1. [The Problem We're Solving](#the-problem-were-solving)
2. [Architecture Overview](#architecture-overview)
3. [Tool Schema Design](#tool-schema-design)
4. [The Search System](#the-search-system)
5. [Dynamic Tool Loading](#dynamic-tool-loading)
6. [Injecting Tools Into Agents](#injecting-tools-into-agents)
7. [Execution & Sandboxing](#execution--sandboxing)
8. [Critical Nuances & Gotchas](#critical-nuances--gotchas)
9. [Database Design](#database-design)
10. [The Full Flow](#the-full-flow)

---

## The Problem We're Solving

Traditional AI agent setups have a fixed set of tools defined at build time:

```typescript
// Static approach - tools are hardcoded
const agent = createAgent({
  tools: {
    searchWeb: webSearchTool,
    readFile: fileReadTool,
    // ... fixed list
  }
});
```

**Problems with this approach:**
- Can't add new tools without redeploying
- Agent has access to ALL tools even when irrelevant
- No way for users to bring their own tools
- Tool bloat affects context window and model performance

**What we want:**
- Discover tools dynamically based on user intent
- Load only relevant tools per conversation
- Allow third-party tool registration
- Execute tools securely in isolation

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User Message                                   │
│                    "Help me scrape this website"                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Chat Endpoint                                    │
│  1. Extract user intent from message                                    │
│  2. Auto-search registry for relevant tools                             │
│  3. Load discovered tools dynamically                                   │
│  4. Merge with static tools                                             │
│  5. Pass combined toolset to model                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │   Search    │ │    Load     │ │   Execute   │
            │   Registry  │ │   Dynamic   │ │   Sandbox   │
            │   (BM25)    │ │   Tools     │ │   Service   │
            └─────────────┘ └─────────────┘ └─────────────┘
                    │               │               │
                    ▼               ▼               ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │  Database   │ │   ESM CDN   │ │  Isolated   │
            │  (Postgres) │ │  (esm.sh)   │ │   Runtime   │
            └─────────────┘ └─────────────┘ └─────────────┘
```

**Three-tier tool access:**
1. **Static tools** - Bundled with app, always available (fast, reliable)
2. **Discovered tools** - Found via search, loaded on-demand
3. **Sandboxed execution** - Run in isolated environment for security

---

## Tool Schema Design

### The `tpmjs` Field in package.json

Tools declare their capabilities via a `tpmjs` field in package.json:

```json
{
  "name": "@myorg/web-scraper",
  "version": "1.0.0",
  "keywords": ["tpmjs"],
  "tpmjs": {
    "category": "web-scraping",
    "frameworks": ["vercel-ai"],
    "env": [
      {
        "name": "SCRAPER_API_KEY",
        "description": "API key for the scraping service",
        "required": true
      }
    ],
    "tools": [
      {
        "exportName": "scrapeTool",
        "description": "Scrape content from any webpage and return structured data",
        "parameters": [
          {
            "name": "url",
            "type": "string",
            "description": "The URL to scrape",
            "required": true
          },
          {
            "name": "selector",
            "type": "string",
            "description": "CSS selector to extract specific elements",
            "required": false
          }
        ],
        "returns": {
          "type": "object",
          "description": "Scraped content with title, text, and metadata"
        },
        "aiAgent": {
          "useCase": "When user needs to extract content from websites",
          "limitations": "Cannot scrape JavaScript-rendered content without headless browser",
          "examples": [
            "Scrape the main content from https://example.com",
            "Extract all product prices from this page"
          ]
        }
      }
    ]
  }
}
```

### Schema Nuances

**1. Multi-tool packages**

One npm package can export multiple tools. Each has its own `exportName`:

```json
{
  "tpmjs": {
    "tools": [
      { "exportName": "scrapeTool", "description": "..." },
      { "exportName": "screenshotTool", "description": "..." },
      { "exportName": "pdfExtractTool", "description": "..." }
    ]
  }
}
```

**2. The `aiAgent` field is critical**

This isn't just documentation - it's injected into the system prompt:

```typescript
// The aiAgent field helps the model understand WHEN to use this tool
aiAgent: {
  useCase: "When user needs to extract content from websites",
  limitations: "Cannot scrape JavaScript-rendered content",
  examples: ["Scrape the main content from...", "Extract all prices..."]
}
```

**3. Tier determination is automatic**

Don't make users declare "minimal" vs "rich" - compute it:

```typescript
function determineTier(tpmjsField: TpmjsField): 'minimal' | 'rich' {
  const hasRichFields = tpmjsField.tools?.some(tool =>
    tool.parameters || tool.returns || tool.aiAgent
  ) || tpmjsField.env || tpmjsField.frameworks;

  return hasRichFields ? 'rich' : 'minimal';
}
```

**4. Parameter types map to Zod schemas**

```typescript
function typeToZodSchema(type: string): z.ZodTypeAny {
  switch (type) {
    case 'string': return z.string();
    case 'number': return z.number();
    case 'boolean': return z.boolean();
    case 'string[]': return z.array(z.string());
    case 'object': return z.record(z.any());
    // Handle union types: "'markdown' | 'mdx'"
    default:
      if (type.includes('|')) {
        const options = type.split('|').map(s => s.trim().replace(/'/g, ''));
        return z.enum(options as [string, ...string[]]);
      }
      return z.string(); // Safe fallback
  }
}
```

---

## The Search System

### Why BM25?

Simple substring matching fails for tool discovery:
- "help me with web stuff" won't match "scrape websites"
- Need semantic relevance, not just keyword matching

BM25 (Best Matching 25) is a battle-tested ranking algorithm that considers:
- **Term frequency (TF)**: How often query terms appear in document
- **Inverse document frequency (IDF)**: Rare terms matter more than common ones
- **Document length normalization**: Short docs aren't unfairly penalized

### Implementation

```typescript
interface SearchableDocument {
  id: string;
  content: string;  // Combined: name + description + category + aiAgent fields
  tool: Tool;
}

function bm25Search(
  query: string,
  documents: SearchableDocument[],
  recentMessages: string[] = []  // Context from conversation
): ScoredDocument[] {
  // Combine query with recent context for better relevance
  const fullQuery = [query, ...recentMessages].join(' ');
  const queryTerms = tokenize(fullQuery);

  // Calculate IDF for each term
  const idf = new Map<string, number>();
  for (const term of queryTerms) {
    const docsWithTerm = documents.filter(d =>
      tokenize(d.content).includes(term)
    ).length;
    idf.set(term, Math.log((documents.length - docsWithTerm + 0.5) / (docsWithTerm + 0.5)));
  }

  // BM25 parameters (tuned for short documents)
  const k1 = 1.2;  // Term frequency saturation
  const b = 0.75;  // Length normalization
  const avgDocLength = documents.reduce((sum, d) =>
    sum + tokenize(d.content).length, 0
  ) / documents.length;

  // Score each document
  return documents.map(doc => {
    const docTerms = tokenize(doc.content);
    const docLength = docTerms.length;

    let score = 0;
    for (const term of queryTerms) {
      const tf = docTerms.filter(t => t === term).length;
      const termIdf = idf.get(term) || 0;

      // BM25 formula
      score += termIdf * (tf * (k1 + 1)) /
        (tf + k1 * (1 - b + b * (docLength / avgDocLength)));
    }

    // Boost by quality metrics
    const qualityBoost = (doc.tool.qualityScore || 0) * 0.5;
    const downloadBoost = Math.log10((doc.tool.package.npmDownloadsLastMonth || 0) + 1) * 0.1;

    return {
      ...doc,
      score: score + qualityBoost + downloadBoost
    };
  }).sort((a, b) => b.score - a.score);
}
```

### The `recentMessages` Trick

Pass recent conversation context to improve search relevance:

```typescript
// In chat endpoint
const recentMessages = messages
  .filter(m => m.role === 'user')
  .slice(-3)
  .map(m => m.content);

const searchResults = await searchTool.execute({
  query: extractUserIntent(lastMessage),
  recentMessages,  // Gives search more context
  limit: 5
});
```

If user previously mentioned "I'm building an e-commerce site" and now says "extract prices", the search understands the context.

---

## Dynamic Tool Loading

### The Challenge

You can't just `import()` arbitrary npm packages at runtime in a Next.js/Vercel environment:
- Webpack needs to know imports at build time
- Serverless functions are stateless
- Security concerns with arbitrary code execution

### Solution: ESM CDN + Process Cache

```typescript
// Process-level cache (survives across requests in same instance)
const moduleCache = new Map<string, any>();
const conversationEnv = new Map<string, Record<string, string>>();

export async function loadToolDynamically(
  packageName: string,
  exportName: string,
  version: string,
  conversationId: string,
  env?: Record<string, string>
): Promise<Tool | null> {
  const cacheKey = `${packageName}::${exportName}`;

  // Return cached tool if available
  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey);
  }

  // Store env vars for this conversation
  if (env) {
    conversationEnv.set(conversationId, {
      ...conversationEnv.get(conversationId),
      ...env
    });
  }

  try {
    // Load via external sandbox service
    const response = await fetch(`${SANDBOX_SERVICE_URL}/load-and-describe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageName,
        exportName,
        version,
        importUrl: `https://esm.sh/${packageName}@${version}`,
        env: env || {},
      }),
      signal: AbortSignal.timeout(120000),
    });

    const { tool: toolMeta } = await response.json();

    // Create AI SDK tool wrapper
    const toolWrapper = tool({
      description: toolMeta.description,
      inputSchema: jsonSchema(toolMeta.inputSchema),
      execute: async (params: any) => {
        // CRITICAL: Get fresh env vars, not from closure!
        const currentEnv = conversationEnv.get(conversationId) || {};

        const execResponse = await fetch(
          `${SANDBOX_SERVICE_URL}/execute-tool`,
          {
            method: 'POST',
            body: JSON.stringify({
              packageName,
              exportName,
              version,
              params,
              env: currentEnv,  // Fresh on every execution
            }),
          }
        );

        return (await execResponse.json()).output;
      },
    });

    // Cache the wrapper (but not the env vars!)
    moduleCache.set(cacheKey, toolWrapper);
    return toolWrapper;

  } catch (error) {
    console.error(`Failed to load ${packageName}/${exportName}:`, error);
    return null;
  }
}
```

### Why Separate Env Vars from Tool Cache?

This is a critical nuance. Consider:

```typescript
// WRONG: Env vars captured in closure
const toolWrapper = tool({
  execute: async (params) => {
    // `env` is captured when tool is created
    // If user updates API key, old key is still used!
    return await execute(params, env);
  }
});
moduleCache.set(cacheKey, toolWrapper);
```

```typescript
// RIGHT: Fresh env lookup on each execution
const toolWrapper = tool({
  execute: async (params) => {
    // Always get current env for this conversation
    const currentEnv = conversationEnv.get(conversationId) || {};
    return await execute(params, currentEnv);
  }
});
```

Users can update API keys mid-conversation. Cached tools must use fresh credentials.

---

## Injecting Tools Into Agents

### The Chat Endpoint Pattern

```typescript
export async function POST(request: Request) {
  const { messages, conversationId, env } = await request.json();

  // 1. Store conversation-scoped env vars
  setConversationEnv(conversationId, env);

  // 2. Load static tools (always available)
  const staticTools = await loadStaticTools();

  // 3. Always include the search tool
  staticTools.searchRegistry = searchRegistryTool;

  // 4. Extract user intent for auto-discovery
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const userQuery = lastUserMessage?.content || '';
  const recentContext = getRecentUserMessages(messages, 3);

  // 5. Auto-search for relevant tools
  let discoveredTools: Record<string, Tool> = {};

  if (userQuery.trim().length > 0) {
    const searchResults = await searchRegistryTool.execute({
      query: userQuery,
      limit: 5,
      recentMessages: recentContext,
    });

    if (searchResults.tools?.length > 0) {
      // 6. Load discovered tools in parallel
      const loadPromises = searchResults.tools.map(meta =>
        loadToolDynamically(
          meta.packageName,
          meta.exportName,
          meta.version,
          conversationId,
          env
        )
      );

      const loadedTools = await Promise.all(loadPromises);

      // 7. Add to toolset with sanitized names
      searchResults.tools.forEach((meta, i) => {
        if (loadedTools[i]) {
          const key = sanitizeToolName(`${meta.packageName}-${meta.exportName}`);
          discoveredTools[key] = loadedTools[i];
        }
      });
    }
  }

  // 8. Merge all tools
  const allTools = {
    ...staticTools,
    ...discoveredTools,
  };

  // 9. Build system prompt with tool guidance
  const systemPrompt = buildSystemPrompt(allTools);

  // 10. Stream response
  const result = streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    tools: allTools,
    maxSteps: 5,  // Allow multi-step tool usage
  });

  return result.toDataStreamResponse();
}
```

### Tool Name Sanitization

OpenAI requires tool names to match: `^[a-zA-Z0-9_-]+$`

npm packages have `@`, `/`, etc. Sanitize them:

```typescript
function sanitizeToolName(name: string): string {
  return name
    .replace(/@/g, '')        // Remove @
    .replace(/\//g, '_')      // Replace / with _
    .replace(/[^a-zA-Z0-9_-]/g, '_');  // Replace other special chars
}

// "@myorg/web-scraper-scrapeTool" → "myorg_web_scraper-scrapeTool"
```

### System Prompt Engineering

The system prompt must explain the tool system:

```typescript
function buildSystemPrompt(tools: Record<string, Tool>): string {
  const toolList = Object.keys(tools).join(', ');

  return `You are an AI assistant with access to tools.

## Available Tools
${toolList}

## Tool Usage Rules

1. **Execute, don't describe**: When a user asks to use a tool, CALL IT. Don't just explain what it does.

2. **searchRegistry is for DISCOVERY**: Use it when the user needs a capability you don't have loaded. Example: User asks about image processing but no image tools are loaded.

3. **Tool names are sanitized**: The tool "@myorg/scraper-scrapeTool" appears as "myorg_scraper-scrapeTool".

4. **Some tools need API keys**: If a tool fails with auth errors, ask the user to provide the required environment variable.

5. **Multi-step is allowed**: You can call multiple tools in sequence. Search → Load → Execute is a valid pattern.

## When to Search vs Execute

- User says "scrape this website" → You have scrapeTool? Execute it. Don't have it? Search first.
- User says "what tools can help with images?" → Use searchRegistry to find options.
- User says "use the hello tool" → Execute it directly if loaded.
`;
}
```

---

## Execution & Sandboxing

### Why Sandbox?

Executing arbitrary npm packages is dangerous:
- Packages can access filesystem, network, env vars
- Malicious packages could exfiltrate data
- Even well-intentioned packages might have bugs

### Sandbox Architecture

Run a separate service (Railway, Fly.io, AWS Lambda) that:
1. Receives execution requests
2. Loads packages in isolated environment
3. Executes with timeout and resource limits
4. Returns only the output

```typescript
// Sandbox service (runs on Railway/Fly.io)
app.post('/execute-tool', async (req, res) => {
  const { packageName, exportName, version, params, env } = req.body;

  // Set env vars for this execution only
  const originalEnv = { ...process.env };
  Object.assign(process.env, env);

  try {
    // Dynamic import from ESM CDN
    const importUrl = `https://esm.sh/${packageName}@${version}`;
    const module = await import(importUrl);

    const tool = module[exportName] || module.default;
    if (!tool?.execute) {
      throw new Error(`No executable tool found at ${exportName}`);
    }

    // Execute with timeout
    const result = await Promise.race([
      tool.execute(params),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 30000)
      )
    ]);

    res.json({ success: true, output: result });

  } catch (error) {
    res.json({ success: false, error: error.message });

  } finally {
    // Restore original env
    process.env = originalEnv;
  }
});
```

### Health Tracking

Track tool reliability:

```typescript
enum HealthStatus {
  HEALTHY = 'HEALTHY',
  BROKEN = 'BROKEN',
  UNKNOWN = 'UNKNOWN'
}

// After successful execution
if (tool.executionHealth === 'BROKEN') {
  await db.tool.update({
    where: { id: tool.id },
    data: {
      executionHealth: 'HEALTHY',
      lastHealthCheck: new Date()
    }
  });
}

// After failed execution
await db.tool.update({
  where: { id: tool.id },
  data: {
    executionHealth: 'BROKEN',
    healthCheckError: error.message,
    lastHealthCheck: new Date()
  }
});
```

This auto-heals false positives and surfaces genuinely broken tools.

---

## Critical Nuances & Gotchas

### 1. Closure Traps with Cached Tools

```typescript
// BUG: API key captured at cache time
function createCachedTool(apiKey: string) {
  const tool = {
    execute: async (params) => {
      return await callAPI(params, apiKey);  // Stale!
    }
  };
  cache.set('myTool', tool);
}

// FIX: Lookup fresh values on each execution
function createCachedTool(conversationId: string) {
  const tool = {
    execute: async (params) => {
      const apiKey = getConversationEnv(conversationId).API_KEY;
      return await callAPI(params, apiKey);  // Fresh!
    }
  };
  cache.set('myTool', tool);
}
```

### 2. Race Conditions in Parallel Loading

```typescript
// BUG: Multiple requests load same tool simultaneously
const tool1 = loadTool('scraper');  // Starts loading
const tool2 = loadTool('scraper');  // Also starts loading (wasteful)

// FIX: Use loading promises as cache values
const loadingPromises = new Map<string, Promise<Tool>>();

async function loadTool(name: string): Promise<Tool> {
  if (cache.has(name)) return cache.get(name);

  if (!loadingPromises.has(name)) {
    loadingPromises.set(name, actuallyLoadTool(name).then(tool => {
      cache.set(name, tool);
      loadingPromises.delete(name);
      return tool;
    }));
  }

  return loadingPromises.get(name);
}
```

### 3. Token Budget Management

More tools = more tokens in system prompt. Be selective:

```typescript
// Don't load 50 tools because they matched the search
const MAX_DYNAMIC_TOOLS = 5;

const searchResults = await search({ query, limit: MAX_DYNAMIC_TOOLS });

// Consider dropping low-relevance tools
const relevantTools = searchResults.filter(t => t.score > 0.3);
```

### 4. The "Search Loop" Problem

Model keeps searching instead of executing:

```
User: "Scrape example.com"
Model: Let me search for scraping tools...
Model: Found some tools! Let me search for more options...
Model: Here are some alternatives, let me search again...
```

**Fix with explicit prompting:**

```
The searchRegistry tool is for DISCOVERY ONLY. Once you find a relevant tool,
STOP SEARCHING and USE IT. Do not search multiple times for the same capability.
```

### 5. Error Message Quality

Bad:
```json
{ "error": "Execution failed" }
```

Good:
```json
{
  "error": "Tool execution failed",
  "details": {
    "tool": "@myorg/scraper::scrapeTool",
    "phase": "execution",
    "message": "SCRAPER_API_KEY environment variable is required",
    "suggestion": "Please provide your API key in the settings panel"
  }
}
```

### 6. Timeout Handling

Different timeouts for different phases:

```typescript
// Tool loading: longer timeout (cold start, network)
const loadTimeout = 120000;  // 2 minutes

// Tool execution: depends on tool type
const defaultExecTimeout = 30000;   // 30 seconds
const longRunningTimeout = 300000;  // 5 minutes for scraping/AI tools

// Search: should be fast
const searchTimeout = 5000;  // 5 seconds
```

---

## Database Design

### Two-Model Approach: Package + Tool

```sql
-- Package-level metadata (npm info, category, env vars)
CREATE TABLE packages (
  id TEXT PRIMARY KEY,
  npm_package_name TEXT UNIQUE NOT NULL,
  npm_version TEXT NOT NULL,
  npm_downloads_last_month INTEGER,
  category TEXT NOT NULL,  -- 'web-scraping', 'data-processing', etc.
  env JSONB,               -- Package-level env requirements
  frameworks TEXT[],       -- ['vercel-ai', 'langchain']
  tier TEXT NOT NULL,      -- 'minimal' | 'rich'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tool-level metadata (individual exports)
CREATE TABLE tools (
  id TEXT PRIMARY KEY,
  package_id TEXT REFERENCES packages(id) ON DELETE CASCADE,
  export_name TEXT NOT NULL,
  description TEXT NOT NULL,
  parameters JSONB,
  returns JSONB,
  ai_agent JSONB,
  quality_score DECIMAL(3,2),
  import_health TEXT DEFAULT 'UNKNOWN',
  execution_health TEXT DEFAULT 'UNKNOWN',
  last_health_check TIMESTAMP,

  UNIQUE(package_id, export_name)
);

-- Indexes for search performance
CREATE INDEX idx_tools_quality ON tools(quality_score DESC);
CREATE INDEX idx_tools_health ON tools(execution_health);
CREATE INDEX idx_packages_category ON packages(category);
CREATE INDEX idx_packages_downloads ON packages(npm_downloads_last_month DESC);
```

### Why Separate Package and Tool?

1. **One package, many tools**: `@myorg/utils` might export 10 tools
2. **Package-level env**: API keys often apply to all tools in a package
3. **Independent health**: One broken tool shouldn't mark the whole package broken
4. **Efficient queries**: Search tools, join package info only when needed

---

## The Full Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. USER MESSAGE                                                          │
│    "Help me extract data from https://news.ycombinator.com"              │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 2. CHAT ENDPOINT RECEIVES REQUEST                                        │
│    - Extract user intent: "extract data from website"                    │
│    - Get recent context: ["I'm building a news aggregator"]              │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 3. AUTO-SEARCH REGISTRY                                                  │
│    Query: "extract data website" + context                               │
│    BM25 + quality scoring                                                │
│    Results: [scrapeTool (0.89), extractorTool (0.72), ...]              │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 4. DYNAMIC TOOL LOADING                                                  │
│    For each search result:                                               │
│    - Check cache → miss                                                  │
│    - Call sandbox: /load-and-describe                                    │
│    - Create AI SDK tool wrapper                                          │
│    - Cache wrapper (but not env vars!)                                   │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 5. MERGE TOOLS                                                           │
│    Static: { searchRegistry, helloTool }                                 │
│    Dynamic: { myorg_scraper_scrapeTool, ... }                           │
│    Combined: { searchRegistry, helloTool, myorg_scraper_scrapeTool }    │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 6. STREAM TO MODEL                                                       │
│    System: "You have these tools: ..."                                   │
│    Tools: combined toolset                                               │
│    Messages: conversation history                                        │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 7. MODEL DECIDES TO USE TOOL                                             │
│    "I'll use myorg_scraper_scrapeTool to extract the data"              │
│    Tool call: { url: "https://news.ycombinator.com" }                   │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 8. TOOL EXECUTION                                                        │
│    - Wrapper's execute() called                                          │
│    - Fresh env vars fetched for conversation                             │
│    - Request sent to sandbox service                                     │
│    - Sandbox loads package, executes, returns result                     │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 9. RESULT RETURNED TO MODEL                                              │
│    { title: "Hacker News", items: [...], metadata: {...} }              │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 10. MODEL GENERATES RESPONSE                                             │
│     "I've extracted the data from Hacker News. Here are the top          │
│      stories: 1. ... 2. ... 3. ..."                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Summary

Building a dynamic tool system requires:

1. **Schema design** - Rich metadata that helps both search and execution
2. **Smart search** - BM25 with quality boosting, not just substring matching
3. **Careful caching** - Cache tools, not credentials
4. **Sandboxed execution** - Never trust arbitrary packages
5. **Health tracking** - Know which tools are broken
6. **Clear prompting** - Tell the model when to search vs execute

The key insight: **tools are discovered at runtime based on user intent, not hardcoded at build time**. This makes agents more flexible and allows a growing ecosystem of tools without redeployment.

---

## Reference Implementation

- **Schema & validation**: `packages/types/src/tpmjs.ts`
- **Search API**: `apps/web/src/app/api/tools/search/route.ts`
- **Dynamic loading**: `apps/playground/src/lib/dynamic-tool-loader.ts`
- **Chat endpoint**: `apps/playground/src/app/api/chat/route.ts`
- **Tool execution**: `apps/web/src/lib/ai-agent/tool-executor-agent.ts`
