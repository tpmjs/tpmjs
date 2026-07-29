# TPMJS Architecture Diagram

This document accompanies the `architecture.d2` diagram and provides a comprehensive overview of the TPMJS platform architecture.

## Rendering the Diagram

Install D2 and render the diagram:

```bash
# Install D2 (macOS)
brew install d2

# Render to SVG (recommended)
d2 docs/architecture.d2 docs/architecture.svg --layout=elk

# Render to PNG
d2 docs/architecture.d2 docs/architecture.png --layout=elk
```

## Architecture Overview

TPMJS (Tool Platform for Model Junctions) is an open platform for discovering, sharing, and executing AI agent tools. Think of it as "npm for AI tools."

---

## 1. External Clients

| Client | Description |
|--------|-------------|
| **Web App** | Next.js 16 App Router application at tpmjs.com |
| **TPMJS CLI** | Command-line tool for interacting with the registry |
| **AI Clients** | External AI applications (Claude Desktop, GPT, etc.) using MCP protocol |
| **Bridge CLI** | (WIP) Local bridge for connecting local MCP servers to TPMJS |

---

## 2. API Gateway

### Authentication Methods

- **Better Auth**: Email/password and OAuth (GitHub, Google)
- **TPMJS API Keys**: Scoped keys with permissions (`mcp:execute`, `agent:chat`, `bridge:connect`, `usage:read`)
- **Session Tokens**: Browser-based sessions

### Rate Limiting

- Per-endpoint limits
- Tier-based limits (FREE, PRO, ENTERPRISE)
- API key-specific overrides

---

## 3. API Endpoints

### Tool Discovery
```
GET  /api/tools           - List tools with pagination
GET  /api/tools/search    - Search tools with filters
GET  /api/tools/[id]      - Get tool details
```

### Execution
```
POST /api/tools/execute/[slug]  - Execute tool (SSE streaming)
```

### MCP Protocol
```
POST /api/mcp/[user]/[slug]/[transport]  - JSON-RPC 2.0 endpoint
  - tools/list: List available tools
  - tools/call: Execute a tool
```

### Agents & Collections
```
/api/agents/*       - CRUD for AI agents
/api/collections/*  - CRUD for tool collections
/api/chat/*         - Chat conversations
```

### Scenarios (Testing)
```
/api/scenarios/*    - Integration test scenarios
/api/use-cases/*    - AI-generated marketing content
```

### Sync (Cron)
```
/api/sync/changes   - npm changes feed sync
/api/sync/keyword   - npm keyword search sync
/api/sync/metrics   - Download/star metrics sync
```

---

## 4. Dual Execution Flows

### Path A: Playground Flow (Web UI)

```
User Prompt
    ↓
POST /api/tools/execute/[slug]
    ↓
AI Agent (AI SDK v6) - GPT-4 / Claude / etc.
    ↓
Tool Schema (Zod)
    ↓
Executor Resolution: Agent → Collection → System Default
    ↓
EXECUTOR (Railway) - POST /execute-tool
    ↓
SSE Stream Response (chunk, tokens, complete)
```

**SSE Event Types:**
```typescript
{ type: 'chunk', content: 'AI response text...' }
{ type: 'tool_call', toolCallId, toolName, args }
{ type: 'tool_result', toolCallId, toolName, result }
{ type: 'tokens', inputTokens, outputTokens }
{ type: 'complete' }
```

### Path B: MCP Flow (External AI Client)

```
External AI Client (Claude Desktop, etc.)
    ↓
JSON-RPC 2.0
    ↓
POST /api/mcp/[username]/[slug]/[transport]
    ↓
MCP Handler (tools/list, tools/call)
    ↓
Tool Name Resolution (Registry + Bridge tools)
    ↓
Same Executor as Path A
    ↓
JSON-RPC Response
```

---

## 5. Schema Extraction Pipeline

The pipeline that discovers npm packages and extracts tool schemas:

```
NPM Registry (packages with "tpmjs" keyword)
    ↓
Sync Workers (GitHub Actions and on-box timers):
  - /api/sync/changes  (every 2 min)  - npm _changes feed
  - /api/sync/keyword  (every 15 min) - keyword search
  - /api/sync/metrics  (every hour)   - downloads, stars
    ↓
Schema Extraction:
  1. Fetch package from npm
  2. Import via esm.sh (dynamic)
  3. listToolExports() - discover exports
  4. extractToolSchema() - analyze signatures
  5. AI extraction (if needed) - GPT for complex types
  6. validateTpmjsField() - validate schema
  7. Store in database (inputSchema field)
    ↓
Zod / AI SDK Conversion:
  TPMJS Parameters → convertToZodSchema() → Zod Schema
                                               ↓
                                    AI SDK inputSchema
                                               ↓
                            LLM Tool Definition (OpenAI/Anthropic)
```

---

## 6. Executor Architecture

### Executor Contract

All executors implement this HTTP interface:

```typescript
// Execute a tool
POST /execute-tool
Request:  { packageName, name, version, params, env }
Response: { success, output, error, executionTimeMs }

// Health check
GET /health
Response: { status: "ok" }
```

### Implementations

| Executor | Description | Use Case |
|----------|-------------|----------|
| **Railway** (Default) | Sandboxed Node.js, dynamic imports from esm.sh | Production default |
| **Unsandbox Template** | Isolated containers, one-command deploy, always-on HTTPS | Self-hosting |
| **Custom** | User-provided URL endpoint | Private tools |

### Resolution Cascade

```
Agent executorConfig
    ↓ (if not set)
Collection executorConfig
    ↓ (if not set)
System Default (Railway)
```

---

## 7. Database Schema (Logical Groups)

### PACKAGES
- `Package` - NPM package metadata
- `Tool` - Individual tools within packages
- `HealthCheck` - Health check audit history

### USERS
- `User` - Authenticated users
- `Session` - Active sessions
- `Account` - OAuth/credential accounts
- `Verification` - Email verification tokens
- `UserApiKey` - User's encrypted API keys (for AI providers)
- `TpmjsApiKey` - User's TPMJS API keys

### EXECUTION
- `Simulation` - Playground execution records
- `TokenUsage` - Token consumption tracking
- `ExecutionLog` - Detailed execution logs
- `ApiUsageRecord` - API request logs (30-day retention)
- `ApiUsageSummary` - Aggregated usage rollups

### COLLECTIONS
- `Collection` - User-created tool groups
- `CollectionTool` - Many-to-many: Collection ↔ Tool
- `CollectionLike` - User likes on collections
- `CollectionBridgeTool` - Bridge tools in collections

### AGENTS
- `Agent` - AI agent configurations
- `AgentCollection` - Many-to-many: Agent ↔ Collection
- `AgentTool` - Many-to-many: Agent ↔ Tool
- `AgentLike` - User likes on agents
- `Conversation` - Chat sessions
- `Message` - Individual messages

### SYNC
- `SyncCheckpoint` - Sync progress tracking
- `SyncLog` - Sync operation audit trail
- `StatsSnapshot` - Daily registry statistics
- `EndpointHealthReport` - External health monitoring

### SCENARIOS
- `Scenario` - AI-generated test scenarios
- `ScenarioRun` - Scenario execution records
- `ScenarioEmbedding` - Vector embeddings for similarity
- `ScenarioQuota` - Daily usage quotas

### USE CASES
- `UseCase` - Marketing content from scenarios
- `Persona` - User personas for targeting
- `Industry` - Industry categories
- `Category` - Functional categories
- `SocialProof` - Quality metrics display

### ENGAGEMENT
- `ToolLike` - User likes on tools
- `ToolRating` - 1-5 star ratings
- `ToolReview` - Written reviews
- `UserActivity` - Activity stream

### BRIDGE (WIP)
- `BridgeConnection` - Active bridge connections

---

## 8. Background Workers (Self-hosted Schedules)

Jobs call authenticated application endpoints from GitHub Actions or the
on-box `tpmjs-cron` timer. TPMJS does not use a hosted cron provider.

| Schedule | Endpoint | Description |
|----------|----------|-------------|
| Every 2 min | `/api/sync/changes` | npm changes feed |
| Every 15 min | `/api/sync/keyword` | npm keyword search |
| Every hour | `/api/sync/metrics` | Downloads, stars update |
| Daily | `/api/sync/stats-snapshot` | Registry statistics |
| Daily 3am | `/api/sync/cleanup-activity` | Activity cleanup |
| Daily 9am | `/api/cron/discord-summary` | Discord notification |
| Daily | `/api/cron/use-cases` | AI use case generation |

---

## 9. External Services

### Package Sources
- **npm Registry** - Package metadata, changes feed
- **GitHub API** - Stars, repository metadata
- **Bundlephobia** - Package size analysis

### Runtime
- **esm.sh** - Dynamic ESM imports for tool loading
- **Self-hosted box** - podman containers built on-box, fronted by Caddy behind Cloudflare (see [operations/deployment.md](./operations/deployment.md)); cron via systemd timers / GitHub Actions
- **Railway** - Default executor hosting

### Data
- **PostgreSQL 17** - self-hosted container (`tpmjs-pg`) on the tpmjs.com box

### AI Providers
- **OpenAI** - GPT-4, GPT-4 Turbo, embeddings
- **Anthropic** - Claude models
- **Google** - Gemini models
- **Groq** - Fast inference
- **Mistral** - Mistral models

### Notifications
- **Discord** - Daily summary webhooks

---

## 10. Bridge System (WIP)

The Bridge system enables local MCP servers to expose tools through TPMJS:

```
Local MCP Server (Blender, Chrome DevTools, etc.)
    ↓
Bridge CLI (@tpmjs/bridge)
    ↓
POST /api/bridge { type: 'register', tools: [...] }
    ↓
BridgeConnection record (DB)
    ↓
Tool calls via polling:
  GET /api/bridge  → pending tool calls
  POST /api/bridge → tool results
```

**Status:** Work in progress (dashed lines in diagram)

---

## 11. AI Integration Points

### User-Provided Keys
Users bring their own API keys for:
- Agent chats (stored encrypted in `UserApiKey`)
- Custom collection configurations

### Internal Keys (TPMJS)
TPMJS uses internal API keys for:
- Schema extraction (analyzing tool signatures)
- Use case generation (marketing content)
- Scenario evaluation (pass/fail determination)
- Discord summaries

---

## Key Architectural Decisions

### 1. Design System First
All UI uses `@tpmjs/ui` components for consistency.

### 2. No Barrel Exports
Direct imports for better tree-shaking and clearer dependencies:
```typescript
// Good
import { Button } from '@tpmjs/ui/Button/Button';

// Bad
import { Button } from '@tpmjs/ui';
```

### 3. Executor Abstraction
Pluggable execution backends allow:
- Different security/isolation levels
- Self-hosting options
- Custom environments for specific tools

### 4. Dual Protocol Support
Both web UI (SSE) and MCP (JSON-RPC) share the same execution backend, ensuring consistency.

### 5. Real-time npm Sync
The 2-minute changes feed sync ensures new packages are discoverable quickly.

---

## Related Documentation

- [TPMJS Architecture (detailed)](./TPMJS-ARCHITECTURE.md) - In-depth architecture explanation
- [NPM Sync System](../CLAUDE.md#npm-package-syncing-system) - Sync worker details
- [MCP Bridge Status](./MCP-BRIDGE-STATUS.md) - Bridge implementation status
- [Tool Health System](./TOOL_HEALTH_SYSTEM.md) - Health check implementation
