# TPMJS Executor for Vercel

Deploy your own TPMJS tool executor using the **Deno runtime** on Vercel for secure, isolated code execution.

## Features

- **Native HTTP Imports**: Deno natively supports importing from esm.sh
- **Full Control**: Your infrastructure, your environment variables
- **Privacy**: No data passes through TPMJS servers
- **One-Click Deploy**: Deploy to Vercel in minutes

## One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tpmjs/tpmjs/tree/main/templates/vercel-executor&project-name=tpmjs-executor&repository-name=tpmjs-executor)

## How It Works

This executor uses the [Vercel Deno Runtime](https://github.com/vercel-community/deno) to:

1. Receive tool execution requests via POST `/api/execute-tool`
2. Dynamically import the npm package from esm.sh (Deno natively supports HTTP imports!)
3. Execute the tool with your parameters
4. Return the result

This provides the same execution model as the Railway executor, but deployed to your own Vercel account.

## API Endpoints

### GET /api/health

Check executor health status.

```bash
curl https://your-executor.vercel.app/api/health
```

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "info": {
    "runtime": "deno",
    "httpImports": true,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /api/execute-tool

Execute a TPMJS tool.

```bash
curl -X POST https://your-executor.vercel.app/api/execute-tool \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "packageName": "@anthropic-ai/tpmjs-hello",
    "name": "helloWorld",
    "version": "latest",
    "params": { "name": "World" }
  }'
```

**Response:**
```json
{
  "success": true,
  "output": "Hello, World!",
  "executionTimeMs": 234
}
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXECUTOR_API_KEY` | No | API key for authentication. If set, requests must include `Authorization: Bearer <key>` header. |

Add custom environment variables for your tools (e.g., `MY_API_KEY`, `DATABASE_URL`) in your Vercel project settings.

### Setting Up API Key Authentication

1. Go to your Vercel project settings
2. Add an environment variable: `EXECUTOR_API_KEY` with a secure random value
3. When configuring your executor in TPMJS, enter this key in the "API Key" field

## Connecting to TPMJS

1. Go to your TPMJS collection or agent settings
2. In "Executor Configuration", select "Custom Executor"
3. Enter your executor URL: `https://your-executor.vercel.app`
4. Enter your API key (if configured)
5. Click "Verify Connection" to test

## Local Development

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Run development server
vercel dev

# Test the health endpoint
curl http://localhost:3000/api/health
```

**Note:** Local development requires the Vercel CLI. Run `vercel login` first.

## Security

- Set `EXECUTOR_API_KEY` to require authentication for all requests
- Tools are loaded dynamically from esm.sh
- Each request gets fresh environment variable injection
- CORS headers allow cross-origin requests (configurable)

## How It Compares to TPMJS Default Executor

| Feature | TPMJS Default (Railway) | Your Vercel Executor |
|---------|------------------------|---------------------|
| Runtime | Deno on Railway | Deno on Vercel |
| Cost | Free (TPMJS hosted) | Your Vercel usage |
| Env Vars | Stored in TPMJS | Stored in your Vercel project |
| Privacy | Requests go through TPMJS | Direct to your executor |
| Control | Managed by TPMJS | Fully yours |

## Pricing

Vercel's free tier includes generous limits for serverless functions. See [Vercel Pricing](https://vercel.com/pricing) for details.

## Support

- [TPMJS Custom Executors Documentation](https://tpmjs.com/docs/executors)
- [TPMJS Custom Executor Tutorial](https://tpmjs.com/docs/tutorials/custom-executor)
- [Vercel Deno Runtime](https://github.com/vercel-community/deno)
- [GitHub Issues](https://github.com/tpmjs/tpmjs/issues)
