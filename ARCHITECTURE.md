# TPMJS Architecture Documentation

A comprehensive guide to the TPMJS platform architecture - from tool discovery to sandboxed execution, collections, agents, and custom executors.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Database Layer](#3-database-layer)
4. [Tool Execution System](#4-tool-execution-system)
5. [MCP Protocol Implementation](#5-mcp-protocol-implementation)
6. [Agent System](#6-agent-system)
7. [Collection System](#7-collection-system)
8. [NPM Sync System](#8-npm-sync-system)
9. [API Layer](#9-api-layer)
10. [SDK Packages](#10-sdk-packages)
11. [UI & Frontend](#11-ui--frontend)
12. [Security & Authentication](#12-security--authentication)

---

## 1. Platform Overview

TPMJS is a **tool registry platform** that automatically discovers, validates, and executes npm packages as AI agent tools. The platform supports multiple AI providers (OpenAI, Anthropic, Google, Groq, Mistral) and exposes tools via MCP (Model Context Protocol) for use with Claude Desktop, Cursor, and other MCP clients.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER PRODUCTS                                   │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│     tpmjs.com       │    SDK Packages     │         MCP Protocol            │
│  ─────────────────  │  ─────────────────  │  ─────────────────────────────  │
│  • Dashboard        │  • @tpmjs/types     │  • Claude Desktop               │
│  • Tool Browser     │  • registry-search  │  • Cursor                       │
│  • Collection Editor│  • registry-execute │  • Claude Code                  │
│  • Agent Builder    │                     │  • Any MCP Client               │
│  • Playground       │                     │                                 │
└─────────────────────┴─────────────────────┴─────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API LAYER (Next.js 16)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  /api/tools    /api/agents    /api/collections    /api/mcp/*    /api/sync/* │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            INFRASTRUCTURE                                    │
├───────────────────────┬───────────────────────┬─────────────────────────────┤
│       Database        │      Execution        │         External            │
│  ───────────────────  │  ───────────────────  │  ─────────────────────────  │
│  • PostgreSQL (Neon)  │  • Vercel Sandbox     │  • npm Registry             │
│  • Prisma ORM         │  • Custom Executors   │  • esm.sh CDN               │
│                       │                       │  • GitHub API               │
└───────────────────────┴───────────────────────┴─────────────────────────────┘
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Tool** | A single executable function from an npm package |
| **Package** | An npm package containing one or more tools |
| **Collection** | A user-curated bundle of tools exposed via MCP |
| **Agent** | An AI assistant with access to tools and collections |
| **Executor** | A sandboxed environment for running tool code |

---

## 2. Monorepo Structure

TPMJS uses **Turborepo** with **pnpm** workspaces. The codebase is organized into packages and applications.

### Directory Structure

```
tpmjs/
├── apps/
│   ├── web/                    # Main Next.js 16 application
│   ├── playground/             # Interactive tool testing
│   ├── tutorial/               # Tutorial application
│   └── railway-executor/       # Deno executor service
│
├── packages/
│   ├── ui/                     # React component library (@tpmjs/ui)
│   ├── types/                  # TypeScript types & Zod schemas (@tpmjs/types)
│   ├── utils/                  # Utility functions (@tpmjs/utils)
│   ├── env/                    # Environment validation (@tpmjs/env)
│   ├── db/                     # Prisma database client (@tpmjs/db)
│   ├── npm-client/             # NPM Registry API client
│   ├── package-executor/       # Tool execution client
│   ├── config/                 # Shared configs (Biome, ESLint, Tailwind, TS)
│   └── tools/                  # 150+ official TPMJS tools
│       └── official/           # @tpmjs/tools-* packages
│
├── turbo.json                  # Turborepo task configuration
├── pnpm-workspace.yaml         # Workspace definitions
└── vercel.json                 # Deployment & cron configuration
```

### Published Packages (npm @tpmjs scope)

| Package | Version | Purpose |
|---------|---------|---------|
| `@tpmjs/types` | 0.2.0 | TypeScript types and Zod validation schemas |
| `@tpmjs/utils` | 0.1.1 | Utility functions (cn, format helpers) |
| `@tpmjs/ui` | 0.1.3 | React component library (30+ components) |
| `@tpmjs/env` | 0.1.1 | Environment variable validation |

### Internal Packages

| Package | Purpose |
|---------|---------|
| `@tpmjs/db` | Prisma client and database schema |
| `@tpmjs/npm-client` | NPM Registry API client for syncing |
| `@tpmjs/package-executor` | Remote executor HTTP client |
| `@tpmjs/config` | Shared Biome, ESLint, Tailwind, TypeScript configs |

### Key Architecture Principles

1. **No Barrel Exports**: Components imported directly (`@tpmjs/ui/Button/Button`)
2. **Strict Module Boundaries**: Apps import from packages, not vice versa
3. **TypeScript Everywhere**: Strict mode with composite projects
4. **Shared Configurations**: Centralized in `packages/config/`

---

## 3. Database Layer

The database layer uses **Prisma ORM** with **PostgreSQL** (Neon) as the data store.

### Core Models

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TOOL REGISTRY                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Package (1) ──────────────────────► (N) Tool                               │
│  ├── npmPackageName (unique)              ├── id (PK)                       │
│  ├── npmVersion                           ├── name                          │
│  ├── category                             ├── description                   │
│  ├── tier (minimal|rich)                  ├── inputSchema (JSON)            │
│  ├── npmDownloadsLastMonth                ├── qualityScore                  │
│  └── githubStars                          ├── importHealth                  │
│                                           └── executionHealth               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        USER & SOCIAL                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User (1) ──────► (N) Agent ──────► (N) Conversation ──────► (N) Message    │
│       │                │                                                     │
│       │                └──────► (N) AgentTool                               │
│       │                └──────► (N) AgentCollection                         │
│       │                                                                      │
│       └──────► (N) Collection ──────► (N) CollectionTool                    │
│       │                                                                      │
│       └──────► (N) ToolLike, CollectionLike, AgentLike                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        SYNC & MONITORING                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SyncCheckpoint          SyncLog              HealthCheck                   │
│  ├── source (unique)     ├── source           ├── toolId                    │
│  └── checkpoint (JSON)   ├── status           ├── importStatus              │
│                          ├── processed        ├── executionStatus           │
│                          └── errors           └── checkType                 │
│                                                                              │
│  Simulation              TokenUsage           StatsSnapshot                 │
│  ├── toolId              ├── simulationId     ├── date (unique)             │
│  ├── status              ├── inputTokens      ├── totalTools                │
│  └── output              └── totalTokens      └── healthStats               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Query Patterns

**1. Pagination without COUNT (limit+1 technique):**
```typescript
const tools = await prisma.tool.findMany({
  take: limit + 1,  // Fetch one extra to check hasMore
  skip: offset,
});
const hasMore = tools.length > limit;
const actualTools = hasMore ? tools.slice(0, limit) : tools;
```

**2. Atomic Like/Unlike with Transactions:**
```typescript
const [like, updatedTool] = await prisma.$transaction([
  prisma.toolLike.create({ data: { userId, toolId } }),
  prisma.tool.update({
    where: { id: toolId },
    data: { likeCount: { increment: 1 } }
  })
]);
```

**3. Upsert for Idempotent Sync Operations:**
```typescript
await prisma.package.upsert({
  where: { npmPackageName: pkg.name },
  create: { /* ... */ },
  update: { /* ... */ }
});
```

---

## 4. Tool Execution System

The execution system provides sandboxed environments for safely running npm package tools.

### Execution Flow

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   1. REQUEST  │────►│   2. RESOLVE  │────►│   3. EXECUTE  │────►│  4. RESPONSE  │
├───────────────┤     ├───────────────┤     ├───────────────┤     ├───────────────┤
│ SDK:          │     │ Lookup tool   │     │ npm install   │     │ output: any   │
│ registryExec  │     │ by ID         │     │ pkg           │     │               │
│               │     │               │     │               │     │ executionTime │
│ MCP:          │     │ Resolve       │     │ tool.execute  │     │ Ms            │
│ tools/call    │     │ executor      │     │ (params)      │     │               │
│               │     │ config        │     │               │     │ success:      │
│ Agent:        │     │               │     │ Return        │     │ boolean       │
│ tool_call     │     │ Build import  │     │ result        │     │               │
│               │     │ URL           │     │               │     │               │
└───────────────┘     └───────────────┘     └───────────────┘     └───────────────┘
```

### Executor Types

**1. Default Executor (Vercel Sandbox)**
- Pre-configured sandbox environment
- Node.js 22, 2 vCPUs, 2 minute timeout
- Network isolated, per-request env injection
- Automatic npm install

**2. Custom URL Executor**
- User-deployed executor service
- Deploy to Vercel, Railway, AWS Lambda, or self-host
- Custom dependencies pre-installed
- Your own API keys built-in

### Executor Config Cascade

```
┌─────────────────────┐
│   System Default    │ ◄─── Vercel Sandbox
│   (lowest priority) │
└─────────┬───────────┘
          │ overridden by
          ▼
┌─────────────────────┐
│  Collection Config  │ ◄─── executorConfig on Collection
│                     │
└─────────┬───────────┘
          │ overridden by
          ▼
┌─────────────────────┐
│    Agent Config     │ ◄─── executorConfig on Agent
│  (highest priority) │
└─────────────────────┘
```

### Executor API Contract

All executors must implement:

**POST /execute-tool**
```typescript
interface ExecuteToolRequest {
  packageName: string;      // "@tpmjs/hello"
  name: string;             // "helloWorldTool"
  version?: string;         // "1.0.0" or "latest"
  params: Record<string, unknown>;
  env?: Record<string, string>;
}

interface ExecuteToolResponse {
  success: boolean;
  output?: unknown;
  error?: string;
  executionTimeMs: number;
}
```

**GET /health**
```typescript
interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  version?: string;
}
```

---

## 5. MCP Protocol Implementation

TPMJS implements the **Model Context Protocol (MCP)** to expose collections as tool servers for AI clients.

### MCP Endpoints

| Transport | Endpoint | Purpose |
|-----------|----------|---------|
| HTTP | `/api/mcp/{username}/{slug}/http` | Request-response |
| SSE | `/api/mcp/{username}/{slug}/sse` | Streaming |

### JSON-RPC Methods

**initialize** - Returns server capabilities
```json
{
  "protocolVersion": "2024-11-05",
  "serverInfo": { "name": "TPMJS: My Collection", "version": "1.0.0" },
  "capabilities": { "tools": {} }
}
```

**tools/list** - Returns available tools in collection
```json
{
  "tools": [{
    "name": "tpmjs-hello--helloWorldTool",
    "description": "A simple hello world tool",
    "inputSchema": { "type": "object", "properties": { ... } }
  }]
}
```

**tools/call** - Executes a tool
```json
{
  "content": [{ "type": "text", "text": "Hello World!" }]
}
```

### Tool Name Format

MCP tool names are sanitized from npm package names:

```
@tpmjs/hello + helloWorldTool → tpmjs-hello--helloWorldTool
```

---

## 6. Agent System

Agents are AI-powered assistants with multi-turn conversations and tool access.

### Agent Configuration

```typescript
interface Agent {
  // Identity
  id: string;
  uid: string;              // URL-friendly ID
  name: string;
  description?: string;

  // Model Configuration
  provider: 'OPENAI' | 'ANTHROPIC' | 'GOOGLE' | 'GROQ' | 'MISTRAL';
  modelId: string;          // e.g., "gpt-4o", "claude-3-5-sonnet"
  systemPrompt?: string;
  temperature: number;      // 0-2, default 0.7

  // Behavior
  maxToolCallsPerTurn: number;    // 1-100, default 20
  maxMessagesInContext: number;   // 1-100, default 10

  // Visibility
  isPublic: boolean;

  // Executor Override
  executorType?: 'default' | 'custom_url';
  executorConfig?: { url: string; apiKey?: string };

  // Relations
  collections: AgentCollection[];
  tools: AgentTool[];
}
```

### Conversation Flow

```
User Message
     │
     ▼
┌────────────────────────────────────┐
│  Save MESSAGE (role=USER)          │
└────────────────┬───────────────────┘
                 │
                 ▼
┌────────────────────────────────────┐
│  Fetch message history             │
│  (maxMessagesInContext)            │
└────────────────┬───────────────────┘
                 │
                 ▼
┌────────────────────────────────────┐
│  Build AI SDK messages + tools     │
│  • System prompt                   │
│  • Conversation history            │
│  • Tool definitions                │
└────────────────┬───────────────────┘
                 │
                 ▼
┌────────────────────────────────────┐
│  streamText() with tool use        │
│  • SSE chunks to client            │
│  • Tool calls executed             │
│  • Results fed back to model       │
└────────────────┬───────────────────┘
                 │
                 ▼
┌────────────────────────────────────┐
│  Save MESSAGE (role=ASSISTANT)     │
│  Save MESSAGE (role=TOOL) for each │
│  tool call result                  │
└────────────────────────────────────┘
```

### SSE Event Types

| Event | Description |
|-------|-------------|
| `chunk` | Text token from AI |
| `tool_call` | AI decided to call a tool |
| `tool_result` | Tool execution completed |
| `tokens` | Token usage statistics |
| `complete` | Conversation finished |
| `error` | Error occurred |

---

## 7. Collection System

Collections are user-curated bundles of tools that can be shared and exposed via MCP.

### Collection Structure

```typescript
interface Collection {
  id: string;
  name: string;
  slug: string;           // URL-friendly, unique per user
  description?: string;
  isPublic: boolean;

  // Executor Override (applies to all tools)
  executorType?: 'default' | 'custom_url';
  executorConfig?: { url: string; apiKey?: string };

  // Relations
  tools: CollectionTool[];  // Junction table with position, notes
}

interface CollectionTool {
  toolId: string;
  position: number;       // User-defined ordering
  note?: string;          // User notes about the tool
}
```

### Collection Limits

| Limit | Value |
|-------|-------|
| Max collections per user | 50 |
| Max tools per collection | 100 |
| Max name length | 100 chars |
| Max description length | 500 chars |

### MCP Access URLs

Public collections can be accessed via MCP:

```
HTTP: https://tpmjs.com/api/mcp/{username}/{slug}/http
SSE:  https://tpmjs.com/api/mcp/{username}/{slug}/sse
```

---

## 8. NPM Sync System

TPMJS automatically discovers tools from npm using multiple sync strategies.

### Sync Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| Changes Feed | Every 2 min | Monitor npm real-time updates |
| Keyword Search | Every 15 min | Search for `tpmjs` keyword |
| Metrics | Every hour | Update downloads & quality scores |
| Health Check | Daily | Verify tool import/execution |
| Stats Snapshot | Daily | Capture historical statistics |

### Discovery Flow

```
npm Registry
     │
     ├──► Changes Feed (/api/sync/changes)
     │    • Polls /_changes endpoint
     │    • 30 packages per run
     │    • Checkpoint-based (lastSeq)
     │
     └──► Keyword Search (/api/sync/keyword)
          • Searches for keyword:tpmjs
          • 250 packages per run
          • Backup discovery
     │
     ▼
┌────────────────────────────────────┐
│  Validate tpmjs field              │
│  • Multi-tool format (new)         │
│  • Legacy rich format              │
│  • Legacy minimal format           │
└────────────────┬───────────────────┘
                 │
                 ▼
┌────────────────────────────────────┐
│  Auto-discover tools               │
│  • If tools[] missing/empty        │
│  • Call executor listToolExports   │
│  • Extract JSON schemas            │
└────────────────┬───────────────────┘
                 │
                 ▼
┌────────────────────────────────────┐
│  Update database                   │
│  • Upsert Package record           │
│  • Upsert Tool records             │
│  • Trigger health checks           │
└────────────────────────────────────┘
```

### Quality Score Calculation

```typescript
qualityScore = tierScore + downloadsScore + starsScore + richnessScore

// tierScore: 0.6 (rich) or 0.4 (minimal)
// downloadsScore: log10(downloads) / 15, max 0.2
// starsScore: log10(stars) / 10, max 0.1
// richnessScore: +0.04 (params) +0.03 (returns) +0.03 (aiAgent)

// Range: 0.00 - 1.00
```

### tpmjs Field Specification

**Multi-Tool Format (Recommended):**
```json
{
  "tpmjs": {
    "category": "utilities",
    "tools": [
      {
        "name": "helloWorld",
        "description": "Greets a user by name"
      },
      {
        "name": "goodbye",
        "description": "Says goodbye to a user"
      }
    ],
    "frameworks": ["vercel-ai"]
  }
}
```

**Valid Categories:**
- Core: `research`, `web`, `data`, `documentation`, `engineering`, `security`, `statistics`, `ops`, `agent`, `utilities`, `html`, `compliance`
- Legacy: `web-scraping`, `data-processing`, `file-operations`, `communication`, `database`, `api-integration`, `image-processing`, `text-analysis`, `automation`, `ai-ml`, `monitoring`

---

## 9. API Layer

The API is built on Next.js 16 App Router with standardized response formats.

### Response Format

**Success:**
```typescript
{
  success: true,
  data: T,
  meta: {
    version: "1.0.0",
    timestamp: "2025-01-11T...",
    requestId: "uuid"
  },
  pagination?: {
    limit: number,
    offset: number,
    count: number,
    hasMore: boolean
  }
}
```

**Error:**
```typescript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR" | "NOT_FOUND" | "UNAUTHORIZED" | ...,
    message: "Human-readable message",
    details?: { ... }
  },
  meta: { ... }
}
```

### Key Endpoints

| Category | Endpoint | Purpose |
|----------|----------|---------|
| **Tools** | `GET /api/tools` | List/search tools |
| | `POST /api/tools/execute/[...slug]` | Execute tool (SSE) |
| **Agents** | `GET /api/agents` | List user agents |
| | `POST /api/agents/[id]/conversation/[convId]` | Chat with agent (SSE) |
| **Collections** | `GET /api/collections` | List user collections |
| | `POST /api/collections/[id]/tools` | Add tool to collection |
| **MCP** | `POST /api/mcp/{user}/{slug}/{transport}` | MCP protocol |
| **Sync** | `POST /api/sync/changes` | Cron: npm changes |
| **Stats** | `GET /api/stats` | Registry statistics |

### Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Default | 100 requests | 1 minute |
| Strict | 20 requests | 1 minute |
| Tool Execute | 10 requests | 1 hour |
| Conversation | 30 requests | 1 minute |

### Authentication

- **Library:** `better-auth` with Prisma adapter
- **Session:** 7-day expiry, cookie-based
- **Email:** Verification required for login
- **Protected Routes:** Check `auth.api.getSession()`

---

## 10. SDK Packages

### @tpmjs/types

Core TypeScript types and Zod validation schemas.

**Exports:**
- `./tool` - Tool and ToolParameter schemas
- `./registry` - Search result schemas
- `./tpmjs` - tpmjs field validation (validateTpmjsField)
- `./agent` - Agent configuration schemas
- `./collection` - Collection schemas
- `./user` - User profile schemas
- `./executor` - Executor request/response types

### @tpmjs/npm-client (Internal)

NPM Registry API client for sync operations.

**Functions:**
- `fetchChanges()` - Poll changes feed
- `searchByKeyword()` - Search packages
- `fetchLatestPackageWithMetadata()` - Get package info
- `fetchDownloadStats()` - Get npm downloads
- `fetchGitHubStars()` - Get GitHub stars

### @tpmjs/package-executor (Internal)

Remote executor client for tool execution.

**Functions:**
- `executePackage(packageName, functionName, params)` - Execute tool
- `clearCache()` - Clear executor cache
- `checkHealth()` - Check executor health

---

## 11. UI & Frontend

### Component Library (@tpmjs/ui)

30+ React components with no-barrel-exports architecture.

**Categories:**
- **Form:** Button, Input, Select, Checkbox, Radio, Switch, Textarea, Slider
- **Layout:** Card, Container, Section, GridContainer, Header
- **Display:** Badge, ProgressBar, Spinner, Icon, CodeBlock, Table
- **Advanced:** Tabs, AnimatedCounter, StatCard, ActivityStream, FlowDiagram

### Design System

**Color System (CSS Variables):**
```css
/* Backgrounds */
--background, --surface, --surface-secondary, --surface-elevated

/* Text */
--foreground, --foreground-secondary, --foreground-tertiary, --foreground-muted

/* Interactive */
--primary, --secondary, --accent

/* Status */
--success, --error, --warning, --info

/* Borders */
--border, --border-strong
```

**Theme Support:**
- Light mode (default)
- Dark mode (Vercel/Cursor aesthetic)
- `next-themes` provider

### Dashboard Structure

```
/dashboard
├── Overview        # Quick actions, profile, activity
├── Agents          # Create/manage AI agents
│   └── [id]/chat   # Chat interface
├── Collections     # Organize tools
├── Settings
│   └── api-keys    # Manage API keys
└── Likes
    ├── tools
    ├── collections
    └── agents
```

---

## 12. Security & Authentication

### Authentication Flow

```
Sign Up → Email Verification → Sign In → Session Cookie → Protected Routes
```

### API Key Storage

User API keys (OpenAI, Anthropic, etc.) are stored encrypted:
- AES-256-CBC encryption
- Unique IV per key
- Only hint (last 4 chars) visible in UI

### Rate Limiting

- **Distributed:** Vercel KV with in-memory fallback
- **Per-IP:** Based on `x-forwarded-for`, `x-real-ip`, or `cf-connecting-ip`
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

### Cron Security

All sync endpoints require:
```
Authorization: Bearer {CRON_SECRET}
```

Vercel Cron automatically adds this header.

### Executor Verification

Custom executor URLs are verified:
1. HTTPS required in production
2. Private IP ranges blocked
3. Health endpoint checked
4. Test tool execution validated

---

## Quick Reference

### Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `BETTER_AUTH_SECRET` | Yes | Session encryption (32+ chars) |
| `CRON_SECRET` | Yes | Cron job auth (32+ chars) |
| `SANDBOX_EXECUTOR_URL` | No | Default executor URL |
| `GITHUB_TOKEN` | No | GitHub API for stars |

### Commands

```bash
# Development
pnpm dev                          # Run all dev servers
pnpm --filter=@tpmjs/web dev      # Run web app only

# Database
pnpm --filter=@tpmjs/db db:generate  # Generate Prisma client
pnpm --filter=@tpmjs/db db:push      # Push schema changes
pnpm --filter=@tpmjs/db db:studio    # Open Prisma Studio

# Testing
pnpm test                         # Run all tests
pnpm type-check                   # Type-check all packages
pnpm lint                         # Lint all packages

# Building
pnpm build                        # Build all packages
```

### Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.9 (strict) |
| Database | PostgreSQL + Prisma 6.19 |
| Auth | better-auth 1.4 |
| AI SDK | Vercel AI SDK 6.0 |
| Styling | Tailwind CSS 4.1 |
| Build | Turborepo + pnpm |
| Testing | Vitest + Testing Library |
| Deployment | Vercel |

---

*This documentation was auto-generated from codebase exploration. Last updated: January 2025*
