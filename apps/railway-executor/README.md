# Railway Dynamic Tool Executor

Dynamic tool executor service that runs with `--experimental-network-imports` to support loading npm packages from esm.sh at runtime.

## Features

- 🔥 **Dynamic imports** from esm.sh
- 💾 **Module caching** for fast repeated loads
- 🛡️ **Validation** of AI SDK tool structure
- 🚀 **Remote execution** of tools with parameters

## Endpoints

### `GET /health`
Health check and cache statistics

### `POST /load-and-describe`
Load a tool from esm.sh and return its schema

**Request:**
```json
{
  "packageName": "firecrawl-aisdk",
  "exportName": "webSearchTool",
  "version": "0.7.2",
  "importUrl": "https://esm.sh/firecrawl-aisdk@0.7.2"
}
```

**Response:**
```json
{
  "success": true,
  "tool": {
    "exportName": "webSearchTool",
    "description": "Search the web using Firecrawl",
    "inputSchema": { ... }
  }
}
```

### `POST /execute-tool`
Execute a tool with parameters

**Request:**
```json
{
  "packageName": "firecrawl-aisdk",
  "exportName": "webSearchTool",
  "version": "0.7.2",
  "params": {
    "query": "latest AI news"
  }
}
```

**Response:**
```json
{
  "success": true,
  "output": { ... },
  "executionTimeMs": 1234
}
```

### `POST /cache/clear`
Clear the module cache

### `GET /cache/stats`
Get cache statistics

## Local Development

```bash
# Install dependencies
npm install

# Start server
npm start

# Server runs on http://localhost:3001
```

## Railway Deployment

This service is designed to run on Railway.

### Deploy Steps

1. Initialize Railway in this directory:
```bash
cd apps/railway-executor
railway init
```

2. Link to your Railway project:
```bash
railway link
```

3. Deploy:
```bash
railway up
```

4. Railway will automatically:
   - Detect Node.js
   - Run `npm install`
   - Execute `npm start` (which includes `--experimental-network-imports`)

### Environment Variables

No environment variables required for basic operation. Optional:

- `PORT` - Server port (Railway sets this automatically)
- `NODE_ENV` - Set to `production` in Railway

## Testing

### Test health endpoint:
```bash
curl http://localhost:3001/health
```

### Test tool loading:
```bash
curl -X POST http://localhost:3001/load-and-describe \
  -H "Content-Type: application/json" \
  -d '{
    "packageName": "@tpmjs/hello",
    "exportName": "helloWorldTool",
    "version": "0.1.0"
  }'
```

### Test tool execution:
```bash
curl -X POST http://localhost:3001/execute-tool \
  -H "Content-Type: application/json" \
  -d '{
    "packageName": "@tpmjs/hello",
    "exportName": "helloWorldTool",
    "version": "0.1.0",
    "params": {}
  }'
```

## Integration with Playground

The playground app calls this service to load and execute tools dynamically.

Set in playground environment:
```bash
RAILWAY_SERVICE_URL=https://your-service.up.railway.app
```

Or use existing:
```bash
SANDBOX_EXECUTOR_URL=https://your-service.up.railway.app
```
