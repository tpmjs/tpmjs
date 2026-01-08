# TPMJS Executor for Vercel

Deploy your own TPMJS tool executor using **Vercel Sandbox** for secure, isolated code execution.

## Features

- **Secure Execution**: Tools run in isolated Vercel Sandbox VMs
- **Full Control**: Your infrastructure, your environment variables
- **Privacy**: No data passes through TPMJS servers
- **One-Click Deploy**: Deploy to Vercel in minutes

## One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tpmjs/tpmjs/tree/main/templates/vercel-executor&project-name=tpmjs-executor&repository-name=tpmjs-executor)

## How It Works

This executor uses [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox) to:

1. Create an isolated VM for each tool execution
2. Install the npm package in the sandbox
3. Execute the tool with your parameters
4. Return the result and destroy the sandbox

This provides secure, isolated execution without the limitations of Node.js serverless functions.

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
    "runtime": "vercel-sandbox",
    "region": "iad1",
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
    "packageName": "@tpmjs/hello",
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
  "executionTimeMs": 2345
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
# Install dependencies
npm install

# Login to Vercel (required for sandbox access)
vercel login

# Link to your Vercel project
vercel link

# Pull environment variables
vercel env pull

# Run development server
npm run dev

# Test the health endpoint
curl http://localhost:3000/api/health
```

**Note:** Vercel Sandbox requires authentication even in development. Run `vercel login` and `vercel link` first.

## Security

- Set `EXECUTOR_API_KEY` to require authentication for all requests
- Tools run in isolated VMs with no access to your Vercel project
- Each execution gets a fresh sandbox instance
- Sandboxes are destroyed after execution completes

## Pricing

Vercel Sandbox usage is billed based on compute time. See [Vercel Sandbox Pricing](https://vercel.com/docs/vercel-sandbox/pricing) for details.

- **Hobby**: 45 min max runtime
- **Pro**: 5 hour max runtime
- **Region**: Currently only available in `iad1`

## Support

- [TPMJS Custom Executors Documentation](https://tpmjs.com/docs/executors)
- [TPMJS Custom Executor Tutorial](https://tpmjs.com/docs/tutorials/custom-executor)
- [Vercel Sandbox Documentation](https://vercel.com/docs/vercel-sandbox)
- [GitHub Issues](https://github.com/tpmjs/tpmjs/issues)
