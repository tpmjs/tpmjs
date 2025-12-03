# Dynamic Tool Loading - Implementation Status

## ✅ Completed

### 1. Search Tool Package (`@tpmjs/search-registry`)
- ✅ Created package with AI SDK v6 JSON Schema format
- ✅ Connects to search API endpoint
- ✅ Returns tool metadata (packageName, exportName, version, importUrl)
- ✅ Fixed schema format (was using Zod, now uses jsonSchema)
- ✅ Location: `packages/tools/search-registry/`

### 2. Search API Endpoint (`/api/tools/search`)
- ✅ Implemented simple text-based search (BM25 had dependency issues)
- ✅ Searches by keywords in description, package name, keywords
- ✅ Returns tools with import URLs for esm.sh
- ✅ Location: `apps/web/src/app/api/tools/search/route.ts`

### 3. Pre-flight Tool Loading in Playground
- ✅ Automatic search on every user message
- ✅ Extracts user query from last message
- ✅ Calls searchTpmjsTools automatically
- ✅ Attempts to load discovered tools dynamically
- ✅ Location: `apps/playground/src/app/api/chat/route.ts`

### 4. Dynamic Tool Loader (Railway Service Approach)
- ✅ Updated to call Railway service instead of local imports
- ✅ Calls `/load-and-describe` endpoint to get tool schema
- ✅ Wraps tool with remote execution via `/execute-tool` endpoint
- ✅ Caches tool wrappers locally
- ✅ Location: `apps/playground/src/lib/dynamic-tool-loader.ts`

### 5. Documentation
- ✅ DYNAMIC_IMPORT_ISSUE.md - Comprehensive problem analysis
- ✅ RAILWAY_DYNAMIC_TOOL_LOADER.md - Railway implementation guide
- ✅ This file - Implementation status

## 🚧 Pending (Railway Service Implementation)

### Railway Service Endpoints Needed

You need to add these two endpoints to your existing Railway service:

#### 1. `POST /load-and-describe`

**Purpose**: Load a tool from esm.sh and return its schema

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
        "query": { "type": "string" }
      }
    }
  }
}
```

**Implementation Reference**: See `RAILWAY_DYNAMIC_TOOL_LOADER.md` for full code

#### 2. `POST /execute-tool`

**Purpose**: Execute a dynamically loaded tool with parameters

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
  "output": { "results": [...] },
  "executionTimeMs": 1234
}
```

**Implementation Reference**: See `RAILWAY_DYNAMIC_TOOL_LOADER.md` for full code

### Deployment Requirements

1. **Railway Service**:
   - Must run with `--experimental-network-imports` flag
   - Add to start command: `node --experimental-network-imports server.js`

2. **Environment Variables** (Vercel):
   ```bash
   RAILWAY_SERVICE_URL=https://your-railway-service.up.railway.app
   # or reuse existing:
   SANDBOX_EXECUTOR_URL=https://your-railway-service.up.railway.app
   ```

3. **Local Testing** (Railway service on port 3001):
   ```bash
   RAILWAY_SERVICE_URL=http://localhost:3001
   ```

## 🎯 Testing Checklist

Once Railway endpoints are deployed:

- [ ] Test `/load-and-describe` endpoint directly with curl
- [ ] Test `/execute-tool` endpoint directly with curl
- [ ] Test full flow in playground:
  - [ ] Ask: "search the web for latest AI news"
  - [ ] Verify pre-flight search finds tools
  - [ ] Verify tools load via Railway
  - [ ] Verify tool execution works
  - [ ] Check console logs for debugging info

## 📊 Current Flow

```
User: "search the web for latest AI news"
                ↓
    Chat API extracts query
                ↓
    Automatically calls searchTpmjsTools
                ↓
    Search API returns matching tools
     (packageName, exportName, version)
                ↓
    loadToolsBatch() called for each tool
                ↓
    For each tool:
      1. Check local cache
      2. If not cached:
         → POST to Railway: /load-and-describe
         ← Get back: description + inputSchema
      3. Create wrapper tool with:
         - description from Railway
         - inputSchema from Railway
         - execute() → calls Railway /execute-tool
      4. Cache wrapper locally
                ↓
    All tools available to agent
                ↓
    Agent calls tool (wrapper)
                ↓
    Wrapper → POST to Railway: /execute-tool
                ↓
    Railway imports from esm.sh and executes
                ↓
    Result returned to agent
                ↓
    Agent uses result to answer user
```

## 🔍 Debugging

Check console logs for:
- `📦 Loading from Railway` - Tool loading initiated
- `✅ Tool loaded from Railway` - Tool schema received
- `🚀 Executing ... remotely` - Tool execution initiated
- `✅ Tool executed successfully` - Tool execution complete
- `❌ Railway service error` - Connection failed
- `❌ Failed to load tool` - Import failed

## 📁 Files Modified

1. `packages/tools/search-registry/src/index.ts` - Search tool
2. `packages/tools/search-registry/package.json` - AI SDK version
3. `apps/web/src/app/api/tools/search/route.ts` - Search endpoint
4. `apps/playground/src/app/api/chat/route.ts` - Pre-flight search
5. `apps/playground/src/lib/dynamic-tool-loader.ts` - Railway integration
6. `apps/playground/next.config.ts` - Added urlImports (unused)
7. `apps/playground/src/lib/tool-loader.ts` - Removed firecrawl

## 🚀 Next Steps

1. **Deploy Railway endpoints** using code from `RAILWAY_DYNAMIC_TOOL_LOADER.md`
2. **Set environment variables** in Vercel
3. **Test locally** with Railway service running on localhost:3001
4. **Deploy to production** and test with real tools
5. **Monitor logs** for any issues

## 💡 Key Insights

- **Next.js Limitation**: Cannot do dynamic HTTP imports due to bundler
- **Railway Solution**: Plain Node.js with `--experimental-network-imports`
- **Caching Strategy**: Two-level cache (local wrapper + Railway module)
- **Execution Model**: Remote execution in Railway, not Next.js
- **Security**: Tools execute in Railway sandbox, not Vercel
- **Performance**: First load ~1-2s (import), cached loads <10ms

## 📚 Related Documentation

- `DYNAMIC_IMPORT_ISSUE.md` - Problem analysis and ChatGPT response
- `RAILWAY_DYNAMIC_TOOL_LOADER.md` - Full Railway implementation guide
- Plan file: `~/.claude/plans/jiggly-inventing-dragon.md`

---

**Status**: Ready for Railway deployment
**Blocker**: Railway `/load-and-describe` and `/execute-tool` endpoints need implementation
**ETA**: 30-60 minutes to implement Railway endpoints + test
