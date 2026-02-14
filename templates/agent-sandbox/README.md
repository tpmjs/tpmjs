# TPMJS Agent Sandbox

Stateful execution server for TPMJS agents. Files created by one tool call persist for subsequent calls within the same conversation.

## Deploy to Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template)

```bash
# Or deploy via CLI
railway init
railway up
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EXECUTOR_API_KEY` | No | - | Bearer token for authentication |
| `MAX_CONCURRENT_SESSIONS` | No | `50` | Maximum concurrent sessions |
| `DEFAULT_SESSION_TTL_SECONDS` | No | `3600` | Session timeout (1 hour) |
| `SESSION_DISK_QUOTA_MB` | No | `100` | Per-session disk quota |
| `PORT` | No | `3002` | Server port |

## API Endpoints

### Sessions

```bash
# Create/resume a session
curl -X POST http://localhost:3002/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EXECUTOR_API_KEY" \
  -d '{"sessionId": "agent123:conv456"}'

# Get session status
curl http://localhost:3002/sessions/agent123:conv456 \
  -H "Authorization: Bearer $EXECUTOR_API_KEY"

# Destroy a session
curl -X DELETE http://localhost:3002/sessions/agent123:conv456 \
  -H "Authorization: Bearer $EXECUTOR_API_KEY"
```

### Tool Execution

```bash
# Execute a tool within a session
curl -X POST http://localhost:3002/execute-tool \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EXECUTOR_API_KEY" \
  -d '{
    "packageName": "@tpmjs/hello",
    "name": "helloWorldTool",
    "version": "0.0.2",
    "params": {"includeTimestamp": true},
    "sessionId": "agent123:conv456"
  }'
```

### Health Check

```bash
curl http://localhost:3002/health
```

## Local Development

```bash
deno run --allow-net --allow-env --allow-read --allow-write=/tmp --allow-run server.ts
```

## Docker

```bash
docker build -t tpmjs-sandbox .
docker run -p 3002:3002 -e EXECUTOR_API_KEY=your-key tpmjs-sandbox
```
