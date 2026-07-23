# TPMJS Executor for Unsandbox

Deploy your own TPMJS tool executor using **Unsandbox** for secure, isolated code execution.

## Features

- **Secure Execution**: Tools run in isolated Unsandbox containers
- **Full Control**: Your infrastructure, your environment variables
- **Privacy**: No data passes through TPMJS servers
- **One-Command Deploy**: Deploy with a single CLI command
- **Always-On**: Services stay running with automatic HTTPS

## One-Command Deploy

```bash
# Install the Unsandbox CLI (if not already installed)
curl -fsSL https://unsandbox.com/install.sh | bash

# Deploy the TPMJS executor
un service --name tpmjs-executor --ports 80 -n semitrusted \
  --bootstrap "curl -fsSL https://raw.githubusercontent.com/tpmjs/tpmjs/main/templates/unsandbox-executor/executor.js -o /root/executor.js && node /root/executor.js"
```

Your executor will be available at: `https://tpmjs-executor.on.unsandbox.com`

## How It Works

This executor runs directly in an Unsandbox container to:

1. Receive tool execution requests via HTTP
2. Install the npm package in an isolated directory
3. Execute the tool with your parameters
4. Return the result and cleanup

Since Unsandbox containers are already isolated, no additional nested sandbox layer is required.

## API Endpoints

### GET /api/health

Check executor health status.

```bash
curl https://tpmjs-executor.on.unsandbox.com/api/health
```

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "info": {
    "runtime": "unsandbox",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /api/execute-tool

Execute a TPMJS tool.

```bash
curl -X POST https://tpmjs-executor.on.unsandbox.com/api/execute-tool \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "packageName": "@tpmjs/hello",
    "name": "helloWorldTool",
    "version": "latest",
    "params": { "includeTimestamp": true }
  }'
```

**Response:**
```json
{
  "success": true,
  "output": {
    "message": "Hello, World!",
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "executionTimeMs": 2345
}
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXECUTOR_API_KEY` | No | API key for authentication. If set, requests must include `Authorization: Bearer <key>` header. |

### Setting Up API Key Authentication

Deploy with an API key for secure access:

```bash
un service --name tpmjs-executor --ports 80 -n semitrusted \
  -e EXECUTOR_API_KEY=your-secure-random-key \
  --bootstrap "curl -fsSL https://raw.githubusercontent.com/tpmjs/tpmjs/main/templates/unsandbox-executor/executor.js -o /root/executor.js && node /root/executor.js"
```

### Adding Tool Environment Variables

Pass environment variables that your tools need:

```bash
un service --name tpmjs-executor --ports 80 -n semitrusted \
  -e EXECUTOR_API_KEY=your-key \
  -e OPENAI_API_KEY=sk-xxx \
  -e DATABASE_URL=postgres://... \
  --bootstrap "curl -fsSL https://raw.githubusercontent.com/tpmjs/tpmjs/main/templates/unsandbox-executor/executor.js -o /root/executor.js && node /root/executor.js"
```

Or use an env file:

```bash
un service --name tpmjs-executor --ports 80 -n semitrusted \
  --env-file .env \
  --bootstrap "curl -fsSL https://raw.githubusercontent.com/tpmjs/tpmjs/main/templates/unsandbox-executor/executor.js -o /root/executor.js && node /root/executor.js"
```

## Connecting to TPMJS

1. Go to your TPMJS collection or agent settings
2. In "Executor Configuration", select "Custom Executor"
3. Enter your executor URL: `https://tpmjs-executor.on.unsandbox.com`
4. Enter your API key (if configured)
5. Click "Verify Connection" to test

## Local Development

You can run the executor locally for testing:

```bash
# Clone the repository
git clone https://github.com/tpmjs/tpmjs.git
cd tpmjs/templates/unsandbox-executor

# Run the executor locally
PORT=3000 node executor.js

# Test the health endpoint
curl http://localhost:3000/api/health

# Test tool execution
curl -X POST http://localhost:3000/api/execute-tool \
  -H "Content-Type: application/json" \
  -d '{
    "packageName": "@tpmjs/hello",
    "name": "helloWorldTool",
    "params": {}
  }'
```

## Managing Your Service

### View Logs

```bash
un service --logs tpmjs-executor
```

### Redeploy

```bash
un service --redeploy tpmjs-executor
```

### Freeze/Unfreeze (Save Costs)

```bash
# Freeze when not in use
un service --freeze tpmjs-executor

# Unfreeze when needed
un service --unfreeze tpmjs-executor
```

### Scale Resources

```bash
# Scale up to 4 vCPU, 8GB RAM
un service --resize tpmjs-executor --vcpu 4
```

### Destroy

```bash
un service --destroy tpmjs-executor
```

## Security

- Set `EXECUTOR_API_KEY` to require authentication for all requests
- Tools run in isolated Unsandbox containers
- Each execution uses a fresh temporary directory
- Network access is controlled by Unsandbox's semitrusted mode
- All environment variables are stored encrypted

## Pricing

Unsandbox services are billed based on uptime. See [Unsandbox Pricing](https://unsandbox.com/pricing) for details.

- Services include automatic HTTPS via `*.on.unsandbox.com`
- Can be frozen when not in use to reduce costs
- Support for auto-unfreeze on HTTP request

## Advanced: Custom Domains

Add a custom domain to your executor:

```bash
un service --name tpmjs-executor --ports 80 -n semitrusted \
  --domains executor.yourdomain.com \
  --bootstrap "curl -fsSL https://raw.githubusercontent.com/tpmjs/tpmjs/main/templates/unsandbox-executor/executor.js -o /root/executor.js && node /root/executor.js"
```

Then add a CNAME record pointing `executor.yourdomain.com` to your service's Unsandbox domain.

## Comparison: Unsandbox vs Vercel

| Feature | Unsandbox | Vercel |
|---------|-----------|--------|
| Isolation | Container-level | VM-level (Sandbox) |
| Always-on | Yes | Serverless (cold starts) |
| Pricing | Per uptime | Per compute time |
| Max runtime | Unlimited | 45min (Hobby) / 5hr (Pro) |
| Network | Full (semitrusted) | Full |
| Custom domains | Yes | Yes |
| Deploy method | CLI | One-click button |

## Support

- [TPMJS Custom Executors Documentation](https://tpmjs.com/docs/executors)
- [Unsandbox Documentation](https://unsandbox.com/docs)
- [GitHub Issues](https://github.com/tpmjs/tpmjs/issues)
