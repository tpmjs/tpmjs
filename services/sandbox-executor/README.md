# TPMJS Sandbox Executor Service

Isolated microservice for securely executing TPMJS npm packages using `isolated-vm`.

## Architecture

This service runs separately from the main Next.js application to provide:

- **Secure sandboxing** using V8 isolates
- **Resource limits** (128MB memory, 10s timeout)
- **Package caching** for faster subsequent executions
- **Isolation from main app** - no risk of compromising the web app

## API Endpoints

### POST /execute

Execute an npm package function.

**Request:**
```json
{
  "packageName": "@tpmjs/createblogpost",
  "functionName": "default",
  "params": {
    "topic": "TypeScript best practices",
    "length": "medium"
  }
}
```

**Response:**
```json
{
  "success": true,
  "output": "Generated blog post content...",
  "executionTimeMs": 1234,
  "logs": []
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "tpmjs-sandbox-executor",
  "version": "1.0.0",
  "memoryLimit": "128MB",
  "timeout": "10000ms"
}
```

### POST /cache/clear

Clear the npm package cache.

## Environment Variables

- `PORT` - Server port (default: 3000)
- `PACKAGE_CACHE_DIR` - Package cache directory (default: /tmp/.tpmjs-cache)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins (default: *)

## Deployment

### Railway

1. Initialize Railway project:
```bash
railway init
```

2. Link to existing project or create new:
```bash
railway link
```

3. Deploy:
```bash
railway up
```

4. Set environment variables:
```bash
railway variables set ALLOWED_ORIGINS=https://tpmjs.com,https://tpmjs-web.vercel.app
```

5. Get the service URL:
```bash
railway domain
```

### Local Development

```bash
npm install
npm run dev
```

Test locally:
```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "packageName": "@tpmjs/createblogpost",
    "params": {"topic": "TypeScript"}
  }'
```

## Security

- Runs in isolated V8 context
- 128MB memory limit per execution
- 10 second timeout
- No filesystem access from sandbox
- No network access from sandbox
- Packages cached in /tmp

## Integration with Next.js

Update the Next.js API route to call this service:

```typescript
// apps/web/src/app/api/tools/execute/[...slug]/route.ts

const SANDBOX_URL = process.env.SANDBOX_EXECUTOR_URL;

const response = await fetch(`${SANDBOX_URL}/execute`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    packageName,
    functionName: 'default',
    params
  })
});

const result = await response.json();
```

## Monitoring

Check logs:
```bash
railway logs
```

Monitor resource usage:
```bash
railway status
```
