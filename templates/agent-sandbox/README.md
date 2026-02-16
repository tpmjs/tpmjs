# TPMJS Agent Sandbox

Stateful execution server for TPMJS agents. Provides persistent filesystem sessions so files created by one tool call survive across subsequent calls within the same conversation. Built on Deno, deployed to Railway (or any Docker host).

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [How It Works](#how-it-works)
- [Session Lifecycle](#session-lifecycle)
- [Shell Tools](#shell-tools)
- [Executor Configuration](#executor-configuration)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Security Model](#security-model)
- [Deployment](#deployment)
- [Local Development](#local-development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
 User Message
      |
      v
 ┌──────────────────────────────────────────────────┐
 │  Next.js API Route (conversation/[id]/route.ts)  │
 │                                                   │
 │  1. Authenticate user                             │
 │  2. Create/resume sandbox session                 │
 │  3. Build tools from agent config                 │
 │  4. Stream AI response via SSE                    │
 │  5. Persist messages + tool results to DB         │
 └───────────────────────┬──────────────────────────┘
                         │
           Tool call with sessionId
                         │
                         v
 ┌──────────────────────────────────────────────────┐
 │          Executor Layer (lib/executors)           │
 │                                                   │
 │  Resolves config cascade:                         │
 │    Agent Config → Collection Config → Default     │
 │                                                   │
 │  Routes to correct executor:                      │
 │    'default'    → package-executor (stateless)    │
 │    'custom_url' → custom HTTP endpoint            │
 │    'sandbox'    → Agent Sandbox Server ←──────    │
 └───────────────────────┬──────────────────────────┘
                         │
               POST /execute-tool
               { sessionId, params }
                         │
                         v
 ┌──────────────────────────────────────────────────┐
 │       Agent Sandbox Server (Deno, server.ts)     │
 │                                                   │
 │  ┌─────────────────────────────────────────────┐ │
 │  │ Session: agent123:conv456                    │ │
 │  │ workDir: /tmp/.../workspace                  │ │
 │  │ TTL: 1 hour (extends on each tool call)      │ │
 │  │ Disk quota: 100 MB                           │ │
 │  │                                              │ │
 │  │  /workspace/                                 │ │
 │  │  ├── cloned-repo/                            │ │
 │  │  │   ├── .git/                               │ │
 │  │  │   ├── src/                                │ │
 │  │  │   └── README.md                           │ │
 │  │  ├── output.txt                              │ │
 │  │  └── notes.md                                │ │
 │  └─────────────────────────────────────────────┘ │
 │                                                   │
 │  Tool execution:                                  │
 │  1. Load npm package from esm.sh                  │
 │  2. Inject _sandboxWorkDir into params            │
 │  3. Enforce disk quota                            │
 │  4. Execute tool.execute(params)                  │
 │  5. Return result                                 │
 └──────────────────────────────────────────────────┘
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **Sandbox Server** | `templates/agent-sandbox/server.ts` | Deno HTTP server with session management, tool execution, module caching |
| **Shell Tools** | `packages/tools/official/sandbox-shell/` | 4 tools: `shellExec`, `readFile`, `writeFile`, `listFiles` |
| **Executor Layer** | `apps/web/src/lib/executors/index.ts` | Routes tool calls to sandbox with retry logic, session creation/destruction |
| **Tool Builder** | `apps/web/src/lib/agents/build-tools.ts` | Builds AI SDK tool definitions with executor config cascade |
| **Conversation Route** | `apps/web/src/app/api/[username]/agents/[agentSlug]/conversation/[conversationId]/route.ts` | SSE streaming endpoint, creates sessions, persists messages |
| **Dockerfile** | `templates/agent-sandbox/Dockerfile` | Container with Deno, git, openssh-client, credential helper |

---

## How It Works

### End-to-End Flow

1. **User sends a message** to an agent configured with `executorType: 'sandbox'`
2. **Conversation route** creates (or resumes) a sandbox session: `POST /sessions` with ID `{agentId}:{conversationId}`
3. **AI model** decides to call a tool (e.g. `shellExec` with `git clone ...`)
4. **Tool builder** wraps the tool in an executor-aware definition that routes the call to the sandbox server
5. **Executor layer** sends `POST /execute-tool` to the sandbox with the `sessionId`
6. **Sandbox server** resolves the session's `workDir`, injects `_sandboxWorkDir` into tool params, and executes
7. **Tool runs** in the session workspace — files persist on disk
8. **Result flows back** through the AI SDK to the model, which may call more tools or respond with text
9. **Messages are persisted** to PostgreSQL (USER, ASSISTANT with toolCalls, TOOL with toolResult)
10. **On conversation delete**, the session is destroyed (fire-and-forget)

### Statefulness

The key difference from the default executor is **persistence**. Within a sandbox session:

- Files created by `writeFile` or `shellExec` persist across tool calls
- Git repositories cloned in one turn are available in the next
- The working directory is the same for every tool call in the session
- Environment variables are injected per-call (not persistent across calls)

### Module Loading

The sandbox server dynamically imports npm packages from `esm.sh`:

```
https://esm.sh/@tpmjs/official-sandbox-shell@0.1.0
```

Modules are cached in memory for 2 minutes (up to 200 entries). The server supports:
- Direct tool exports (`export const toolName = tool({...})`)
- Factory functions (`export function toolName(config) { return tool({...}) }`)
- Zod schemas (converted via `zod-to-json-schema`)

---

## Session Lifecycle

```
 POST /sessions ─────────────────────► Session Created
   { sessionId }                       workDir: /tmp/.../workspace
                                       TTL: 1 hour
                                       │
                                       │ Each tool call:
                                       │  - Extends TTL
                                       │  - Increments toolCallCount
                                       │  - Checks disk quota
                                       │
                                       ▼
 POST /execute-tool ─────────────────► Tool Executes in workDir
   { sessionId, packageName,           _sandboxWorkDir injected
     name, params }                    │
                                       │
                 ┌─────────────────────┤
                 │                     │
                 ▼                     ▼
         TTL Expires              DELETE /sessions/{id}
         (cleanup timer)          (explicit destroy)
                 │                     │
                 ▼                     ▼
         Session Destroyed ◄───────── workDir removed
         (every 60s sweep)
```

### Session Properties

| Property | Description |
|----------|-------------|
| `sessionId` | Unique ID, typically `{agentId}:{conversationId}` |
| `workDir` | Filesystem path: `/tmp/tpmjs-sandbox/sessions/{safe-id}/workspace` |
| `createdAt` | When the session was first created |
| `expiresAt` | TTL deadline, extended on every tool call |
| `toolCallCount` | Number of tool calls executed in this session |

### Idempotent Creation

Calling `POST /sessions` with an existing `sessionId` doesn't create a new session — it extends the TTL and returns the existing one with `resumed: true`. This makes it safe to call at the start of every conversation turn.

### Cleanup

- **TTL expiration**: A sweep runs every 60 seconds, destroying sessions past their `expiresAt`
- **Explicit deletion**: `DELETE /sessions/{id}` immediately destroys the session and removes files
- **Orphan cleanup**: On server startup, any leftover session directories from a previous run are removed
- **Graceful shutdown**: `SIGTERM`/`SIGINT` destroy all active sessions before exit

---

## Shell Tools

The `@tpmjs/official-sandbox-shell` package provides 4 tools that run inside the sandbox workspace.

### `shellExec`

Execute any shell command in the workspace.

```json
{
  "command": "git clone https://github.com/user/repo.git --depth 1",
  "timeout": 60000
}
```

**Returns:**
```json
{
  "stdout": "Cloning into 'repo'...\n",
  "stderr": "",
  "exitCode": 0,
  "durationMs": 2341,
  "truncated": false
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `command` | string | *required* | Shell command (passed to `sh -c`) |
| `timeout` | number | 30000 | Timeout in ms (min: 1000, max: 300000) |

**Behavior:**
- Runs via `Deno.Command('sh', { args: ['-c', command], cwd: workDir })`
- On timeout: sends `SIGTERM`, waits 2s, then `SIGKILL`
- stdout/stderr truncated at 100 KB each
- Exit code 137 indicates timeout kill

### `readFile`

Read a file from the workspace.

```json
{
  "path": "repo/src/index.ts"
}
```

**Returns:**
```json
{
  "content": "console.log('hello');\n",
  "path": "repo/src/index.ts",
  "size": 22,
  "truncated": false
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | File path relative to workspace root |

**Behavior:**
- Content truncated at 500 KB
- Symlink escape detection via `Deno.realPath()`
- Path traversal (`../`) blocked

### `writeFile`

Create or overwrite a file.

```json
{
  "path": "src/main.py",
  "content": "print('hello')\n",
  "createDirs": true
}
```

**Returns:**
```json
{
  "success": true,
  "path": "src/main.py",
  "bytesWritten": 16
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | *required* | File path relative to workspace root |
| `content` | string | *required* | Content to write |
| `createDirs` | boolean | true | Create parent directories if needed |

### `listFiles`

List files and directories.

```json
{
  "path": "repo",
  "recursive": true,
  "maxDepth": 2
}
```

**Returns:**
```json
{
  "path": "repo",
  "entries": [
    { "name": "README.md", "type": "file", "size": 1024 },
    { "name": "src", "type": "directory", "size": null },
    { "name": "src/index.ts", "type": "file", "size": 256 }
  ],
  "truncated": false
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | `.` | Directory path relative to workspace root |
| `recursive` | boolean | false | List recursively |
| `maxDepth` | number | 3 | Max depth for recursive listing |

**Behavior:**
- Capped at 1000 entries (sets `truncated: true` beyond that)
- Symlinks pointing outside workspace are silently skipped
- Broken symlinks are skipped

### `_sandboxWorkDir` Injection

All tools accept a `_sandboxWorkDir` parameter, but agents never set it directly. The sandbox server injects it automatically:

```typescript
// server.ts line 420
const executeParams = cwd ? { ...params, _sandboxWorkDir: cwd } : params;
```

If `_sandboxWorkDir` is missing (tool called outside a sandbox), all tools throw a clear error.

---

## Executor Configuration

### Cascade Resolution

Tool execution is routed through a 3-level cascade:

```
Agent.executorType / Agent.executorConfig     (highest priority)
  └── Collection.executorType / Collection.executorConfig
        └── System default                    (lowest priority)
```

This means:
- An agent-level executor config applies to **all** tools in the agent
- A collection-level executor config applies only to tools from that collection
- The system default (`package-executor`) is used when nothing else is configured

### Executor Types

| Type | Description | Config Fields |
|------|-------------|---------------|
| `default` | TPMJS default stateless executor | None |
| `custom_url` | Your own HTTP executor endpoint | `url`, `apiKey` |
| `sandbox` | Agent Sandbox with persistent sessions | `url` (optional), `apiKey` (optional) |

### Database Schema

```prisma
model Agent {
  executorType    String?   // 'default', 'custom_url', 'sandbox'
  executorConfig  Json?     // { type, url?, apiKey? }
  envVars         Json?     // { KEY: "value", ... }
}

model Collection {
  executorType    String?
  executorConfig  Json?
  envVars         Json?
}
```

### Environment Variable Merging

Environment variables are merged with agent-level overriding collection-level:

```
Collection envVars:  { API_KEY: "coll-key", REGION: "us-east-1" }
Agent envVars:       { API_KEY: "agent-key", DEBUG: "true" }
                          ↓
Merged result:       { API_KEY: "agent-key", REGION: "us-east-1", DEBUG: "true" }
```

Env vars are passed to the sandbox server per tool call and cleaned up after execution.

---

## Environment Variables

### Sandbox Server

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3002` | Server port |
| `EXECUTOR_API_KEY` | No | — | Bearer token for authentication. If unset, auth is disabled. |
| `MAX_CONCURRENT_SESSIONS` | No | `50` | Maximum concurrent sessions |
| `DEFAULT_SESSION_TTL_SECONDS` | No | `3600` | Session timeout (1 hour) |
| `SESSION_DISK_QUOTA_MB` | No | `100` | Per-session disk quota |
| `GITHUB_TOKEN` | No | — | GitHub PAT for cloning private repos via credential helper |

### Web App

| Variable | Required | Description |
|----------|----------|-------------|
| `AGENT_SANDBOX_URL` | Yes (for sandbox agents) | URL of the sandbox server (e.g. `https://sandbox.example.com`) |

The URL can also be set per-agent or per-collection via `executorConfig.url`, which takes precedence over the environment variable.

---

## API Reference

### Health Check

```
GET /health
```

No authentication required.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "info": {
    "runtime": "deno",
    "denoVersion": "2.1.9",
    "activeSessions": 3,
    "maxSessions": 50,
    "cachedModules": 12,
    "capabilities": {
      "sessions": true,
      "executeToolWithSession": true
    }
  }
}
```

### Metrics

```
GET /metrics
```

No authentication required. Returns operational metrics for monitoring.

**Response:**
```json
{
  "uptime": 3600000,
  "sessions": {
    "active": 3,
    "max": 50,
    "totalCreated": 150,
    "totalDestroyed": 147
  },
  "executions": {
    "total": 1024,
    "successful": 1010,
    "failed": 14
  },
  "memory": {
    "rss": 67108864,
    "heapUsed": 45000000,
    "heapTotal": 60000000
  },
  "cache": {
    "modules": 12,
    "maxSize": 200
  }
}
```

### Create/Resume Session

```
POST /sessions
Authorization: Bearer <EXECUTOR_API_KEY>
Content-Type: application/json

{
  "sessionId": "agent123:conv456",
  "timeoutSeconds": 3600
}
```

**Response:**
```json
{
  "sessionId": "agent123:conv456",
  "workDir": "/tmp/tpmjs-sandbox/sessions/agent123_conv456/workspace",
  "createdAt": "2026-02-16T10:00:00.000Z",
  "expiresAt": "2026-02-16T11:00:00.000Z",
  "resumed": false
}
```

Idempotent: if session exists, `resumed: true` and TTL is extended.

### Get Session

```
GET /sessions/{sessionId}
Authorization: Bearer <EXECUTOR_API_KEY>
```

**Response:**
```json
{
  "sessionId": "agent123:conv456",
  "workDir": "/tmp/tpmjs-sandbox/sessions/agent123_conv456/workspace",
  "createdAt": "2026-02-16T10:00:00.000Z",
  "expiresAt": "2026-02-16T11:00:00.000Z",
  "toolCallCount": 7
}
```

Returns `404` if session is expired or doesn't exist.

### Destroy Session

```
DELETE /sessions/{sessionId}
Authorization: Bearer <EXECUTOR_API_KEY>
```

**Response:**
```json
{
  "sessionId": "agent123:conv456",
  "destroyed": true
}
```

Removes session and deletes workspace directory.

### Execute Tool

```
POST /execute-tool
Authorization: Bearer <EXECUTOR_API_KEY>
Content-Type: application/json

{
  "packageName": "@tpmjs/official-sandbox-shell",
  "name": "shellExec",
  "version": "0.1.0",
  "params": { "command": "git clone https://github.com/user/repo.git --depth 1" },
  "sessionId": "agent123:conv456",
  "env": { "GITHUB_TOKEN": "ghp_..." }
}
```

**Response (success):**
```json
{
  "success": true,
  "output": {
    "stdout": "Cloning into 'repo'...\n",
    "stderr": "",
    "exitCode": 0,
    "durationMs": 2341,
    "truncated": false
  },
  "executionTimeMs": 2500
}
```

**Response (error):**
```json
{
  "success": false,
  "error": "Session disk quota exceeded: 105MB / 100MB",
  "executionTimeMs": 12
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `packageName` | Yes | npm package name (e.g. `@tpmjs/official-sandbox-shell`) |
| `name` | Yes | Named export from the package |
| `version` | No | Package version (default: `latest`) |
| `params` | No | Parameters passed to `tool.execute()` |
| `sessionId` | No | Session ID for workspace resolution |
| `env` | No | Environment variables set for this execution only |
| `importUrl` | No | Override the esm.sh import URL |

**Execution flow:**
1. Load module from cache or `esm.sh`
2. Resolve session workspace from `sessionId`
3. Check disk quota
4. Set environment variables
5. Inject `_sandboxWorkDir` into params
6. Call `tool.execute(params)`
7. Clean up environment variables
8. Return result

---

## Security Model

### Authentication

All endpoints except `/health` and `/metrics` require a Bearer token when `EXECUTOR_API_KEY` is set. If unset, auth is disabled (development mode only).

### Path Sandboxing

All file tools enforce workspace boundaries:

1. **Path normalization**: `../` segments are resolved and checked
2. **Boundary check**: Resolved path must start with `workDir`
3. **Symlink detection**: `Deno.realPath()` verifies the canonical path stays in workspace
4. **Escape rejection**: Throws `"Path escapes sandbox workspace"` on violation

```typescript
function resolveSandboxPath(workDir: string, relativePath: string): string {
  // Normalize, resolve .., validate prefix
  if (!final.startsWith(normalizedWorkDir)) {
    throw new Error(`Path escapes sandbox workspace: ${relativePath}`);
  }
  return final;
}
```

### Disk Quotas

Before every tool execution, the server checks workspace size:

```
if (usageKB > SESSION_DISK_QUOTA_MB * 1024) → HTTP 413
```

Default: 100 MB per session.

### Process Isolation

- The Deno server runs as the `deno` user (non-root)
- Write access is restricted to `/tmp` (`--allow-write=/tmp`)
- Each session has its own workspace directory
- Environment variables are cleaned up after each tool call

### Timeout Protection

- `shellExec`: Configurable per-call (default 30s, max 5min)
- `SIGTERM` → 2s grace → `SIGKILL`
- HTTP-level timeout on executor calls: 5 minutes
- Session creation timeout: 15 seconds

### Output Truncation

| Resource | Limit |
|----------|-------|
| stdout/stderr | 100 KB each |
| File reads | 500 KB |
| Directory listings | 1000 entries |

### Git Credential Helper

Private repos can be cloned using a `GITHUB_TOKEN` environment variable. The credential helper (`git-credential-env`) is a system-level git config that reads the token from the environment:

```sh
#!/bin/sh
if [ "$1" = "get" ]; then
  if [ -n "$GITHUB_TOKEN" ]; then
    echo "protocol=https"
    echo "host=github.com"
    echo "username=x-access-token"
    echo "password=$GITHUB_TOKEN"
  fi
fi
```

---

## Deployment

### Railway (Recommended)

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template)

```bash
# Or deploy via CLI
cd templates/agent-sandbox
railway init
railway up
```

Set environment variables in Railway dashboard:
- `EXECUTOR_API_KEY` — your chosen secret
- `GITHUB_TOKEN` — (optional) for private repo cloning

### Docker

```bash
# Build
docker build -t tpmjs-sandbox templates/agent-sandbox/

# Run
docker run -p 3002:3002 \
  -e EXECUTOR_API_KEY=your-secret-key \
  -e GITHUB_TOKEN=ghp_optional \
  tpmjs-sandbox
```

### Dockerfile Details

```dockerfile
FROM denoland/deno:2.1.9

# System packages: curl (health checks), git, openssh-client (private repos)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl git openssh-client && rm -rf /var/lib/apt/lists/*

# Session storage
RUN mkdir -p /tmp/tpmjs-sandbox/sessions && chown -R deno:deno /tmp/tpmjs-sandbox

# Git credential helper for GITHUB_TOKEN
COPY git-credential-env /usr/local/bin/git-credential-env
RUN chmod +x /usr/local/bin/git-credential-env && \
    git config --system credential.helper '/usr/local/bin/git-credential-env'

# Deno permissions: network, env, read, write to /tmp, subprocess execution
USER deno
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", \
     "--allow-write=/tmp", "--allow-run", "server.ts"]
```

### Connecting the Web App

Set `AGENT_SANDBOX_URL` in `apps/web/.env.local`:

```env
AGENT_SANDBOX_URL=https://your-sandbox.up.railway.app
```

Or configure per-agent in the database:

```sql
UPDATE agents SET
  executor_type = 'sandbox',
  executor_config = '{"type":"sandbox","url":"https://your-sandbox.up.railway.app","apiKey":"your-secret"}'
WHERE id = 'agent-id';
```

---

## Local Development

### Run the Sandbox Server

```bash
cd templates/agent-sandbox

# Without auth (development)
deno run --allow-net --allow-env --allow-read --allow-write=/tmp --allow-run server.ts

# With auth
EXECUTOR_API_KEY=dev-secret deno run --allow-net --allow-env --allow-read --allow-write=/tmp --allow-run server.ts
```

### Run with Docker

```bash
docker build -t tpmjs-sandbox .
docker run -p 3002:3002 tpmjs-sandbox
```

### Point the Web App at Local Sandbox

```env
# apps/web/.env.local
AGENT_SANDBOX_URL=http://localhost:3002
```

### Quick Manual Test

```bash
# Health check
curl http://localhost:3002/health | jq .

# Create session
curl -X POST http://localhost:3002/sessions \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test:1"}'

# Run a command
curl -X POST http://localhost:3002/execute-tool \
  -H "Content-Type: application/json" \
  -d '{
    "packageName": "@tpmjs/official-sandbox-shell",
    "name": "shellExec",
    "version": "0.1.0",
    "params": {"command": "echo hello world"},
    "sessionId": "test:1"
  }'

# Clean up
curl -X DELETE http://localhost:3002/sessions/test:1
```

---

## Testing

### Integration Test Script

The `test-sandbox.sh` script exercises all 4 shell tools end-to-end:

```bash
# Against local instance (no auth)
./test-sandbox.sh

# Against deployed instance
./test-sandbox.sh https://sandbox.example.com your-api-key
```

**Test sequence:**
1. Health check
2. Create session
3. `shellExec`: write a file with echo
4. `readFile`: verify content
5. `writeFile`: create `src/index.js`
6. `listFiles`: verify workspace contents
7. `shellExec`: `git clone` (shallow)
8. `listFiles`: verify cloned repo
9. `shellExec`: `git log` in cloned repo
10. Destroy session

### E2E Integration Test

A full integration test at `apps/web/src/test/integration/sandbox/sandbox-shell-e2e.integration.test.ts` tests the complete flow through the web app:

1. Creates a test agent with sandbox executor
2. Multi-turn conversation: clone repo, create files, git commit
3. Verifies stateful persistence across turns
4. Tests conversation history retrieval with tool call metadata

```bash
INTEGRATION_TESTS=true AGENT_SANDBOX_URL=http://localhost:3002 pnpm test
```

### Blocks Validator

Validate tool definitions against the blocks.yml schema:

```bash
cd packages/tools/official
blocks run sandbox.shellExec
blocks run sandbox.readFile
blocks run sandbox.writeFile
blocks run sandbox.listFiles
```

### Build Verification

```bash
pnpm --filter=@tpmjs/official-sandbox-shell type-check
pnpm --filter=@tpmjs/official-sandbox-shell build
```

---

## Troubleshooting

### Session creation fails with "Sandbox executor URL not configured"

The web app can't find the sandbox server URL. Either:
- Set `AGENT_SANDBOX_URL` in `apps/web/.env.local`
- Or set `executorConfig.url` on the agent in the database

### Disk quota exceeded (HTTP 413)

A session has used more than 100 MB. The agent needs to clean up files or start a new conversation. Adjust `SESSION_DISK_QUOTA_MB` if needed.

### Tool execution timeout

Default timeout is 30 seconds for `shellExec`. For long operations like `git clone` of large repos, the agent should pass `"timeout": 60000` or higher (max 300000).

### "Maximum concurrent sessions reached"

The server is at capacity. Sessions expire after 1 hour by default. Either:
- Wait for sessions to expire
- Increase `MAX_CONCURRENT_SESSIONS`
- Destroy idle sessions manually

### Module import failures

The sandbox server imports npm packages from `esm.sh`. If a package fails to load:
- Check the package is published to npm
- Check `esm.sh` status
- Try specifying `importUrl` to use a different CDN

### Git clone fails for private repos

Ensure `GITHUB_TOKEN` is set as an environment variable on the sandbox server (not just in the web app). The credential helper reads it from the server's environment.

### Files disappear between tool calls

Check that the same `sessionId` is being used. The conversation route generates `{agentId}:{conversationId}` — if the conversation ID changes, it's a new session.

### "Path escapes sandbox workspace"

A tool tried to read/write outside the workspace (e.g. `../../etc/passwd`). This is a security violation and is blocked. All paths must be relative to the workspace root.
