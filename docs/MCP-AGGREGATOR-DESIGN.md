# TPMJS MCP Aggregator: One MCP Server to Rule Them All

A design document for importing tools from external MCP servers into TPMJS collections, enabling a single unified MCP endpoint.

---

## Table of Contents

1. [The Vision](#the-vision)
2. [Current State](#current-state)
3. [The Challenge](#the-challenge)
4. [Architecture Options](#architecture-options)
5. [Recommended Implementation](#recommended-implementation)
6. [Technical Specifications](#technical-specifications)
7. [User Experience](#user-experience)
8. [Implementation Phases](#implementation-phases)

---

## The Vision

**Goal**: Add one MCP server to Claude Desktop and control ALL your tools from TPMJS.

```
Before (Current State):
┌─────────────────────────────────────────┐
│  Claude Desktop / Cursor / Claude Code  │
│                                         │
│  MCP Servers:                           │
│  ├── tpmjs.com/mcp/user/my-tools       │  ← TPMJS collection
│  ├── chrome-devtools-mcp               │  ← Local stdio
│  ├── browser-mcp                       │  ← Local stdio
│  ├── filesystem-mcp                    │  ← Local stdio
│  └── slack-mcp                         │  ← Local stdio
└─────────────────────────────────────────┘

After (With Aggregator):
┌─────────────────────────────────────────┐
│  Claude Desktop / Cursor / Claude Code  │
│                                         │
│  MCP Servers:                           │
│  └── tpmjs.com/mcp/user/unified        │  ← ONE server with ALL tools
│                                         │
│      Contains:                          │
│      ├── npm tools (remote)             │
│      ├── chrome tools (via bridge)      │
│      ├── browser tools (via bridge)     │
│      ├── filesystem tools (via bridge)  │
│      └── slack tools (via bridge)       │
└─────────────────────────────────────────┘
```

**Benefits**:
- Single MCP configuration
- Centralized tool management via TPMJS UI
- Mix remote npm tools with local MCP tools
- Easy sharing of tool configurations
- Unified environment variable management

---

## Current State

### TPMJS as MCP Server

TPMJS already exposes collections as MCP servers:

```
Endpoint: /api/mcp/{username}/{slug}/{transport}
Transport: HTTP or SSE
Protocol: JSON-RPC 2.0
```

**Supported Methods**:
- `initialize` - Server handshake
- `tools/list` - List all tools in collection
- `tools/call` - Execute a tool

**Tool Source**: Currently only npm packages synced from the TPMJS registry.

### What We Need to Add

1. **MCP Client Capability**: Connect TO other MCP servers
2. **Tool Import**: Pull tool definitions from external MCP servers
3. **Proxy Execution**: Route tool calls to original MCP server
4. **Bridge Infrastructure**: Handle local stdio-based servers

---

## The Challenge

### Transport Mismatch

Most powerful MCP servers use **stdio transport** which requires local execution:

| MCP Server | Transport | Why |
|------------|-----------|-----|
| Chrome DevTools MCP | stdio | Controls local Chrome via DevTools Protocol |
| Claude in Chrome | Native Messaging | Controls user's browser via Chrome extension |
| Browser MCP | stdio + extension | Puppeteer on user's machine |
| Filesystem MCP | stdio | Reads/writes local files |
| Git MCP | stdio | Operates on local git repos |

**Problem**: TPMJS runs in the cloud. It cannot directly connect to stdio-based MCP servers on user's machines.

### The Bridge Requirement

```
User's Machine                         TPMJS Cloud
┌────────────────────────────┐        ┌─────────────────────────────┐
│                            │        │                             │
│  ┌──────────────────────┐  │        │  ┌───────────────────────┐  │
│  │  Chrome DevTools MCP │  │        │  │  TPMJS cannot reach   │  │
│  │  (stdio)             │  │        │  │  local stdio servers  │  │
│  └──────────────────────┘  │   ✗    │  │  directly             │  │
│  ┌──────────────────────┐  │────────│  │                       │  │
│  │  Filesystem MCP      │  │        │  └───────────────────────┘  │
│  │  (stdio)             │  │        │                             │
│  └──────────────────────┘  │        │                             │
└────────────────────────────┘        └─────────────────────────────┘

                          NEED: A BRIDGE
```

---

## Architecture Options

### Option A: Full Cloud (Limited)

Only support MCP servers that expose HTTP/SSE endpoints.

```
TPMJS Cloud
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  TPMJS MCP Aggregator                               │   │
│  │                                                     │   │
│  │  Connects to:                                       │   │
│  │  ├── Remote MCP Server A (HTTP) ✓                   │   │
│  │  ├── Remote MCP Server B (SSE) ✓                    │   │
│  │  └── Local MCP Server (stdio) ✗                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Pros**: Simple, no user setup
**Cons**: Can't use Chrome, filesystem, or other local tools

---

### Option B: User-Hosted Bridge (CLI)

User runs a bridge CLI that connects local MCP servers to TPMJS.

```
User's Machine                              TPMJS Cloud
┌────────────────────────────────┐         ┌─────────────────────────────┐
│                                │         │                             │
│  ┌──────────────────────────┐  │         │  ┌───────────────────────┐  │
│  │  tpmjs-bridge CLI        │◀─┼── WSS ──┼─▶│  TPMJS API            │  │
│  │                          │  │         │  │                       │  │
│  │  Connects to local MCP:  │  │         │  │  Routes tool calls    │  │
│  │  ├── chrome-devtools     │  │         │  │  to user's bridge     │  │
│  │  ├── filesystem          │  │         │  │                       │  │
│  │  └── custom servers      │  │         │  └───────────────────────┘  │
│  └──────────────────────────┘  │         │                             │
│             │                  │         │                             │
│             ▼                  │         │                             │
│  ┌──────────────────────────┐  │         │                             │
│  │  Local MCP Servers       │  │         │                             │
│  │  (stdio)                 │  │         │                             │
│  └──────────────────────────┘  │         │                             │
└────────────────────────────────┘         └─────────────────────────────┘
```

**Flow**:
1. User runs: `npx tpmjs-bridge --servers chrome-devtools,filesystem`
2. Bridge connects to TPMJS via WebSocket
3. Bridge discovers tools from local MCP servers
4. TPMJS receives tool definitions
5. Tool calls route: TPMJS → Bridge → Local MCP → Result → Bridge → TPMJS

**Pros**: Full local tool access, works with any MCP server
**Cons**: Requires CLI running, connection management

---

### Option C: Browser Extension Bridge

Use browser extension with native messaging for bridge functionality.

```
Browser (with TPMJS Extension)
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  TPMJS Web App                     TPMJS Extension                  │
│  ┌─────────────────────┐          ┌─────────────────────────────┐  │
│  │                     │◀─ msgs ─▶│  Native Messaging Host      │  │
│  │  Tool Management    │          │  ┌───────────────────────┐  │  │
│  │  UI                 │          │  │ Connects to MCP       │  │  │
│  └─────────────────────┘          │  │ servers via stdio     │  │  │
│                                    │  └───────────────────────┘  │  │
│                                    └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                                    ┌───────────────────┐
                                    │  Local MCP        │
                                    │  Servers (stdio)  │
                                    └───────────────────┘
```

**Pros**: No CLI needed, browser-native
**Cons**: Complex setup, browser-dependent

---

### Option D: Hybrid Approach (Recommended)

Combine cloud + bridge for best of both worlds:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              TPMJS Platform                            │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                      MCP Aggregator Service                       │ │
│  │                                                                   │ │
│  │  Tool Sources:                                                    │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │ │
│  │  │  npm Registry   │  │  Remote MCP     │  │  User Bridge    │   │ │
│  │  │  (always avail) │  │  (HTTP/SSE)     │  │  (when online)  │   │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘   │ │
│  │         │                     │                    │              │ │
│  │         ▼                     ▼                    ▼              │ │
│  │  ┌────────────────────────────────────────────────────────────┐  │ │
│  │  │                 Unified Tool Registry                       │  │ │
│  │  │                                                            │  │ │
│  │  │  Tools:                                                    │  │ │
│  │  │  ├── @tpmjs/hello.helloWorld          [npm]    ✓ always   │  │ │
│  │  │  ├── slack.postMessage                 [remote] ✓ always   │  │ │
│  │  │  ├── chrome.navigate                   [bridge] ? online   │  │ │
│  │  │  └── filesystem.readFile               [bridge] ? online   │  │ │
│  │  └────────────────────────────────────────────────────────────┘  │ │
│  │                              │                                    │ │
│  │                              ▼                                    │ │
│  │  ┌────────────────────────────────────────────────────────────┐  │ │
│  │  │              MCP Server Endpoint                            │  │ │
│  │  │              /api/mcp/{user}/{collection}/http              │  │ │
│  │  └────────────────────────────────────────────────────────────┘  │ │
│  │                                                                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
                           │                              ▲
                           ▼                              │
              ┌─────────────────────────┐    WebSocket    │
              │  MCP Client             │─────────────────┘
              │  (Claude Desktop, etc.) │
              └─────────────────────────┘

                     User's Machine
              ┌─────────────────────────────────────┐
              │                                     │
              │  ┌───────────────────────────────┐ │
              │  │  tpmjs-bridge                 │ │
              │  │  Connected to TPMJS via WSS   │◀──── (WebSocket)
              │  │                               │ │
              │  │  Local MCP Servers:           │ │
              │  │  ├── chrome-devtools (stdio)  │ │
              │  │  ├── filesystem (stdio)       │ │
              │  │  └── custom (stdio)           │ │
              │  └───────────────────────────────┘ │
              │                                     │
              └─────────────────────────────────────┘
```

---

## Recommended Implementation

### Core Components

#### 1. MCP Client Library (`@tpmjs/mcp-client`)

A package that can connect to MCP servers and proxy their tools.

```typescript
// packages/mcp-client/src/index.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export interface MCPServerConfig {
  id: string;
  name: string;
  transport: 'stdio' | 'http' | 'sse';

  // For stdio
  command?: string;
  args?: string[];

  // For http/sse
  url?: string;
  headers?: Record<string, string>;
}

export class MCPClientManager {
  private clients: Map<string, Client> = new Map();

  async connect(config: MCPServerConfig): Promise<void> {
    const client = new Client({
      name: 'tpmjs-aggregator',
      version: '1.0.0',
    });

    let transport;
    if (config.transport === 'stdio') {
      transport = new StdioClientTransport({
        command: config.command!,
        args: config.args || [],
      });
    } else {
      transport = new StreamableHTTPClientTransport(
        new URL(config.url!),
        { headers: config.headers }
      );
    }

    await client.connect(transport);
    this.clients.set(config.id, client);
  }

  async listTools(serverId: string) {
    const client = this.clients.get(serverId);
    if (!client) throw new Error(`Server ${serverId} not connected`);
    return client.listTools();
  }

  async callTool(serverId: string, name: string, args: unknown) {
    const client = this.clients.get(serverId);
    if (!client) throw new Error(`Server ${serverId} not connected`);
    return client.callTool({ name, arguments: args as Record<string, unknown> });
  }

  async disconnect(serverId: string) {
    const client = this.clients.get(serverId);
    if (client) {
      await client.close();
      this.clients.delete(serverId);
    }
  }
}
```

#### 2. Bridge CLI (`tpmjs-bridge`)

Runs on user's machine, connects local MCP servers to TPMJS.

```typescript
// packages/tpmjs-bridge/src/index.ts
#!/usr/bin/env node

import { MCPClientManager, MCPServerConfig } from '@tpmjs/mcp-client';
import WebSocket from 'ws';

interface BridgeConfig {
  apiKey: string;
  tpmjsUrl: string;
  servers: MCPServerConfig[];
}

class TPMJSBridge {
  private mcpManager: MCPClientManager;
  private ws: WebSocket | null = null;
  private config: BridgeConfig;

  constructor(config: BridgeConfig) {
    this.config = config;
    this.mcpManager = new MCPClientManager();
  }

  async start() {
    // 1. Connect to all local MCP servers
    for (const server of this.config.servers) {
      console.log(`Connecting to ${server.name}...`);
      await this.mcpManager.connect(server);
    }

    // 2. Gather all tools from connected servers
    const allTools = [];
    for (const server of this.config.servers) {
      const { tools } = await this.mcpManager.listTools(server.id);
      allTools.push(...tools.map(t => ({
        ...t,
        serverId: server.id,
        serverName: server.name,
      })));
    }

    // 3. Connect to TPMJS WebSocket (requires API key with bridge:connect scope)
    this.ws = new WebSocket(
      `${this.config.tpmjsUrl}/api/bridge?token=${this.config.apiKey}` // apiKey format: tpmjs_sk_...
    );

    this.ws.on('open', () => {
      console.log('Connected to TPMJS');
      // Register available tools
      this.ws!.send(JSON.stringify({
        type: 'register',
        tools: allTools,
      }));
    });

    this.ws.on('message', async (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'tool_call') {
        // Execute tool via local MCP server
        const result = await this.mcpManager.callTool(
          message.serverId,
          message.toolName,
          message.args
        );

        // Send result back
        this.ws!.send(JSON.stringify({
          type: 'tool_result',
          callId: message.callId,
          result,
        }));
      }
    });

    this.ws.on('close', () => {
      console.log('Disconnected from TPMJS, reconnecting...');
      setTimeout(() => this.start(), 5000);
    });
  }
}

// CLI entry point
// API key is loaded from ~/.tpmjs/credentials.json (format: tpmjs_sk_...)
const config = loadConfig(); // from ~/.tpmjs/bridge.json
const bridge = new TPMJSBridge(config);
bridge.start();
```

#### 3. Bridge WebSocket API (`/api/bridge`)

Server-side handler for bridge connections.

**Authentication:** Requires TPMJS API key (format: `tpmjs_sk_...`) with `bridge:connect` scope.

```typescript
// apps/web/src/app/api/bridge/route.ts
import { prisma } from '@tpmjs/db';
import { authenticateRequest, hasScope } from '~/lib/api-keys/middleware';

export const runtime = 'nodejs';

// WebSocket upgrade handler
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  // Validate API key (must have bridge:connect scope)
  const authResult = await authenticateRequest();
  if (!authResult.authenticated || !hasScope(authResult, 'bridge:connect')) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Upgrade to WebSocket
  const { socket, response } = Deno.upgradeWebSocket(request);

  socket.onmessage = async (event) => {
    const message = JSON.parse(event.data);

    if (message.type === 'register') {
      // Store bridge tools in database
      await prisma.bridgeConnection.upsert({
        where: { userId: user.id },
        update: {
          tools: message.tools,
          lastSeen: new Date(),
          status: 'connected',
        },
        create: {
          userId: user.id,
          tools: message.tools,
          lastSeen: new Date(),
          status: 'connected',
        },
      });
    }

    if (message.type === 'tool_result') {
      // Forward result to waiting request
      pendingCalls.get(message.callId)?.resolve(message.result);
    }
  };

  socket.onclose = async () => {
    await prisma.bridgeConnection.update({
      where: { userId: user.id },
      update: { status: 'disconnected' },
    });
  };

  return response;
}
```

#### 4. Database Schema Updates

```prisma
// packages/db/prisma/schema.prisma

// Track connected bridges
model BridgeConnection {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  tools     Json     // Array of tool definitions from bridge
  status    String   // 'connected' | 'disconnected'
  lastSeen  DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Track external MCP servers added to collections
model ExternalMCPServer {
  id           String @id @default(cuid())
  collectionId String
  collection   Collection @relation(fields: [collectionId], references: [id])

  name         String
  transport    String  // 'http' | 'sse' | 'bridge'

  // For HTTP/SSE
  url          String?
  headers      Json?   // Encrypted headers

  // For bridge (tool IDs from user's connected bridge)
  bridgeToolIds String[]

  // Cached tool definitions
  tools        Json?
  lastSync     DateTime?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// Update Collection to include external servers
model Collection {
  // ... existing fields ...

  externalServers ExternalMCPServer[]
}
```

#### 5. Enhanced MCP Handlers

```typescript
// apps/web/src/lib/mcp/handlers.ts

export async function handleToolsList(
  collection: CollectionWithTools,
  userId: string
): Promise<MCPToolsListResult> {
  const tools: MCPTool[] = [];

  // 1. Add npm-based tools (existing)
  for (const ct of collection.tools) {
    tools.push(convertToMCPTool(ct.tool));
  }

  // 2. Add remote MCP server tools
  for (const server of collection.externalServers) {
    if (server.transport === 'http' || server.transport === 'sse') {
      const serverTools = await fetchRemoteMCPTools(server);
      tools.push(...serverTools.map(t => ({
        ...t,
        name: `${server.name}--${t.name}`, // Namespace by server
      })));
    }
  }

  // 3. Add bridge tools (if user has connected bridge)
  const bridge = await prisma.bridgeConnection.findUnique({
    where: { userId },
  });

  if (bridge?.status === 'connected') {
    for (const server of collection.externalServers) {
      if (server.transport === 'bridge') {
        const bridgeTools = bridge.tools.filter(
          t => server.bridgeToolIds.includes(t.id)
        );
        tools.push(...bridgeTools.map(t => ({
          ...t,
          name: `${server.name}--${t.name}`,
        })));
      }
    }
  }

  return { tools };
}

export async function handleToolsCall(
  collection: CollectionWithTools,
  userId: string,
  toolName: string,
  args: unknown
): Promise<MCPToolResult> {
  // Parse namespaced tool name
  const [serverName, actualToolName] = toolName.split('--');

  // Find the server
  const server = collection.externalServers.find(s => s.name === serverName);

  if (!server) {
    // Must be an npm tool, use existing logic
    return executeNpmTool(collection, toolName, args);
  }

  if (server.transport === 'http' || server.transport === 'sse') {
    // Call remote MCP server directly
    return callRemoteMCPTool(server, actualToolName, args);
  }

  if (server.transport === 'bridge') {
    // Route through user's bridge
    return callBridgeTool(userId, server, actualToolName, args);
  }
}

async function callBridgeTool(
  userId: string,
  server: ExternalMCPServer,
  toolName: string,
  args: unknown
): Promise<MCPToolResult> {
  const bridge = await getBridgeConnection(userId);
  if (!bridge || bridge.status !== 'connected') {
    throw new Error('Bridge not connected. Run `npx tpmjs-bridge` to connect.');
  }

  // Send tool call through WebSocket
  const callId = generateId();
  const result = await new Promise((resolve, reject) => {
    pendingCalls.set(callId, { resolve, reject });

    bridge.socket.send(JSON.stringify({
      type: 'tool_call',
      callId,
      serverId: server.bridgeServerId,
      toolName,
      args,
    }));

    // Timeout after 5 minutes
    setTimeout(() => {
      pendingCalls.delete(callId);
      reject(new Error('Bridge tool call timed out'));
    }, 300000);
  });

  return result;
}
```

---

## Technical Specifications

### Tool Naming Convention

To avoid collisions when aggregating from multiple sources:

```
{source}--{originalName}

Examples:
- npm--@tpmjs/hello--helloWorldTool     (npm package)
- chrome-devtools--navigate              (remote MCP)
- bridge--filesystem--readFile           (bridge MCP)
```

### Transport Priority

When a tool exists in multiple sources:

1. **npm** - Fastest, always available
2. **Remote HTTP/SSE** - Fast, usually available
3. **Bridge** - Requires user connection, variable latency

### Error Handling

```typescript
interface ToolExecutionError {
  code: 'BRIDGE_DISCONNECTED' | 'REMOTE_TIMEOUT' | 'TOOL_NOT_FOUND';
  message: string;
  suggestion?: string;
}

// Examples:
{
  code: 'BRIDGE_DISCONNECTED',
  message: 'Cannot execute chrome.navigate - bridge not connected',
  suggestion: 'Run `npx tpmjs-bridge` to connect your local tools'
}
```

### Security Considerations

1. **API Key Authentication**: All API endpoints require a valid TPMJS API key (`tpmjs_sk_...` prefix)
2. **Scope-Based Access**: API keys have specific scopes (e.g., `bridge:connect`, `mcp:execute`, `agent:chat`)
3. **User Isolation**: Each user's bridge is isolated
4. **Tool Whitelisting**: Users explicitly add tools to collections
5. **Encrypted Credentials**: Remote MCP server credentials encrypted at rest
6. **WebSocket Security**: WSS (TLS) required for bridge connections

**Required API Key Scopes:**
- `bridge:connect` - For bridge WebSocket connections
- `mcp:execute` - For MCP tool execution
- `collection:read` - For accessing collection data

Generate API keys from Settings > TPMJS API Keys in the dashboard.

---

## User Experience

### Adding Remote MCP Tools via UI

```
┌────────────────────────────────────────────────────────────────────┐
│  Collection: My Dev Tools                                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Tools (12)                                      [+ Add Tools ▼]   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ + Add from npm registry                                      │ │
│  │ + Add from remote MCP server (HTTP/SSE)                      │ │
│  │ + Add from local bridge                                      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ─────────────────────────────────────────────────────────────    │
│                                                                    │
│  📦 npm Tools                                                      │
│  ├── @tpmjs/hello / helloWorldTool                    [Remove]    │
│  └── @tpmjs/weather / getWeather                      [Remove]    │
│                                                                    │
│  🌐 Remote MCP: slack-mcp (https://slack-mcp.com)                 │
│  ├── postMessage                                      [Remove]    │
│  └── listChannels                                     [Remove]    │
│                                                                    │
│  🔗 Bridge: chrome-devtools                           ● Connected │
│  ├── navigate                                         [Remove]    │
│  ├── screenshot                                       [Remove]    │
│  └── evaluate                                         [Remove]    │
│                                                                    │
│  🔗 Bridge: filesystem                                ● Connected │
│  └── readFile                                         [Remove]    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Bridge Setup Flow

```
┌────────────────────────────────────────────────────────────────────┐
│  Connect Local Tools                                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Your local MCP servers can be accessed through TPMJS.             │
│                                                                    │
│  Step 1: Install the bridge                                        │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  npm install -g @tpmjs/bridge                                │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  Step 2: Configure your MCP servers                                │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  tpmjs-bridge init                                           │ │
│  │                                                              │ │
│  │  # This creates ~/.tpmjs/bridge.json with:                   │ │
│  │  {                                                           │ │
│  │    "servers": [                                              │ │
│  │      {                                                       │ │
│  │        "name": "chrome-devtools",                            │ │
│  │        "command": "npx",                                     │ │
│  │        "args": ["-y", "chrome-devtools-mcp"]                 │ │
│  │      }                                                       │ │
│  │    ]                                                         │ │
│  │  }                                                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  Step 3: Start the bridge                                          │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  tpmjs-bridge start                                          │ │
│  │                                                              │ │
│  │  ✓ Connected to chrome-devtools (5 tools)                    │ │
│  │  ✓ Connected to TPMJS                                        │ │
│  │  Bridge running. Press Ctrl+C to stop.                       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Bridge Status: ● Connected                                │   │
│  │  Tools Available: 5                                        │   │
│  │  Last Seen: Just now                                       │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Unified MCP Configuration

After setup, user only needs ONE MCP server in their config:

```json
// ~/.config/claude/claude_desktop_config.json
{
  "mcpServers": {
    "tpmjs": {
      "type": "url",
      "url": "https://tpmjs.com/api/mcp/username/all-my-tools/http",
      "headers": {
        "Authorization": "Bearer tpmjs_sk_your_api_key_here"
      }
    }
  }
}
```

**Note:** Generate your API key from Settings > TPMJS API Keys. The key requires `mcp:execute` scope.

This single endpoint provides access to:
- All npm tools in the collection
- All remote MCP tools configured
- All local tools via connected bridge

---

## Implementation Phases

### Phase 1: Remote MCP Import (2-3 weeks)

**Goal**: Import tools from remote HTTP/SSE MCP servers

**Deliverables**:
1. `@tpmjs/mcp-client` package for connecting to MCP servers
2. UI for adding remote MCP server to collection
3. Updated MCP handlers to aggregate remote tools
4. Tool execution routing for remote servers

**No bridge needed** - works with any public HTTP MCP server.

### Phase 2: Bridge Foundation (3-4 weeks)

**Goal**: Enable local tool access via bridge

**Deliverables**:
1. `@tpmjs/bridge` CLI package
2. WebSocket API for bridge connections (`/api/bridge`)
3. Database schema for bridge connections
4. Bridge status UI in dashboard

### Phase 3: Tool Discovery & Sync (2 weeks)

**Goal**: Automatic tool discovery and sync

**Deliverables**:
1. Auto-discover tools when bridge connects
2. Sync tool definitions periodically
3. Handle schema changes gracefully
4. Tool health monitoring

### Phase 4: Advanced Features (Ongoing)

**Goal**: Enhanced reliability and UX

**Deliverables**:
1. Bridge auto-reconnection
2. Tool execution queuing
3. Offline tool caching
4. Multiple bridge support (different machines)
5. Browser extension alternative to CLI

---

## Summary

The MCP Aggregator transforms TPMJS from a tool registry into a **universal tool hub**:

| Feature | Before | After |
|---------|--------|-------|
| Tool Sources | npm only | npm + remote MCP + local MCP |
| MCP Servers | One per collection | One unified endpoint |
| Local Tools | Not possible | Via bridge |
| Chrome/Browser | Not possible | Via bridge |
| Configuration | Multiple MCP entries | Single TPMJS entry |

The hybrid approach (cloud + bridge) provides:
- **Always-on** npm and remote MCP tools
- **When-connected** local tools via bridge
- **Graceful degradation** when bridge is offline
- **Single point of management** for all tools

---

## References

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Protocol Docs](https://modelcontextprotocol.io/docs)
- [Chrome DevTools MCP](https://github.com/anthropics/chrome-devtools-mcp)
- [Browser MCP](https://browsermcp.io/)
- [Claude in Chrome Docs](https://code.claude.com/docs/en/chrome)
- [Vercel AI SDK MCP](https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools)
