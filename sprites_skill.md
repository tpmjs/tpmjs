# Sprites Tools Development & Testing Guide

This document covers how to build, publish, flush caches, and test the TPMJS sprites tools.

## Credentials

### TPMJS API Key
```
tpmjs_sk_U_31AqikFd3up5VcP9kUGpisu2ONo8R_gvwnvE9BdzM
```

### SPRITES_TOKEN (set in collection env vars)
```
ajax-davis/775360/824b966f66a294260bdd53c4c0dbb9ab/fe71a34c57b48f7d16680bdfaed23f7009bd366a4599c439ab09fbc38629d2fe
```

### CRON_SECRET (for triggering syncs)
```
6c806d35cf6212f489c76414d38d2b6acbc44590ac78bb08aadea28dd04a29d0
```

## MCP Endpoint

The sprites collection MCP endpoint:
```
https://tpmjs.com/api/mcp/ajax/sprites/http
```

## Available Sprites Tools

| Tool | Package | Description |
|------|---------|-------------|
| `sprites-list` | `@tpmjs/tools-sprites-list` | List all sprites with status |
| `sprites-get` | `@tpmjs/tools-sprites-get` | Get a specific sprite's details |
| `sprites-create` | `@tpmjs/tools-sprites-create` | Create a new sprite |
| `sprites-delete` | `@tpmjs/tools-sprites-delete` | Delete a sprite |
| `sprites-exec` | `@tpmjs/tools-sprites-exec` | Execute commands in a sprite |
| `sprites-sessions` | `@tpmjs/tools-sprites-sessions` | List active sessions |
| `sprites-policy-get` | `@tpmjs/tools-sprites-policy-get` | Get sprite policy |
| `sprites-checkpoint-list` | `@tpmjs/tools-sprites-checkpoint-list` | List checkpoints |
| `sprites-checkpoint-create` | `@tpmjs/tools-sprites-checkpoint-create` | Create a checkpoint |
| `sprites-checkpoint-restore` | `@tpmjs/tools-sprites-checkpoint-restore` | Restore from checkpoint |

## Building a Sprites Tool

1. Navigate to the tool directory:
```bash
cd packages/tools/official/sprites-exec
```

2. Build:
```bash
pnpm build
```

3. Type-check:
```bash
pnpm type-check
```

## Publishing a Sprites Tool

1. Bump version in `package.json`:
```json
"version": "0.1.5"
```

2. Build and publish:
```bash
cd packages/tools/official/sprites-exec
pnpm build
npm publish
```

3. Commit the version bump:
```bash
git add package.json
git commit -m "chore: bump sprites-exec to 0.1.5"
git push
```

## Syncing to Database

After publishing, sync the package to the TPMJS database:

### Changes Feed Sync (fast, picks up recent npm changes)
```bash
curl -s -X POST "https://tpmjs.com/api/sync/changes" \
  -H "Authorization: Bearer 6c806d35cf6212f489c76414d38d2b6acbc44590ac78bb08aadea28dd04a29d0" \
  -H "Content-Type: application/json"
```

### Keyword Sync (comprehensive, searches for all tpmjs packages)
```bash
curl -s -X POST "https://tpmjs.com/api/sync/keyword" \
  -H "Authorization: Bearer 6c806d35cf6212f489c76414d38d2b6acbc44590ac78bb08aadea28dd04a29d0" \
  -H "Content-Type: application/json"
```

### Check version in database
```bash
curl -s "https://tpmjs.com/api/tools?q=sprites-exec" | jq '.data[] | select(.package.npmPackageName == "@tpmjs/tools-sprites-exec") | {name: .name, version: .package.npmVersion}'
```

## Flushing Executor Caches

**CRITICAL**: The executor caches npm packages. After publishing a new version, you MUST flush the cache.

### Flush Primary Executor (executor.tpmjs.com)
```bash
curl -s -X POST "https://executor.tpmjs.com/cache/clear" | jq .
```

### Flush Railway Executor (backup)
```bash
curl -s -X POST "https://endearing-commitment-production.up.railway.app/cache/clear" | jq .
```

### Check Cache Stats
```bash
curl -s "https://executor.tpmjs.com/cache/stats" | jq .
```

## Testing via MCP Endpoint

### List All Tools
```bash
curl -s -X POST "https://tpmjs.com/api/mcp/ajax/sprites/http" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tpmjs_sk_U_31AqikFd3up5VcP9kUGpisu2ONo8R_gvwnvE9BdzM" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | jq '.result.tools[] | {name: .name}'
```

### Test sprites-list
```bash
curl -s -X POST "https://tpmjs.com/api/mcp/ajax/sprites/http" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tpmjs_sk_U_31AqikFd3up5VcP9kUGpisu2ONo8R_gvwnvE9BdzM" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"tpmjs-tools-sprites-list--spritesListTool","arguments":{}}}' | jq '.result'
```

### Test sprites-exec (simple command)
```bash
curl -s -X POST "https://tpmjs.com/api/mcp/ajax/sprites/http" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tpmjs_sk_U_31AqikFd3up5VcP9kUGpisu2ONo8R_gvwnvE9BdzM" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"tpmjs-tools-sprites-exec--spritesExecTool","arguments":{"name":"hello-script-sprite","cmd":"echo hello"}}}' | jq '.result'
```

### Test sprites-exec (shell operators)
```bash
curl -s -X POST "https://tpmjs.com/api/mcp/ajax/sprites/http" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tpmjs_sk_U_31AqikFd3up5VcP9kUGpisu2ONo8R_gvwnvE9BdzM" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"tpmjs-tools-sprites-exec--spritesExecTool","arguments":{"name":"hello-script-sprite","cmd":"echo foo && echo bar"}}}' | jq '.result'
```

### Test sprites-get
```bash
curl -s -X POST "https://tpmjs.com/api/mcp/ajax/sprites/http" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tpmjs_sk_U_31AqikFd3up5VcP9kUGpisu2ONo8R_gvwnvE9BdzM" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"tpmjs-tools-sprites-get--spritesGetTool","arguments":{"name":"hello-script-sprite"}}}' | jq '.result'
```

### Test sprites-create
```bash
curl -s -X POST "https://tpmjs.com/api/mcp/ajax/sprites/http" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tpmjs_sk_U_31AqikFd3up5VcP9kUGpisu2ONo8R_gvwnvE9BdzM" \
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"tpmjs-tools-sprites-create--spritesCreateTool","arguments":{"name":"test-sprite-123"}}}' | jq '.result'
```

### Test sprites-delete
```bash
curl -s -X POST "https://tpmjs.com/api/mcp/ajax/sprites/http" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tpmjs_sk_U_31AqikFd3up5VcP9kUGpisu2ONo8R_gvwnvE9BdzM" \
  -d '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"tpmjs-tools-sprites-delete--spritesDeleteTool","arguments":{"name":"test-sprite-123"}}}' | jq '.result'
```

## Testing via Agent Conversation

```bash
curl -s -X POST "https://tpmjs.com/api/ajax/agents/sprites/conversation/test-conv?format=json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tpmjs_sk_U_31AqikFd3up5VcP9kUGpisu2ONo8R_gvwnvE9BdzM" \
  -d '{"message":"List all sprites"}'
```

## Complete Workflow: Publish + Sync + Flush + Test

```bash
# 1. Build and publish
cd packages/tools/official/sprites-exec
pnpm build && npm publish

# 2. Trigger sync
curl -s -X POST "https://tpmjs.com/api/sync/changes" \
  -H "Authorization: Bearer 6c806d35cf6212f489c76414d38d2b6acbc44590ac78bb08aadea28dd04a29d0"

# 3. Flush caches
curl -s -X POST "https://executor.tpmjs.com/cache/clear"
curl -s -X POST "https://endearing-commitment-production.up.railway.app/cache/clear"

# 4. Test
curl -s -X POST "https://tpmjs.com/api/mcp/ajax/sprites/http" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tpmjs_sk_U_31AqikFd3up5VcP9kUGpisu2ONo8R_gvwnvE9BdzM" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"tpmjs-tools-sprites-exec--spritesExecTool","arguments":{"name":"hello-script-sprite","cmd":"echo test"}}}' | jq .
```

## Known Issues & Fixes

### Issue: "Failed to parse response from Sprites API"
**Cause**: Sprites API returns JSON error `{"error":"..."}` with HTTP 200 instead of proper error codes.
**Fix**: Added JSON error detection in sprites-exec v0.1.4.

### Issue: "Invalid sprite status: cold"
**Cause**: Sprites API returns "cold" status for idle sprites, which wasn't recognized.
**Fix**: Added "cold" to valid statuses in sprites-list v0.1.3.

### Issue: "The update command takes no arguments"
**Cause**: Commands with shell operators (&&, ||, |, etc.) were being parsed incorrectly.
**Fix**: Added shell operator detection and `sh -c` wrapping in sprites-exec v0.1.5.

### Issue: Old version still being used after publish
**Cause**: Deno HTTP import cache + executor module cache.
**Fix**:
1. Pass explicit version from database (deployed to web app)
2. Flush executor caches after publishing
