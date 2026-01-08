# TPMJS Executor Template

Deploy your own executor for running TPMJS tools on Vercel.

## One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tpmjs/tpmjs/tree/main/templates/vercel-executor&project-name=tpmjs-executor&repository-name=tpmjs-executor)

## What is an Executor?

An executor is a service that runs TPMJS tools. By default, TPMJS uses a shared executor, but you can deploy your own for:

- **Full control**: Run tools on your own infrastructure
- **Custom environment**: Inject your own environment variables and secrets
- **Privacy**: Keep tool execution data on your own servers
- **Performance**: Deploy in regions closest to your users

## API Endpoints

### POST /api/execute-tool

Execute a TPMJS tool.

**Request:**
```json
{
  "packageName": "@tpmjs/hello",
  "name": "helloWorld",
  "version": "latest",
  "params": { "name": "World" },
  "env": { "MY_SECRET": "value" }
}
```

**Response:**
```json
{
  "success": true,
  "output": "Hello, World!",
  "executionTimeMs": 123
}
```

### GET /api/health

Check executor health status.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "info": {
    "runtime": "vercel-serverless",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXECUTOR_API_KEY` | No | API key for authentication. If set, requests must include `Authorization: Bearer <key>` header. |

### Setting Up API Key Authentication

1. Go to your Vercel project settings
2. Add an environment variable: `EXECUTOR_API_KEY` with a secure random value
3. When configuring your executor in TPMJS, enter this key in the "API Key" field

## How It Works

1. TPMJS sends a request to your executor with package name, tool name, and parameters
2. The executor dynamically imports the package from [esm.sh](https://esm.sh)
3. The tool's `execute()` function is called with the provided parameters
4. The result is returned to TPMJS

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Test the health endpoint
curl http://localhost:3000/api/health

# Test tool execution
curl -X POST http://localhost:3000/api/execute-tool \
  -H "Content-Type: application/json" \
  -d '{"packageName":"@anthropic-ai/tpmjs-hello","name":"helloWorld","params":{"name":"Test"}}'
```

## Security Considerations

- Always set `EXECUTOR_API_KEY` in production to prevent unauthorized access
- The executor runs tools in a serverless environment with limited capabilities
- Environment variables injected via `env` are available only during execution
- Tools are imported from esm.sh, a trusted CDN for npm packages

## Support

- [TPMJS Documentation](https://tpmjs.com/docs)
- [Executor Documentation](https://tpmjs.com/docs/executors)
- [GitHub Issues](https://github.com/tpmjs/tpmjs/issues)
