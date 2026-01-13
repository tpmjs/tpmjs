# TPMJS Platform - Complete Feature Documentation

A comprehensive overview of all TPMJS functionality for marketing, fundraising, and pet project ideation.

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Core Architecture](#core-architecture)
3. [Tool Registry & Discovery](#tool-registry--discovery)
4. [Tool Execution System](#tool-execution-system)
5. [MCP (Model Context Protocol) Implementation](#mcp-model-context-protocol-implementation)
6. [Collections System](#collections-system)
7. [Agent System](#agent-system)
8. [API Endpoints](#api-endpoints)
9. [SDK & Packages](#sdk--packages)
10. [Security & Privacy](#security--privacy)
11. [Infrastructure](#infrastructure)
12. [Use Cases](#use-cases)
13. [Competitive Advantages](#competitive-advantages)

---

## Platform Overview

**TPMJS (Tool Package Manager for JavaScript)** is an open platform for discovering, sharing, and executing AI tools via the Model Context Protocol (MCP). Think of it as "npm for AI tools" - a registry where developers can publish tools that AI assistants can use.

### Key Value Propositions

1. **Unified Tool Registry** - One place to discover and use AI tools
2. **Instant MCP Servers** - Any collection becomes an MCP-compatible server
3. **Secure Execution** - Sandboxed tool execution with rate limiting
4. **AI Agent Infrastructure** - Build multi-turn conversational agents with tool access
5. **Developer-Friendly** - Publish tools via npm, use via standard protocols

---

## Core Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS |
| Backend | Next.js API Routes (Serverless) |
| Database | PostgreSQL (Neon) with Prisma ORM |
| Auth | NextAuth.js (GitHub OAuth) |
| Hosting | Vercel (Edge + Serverless) |
| Package Registry | npm (mirrored) |
| Build System | Turborepo + pnpm workspaces |

### Monorepo Structure

```
tpmjs/
├── apps/
│   ├── web/           # Main Next.js application (tpmjs.com)
│   └── playground/    # Interactive tool testing environment
├── packages/
│   ├── @tpmjs/types   # Shared TypeScript types & Zod schemas
│   ├── @tpmjs/ui      # React component library
│   ├── @tpmjs/utils   # Utility functions
│   ├── @tpmjs/env     # Environment variable validation
│   ├── @tpmjs/db      # Prisma database client
│   ├── @tpmjs/mocks   # MSW mock server for testing
│   └── @tpmjs/config  # Shared configs (ESLint, Tailwind, TypeScript)
└── templates/
    └── vercel-executor/  # Template for deploying tool executors
```

---

## Tool Registry & Discovery

### What is a TPMJS Tool?

A TPMJS tool is an npm package with:
1. The `tpmjs` keyword in package.json
2. A `tpmjs` field defining the tool's MCP schema

```json
{
  "name": "my-awesome-tool",
  "keywords": ["tpmjs"],
  "tpmjs": {
    "name": "my-tool",
    "description": "Does awesome things",
    "inputSchema": {
      "type": "object",
      "properties": {
        "query": { "type": "string" }
      },
      "required": ["query"]
    }
  }
}
```

### Tool Tiers

| Tier | Description | Features |
|------|-------------|----------|
| **Minimal** | Basic tool definition | Name, description, input schema only |
| **Rich** | Full-featured tool | Executor URL, examples, categories, tags |

### Discovery Methods

1. **npm Changes Feed Sync** (every 2 minutes)
   - Monitors npm's real-time changes feed
   - Catches new packages and updates instantly
   - Processes ~100 changes per run

2. **Keyword Search Sync** (every 15 minutes)
   - Actively searches npm for `tpmjs` keyword
   - Backfills any missed packages
   - Processes up to 250 packages per run

3. **Metrics Sync** (hourly)
   - Updates download statistics
   - Calculates quality scores
   - Refreshes ranking data

### Quality Scoring Algorithm

```
Quality Score = Tier Score + Downloads Score + Stars Score

Where:
- Tier Score: rich = 0.6, minimal = 0.4
- Downloads Score: min(0.3, log10(downloads + 1) / 10)
- Stars Score: min(0.1, log10(githubStars + 1) / 10)
```

### Tool Categories

- AI/ML
- Development Tools
- Data Processing
- Web Scraping
- APIs & Integrations
- Utilities
- And more...

### Current Registry Stats

- **170+ Official Tools** in the ajax-collection
- **Growing Community Tools** published by developers
- **Real-time Sync** with npm registry

---

## Tool Execution System

### Execution Flow

```
User Request → TPMJS API → Executor Selection → Sandboxed Execution → Response
```

### Executor Types

1. **HTTP Executor** - Calls external HTTP endpoints
2. **Serverless Executor** - Runs in Vercel Edge/Serverless
3. **Code Executor** - Executes arbitrary code in sandbox

### Sandboxing Features

- **Network Isolation** - Zero-trust or semi-trusted modes
- **Timeout Limits** - Configurable per-tool (1-900 seconds)
- **Resource Limits** - Memory and CPU constraints
- **Input Validation** - Zod schema validation

### Executor Template

The `templates/vercel-executor/` provides a ready-to-deploy executor:

```typescript
// Example executor implementation
export async function POST(request: Request) {
  const { tool, input } = await request.json();

  // Validate input against schema
  const validated = toolSchema.parse(input);

  // Execute tool logic
  const result = await executeTool(tool, validated);

  return Response.json(result);
}
```

### Code Execution (via MCP Tool)

The platform includes a powerful code execution tool:

```javascript
// Execute code in 42+ languages
{
  "language": "python",
  "code": "print('Hello, World!')",
  "network_mode": "zerotrust",  // or "semitrusted"
  "ttl": 60  // timeout in seconds
}
```

Supported languages include:
- Python, JavaScript, TypeScript
- Go, Rust, C, C++
- Ruby, PHP, Perl
- Java, Kotlin, Scala
- And 30+ more

---

## MCP (Model Context Protocol) Implementation

### What is MCP?

MCP is an open protocol for AI assistants to interact with tools. TPMJS provides:
- **MCP Server Hosting** - Every collection is an MCP server
- **Multiple Transports** - HTTP and SSE support
- **Standard Compliance** - Full MCP specification support

### Transport Options

#### HTTP Transport
```
POST /api/mcp/{username}/{collection-slug}/http
Content-Type: application/json

{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}
```

#### SSE Transport
```
POST /api/mcp/{username}/{collection-slug}/sse
Content-Type: application/json

{"jsonrpc": "2.0", "id": 1, "method": "initialize"}
```

### MCP Methods Supported

| Method | Description |
|--------|-------------|
| `initialize` | Initialize MCP session |
| `tools/list` | List available tools |
| `tools/call` | Execute a tool |
| `resources/list` | List available resources |
| `resources/read` | Read a resource |
| `prompts/list` | List available prompts |
| `prompts/get` | Get a specific prompt |

### Authentication

- **API Key Auth** - Bearer token in Authorization header
- **Session Auth** - Cookie-based for web users
- **Scopes** - Granular permission control
  - `mcp:access` - Access MCP endpoints
  - `mcp:execute` - Execute tools
  - `tools:read` - List tools
  - `tools:execute` - Execute specific tools
  - `collections:read` - Access collections

### Integration Examples

#### Claude Desktop
```json
{
  "mcpServers": {
    "tpmjs": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-remote",
        "https://tpmjs.com/api/mcp/ajax/ajax-collection/sse"]
    }
  }
}
```

#### Cursor IDE
```json
{
  "mcpServers": {
    "tpmjs": {
      "url": "https://tpmjs.com/api/mcp/ajax/ajax-collection/sse"
    }
  }
}
```

---

## Collections System

### What are Collections?

Collections are curated groups of tools that form an MCP server. Users can:
- Create public or private collections
- Add tools from the registry
- Share collections as MCP endpoints

### Collection Features

- **Custom Naming** - Unique slug per user
- **Tool Curation** - Add/remove tools
- **Access Control** - Public or private
- **MCP Endpoint** - Automatic server generation

### Collection API

```typescript
// Create collection
POST /api/collections
{ "name": "My Tools", "slug": "my-tools", "isPublic": true }

// Add tool to collection
POST /api/collections/{id}/tools
{ "toolId": "tool-123" }

// Get collection's MCP endpoint
GET /api/mcp/{username}/{collection-slug}/http
```

---

## Agent System

### What are TPMJS Agents?

Agents are AI-powered conversational interfaces with access to TPMJS tools. They enable:
- Multi-turn conversations
- Tool execution within context
- Custom system prompts
- Provider flexibility (OpenAI, Anthropic, etc.)

### Agent Configuration

```typescript
interface Agent {
  id: string;
  uid: string;           // Unique identifier
  name: string;
  description?: string;
  provider: "OPENAI" | "ANTHROPIC" | "GOOGLE";
  modelId: string;       // e.g., "gpt-4o-mini"
  systemPrompt?: string;
  isPublic: boolean;
  tools: Tool[];         // Attached tools
}
```

### Agent Features

1. **Multi-Turn Conversations**
   - Persistent chat history
   - Context-aware responses
   - Tool execution in conversation

2. **Provider Flexibility**
   - OpenAI (GPT-4, GPT-4o-mini)
   - Anthropic (Claude)
   - Google (Gemini)
   - Custom providers

3. **Tool Integration**
   - Attach any TPMJS tool
   - Automatic tool calling
   - Result injection into context

4. **Public Chat Pages**
   - Share agents via public URL
   - Embeddable chat interfaces
   - No auth required for public agents

### Agent API

```typescript
// Create agent
POST /api/agents
{ "name": "My Agent", "provider": "OPENAI", "modelId": "gpt-4o-mini" }

// Chat with agent
POST /api/agents/{id}/chat
{ "messages": [{"role": "user", "content": "Hello!"}] }

// Stream response
POST /api/agents/{id}/chat
{ "messages": [...], "stream": true }
```

---

## API Endpoints

### Public Endpoints (No Auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with build info |
| `/api/stats` | GET | Platform statistics |
| `/api/stats/health` | GET | Tool health metrics |
| `/api/tools` | GET | List public tools |
| `/api/tools/{id}` | GET | Get tool details |
| `/api/tools/search` | GET | Search tools |
| `/api/collections/public` | GET | List public collections |

### Authenticated Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user` | GET | Current user profile |
| `/api/user/settings` | PATCH | Update user settings |
| `/api/user/api-keys` | GET/POST | Manage API keys |
| `/api/agents` | CRUD | Agent management |
| `/api/collections` | CRUD | Collection management |

### MCP Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mcp/{user}/{collection}/http` | POST | HTTP transport |
| `/api/mcp/{user}/{collection}/sse` | POST | SSE transport |
| `/api/mcp/{user}/{collection}/http` | GET | Server info |

### Sync Endpoints (Cron)

| Endpoint | Schedule | Description |
|----------|----------|-------------|
| `/api/sync/changes` | */2 * * * * | npm changes feed |
| `/api/sync/keyword` | */15 * * * * | Keyword search |
| `/api/sync/metrics` | 0 * * * * | Metrics update |

### Tool Execution

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tools/{id}/execute` | POST | Execute a tool |
| `/api/execute/code` | POST | Execute code (sandbox) |

---

## SDK & Packages

### Published npm Packages

| Package | Description |
|---------|-------------|
| `@tpmjs/types` | TypeScript types and Zod schemas |
| `@tpmjs/ui` | React component library |
| `@tpmjs/utils` | Utility functions |
| `@tpmjs/env` | Environment validation |

### Type Definitions

```typescript
// Tool types
interface TpmjsTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
  executor?: string;
  category?: string;
  tags?: string[];
}

// MCP types
interface McpRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface McpResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: McpError;
}
```

### UI Components

- Buttons, Cards, Badges
- Form inputs with validation
- Code editors with syntax highlighting
- Chat interfaces
- Tool cards and lists

---

## Security & Privacy

### Authentication Methods

1. **GitHub OAuth** - Primary user auth
2. **API Keys** - Programmatic access
3. **Session Cookies** - Web auth

### API Key Security

- SHA-256 hashed storage
- Prefix-only display after creation
- Scoped permissions
- Optional expiration
- Revocation support

### Rate Limiting

- Per-user limits
- Per-IP limits
- Per-tool limits
- Customizable thresholds

### Data Privacy

- No tool input logging by default
- Optional usage analytics
- GDPR-compliant data handling
- User data export/deletion

### Sandbox Security

- Network isolation modes
- Resource limits
- No persistent storage
- Ephemeral execution

---

## Infrastructure

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Vercel                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Edge      │  │  Serverless │  │   Serverless        │  │
│  │   Network   │→ │  Functions  │→ │   Executors         │  │
│  │   (CDN)     │  │  (API)      │  │   (Tool Runners)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Neon PostgreSQL                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Tools     │  │   Users     │  │   Collections       │  │
│  │   Registry  │  │   & Auth    │  │   & Agents          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Monitoring

- **Health Checks** - Every 5 minutes via GitHub Actions
- **Vercel Analytics** - Performance monitoring
- **Sync Logging** - All sync operations logged
- **Error Tracking** - Automatic error collection

### CI/CD Pipeline

1. **Pre-commit** - Lint, format, type-check (Lefthook)
2. **CI** - Full test suite (GitHub Actions)
3. **Deploy** - Automatic on merge (Vercel)
4. **Health Check** - Post-deploy verification

---

## Use Cases

### For Developers

1. **Publish AI Tools**
   - Package as npm module
   - Add `tpmjs` keyword
   - Automatically synced to registry

2. **Build Tool Collections**
   - Curate tools for specific use cases
   - Share as MCP endpoint
   - Embed in applications

3. **Create AI Agents**
   - Attach tools to agents
   - Custom system prompts
   - Deploy public chat interfaces

### For AI Applications

1. **Integrate Tools**
   - Connect via MCP protocol
   - Use any TPMJS collection
   - Standard JSON-RPC interface

2. **Extend Capabilities**
   - Web scraping, code execution
   - API integrations
   - Data processing

3. **Build Workflows**
   - Chain multiple tools
   - Agent-based automation
   - Custom orchestration

### For Enterprises

1. **Private Tool Registry**
   - Internal tools only
   - Access control
   - Usage analytics

2. **Secure Execution**
   - Sandboxed environments
   - Audit logging
   - Compliance ready

3. **Custom Agents**
   - Brand-specific AI assistants
   - Internal knowledge access
   - Tool-enabled support

---

## Competitive Advantages

### vs. Building Custom MCP Servers

| TPMJS | Custom MCP Server |
|-------|-------------------|
| Instant setup | Days/weeks of development |
| 170+ tools ready | Build each tool |
| Hosted infrastructure | Self-hosted required |
| Automatic scaling | Manual scaling |

### vs. Other Tool Platforms

| Feature | TPMJS | Competitors |
|---------|-------|-------------|
| Open Protocol (MCP) | ✅ | Often proprietary |
| npm Integration | ✅ | Custom registries |
| Self-hostable | ✅ | Usually SaaS-only |
| Code Execution | ✅ | Limited |
| Agent System | ✅ | Separate product |

### Unique Features

1. **npm-Native** - Tools are just npm packages
2. **MCP-First** - Built on open standard
3. **Hybrid Execution** - Local + cloud options
4. **Collection System** - Curated tool sets
5. **Agent Platform** - Full conversational AI

---

## Appendix: Official Tools Collection

The `ajax-collection` includes 170+ tools across categories:

### Web & Data
- `firecrawl-aisdk` - Web crawling and extraction
- `tpmjs-tools-page-brief` - Page summarization
- `tpmjs-tools-search` - Web search

### Development
- `tpmjs-unsandbox` - Code execution (42+ languages)
- `tpmjs-tools-toc-generate` - Markdown TOC generator
- `tpmjs-tools-changelog-entry` - Changelog generation

### Content
- `tpmjs-createblogpost` - Blog post creation
- `tpmjs-tools-recipe-hash` - Recipe/workflow hashing
- `tpmjs-tools-workflow-variant-generate` - Workflow variations

### And Many More...
- API integrations
- Data transformations
- File processing
- Image manipulation
- Text analysis

---

## Summary

TPMJS is a comprehensive platform for AI tool discovery, execution, and orchestration. Key takeaways:

1. **Registry** - npm-native tool discovery with automatic syncing
2. **Execution** - Secure, sandboxed tool running
3. **MCP** - Standard protocol for AI integration
4. **Collections** - Curated tool sets as MCP servers
5. **Agents** - Conversational AI with tool access
6. **Infrastructure** - Production-ready, scalable, monitored

The platform enables developers to publish tools, AI applications to consume them, and enterprises to build secure, tool-enabled AI experiences.
