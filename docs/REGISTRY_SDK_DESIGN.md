# TPMJS Registry SDK Design

This document describes the design for `@tpmjs/registrySearch` and `@tpmjs/registryExecute` packages that allow any AI SDK v4+ project to access the entire TPMJS tool registry.

## Overview

The goal is to let developers add two tools to their existing AI SDK agent and instantly gain access to thousands of tools from the TPMJS registry:

```typescript
import { weatherTool } from './tools/weather';
import { registrySearchTool } from '@tpmjs/registrySearch';
import { registryExecuteTool } from '@tpmjs/registryExecute';

export const agent = new Agent({
  model: 'anthropic/claude-sonnet-4-20250514',
  instructions: 'You are a helpful assistant with access to many tools.',
  tools: {
    weather: weatherTool,              // Their own tools
    registrySearch: registrySearchTool,    // Search TPMJS registry
    registryExecute: registryExecuteTool,  // Execute any registry tool
  },
});
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      User's Agent                                │
│  ┌─────────────┐  ┌────────────────┐  ┌─────────────────────┐   │
│  │ weatherTool │  │ registrySearch │  │   registryExecute   │   │
│  └─────────────┘  └───────┬────────┘  └──────────┬──────────┘   │
└───────────────────────────┼──────────────────────┼──────────────┘
                            │                      │
                            ▼                      ▼
                  ┌─────────────────┐   ┌─────────────────────────┐
                  │  TPMJS Search   │   │   Railway Executor      │
                  │     API         │   │   (Sandboxed Deno)      │
                  └─────────────────┘   └─────────────────────────┘
                            │                      │
                            ▼                      ▼
                  ┌─────────────────┐   ┌─────────────────────────┐
                  │  Tool Registry  │   │   esm.sh (CDN)          │
                  │   (Postgres)    │   │   Dynamic imports       │
                  └─────────────────┘   └─────────────────────────┘
```

## Package Design

Two separate packages so users can install only what they need:

```
@tpmjs/registrySearch   - Search the TPMJS registry for tools
@tpmjs/registryExecute  - Execute any tool from the registry
```

## Environment Variables

Both packages support self-hosted registries via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `TPMJS_API_URL` | `https://tpmjs.com` | Base URL for the registry API |
| `TPMJS_EXECUTOR_URL` | `https://executor.tpmjs.com` | URL for the sandbox executor |

This allows users to run their own TPMJS registry and executor.

## Tool Definitions

### 1. `@tpmjs/registrySearch`

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const TPMJS_API_URL = process.env.TPMJS_API_URL || 'https://tpmjs.com';

export const registrySearchTool = tool({
  description: `Search the TPMJS tool registry to discover available tools.
Use this when you need to find a tool for a specific task.
Returns tool metadata including name, description, required env vars, and how to execute it.`,

  parameters: z.object({
    query: z.string().describe('Search query describing what you want to do'),
    category: z.enum([
      'search',
      'code',
      'data',
      'media',
      'communication',
      'productivity',
      'finance',
      'ai-ml',
      'devops',
      'other'
    ]).optional().describe('Filter by category'),
    limit: z.number().min(1).max(20).default(5).describe('Max results to return'),
  }),

  execute: async ({ query, category, limit }) => {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
      ...(category && { category }),
    });

    const response = await fetch(`${TPMJS_API_URL}/api/tools/search?${params}`);
    const data = await response.json();

    return {
      query,
      matchCount: data.data.length,
      tools: data.data.map((tool: any) => ({
        // Unique identifier for registryExecuteTool
        toolId: `${tool.package.npmPackageName}::${tool.exportName}`,

        // Human-readable info
        name: tool.exportName,
        package: tool.package.npmPackageName,
        description: tool.description,
        category: tool.category,

        // Execution requirements
        requiredEnvVars: tool.env?.filter((e: any) => e.required).map((e: any) => e.name) || [],

        // Quality indicators
        healthStatus: tool.executionHealth,
        qualityScore: tool.qualityScore,
      })),
    };
  },
});
```

### 2. `@tpmjs/registryExecute`

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const TPMJS_API_URL = process.env.TPMJS_API_URL || 'https://tpmjs.com';
const TPMJS_EXECUTOR_URL = process.env.TPMJS_EXECUTOR_URL || 'https://executor.tpmjs.com';

export const registryExecuteTool = tool({
  description: `Execute a tool from the TPMJS registry.
Use registrySearchTool first to find the toolId, then call this with the toolId and parameters.
The tool runs in a secure sandbox - you don't need to install anything.`,

  parameters: z.object({
    toolId: z.string().describe('Tool identifier from registrySearchTool (format: "package::exportName")'),
    params: z.record(z.any()).describe('Parameters to pass to the tool'),
    env: z.record(z.string()).optional().describe('Environment variables (API keys) if required'),
  }),

  execute: async ({ toolId, params, env }) => {
    const [packageName, exportName] = toolId.split('::');

    if (!packageName || !exportName) {
      throw new Error(`Invalid toolId format. Expected "package::exportName", got "${toolId}"`);
    }

    // Get tool metadata to find version and importUrl
    const metaResponse = await fetch(
      `${TPMJS_API_URL}/api/tools?package=${encodeURIComponent(packageName)}&export=${encodeURIComponent(exportName)}`
    );
    const metaData = await metaResponse.json();
    const toolMeta = metaData.data?.[0];

    if (!toolMeta) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    // Execute via sandbox executor
    const response = await fetch(`${TPMJS_EXECUTOR_URL}/execute-tool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageName,
        exportName,
        version: toolMeta.package.npmVersion,
        importUrl: toolMeta.importUrl || `https://esm.sh/${packageName}@${toolMeta.package.npmVersion}`,
        params,
        env: env || {},
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Tool execution failed');
    }

    return {
      toolId,
      executionTimeMs: result.executionTimeMs,
      output: result.output,
    };
  },
});
```

## Usage Examples

### Basic Usage

```typescript
import { Agent } from 'ai';
import { registrySearchTool } from '@tpmjs/registrySearch';
import { registryExecuteTool } from '@tpmjs/registryExecute';

const agent = new Agent({
  model: 'anthropic/claude-sonnet-4-20250514',
  tools: {
    registrySearch: registrySearchTool,
    registryExecute: registryExecuteTool,
  },
});

// User: "Search the web for latest AI news"
// Agent:
//   1. Calls registrySearch({ query: "web search" })
//   2. Finds @exalabs/ai-sdk::webSearch
//   3. Calls registryExecute({
//        toolId: "@exalabs/ai-sdk::webSearch",
//        params: { query: "latest AI news" },
//        env: { EXA_API_KEY: "..." }
//      })
//   4. Returns results to user
```

### With Their Own Tools

```typescript
import { Agent } from 'ai';
import { registrySearchTool } from '@tpmjs/registrySearch';
import { registryExecuteTool } from '@tpmjs/registryExecute';
import { weatherTool } from './tools/weather';
import { databaseTool } from './tools/database';

const agent = new Agent({
  model: 'anthropic/claude-sonnet-4-20250514',
  instructions: `You are a helpful assistant.

For common tasks, use the built-in tools (weather, database).
For anything else, search the TPMJS registry to find appropriate tools.`,

  tools: {
    // Their custom tools
    weather: weatherTool,
    database: databaseTool,

    // TPMJS registry access
    registrySearch: registrySearchTool,
    registryExecute: registryExecuteTool,
  },
});
```

### Self-Hosted Registry

```typescript
// Set environment variables for your own registry
// TPMJS_API_URL=https://registry.mycompany.com
// TPMJS_EXECUTOR_URL=https://executor.mycompany.com

import { registrySearchTool } from '@tpmjs/registrySearch';
import { registryExecuteTool } from '@tpmjs/registryExecute';

// Tools will automatically use your self-hosted URLs
const agent = new Agent({
  model: 'anthropic/claude-sonnet-4-20250514',
  tools: {
    registrySearch: registrySearchTool,
    registryExecute: registryExecuteTool,
  },
});
```

## API Endpoints Required

### 1. Search API (existing, may need updates)

```
GET https://tpmjs.com/api/tools/search?q=web+search&limit=5&category=search
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "exportName": "webSearch",
      "description": "Search the web...",
      "category": "search",
      "executionHealth": "HEALTHY",
      "qualityScore": 0.9,
      "env": [
        { "name": "EXA_API_KEY", "required": true }
      ],
      "package": {
        "npmPackageName": "@exalabs/ai-sdk",
        "npmVersion": "1.0.5"
      },
      "importUrl": "https://esm.sh/@exalabs/ai-sdk@1.0.5"
    }
  ]
}
```

### 2. Execute API (existing Railway executor)

```
POST https://executor.tpmjs.com/execute-tool
```

Request:
```json
{
  "packageName": "@exalabs/ai-sdk",
  "exportName": "webSearch",
  "version": "1.0.5",
  "importUrl": "https://esm.sh/@exalabs/ai-sdk@1.0.5",
  "params": { "query": "latest AI news" },
  "env": { "EXA_API_KEY": "..." }
}
```

Response:
```json
{
  "success": true,
  "output": { ... },
  "executionTimeMs": 1234
}
```

## Package Structure

### @tpmjs/registrySearch

```
packages/registrySearch/
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts           # Exports registrySearchTool
└── README.md
```

### @tpmjs/registryExecute

```
packages/registryExecute/
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts           # Exports registryExecuteTool
└── README.md
```

### package.json (@tpmjs/registrySearch)

```json
{
  "name": "@tpmjs/registrySearch",
  "version": "0.1.0",
  "description": "Search the TPMJS tool registry from any AI SDK agent",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "keywords": ["tpmjs", "tpmjs-tool", "ai-sdk", "vercel-ai", "tools", "registry", "search"],
  "peerDependencies": {
    "ai": "^4.0.0",
    "zod": "^3.0.0"
  }
}
```

### package.json (@tpmjs/registryExecute)

```json
{
  "name": "@tpmjs/registryExecute",
  "version": "0.1.0",
  "description": "Execute tools from the TPMJS registry in any AI SDK agent",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "keywords": ["tpmjs", "tpmjs-tool", "ai-sdk", "vercel-ai", "tools", "registry", "execute"],
  "peerDependencies": {
    "ai": "^4.0.0",
    "zod": "^3.0.0"
  }
}
```

## Security Considerations

1. **Sandboxed Execution**: All tools run in the Railway Deno sandbox, not in the user's process
2. **No Code Injection**: Users can't execute arbitrary code, only registered tools
3. **API Key Isolation**: Keys are passed per-request, not stored
4. **Health Checks**: Only HEALTHY tools should be returned in search results by default

## Next Steps

1. [ ] Create `packages/registrySearch` directory
2. [ ] Create `packages/registryExecute` directory
3. [ ] Implement `registrySearchTool`
4. [ ] Implement `registryExecuteTool`
5. [ ] Add search API endpoint if not exists
6. [ ] Write README with examples for each package
7. [ ] Publish to npm
8. [ ] Create demo agent using the SDK

## Future Enhancements

1. **Tool Recommendations**: Based on conversation context, proactively suggest tools
2. **Tool Chaining**: Pre-built workflows combining multiple tools
3. **Local Caching**: Cache tool metadata for faster searches
4. **Type Generation**: Generate TypeScript types for popular tools
5. **Usage Analytics**: Track which tools are used most (anonymized)
6. **Rate Limiting**: Add rate limiting when needed
