# TPMJS Executor for Railway

Deploy your own TPMJS tool executor on **Railway** for reliable, always-on execution.

## Features

- **One-Click Deploy**: Deploy to Railway in seconds
- **Always-On**: No cold starts, instant tool execution
- **Full Control**: Your infrastructure, your environment variables
- **Privacy**: No data passes through TPMJS servers
- **Auto-Scaling**: Railway handles scaling automatically
- **Free Tier**: $5/month free credit included

## One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/tpmjs-executor?referralCode=tpmjs)

Or deploy manually:

```bash
# Clone this template
git clone https://github.com/tpmjs/tpmjs.git
cd tpmjs/templates/railway-executor

# Create a new Railway project
railway init

# Deploy
railway up
```

Your executor will be available at: `https://your-project.up.railway.app`

## How It Works

This executor runs as an always-on Node.js service on Railway:

1. Receives tool execution requests via HTTP
2. Installs the npm package in an isolated directory
3. Executes the tool with your parameters
4. Returns the result and cleans up

## API Endpoints

### GET /health

Check executor health status.

```bash
curl https://your-executor.up.railway.app/health
```

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "info": {
    "runtime": "railway",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "region": "us-west1"
  }
}
```

### POST /execute-tool

Execute a TPMJS tool.

```bash
curl -X POST https://your-executor.up.railway.app/execute-tool \
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

1. Go to your Railway project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Add `EXECUTOR_API_KEY` with a secure random value
5. The service will automatically redeploy

### Adding Tool Environment Variables

Pass environment variables that your tools need:

1. In Railway dashboard, go to "Variables"
2. Add your variables (e.g., `OPENAI_API_KEY`, `DATABASE_URL`)
3. These will be available during tool execution

Or use the Railway CLI:

```bash
railway variables set EXECUTOR_API_KEY=your-key
railway variables set OPENAI_API_KEY=sk-xxx
railway variables set DATABASE_URL=postgres://...
```

## Connecting to TPMJS

1. Go to your TPMJS collection or agent settings
2. In "Executor Configuration", select "Custom Executor"
3. Enter your executor URL: `https://your-project.up.railway.app`
4. Enter your API key (if configured)
5. Click "Verify Connection" to test

## Local Development

```bash
# Clone the repository
git clone https://github.com/tpmjs/tpmjs.git
cd tpmjs/templates/railway-executor

# Run locally
PORT=3000 node index.js

# Or with an API key
EXECUTOR_API_KEY=test-key PORT=3000 node index.js

# Test health endpoint
curl http://localhost:3000/health

# Test tool execution
curl -X POST http://localhost:3000/execute-tool \
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
railway logs
```

Or view in the Railway dashboard under "Deployments" → select deployment → "Logs"

### Redeploy

```bash
railway up
```

Or push to your connected GitHub repository for automatic deployments.

### Scale Resources

1. Go to Railway dashboard
2. Click on your service
3. Go to "Settings" tab
4. Adjust CPU and memory limits

### Custom Domains

1. Go to Railway dashboard
2. Click on your service
3. Go to "Settings" tab
4. Under "Domains", click "Generate Domain" or add a custom domain

## Docker Deployment

If you prefer Docker:

```bash
# Build the image
docker build -t tpmjs-executor .

# Run locally
docker run -p 3000:3000 -e EXECUTOR_API_KEY=your-key tpmjs-executor
```

Railway will automatically detect and use the Dockerfile if present.

## Security

- Set `EXECUTOR_API_KEY` to require authentication for all requests
- Tools run in isolated temporary directories
- Each execution uses a fresh npm install
- Environment variables are stored encrypted by Railway
- Network traffic is encrypted via HTTPS

## Pricing

Railway pricing is usage-based with a generous free tier:

- **Free Tier**: $5/month credit (enough for light usage)
- **Pay-as-you-go**: ~$0.000463/min for 0.5 vCPU, 512MB RAM

See [Railway Pricing](https://railway.app/pricing) for current rates.

**Cost Optimization Tips:**
- Use the "Sleep" feature for dev environments
- Set memory limits appropriate for your tools
- Monitor usage in Railway dashboard

## Comparison: Railway vs Other Platforms

| Feature | Railway | Unsandbox |
|---------|---------|-----------|
| Deploy method | One-click / CLI | CLI |
| Cold starts | None (always-on) | None |
| Max runtime | Unlimited | Unlimited |
| Free tier | $5/month credit | None |
| Pricing | Per usage | Per uptime |
| Docker support | Yes | Yes |
| Auto-scaling | Yes | Manual |

## Troubleshooting

### "Connection refused" errors
- Check that your service is running in Railway dashboard
- Verify the URL is correct (check "Domains" in settings)
- Ensure `EXECUTOR_API_KEY` matches if authentication is enabled

### Tool installation failures
- Check Railway logs for npm errors
- Verify the package name and version are correct
- Some packages may need additional system dependencies

### Timeout errors
- Railway has no timeout limit, but individual tool executions timeout at 2 minutes
- For longer-running tools, consider increasing the timeout in the executor code

## Support

- [TPMJS Custom Executors Documentation](https://tpmjs.com/docs/executors)
- [Railway Documentation](https://docs.railway.app)
- [GitHub Issues](https://github.com/tpmjs/tpmjs/issues)
