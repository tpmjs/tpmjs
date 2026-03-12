# Agent Skills Declaration: TPMJS

> Machine-consumable capability contract for AI agents — the universal tool registry for AI.

## 1. Platform Identity

**Name:** TPMJS — The Package Manager for JavaScript AI Tools
**URL:** https://tpmjs.com
**Description:** A universal registry and execution platform for AI agent tools. Discover, execute, compose, and publish tools that any AI agent can use — via SDK, CLI, REST API, or MCP protocol.
**Architecture:** Next.js 16 App Router, PostgreSQL (Neon), deployed on Vercel. Tool execution on Railway (Deno). MCP protocol support. Multi-tenant SaaS.

---

## 2. Core Capabilities

### 2.1 Tool Registry

TPMJS indexes AI tools published to npm with the `tpmjs` keyword. Tools follow the Vercel AI SDK v6 tool format (`tool()` from the `ai` package).

**Discovery methods:**
- NPM changes feed polling (every 4 hours)
- NPM keyword search (`tpmjs` keyword, every 6 hours)
- Manual package sync via API
- Web search and browsing at https://tpmjs.com

**Tool metadata:**
- Name, description, input schema (JSON Schema / Zod)
- Package name, version, npm download counts
- Category: `research`, `web`, `data`, `documentation`, `engineering`, `security`, `statistics`, `ops`, `agent`, `sandbox`, `utilities`, `html`, `compliance`
- Quality score (0.00–1.00) based on health, ratings, usage
- Health status: `HEALTHY`, `BROKEN`, or `UNKNOWN` (import + execution checks)
- Tier: `minimal` (basic metadata) or `rich` (full schema + examples)

**Search & browse:**
```bash
# CLI
tpm tool search "web scraping"
tpm tool trending
tpm tool info @tpmjs/official-firecrawl scrapeTool

# REST API
GET https://tpmjs.com/api/tools?category=web&health=HEALTHY
GET https://tpmjs.com/api/tools/search?q=firecrawl
GET https://tpmjs.com/api/tools/trending
```

### 2.2 Tool Execution

Execute any tool from the registry without installing it. The execution server imports the npm package, instantiates the tool, runs it with provided arguments, and returns the result.

**Execution methods:**

```bash
# CLI — direct execution
tpm tool execute firecrawl-scrape --input '{"url":"https://example.com"}'
tpm tool execute my-tool --input-file params.json --stream

# CLI — execute from a collection via MCP
tpm run -c username/collection -t toolName --args '{"key":"value"}' --env API_KEY=xxx

# REST API
POST https://tpmjs.com/api/registry/execute
{
  "toolId": "tool-uuid",
  "args": { "url": "https://example.com" },
  "envVars": { "API_KEY": "..." }
}

# MCP protocol (JSON-RPC 2.0)
POST https://tpmjs.com/api/mcp/username/collection/http
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "scrapeTool",
    "arguments": { "url": "https://example.com" }
  }
}
```

**Execution infrastructure:**
- Stateless tool executor on Railway (Deno runtime)
- Sandbox server for persistent workspaces (Docker containers, 24h TTL)
- Custom executor support (point to your own server URL)
- Environment variables passed securely per-request or stored encrypted per-collection
- Rate limits: 100/hr unauthenticated, 1000/hr free tier, 10000/hr pro tier

### 2.3 Collections

Collections are curated bundles of tools exposed as a single MCP server endpoint. Create a collection, add tools, and any MCP-compatible AI client can connect.

**Collection features:**
- Add tools from registry or npm packages
- Public/private visibility
- Fork and clone collections
- Custom executor configuration per collection
- Encrypted environment variables per collection
- Like, rate, and review
- AI-generated skills.md capability documentation
- AI-generated use cases
- Scenario-based integration testing

```bash
# CLI
tpm collection create
tpm collection add my-collection --package @tpmjs/official-firecrawl
tpm collection add my-collection --search "firecrawl"  # Search + add in one step
tpm collection info username/my-collection
tpm collection update my-col --name "New Name" --public
tpm collection import my-collection --file tools.txt

# REST API
POST https://tpmjs.com/api/collections
GET  https://tpmjs.com/api/collections/{id}
POST https://tpmjs.com/api/collections/{id}/tools/from-package
```

### 2.4 MCP Server

Every public collection is an MCP server. Connect it to Claude Desktop, Claude Code, Cursor, Windsurf, or any MCP-compatible client.

**Endpoint format:**
```
POST https://tpmjs.com/api/mcp/{username}/{collection-slug}/http
SSE  https://tpmjs.com/api/mcp/{username}/{collection-slug}/sse
```

**Supported methods:**
- `initialize` — Handshake with server info and capabilities
- `tools/list` — List all tools with schemas
- `tools/call` — Execute a tool with arguments
- `ping` — Health check
- `notifications/initialized` — Client ready notification

**Authentication:** Bearer token via `Authorization` header. Optional for public collections (read), required for tool execution.

**Pass environment variables:** Use `tpmjs-*` prefixed headers:
```
tpmjs-OPENAI_API_KEY: sk-...
tpmjs-CUSTOM_VAR: value
```

**Generate client config:**
```bash
tpm mcp config username/collection                  # Auto-detect client
tpm mcp config username/collection --client claude   # Claude Desktop
tpm mcp config username/collection --client cursor   # Cursor
tpm mcp config username/collection --client windsurf # Windsurf
```

**Run as local MCP server:**
```bash
tpm mcp serve            # HTTP on port 3333
tpm mcp serve --stdio    # stdio mode for direct client integration
```

### 2.5 SDK (Programmatic)

Two npm packages for integrating TPMJS into your AI agent code:

```bash
npm install @tpmjs/registry-search @tpmjs/registry-execute ai zod
```

**@tpmjs/registry-search** — AI SDK tool that searches the registry:
```typescript
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { registrySearchTool } from '@tpmjs/registry-search';

const result = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: { registrySearch: registrySearchTool },
  prompt: 'Find tools for web scraping',
});
```

**@tpmjs/registry-execute** — AI SDK tool that executes any registry tool:
```typescript
import { registryExecuteTool } from '@tpmjs/registry-execute';

const result = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: {
    registrySearch: registrySearchTool,
    registryExecute: registryExecuteTool,
  },
  maxSteps: 5,
  prompt: 'Scrape https://example.com using Firecrawl',
});
```

### 2.6 CLI

Full-featured command-line interface for all platform operations:

```bash
npm install -g @tpmjs/cli
```

**34 commands across 8 categories:**

| Category | Commands |
|----------|----------|
| Auth | `login`, `logout`, `status`, `whoami` |
| Tools | `search`, `trending`, `info`, `execute`, `init`, `validate` |
| Agents | `list`, `create`, `update`, `delete`, `chat` |
| Collections | `list`, `create`, `info`, `update`, `delete`, `add`, `remove`, `import` |
| Scenarios | `list`, `info`, `generate`, `run`, `test` |
| MCP | `config`, `serve` |
| Publishing | `check`, `preview` |
| Utilities | `doctor`, `update`, `playground`, `run` |

**Global flags:** `--json` (machine output), `--verbose` (debug), `--help`, `--version`

### 2.7 Agents

Create AI agents with tool access, model configuration, and conversational interfaces:

```bash
# CLI
tpm agent create
tpm agent chat <agent-id>
tpm agent chat <agent-id> "What tools can help with data analysis?"

# REST API
POST https://tpmjs.com/api/agents
POST https://tpmjs.com/api/agents/{id}/conversations
```

**Agent features:**
- Model selection: OpenAI, Anthropic, Google, Groq, Mistral
- Temperature, max tool calls, max context messages
- Tool and collection assignment
- Interactive chat with tool calling
- Human-in-the-loop tool approval workflow
- Conversation history and execution logs
- Public/private visibility, fork/clone
- Sandbox mode: auto-injects `shellExec`, `readFile`, `writeFile`, `listFiles` tools with persistent Docker workspace (24h TTL)
- Custom executor support (route tool calls to your own server)

### 2.8 Scenarios (Integration Testing)

Test your collections with AI-powered scenario testing:

```bash
# Generate test scenarios automatically
tpm scenario generate my-collection --count 5

# Run all scenarios
tpm scenario run my-collection

# Test a specific scenario
tpm scenario test <scenario-id> --verbose

# REST API
POST https://tpmjs.com/api/collections/{id}/scenarios/generate
POST https://tpmjs.com/api/scenarios/{id}/run
```

**Scenario features:**
- AI-generated test scenarios from collection analysis
- Pass/fail/error tracking with streak counting
- Quality scoring based on reliability
- Similarity detection (embedding-based dedup)
- Tags and metadata
- Linked to use cases for documentation

### 2.9 Skills & Usage Documentation

Every public collection auto-generates machine-readable documentation:

**skills.md** — AI-generated capability contract:
```bash
curl https://tpmjs.com/@username/collections/slug/skills.md
```
Contains: agent identity, core skills with input schemas, multi-tool workflows, integration methods (CLI/API/MCP), constraints, versioning. Cached 1 week, regenerated on demand.

**usage.md** — Real-world usage examples from tested scenarios:
```bash
curl https://tpmjs.com/@username/collections/slug/usage.md
```
Contains: tested prompts with pass/fail status, reliability scores, grouped by tags.

### 2.10 Memories (Vector Knowledge Base)

Store and retrieve agent memories with semantic search:

```bash
# REST API
POST https://tpmjs.com/api/memories
{
  "content": "The user prefers TypeScript",
  "namespace": "preferences",
  "tags": ["typescript", "config"]
}

# Semantic search
POST https://tpmjs.com/api/memories/search
{
  "query": "What language does the user prefer?",
  "namespace": "preferences",
  "limit": 5
}
```

**Memory features:**
- Content storage (100KB max per memory)
- Auto-generated summaries
- Namespace organization
- Tag-based categorization
- Vector embeddings for semantic search
- TTL/expiration support
- Source tracking (API, agent, context)
- Scoped access via API key permissions

### 2.11 Workflows (Visual Tool Composition)

Compose tools into multi-step workflows with a visual builder:

```bash
# REST API
POST https://tpmjs.com/api/workflows
PUT  https://tpmjs.com/api/workflows/{id}/graph   # Update nodes/edges
POST https://tpmjs.com/api/workflows/{id}/execute  # Run workflow
GET  https://tpmjs.com/api/workflows/{id}/executions/{executionId}
```

**Workflow features:**
- Visual graph builder (nodes + edges)
- Node-level execution tracking
- Execution history and status

### 2.12 Custom MCP Servers

Register and manage external MCP servers alongside TPMJS collections:

```bash
# REST API
POST https://tpmjs.com/api/custom-mcp-servers
{
  "name": "My Custom Server",
  "url": "https://my-server.com/mcp",
  "authType": "bearer",
  "authToken": "..."
}

# Discover tools from remote server
POST https://tpmjs.com/api/custom-mcp-servers/{id}/sync
```

Supports HTTP and stdio-based servers, bearer/basic/custom auth, tool discovery and caching.

### 2.13 Bridge (Local Tool Execution)

Connect local tools running on your machine to TPMJS via the bridge:

```bash
# REST API
POST https://tpmjs.com/api/bridge
{
  "action": "register",
  "tools": [...]
}
```

The bridge enables tool registration, execution result submission, and websocket-like polling for tool calls from the platform.

---

## 3. Publishing Tools

### 3.1 TPMJS Specification

Tools must follow the Vercel AI SDK v6 format:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

export const myTool = tool({
  description: 'What this tool does',
  parameters: z.object({
    input: z.string().describe('The input parameter'),
  }),
  execute: async ({ input }) => {
    return { result: `Processed: ${input}` };
  },
});
```

### 3.2 Package Configuration

Add to your `package.json`:

```json
{
  "name": "@myorg/my-tools",
  "keywords": ["tpmjs"],
  "tpmjs": {
    "category": "utilities",
    "tools": {
      "myTool": {
        "description": "What this tool does",
        "export": "./dist/index.js"
      }
    }
  }
}
```

### 3.3 Publishing Workflow

```bash
# Initialize a new tool package
tpm tool init my-tool --template rich --category utilities

# Validate configuration
tpm tool validate

# Check discovery status
tpm publish check @myorg/my-tools

# Preview appearance
tpm publish preview

# Publish to npm (TPMJS discovers automatically)
npm publish
```

**Quality scoring factors:**
- Health status (import + execution checks)
- Community ratings and reviews
- Download counts
- View and execution counts
- Schema completeness (rich vs minimal tier)
- Skills documentation generated

---

## 4. REST API Reference

### Authentication

```bash
# API key authentication
Authorization: Bearer tpmjs_xxxxxxxxxxxx

# Session-based (web UI)
# OAuth: GitHub, Google
```

**API key management:**
```bash
# Create/manage at https://tpmjs.com/dashboard/settings
# Or via API:
POST https://tpmjs.com/api/user/tpmjs-api-keys
GET  https://tpmjs.com/api/user/tpmjs-api-keys
POST https://tpmjs.com/api/user/tpmjs-api-keys/{id}/rotate
```

**API key scopes:** `mcp:execute`, `agent:chat`, `bridge:connect`, `usage:read`, `memory:write`, and more.

### Tools API

```
GET  /api/tools                          # List tools (filterable)
GET  /api/tools/search?q={query}         # Search tools
GET  /api/tools/trending                 # Trending tools
GET  /api/tools/{slug}                   # Tool details
POST /api/tools/execute/{slug}           # Execute tool (playground)
POST /api/registry/execute               # Execute tool (programmatic)
POST /api/tools/extract-schema           # Auto-extract input schema
GET  /api/tools/{id}/reviews             # Tool reviews
POST /api/tools/{id}/rate                # Rate tool
POST /api/tools/{id}/like                # Like tool
POST /api/tools/report-health            # Report health check
GET  /api/tools/broken                   # List broken tools
```

### Collections API

```
GET    /api/collections                           # List collections
POST   /api/collections                           # Create collection
GET    /api/collections/{id}                      # Get collection
PATCH  /api/collections/{id}                      # Update collection
DELETE /api/collections/{id}                      # Delete collection
POST   /api/collections/{id}/tools/{toolId}       # Add tool
DELETE /api/collections/{id}/tools/{toolId}       # Remove tool
POST   /api/collections/{id}/tools/from-package   # Add tools from npm package
POST   /api/collections/{id}/like                 # Like/unlike
POST   /api/collections/{id}/clone                # Clone collection
POST   /api/collections/{id}/scenarios/generate   # Generate test scenarios
POST   /api/collections/{id}/use-cases/generate   # Generate use cases
GET    /api/public/collections                    # List public collections
```

### Agents API

```
GET    /api/agents                                          # List agents
POST   /api/agents                                          # Create agent
GET    /api/agents/{id}                                     # Get agent
PATCH  /api/agents/{id}                                     # Update agent
DELETE /api/agents/{id}                                     # Delete agent
POST   /api/agents/{id}/tools/{toolId}                      # Add tool
DELETE /api/agents/{id}/tools/{toolId}                      # Remove tool
POST   /api/agents/{id}/collections/{collectionId}          # Add collection
DELETE /api/agents/{id}/collections/{collectionId}          # Remove collection
GET    /api/agents/{id}/conversations                       # List conversations
POST   /api/agents/{id}/conversations                       # Start conversation
GET    /api/agents/{id}/conversation/{conversationId}       # Get conversation
POST   /api/agents/{id}/conversation/{conversationId}/approval  # Approve/deny tool call
POST   /api/agents/{id}/clone                               # Clone agent
```

### MCP API

```
POST /api/mcp/{username}/{slug}/http     # MCP HTTP transport
GET  /api/mcp/{username}/{slug}/sse      # MCP SSE transport
```

### Scenarios API

```
GET    /api/scenarios                     # List scenarios
POST   /api/scenarios                     # Create scenario
GET    /api/scenarios/{id}                # Get scenario
PATCH  /api/scenarios/{id}                # Update scenario
DELETE /api/scenarios/{id}                # Delete scenario
POST   /api/scenarios/{id}/run            # Run scenario
GET    /api/scenarios/{id}/runs           # Get run history
GET    /api/scenarios/featured            # Featured scenarios
POST   /api/scenarios/check-similarity    # Check for duplicates
```

### Memories API

```
GET    /api/memories                      # List memories
POST   /api/memories                      # Create memory
GET    /api/memories/{id}                 # Get memory
PATCH  /api/memories/{id}                 # Update memory
DELETE /api/memories/{id}                 # Delete memory
POST   /api/memories/search              # Semantic search
```

### Workflows API

```
GET    /api/workflows                               # List workflows
POST   /api/workflows                               # Create workflow
GET    /api/workflows/{id}                           # Get workflow
PATCH  /api/workflows/{id}                           # Update workflow
DELETE /api/workflows/{id}                           # Delete workflow
PUT    /api/workflows/{id}/graph                     # Update graph (nodes/edges)
POST   /api/workflows/{id}/execute                   # Execute workflow
GET    /api/workflows/{id}/executions/{executionId}  # Get execution
```

### User & Admin API

```
GET    /api/user/profile                  # Get profile
PATCH  /api/user/profile                  # Update profile
GET    /api/user/usage                    # Usage statistics
GET    /api/user/activity                 # Activity feed
GET    /api/user/activity-dashboard       # Activity dashboard
GET    /api/user/likes/tools              # Liked tools
GET    /api/user/likes/collections        # Liked collections
GET    /api/user/likes/agents             # Liked agents
POST   /api/track/view                    # Track views
GET    /api/stats                         # Registry statistics
GET    /api/activity/public               # Public activity feed
GET    /api/admin/stats                   # Admin stats (admin only)
GET    /api/admin/users                   # User management (admin only)
GET    /api/admin/search-logs             # Search analytics (admin only)
```

### Health & Sync API

```
GET  /api/health                          # Health check (no DB)
GET  /api/health/report                   # Detailed health + commit info
POST /api/sync/package                    # Sync specific npm package
POST /api/sync/changes                    # NPM changes feed sync
POST /api/sync/keyword                    # NPM keyword search
POST /api/sync/enrich                     # Schema extraction + health
POST /api/sync/metrics                    # Download stats + quality
POST /api/sync/health-check               # Full health check (all tools)
POST /api/sync/stats-snapshot             # Daily stats snapshot
```

---

## 5. Collection Documentation Endpoints

Every public collection exposes these documentation URLs:

| Endpoint | Content |
|----------|---------|
| `/{username}/collections/{slug}/skills.md` | AI-generated capability contract for agents |
| `/{username}/collections/{slug}/usage.md` | Real-world usage examples from tested scenarios |
| `/api/mcp/{username}/{slug}/http` | MCP HTTP endpoint for tool execution |
| `/api/mcp/{username}/{slug}/sse` | MCP SSE endpoint for streaming |

---

## 6. Sandbox (Persistent Agent Workspaces)

Agents can enable sandbox mode to get a persistent Docker workspace:

**Auto-injected tools when sandbox is enabled:**
- `shellExec` — Execute shell commands in the sandbox
- `readFile` — Read files from the sandbox workspace
- `writeFile` — Write files to the sandbox workspace
- `listFiles` — List files in the sandbox workspace

**Session lifecycle:**
- Session ID: `agentId:conversationId`
- TTL: 24 hours of inactivity, extended on each tool call
- After expiry: workspace deleted, next message starts fresh
- Sandbox tools route to sandbox server; other tools route to configured executor

**Environment variables:**
- `AGENT_SANDBOX_URL` — Sandbox server URL
- `AGENT_SANDBOX_API_KEY` — Authentication key

---

## 7. Executors

Executors define where tool code runs:

| Executor Type | Description |
|---------------|-------------|
| `default` | TPMJS infrastructure (Railway/Deno) |
| `custom_url` | Your own HTTP server |

An agent can use both a custom executor AND sandbox simultaneously. Sandbox tools always route to the sandbox server; non-sandbox tools route to the configured executor.

---

## 8. Rate Limits & Quotas

| Tier | Rate Limit | Features |
|------|-----------|----------|
| Unauthenticated | 100 req/hr (IP-based) | Read-only, playground |
| Free | 1,000 req/hr | Full API access |
| Pro | 10,000 req/hr | Priority execution |
| Enterprise | Custom | Custom limits, SLA |

Per-API-key rate limit overrides are supported.

---

## 9. Integrations

### Claude Desktop
```json
{
  "mcpServers": {
    "tpmjs": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-remote", "https://tpmjs.com/api/mcp/username/collection/sse"]
    }
  }
}
```

### Claude Code CLI
```bash
claude mcp add tpmjs -- npx -y @anthropic/mcp-remote https://tpmjs.com/api/mcp/username/collection/sse
```

### Cursor
```json
{
  "mcpServers": {
    "tpmjs": {
      "url": "https://tpmjs.com/api/mcp/username/collection/sse"
    }
  }
}
```

### Windsurf
```json
{
  "mcpServers": {
    "tpmjs": {
      "serverUrl": "https://tpmjs.com/api/mcp/username/collection/sse"
    }
  }
}
```

### Local MCP Server
```bash
tpm mcp serve          # HTTP on port 3333
tpm mcp serve --stdio  # stdio mode
```

---

## 10. Constraints & Safety

**This platform does NOT:**
- Store or execute arbitrary user code outside of sandboxed containers
- Expose private collections or tools to unauthenticated users
- Allow cross-tenant access to memories, agents, or conversations
- Bypass rate limits or quotas

**Security:**
- API keys are hashed and stored securely
- Environment variables are encrypted at rest
- Sandbox containers are isolated per session
- OAuth-based authentication (GitHub, Google)
- Credential files stored with restricted permissions (0600)

---

## 11. Versioning

**Skills Version:** 1.0.0
**Generated:** 2026-03-10
**Platform URL:** https://tpmjs.com
**Documentation:** https://tpmjs.com/docs
**CLI Docs:** https://tpmjs.com/docs/cli
**GitHub:** https://github.com/tpmjs/tpmjs

---

## 12. Canonical References

- **TPMJS Platform:** https://tpmjs.com
- **Documentation:** https://tpmjs.com/docs
- **CLI Reference:** https://tpmjs.com/docs/cli
- **API Health:** https://tpmjs.com/api/health
- **npm:** https://www.npmjs.com/package/@tpmjs/cli
- **SDK Search:** https://www.npmjs.com/package/@tpmjs/registry-search
- **SDK Execute:** https://www.npmjs.com/package/@tpmjs/registry-execute
- **MCP Protocol:** https://modelcontextprotocol.io
- **GitHub:** https://github.com/tpmjs/tpmjs
