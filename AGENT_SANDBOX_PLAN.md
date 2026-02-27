# Agent Sandbox Feature — Implementation Plan

## Context

TPMJS agents currently execute tools through **stateless executors** — each tool call is an independent HTTP request with no shared state between calls. The Agent Sandbox feature adds **stateful execution sessions** where files created by one tool call persist for subsequent calls within the same conversation. This enables multi-step workflows (e.g., generate a CSV, then analyze it, then chart it) that require filesystem persistence.

Users can specify a sandbox URL or use the TPMJS default sandbox on Railway. Default behavior (no sandbox) remains unchanged.

---

## Architecture Overview

- **Sandbox = Executor with sessions**. A sandbox implements the standard executor API (`POST /execute-tool`) plus session management endpoints (`POST /sessions`, `DELETE /sessions/:id`).
- **Session = Conversation**. Each agent conversation maps to one sandbox session. The `sessionId` is derived deterministically from `agentId:conversationId`.
- **Session lifecycle**: Created on first message in a conversation, auto-expires after 1 hour TTL (extended on each tool call), explicitly destroyed on conversation delete.

---

## 1. Types & Schemas

### `packages/types/src/executor.ts`
- Add `'sandbox'` to `ExecutorTypeSchema`: `z.enum(['default', 'custom_url', 'sandbox'])`
- Add `SandboxExecutorConfigSchema`: `{ type: 'sandbox', url?: string, apiKey?: string }`
- Add to `ExecutorConfigSchema` discriminated union
- Add session management types: `CreateSessionRequest/Response`, `DestroySessionResponse`, `SessionStatusResponse`, `SandboxExecuteToolRequest` (extends `ExecuteToolRequest` with `sessionId`)
- Add Zod schemas: `CreateSessionRequestSchema`, `SandboxExecuteToolRequestSchema`

### `packages/types/src/agent.ts` + `packages/types/src/collection.ts`
- Make `url` optional in `ExecutorConfigUpdateSchema` (to support default sandbox with no custom URL)

---

## 2. Sandbox API Contract

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check — must include `capabilities.sessions: true` |
| `POST` | `/sessions` | Create session: `{ sessionId, timeoutSeconds? }` → `{ sessionId, createdAt, expiresAt }` |
| `GET` | `/sessions/:id` | Session status |
| `DELETE` | `/sessions/:id` | Destroy session + clean up files |
| `POST` | `/execute-tool` | Standard executor + `sessionId` in body. Tool runs with `cwd` set to session workspace dir |

Session workspace layout:
```
/tmp/tpmjs-sandbox/sessions/<sessionId>/workspace/   # tool cwd
```

---

## 3. Server-Side Changes

### `apps/web/src/lib/executors/index.ts`
- Add sandbox case to `parseExecutorConfig()` (handle `executorType === 'sandbox'`)
- Add `executeWithSandbox(url, apiKey, request, sessionId)` — like `executeWithCustomUrl` but includes `sessionId` in request body
- Add `createSandboxSession(url, apiKey, sessionId, timeoutSeconds?)` and `destroySandboxSession(url, apiKey, sessionId)`
- Add `resolveSandboxUrl(config)` — returns `config.url || process.env.AGENT_SANDBOX_URL`
- Update `executeWithExecutor(config, request, sessionId?)` — add optional `sessionId` param, dispatch to `executeWithSandbox` when `type === 'sandbox'`
- Update `getExecutorDescription()` for sandbox type

### `apps/web/src/lib/ai-agent/tool-executor-agent.ts`
- Add `sessionId?: string` param to `createToolDefinition()`
- Pass `sessionId` through to `executeWithExecutor()` in the tool's `execute()` callback

### `apps/web/src/lib/agents/build-tools.ts`
- Add `sessionId?: string` param to `buildAgentTools()`
- Pass through to both `createToolDefinition()` call sites (collection tools line ~287, individual tools line ~305)

### Conversation Routes (3 files)
- `apps/web/src/app/api/agents/[id]/conversation/[conversationId]/route.ts`
- `apps/web/src/app/api/chat/[username]/[uid]/conversation/[conversationId]/route.ts`
- `apps/web/src/app/api/[username]/agents/[agentSlug]/conversation/[conversationId]/route.ts`

In each POST handler:
1. After fetching agent, check if `executorType === 'sandbox'`
2. Generate `sessionId = agentId:conversationId`
3. Call `createSandboxSession()` (idempotent — resumes if exists)
4. Pass `sessionId` to `buildAgentTools()`
5. On error, return 502 with clear message

In DELETE handler: call `destroySandboxSession()` fire-and-forget

---

## 4. Sandbox Template

### New: `templates/agent-sandbox/`
```
templates/agent-sandbox/
  server.ts           # Deno HTTP server with session management + tool execution
  Dockerfile          # Based on denoland/deno, same pattern as apps/railway-executor/
  railway.toml        # Railway deployment config
  README.md           # Deployment guide
```

**`server.ts`** — Based on `apps/railway-executor/server.ts` pattern:
- In-memory `Map<sessionId, { workDir, createdAt, expiresAt, toolCallCount }>` for session state
- Session endpoints: POST `/sessions`, GET `/sessions/:id`, DELETE `/sessions/:id`
- Tool execution sets `cwd` to session's workspace directory
- Cleanup interval garbage-collects expired sessions (removes dirs)
- Same esm.sh dynamic import pattern as Railway executor
- Per-session disk quota + max concurrent sessions limit

### Default Deployment
Deploy to Railway at a stable URL. Store URL in `AGENT_SANDBOX_URL` env var.

---

## 5. Database Changes

**None required.** The existing `Agent.executorType` and `Agent.executorConfig` fields store `'sandbox'` and `{ url?, apiKey? }` respectively. Sessions are ephemeral and managed by the sandbox service.

---

## 6. UI Changes

### `apps/web/src/components/ExecutorConfigPanel.tsx`
- Add third radio button: "Agent Sandbox" with "Stateful" badge
- Description: "Persistent filesystem across tool calls within a conversation"
- When selected: optional URL field (placeholder: "Leave empty for TPMJS default sandbox"), optional API key field, verify button
- Update `handleTypeChange` and `onChange` for `type: 'sandbox'`

### `apps/web/src/app/dashboard/agents/[id]/page.tsx`
- Update executor config hydration to handle `executorType === 'sandbox'`
- Update save payload construction for sandbox type
- Add sandbox badge indicator when active

---

## 7. Documentation

### New: `apps/web/src/app/docs/executors/sandbox/page.tsx`
Following the pattern of existing executor doc pages (railway/page.tsx, vercel/page.tsx):
- What is the Agent Sandbox
- When to use it (multi-step workflows, filesystem operations, data pipelines)
- Default sandbox vs self-hosted
- Session lifecycle (creation, TTL, cleanup)
- API contract reference
- Deploy your own (Railway one-click, Docker, CLI)
- Configuration in agent settings

### Update: `apps/web/src/app/docs/executors/page.tsx`
- Add "Agent Sandbox" card to the executor types grid (alongside Default, Custom URL)

### Update: `apps/web/src/app/docs/agents/page.tsx`
- Add "Sandbox Mode" section explaining how to enable and what it does

---

## 8. Implementation Order

1. Types (`packages/types/src/executor.ts`, `agent.ts`, `collection.ts`)
2. Executor resolution (`apps/web/src/lib/executors/index.ts`)
3. Tool definition plumbing (`tool-executor-agent.ts` → `build-tools.ts`)
4. Conversation routes (3 files — session creation/cleanup)
5. Sandbox template (`templates/agent-sandbox/`)
6. UI (`ExecutorConfigPanel.tsx`, agent settings page)
7. Documentation (new sandbox page, update executor overview, update agent docs)
8. Deploy default sandbox to Railway

---

## 9. Verification

1. **Unit**: Verify `parseExecutorConfig` handles `'sandbox'` type correctly
2. **Integration**: Create an agent with sandbox executor, send a message that triggers a tool writing a file, send a second message that reads that file — verify persistence
3. **Session cleanup**: Delete a conversation, verify sandbox session is destroyed
4. **Default sandbox**: Set executor to sandbox with no URL, verify it uses `AGENT_SANDBOX_URL`
5. **Custom sandbox**: Set a custom sandbox URL, verify tool calls route to it
6. **Backward compatibility**: Agents without sandbox configured continue working unchanged
7. **UI**: Verify ExecutorConfigPanel renders sandbox option, saves correctly, verify button works
8. **Docs**: Navigate to `/docs/executors/sandbox`, verify page renders
