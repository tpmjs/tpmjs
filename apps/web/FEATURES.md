# TPMJS Features

TPMJS is the universal tool registry for AI agents. Discover, publish, and execute AI tools with one URL.

---

## Table of Contents

- [Tool Discovery](#tool-discovery)
- [Tool Execution](#tool-execution)
- [AI Agents](#ai-agents)
- [Collections](#collections)
- [MCP Integration](#mcp-integration)
- [Publishing Tools](#publishing-tools)
- [API Access](#api-access)
- [Dashboard](#dashboard)
- [Community Features](#community-features)

---

## Tool Discovery

### Search & Browse

- **Full-text search** - BM25-ranked semantic search across 170+ tools
- **Category filtering** - Filter by category (research, web, data, engineering, security, utilities, etc.)
- **Health status filtering** - Filter by import/execution health (Healthy, Degraded, Broken)
- **Official tools** - Browse verified official TPMJS tools
- **Virtualized browsing** - Smooth scrolling through large tool lists

### Tool Details

Each tool page displays:

- Package name and version
- Description and usage examples
- Input parameter schemas (extracted from Zod)
- Required environment variables
- Quality score (0.0 - 1.0)
- Monthly npm downloads
- Health status indicators
- Community ratings and reviews

### Quality Scoring

Tools are automatically scored based on:

- Documentation tier (Rich, Basic, Minimal)
- npm download count
- GitHub stars
- Import and execution health

---

## Tool Execution

### Interactive Playground

Test any tool directly in the browser:

- AI-generated test parameters
- Real-time streaming output
- Execution history
- Error reporting with health status

### Sandboxed Execution

- Tools execute in isolated Deno runtime
- Secure sandboxing on Railway infrastructure
- Rate limiting by tier (Free, Pro, Enterprise)
- Automatic timeout handling

### Dynamic Tool Loading (Beta)

- Tools discovered based on conversation context
- AI automatically selects relevant tools
- No manual configuration required

---

## AI Agents

### Create Custom Agents

Build AI agents with:

- **System prompts** - Define agent behavior and personality
- **Model selection** - Choose from available AI models
- **Tool selection** - Pick specific tools or entire collections
- **Temperature control** - Adjust response creativity

### Agent Features

- **Web chat interface** - Test agents directly in browser
- **Conversation history** - Save and review past conversations
- **Public sharing** - Share agents via unique URLs
- **Forking** - Clone and customize existing agents
- **Analytics** - Track execution history and usage

### Agent Management

- Create, edit, and delete agents
- Toggle public/private visibility
- View fork relationships
- Monitor health and performance

---

## Collections

### Curated Tool Bundles

Group related tools into collections:

- **Create collections** - Bundle tools for specific use cases
- **AI-generated descriptions** - Auto-generate use case descriptions
- **Public sharing** - Share collections with the community
- **Forking** - Clone and customize collections

### Collection Features

- Add/remove tools dynamically
- Set visibility (public/private)
- View included tools with full metadata
- Copy MCP configuration for instant use

---

## MCP Integration

### Universal Compatibility

TPMJS works with any MCP-compatible client:

| Client | Support |
|--------|---------|
| Claude Desktop | Full integration |
| Cursor | Full integration |
| Windsurf | Full integration |
| Any MCP client | JSON-RPC 2.0 |

### Quick Start

Add to `claude_desktop_config.json`:

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

### MCP Endpoints

- **Collection endpoints** - Each collection exposes an MCP server
- **Authentication** - API key-based auth via headers
- **Streaming** - Server-Sent Events (SSE) for real-time responses

### MCP Protocol

Full JSON-RPC 2.0 implementation:

- `initialize` - Establish session
- `tools/list` - Get available tools
- `tools/call` - Execute tools

---

## Publishing Tools

### Auto-Discovery

Publish tools to npm and they appear on TPMJS within minutes:

1. Add `tpmjs` keyword to `package.json`
2. Configure the `tpmjs` field with metadata
3. Publish to npm
4. Tool appears in 2-15 minutes

### Package Configuration

```json
{
  "name": "@your-scope/your-tool",
  "keywords": ["tpmjs"],
  "tpmjs": {
    "category": "utilities",
    "tools": ["myTool", "anotherTool"],
    "envVars": ["API_KEY"]
  }
}
```

### Discovery Methods

- **Changes feed** - Monitors npm real-time (every 2 min)
- **Keyword search** - Active npm search (every 15 min)
- **Manual curation** - High-quality verified tools

### Package Generator

Quick start with the CLI generator:

```bash
npx @tpmjs/create-basic-tools
```

Creates a production-ready package with:

- 2-3 example tools
- Complete TypeScript setup
- Best practices included

---

## API Access

### REST API

```
GET  /api/tools                    - List tools with filters
GET  /api/tools/search             - BM25 semantic search
GET  /api/tools/[pkg]/[tool]       - Get tool details
POST /api/tools/execute/[pkg]/[tool] - Execute tool
GET  /api/public/collections       - List collections
GET  /api/public/agents            - List agents
GET  /api/stats                    - Platform statistics
```

### Authentication

Generate API keys with granular scopes:

| Scope | Permission |
|-------|------------|
| `mcp:execute` | Execute tools via MCP |
| `agent:chat` | Agent conversations |
| `bridge:connect` | Bridge connections |
| `collection:read` | Read collections |
| `usage:read` | View usage analytics |

### Rate Limits

| Tier | Requests/Hour |
|------|---------------|
| Free | 100 |
| Pro | 1,000 |
| Enterprise | 10,000 |

### Streaming Responses

All execution endpoints support SSE streaming for real-time output.

---

## Dashboard

### Overview

- Welcome screen with quick stats
- Recent activity stream
- Quick access to agents and collections

### Agents Management

- View all your agents
- Create new agents
- Edit agent configuration
- Test via chat interface
- View conversation history

### Collections Management

- View all your collections
- Create and edit collections
- Add/remove tools
- Toggle visibility

### Likes & Bookmarks

Save your favorites:

- `/dashboard/likes/tools` - Liked tools
- `/dashboard/likes/agents` - Liked agents
- `/dashboard/likes/collections` - Liked collections

### Settings

- **Profile** - Name, email, avatar
- **API Keys** - Generate and manage TPMJS keys
- **Third-Party Keys** - Store external API credentials
- **Bridge** - Configure Bridge integration

### Usage Analytics

- API call statistics
- Execution counts and success rates
- Error tracking
- Usage against rate limits

---

## Community Features

### Social Engagement

- **Likes** - Like tools, agents, and collections
- **Ratings** - Rate tools (1-5 stars)
- **Reviews** - Leave comments on tools

### Sharing

- **Public profiles** - View user profiles at `/[username]`
- **Copy options** - Multiple formats for sharing:
  - Direct URLs
  - MCP configurations
  - API endpoints

### Forking

Clone and customize:

- Fork public agents
- Fork public collections
- Track fork relationships
- Attribution to original creators

---

## Framework Compatibility

TPMJS tools work with popular AI frameworks:

- **Vercel AI SDK** - Native compatibility
- **LangChain** - Full support
- **LlamaIndex** - Compatible
- **Custom frameworks** - JSON-RPC protocol

---

## Security

- **Sandboxed execution** - Isolated Deno runtime
- **API key rotation** - Secure key management
- **Rate limiting** - Protection against abuse
- **Email verification** - Account security
- **Scoped permissions** - Fine-grained access control

---

## Documentation

Comprehensive guides available:

- [API Documentation](/docs/api) - REST and MCP APIs
- [Publishing Guide](/publish) - How to publish tools
- [MCP Tutorial](/docs/tutorials/mcp) - MCP client setup
- [Custom Executors](/docs/tutorials/custom-executor) - Self-hosted execution
- [Bridge Setup](/docs/tutorials/bridge) - External tool integration
- [Agent Tutorial](/docs/tutorials/agents) - Building AI agents

---

## Platform Stats

- **170+ tools** indexed and searchable
- **Multiple categories** covering diverse use cases
- **Real-time sync** with npm registry
- **Automatic health monitoring**
- **Quality scoring** for all tools

---

## Getting Started

1. **Browse tools** at [tpmjs.com/tool/tool-search](https://tpmjs.com/tool/tool-search)
2. **Try the playground** to test tools interactively
3. **Create an account** to build agents and collections
4. **Generate an API key** for programmatic access
5. **Configure MCP** for Claude, Cursor, or Windsurf

---

*TPMJS - The Tool Package Manager for AI*
