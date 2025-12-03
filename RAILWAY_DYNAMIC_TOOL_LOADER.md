# Railway Service - Dynamic Tool Loader Implementation

## Overview

This document describes the Railway service implementation needed to support dynamic tool loading from esm.sh in the TPMJS playground.

## Why Railway Service?

Next.js/Turbopack intercepts all `import()` calls and tries to resolve them through its module graph. HTTP URLs like `https://esm.sh/...` are not supported.

**Solution**: Use a plain Node.js service on Railway that:
- Runs with `--experimental-network-imports` flag
- Can dynamically import from HTTP URLs (esm.sh)
- Executes tool functions and returns results
- Is already set up for existing ToolPlayground

## New Endpoint Required

### `POST /load-and-describe`

**Purpose**: Dynamically import a tool package and return its AI SDK tool definition (description, schema) without executing it.

**Request**:
```json
{
  "packageName": "firecrawl-aisdk",
  "exportName": "webSearchTool",
  "version": "0.7.2",
  "importUrl": "https://esm.sh/firecrawl-aisdk@0.7.2"
}
```

**Response**:
```json
{
  "success": true,
  "tool": {
    "exportName": "webSearchTool",
    "description": "Search the web using Firecrawl",
    "inputSchema": {
      "type": "object",
      "properties": {
        "query": { "type": "string", "description": "Search query" }
      },
      "required": ["query"]
    }
  }
}
```

**Implementation** (pseudo-code for Railway service):

```javascript
// server.js (Railway service)
import express from 'express';

const app = express();
app.use(express.json());

// Cache for imported modules
const moduleCache = new Map();

app.post('/load-and-describe', async (req, res) => {
  const { packageName, exportName, version, importUrl } = req.body;

  const cacheKey = `${packageName}::${exportName}`;

  try {
    let toolModule;

    // Check cache first
    if (moduleCache.has(cacheKey)) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      toolModule = moduleCache.get(cacheKey);
    } else {
      // Dynamic import from esm.sh
      const url = importUrl || `https://esm.sh/${packageName}@${version}`;
      console.log(`📦 Importing: ${url}`);

      const module = await import(url);
      toolModule = module[exportName];

      if (!toolModule) {
        return res.status(404).json({
          success: false,
          error: `Export "${exportName}" not found in module`
        });
      }

      // Validate it's an AI SDK tool
      if (!toolModule.description || !toolModule.execute) {
        return res.status(400).json({
          success: false,
          error: `Invalid AI SDK tool structure`
        });
      }

      // Cache it
      moduleCache.set(cacheKey, toolModule);
    }

    // Extract tool definition (description + schema)
    // AI SDK v6 tools have: description, inputSchema, execute
    res.json({
      success: true,
      tool: {
        exportName,
        description: toolModule.description,
        inputSchema: toolModule.inputSchema || toolModule.parameters?.shape || {},
      }
    });
  } catch (error) {
    console.error('Failed to load tool:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Railway tool loader running on port ${PORT}`);
});
```

**Railway Deployment**:
```bash
# Start command in Railway settings:
node --experimental-network-imports server.js

# Or in package.json:
{
  "scripts": {
    "start": "node --experimental-network-imports server.js"
  }
}
```

## Modified Endpoint: `POST /execute-tool`

**Purpose**: Execute a dynamically loaded tool with parameters.

**Request**:
```json
{
  "packageName": "firecrawl-aisdk",
  "exportName": "webSearchTool",
  "version": "0.7.2",
  "importUrl": "https://esm.sh/firecrawl-aisdk@0.7.2",
  "params": {
    "query": "latest AI news"
  }
}
```

**Response**:
```json
{
  "success": true,
  "output": {
    "results": [...]
  },
  "executionTimeMs": 1234
}
```

**Implementation** (pseudo-code):

```javascript
app.post('/execute-tool', async (req, res) => {
  const { packageName, exportName, version, importUrl, params } = req.body;

  const cacheKey = `${packageName}::${exportName}`;
  const startTime = Date.now();

  try {
    let toolModule;

    // Check cache or import
    if (moduleCache.has(cacheKey)) {
      toolModule = moduleCache.get(cacheKey);
    } else {
      const url = importUrl || `https://esm.sh/${packageName}@${version}`;
      const module = await import(url);
      toolModule = module[exportName];

      if (!toolModule || !toolModule.execute) {
        return res.status(404).json({
          success: false,
          error: 'Tool not found or invalid'
        });
      }

      moduleCache.set(cacheKey, toolModule);
    }

    // Execute the tool
    const result = await toolModule.execute(params);

    res.json({
      success: true,
      output: result,
      executionTimeMs: Date.now() - startTime
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      executionTimeMs: Date.now() - startTime
    });
  }
});
```

## Integration with Playground

### 1. Update `dynamic-tool-loader.ts`

Replace local dynamic imports with Railway service calls:

```typescript
// apps/playground/src/lib/dynamic-tool-loader.ts

const RAILWAY_SERVICE_URL = process.env.RAILWAY_SERVICE_URL || 'http://localhost:3001';

export async function loadToolDynamically(
  packageName: string,
  exportName: string,
  version: string,
  importUrl?: string
): Promise<any | null> {
  const cacheKey = getCacheKey(packageName, exportName);

  // Check local cache first
  if (moduleCache.has(cacheKey)) {
    console.log(`✅ Cache hit: ${cacheKey}`);
    return moduleCache.get(cacheKey);
  }

  try {
    console.log(`📦 Loading from Railway: ${packageName}/${exportName}`);

    // Call Railway service to load and describe tool
    const response = await fetch(`${RAILWAY_SERVICE_URL}/load-and-describe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageName,
        exportName,
        version,
        importUrl,
      }),
    });

    if (!response.ok) {
      console.error(`❌ Railway service error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.success) {
      console.error(`❌ Failed to load tool: ${data.error}`);
      return null;
    }

    // Create a tool wrapper that executes remotely
    const tool = {
      description: data.tool.description,
      inputSchema: data.tool.inputSchema,
      execute: async (params: any) => {
        console.log(`🚀 Executing ${packageName}/${exportName} remotely`);

        const execResponse = await fetch(`${RAILWAY_SERVICE_URL}/execute-tool`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageName,
            exportName,
            version,
            importUrl,
            params,
          }),
        });

        const result = await execResponse.json();

        if (!result.success) {
          throw new Error(result.error || 'Tool execution failed');
        }

        return result.output;
      },
    };

    // Cache the wrapper
    moduleCache.set(cacheKey, tool);
    console.log(`✅ Loaded and cached: ${cacheKey}`);

    return tool;
  } catch (error) {
    console.error(`❌ Failed to load ${packageName}#${exportName}:`, error);
    return null;
  }
}
```

### 2. Environment Variables

Add to `.env.local`:
```bash
RAILWAY_SERVICE_URL=https://your-railway-service.up.railway.app
```

Or for local testing with Railway running locally:
```bash
RAILWAY_SERVICE_URL=http://localhost:3001
```

## Testing Locally

### Terminal 1: Run Railway service locally
```bash
cd railway-service
node --experimental-network-imports server.js
```

### Terminal 2: Run playground
```bash
cd tpmjs
pnpm dev --filter=@tpmjs/playground
```

### Test the flow:
```bash
# Test Railway service directly
curl -X POST http://localhost:3001/load-and-describe \
  -H "Content-Type: application/json" \
  -d '{
    "packageName": "firecrawl-aisdk",
    "exportName": "webSearchTool",
    "version": "0.7.2"
  }'

# Then test via playground UI
# Navigate to http://localhost:3000/playground
# Ask: "search the web for latest AI news"
```

## Deployment Checklist

- [ ] Create Railway service with Node.js
- [ ] Add `--experimental-network-imports` flag to start command
- [ ] Deploy `/load-and-describe` endpoint
- [ ] Deploy `/execute-tool` endpoint (or modify existing `/execute`)
- [ ] Set `RAILWAY_SERVICE_URL` in Vercel environment variables
- [ ] Test with real tools from TPMJS registry
- [ ] Monitor Railway logs for import errors

## Benefits

1. ✅ **Works around Next.js limitations** - Imports happen in plain Node
2. ✅ **Reuses existing Railway infrastructure** - No new service needed
3. ✅ **Caching on both sides** - Local cache + Railway cache
4. ✅ **Security** - Tools execute in Railway sandbox, not Next.js
5. ✅ **Scalability** - Railway handles the heavy lifting

## Next Steps

1. Implement Railway service endpoints
2. Update `dynamic-tool-loader.ts` to use Railway
3. Test locally
4. Deploy to Railway + Vercel
5. Celebrate dynamic tool loading! 🎉
