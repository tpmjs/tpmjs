# PRD: TPMJS MCP Bridge

**Product Requirements Document**

| Field | Value |
|-------|-------|
| Author | Ajax Davis |
| Status | Draft |
| Created | 2025-01-12 |
| Last Updated | 2025-01-12 |

---

## Table of Contents

1. [Overview](#overview)
2. [Problem Statement](#problem-statement)
3. [Solution](#solution)
4. [User Stories](#user-stories)
5. [Architecture](#architecture)
6. [User Experience](#user-experience)
7. [Technical Specification](#technical-specification)
8. [Database Schema](#database-schema)
9. [API Specification](#api-specification)
10. [Security Considerations](#security-considerations)
11. [Implementation Phases](#implementation-phases)
12. [Success Metrics](#success-metrics)
13. [Open Questions](#open-questions)

---

## Overview

### What

The TPMJS MCP Bridge enables users to connect local MCP (Model Context Protocol) servers to their TPMJS collections. This allows a single TPMJS MCP endpoint to aggregate tools from:
- npm packages (existing)
- Remote MCP servers (HTTP/SSE)
- Local MCP servers (via bridge)

### Why

Users currently need to configure multiple MCP servers in their AI tools (Claude Desktop, Cursor, etc.). Each local MCP server (Chrome DevTools, Blender, filesystem, etc.) requires separate configuration. TPMJS can become the single point of control for all tools.

### Goal

**One MCP endpoint to rule them all.** Users add one TPMJS MCP server to Claude Desktop and manage all their tools through the TPMJS UI.

---

## Problem Statement

### Current Pain Points

1. **Multiple MCP Configurations**: Users must manually configure each MCP server in Claude Desktop's config file
2. **No Central Management**: No UI to manage which tools are available
3. **Local Tools Inaccessible from Cloud**: TPMJS runs in the cloud and cannot access local MCP servers that use stdio transport
4. **Tool Discovery Fragmented**: Users must find and configure each MCP server separately

### Example: Current State

```json
// ~/.config/claude/claude_desktop_config.json
{
  "mcpServers": {
    "tpmjs": {
      "type": "url",
      "url": "https://tpmjs.com/api/mcp/ajax/my-tools/http"
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp"]
    },
    "blender": {
      "command": "uvx",
      "args": ["blender-mcp"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-filesystem", "/home/user"]
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-slack"]
    }
  }
}
```

**Problems:**
- 5 separate server configurations
- Must edit JSON file manually
- No visibility into available tools
- Cannot share configurations easily

---

## Solution

### The Bridge

A CLI tool (`@tpmjs/bridge`) that runs on the user's machine and:
1. Connects to local MCP servers (stdio)
2. Discovers their tools
3. Registers tools with TPMJS via WebSocket
4. Proxies tool calls from TPMJS to local MCP servers

### Target State

```json
// ~/.config/claude/claude_desktop_config.json
{
  "mcpServers": {
    "tpmjs": {
      "type": "url",
      "url": "https://tpmjs.com/api/mcp/ajax/unified/http"
    }
  }
}
```

**One endpoint** providing access to:
- npm tools
- Chrome DevTools (via bridge)
- Blender (via bridge)
- Filesystem (via bridge)
- Slack (via bridge)
- Any other MCP server

---

## User Stories

### US-1: Add Local MCP Server to Bridge

**As a** TPMJS user
**I want to** add a local MCP server (like Blender) to my bridge
**So that** its tools appear in my TPMJS collection

**Acceptance Criteria:**
- [ ] User can edit bridge config file to add new server
- [ ] Bridge discovers tools when server is added
- [ ] Tools appear in TPMJS dashboard

### US-2: Select Tools for Collection

**As a** TPMJS user
**I want to** choose which bridge tools to include in my collection
**So that** I only expose the tools I need

**Acceptance Criteria:**
- [ ] User sees all available bridge tools in UI
- [ ] User can add/remove tools from collection
- [ ] MCP endpoint only includes selected tools

### US-3: Use Bridge Tools from Claude

**As a** Claude Desktop user
**I want to** use bridge tools (like Chrome screenshot) through TPMJS
**So that** I don't need multiple MCP server configurations

**Acceptance Criteria:**
- [ ] Tool calls route through TPMJS to bridge
- [ ] Results return to Claude Desktop
- [ ] Latency is acceptable (<2s for most operations)

### US-4: Handle Bridge Disconnection

**As a** TPMJS user
**I want to** see clear errors when my bridge is offline
**So that** I understand why certain tools aren't working

**Acceptance Criteria:**
- [ ] UI shows bridge connection status
- [ ] Tool calls return helpful error when bridge is offline
- [ ] Bridge auto-reconnects when possible

### US-5: Quick CLI Setup

**As a** developer
**I want to** set up the bridge quickly via CLI
**So that** I can start using local tools immediately

**Acceptance Criteria:**
- [ ] `npx @tpmjs/bridge init` creates config file
- [ ] `npx @tpmjs/bridge add <server>` adds common servers
- [ ] `npx @tpmjs/bridge start` connects everything

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TPMJS Platform                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        MCP Aggregator                                │   │
│  │                                                                      │   │
│  │   Tool Sources:                                                      │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│  │   │ npm Registry │  │ Remote MCP   │  │ User's Bridge            │  │   │
│  │   │ (always on)  │  │ (HTTP/SSE)   │  │ (when connected)         │  │   │
│  │   └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │
│  │          │                 │                      │                  │   │
│  │          ▼                 ▼                      ▼                  │   │
│  │   ┌─────────────────────────────────────────────────────────────┐   │   │
│  │   │              Unified Tool Registry                           │   │   │
│  │   │   • npm tools: always available                              │   │   │
│  │   │   • Remote MCP tools: always available                       │   │   │
│  │   │   • Bridge tools: available when bridge connected            │   │   │
│  │   └─────────────────────────────────────────────────────────────┘   │   │
│  │                              │                                       │   │
│  │                              ▼                                       │   │
│  │   ┌─────────────────────────────────────────────────────────────┐   │   │
│  │   │         MCP Server: /api/mcp/{user}/{collection}/http        │   │   │
│  │   └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                        │                                    │
│                                        │ WebSocket                          │
│                                        ▼                                    │
└────────────────────────────────────────┼────────────────────────────────────┘
                                         │
              ┌──────────────────────────┴──────────────────────────┐
              │                                                     │
              ▼                                                     ▼
┌──────────────────────────────┐                    ┌──────────────────────────┐
│     Claude Desktop           │                    │     User's Machine       │
│     (MCP Client)             │                    │                          │
│                              │                    │  ┌────────────────────┐  │
│  Only needs ONE server:      │                    │  │  @tpmjs/bridge     │  │
│  tpmjs.com/api/mcp/...       │                    │  │                    │  │
│                              │                    │  │  MCP Clients:      │  │
└──────────────────────────────┘                    │  │  ├── chrome        │  │
                                                    │  │  ├── blender       │  │
                                                    │  │  ├── filesystem    │  │
                                                    │  │  └── slack         │  │
                                                    │  └────────────────────┘  │
                                                    │           │              │
                                                    │           ▼              │
                                                    │  ┌────────────────────┐  │
                                                    │  │  Local MCP Servers │  │
                                                    │  │  (stdio processes) │  │
                                                    │  └────────────────────┘  │
                                                    └──────────────────────────┘
```

### Bridge Detail

```
User's Machine
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         @tpmjs/bridge                                  │ │
│  │                                                                        │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    MCP Client Manager                            │  │ │
│  │  │                                                                  │  │ │
│  │  │  Maintains connections to local MCP servers:                     │  │ │
│  │  │                                                                  │  │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │  │ │
│  │  │  │ chrome      │  │ blender     │  │ filesystem  │              │  │ │
│  │  │  │ devtools    │  │             │  │             │              │  │ │
│  │  │  │             │  │             │  │             │              │  │ │
│  │  │  │ stdio ↕     │  │ stdio ↕     │  │ stdio ↕     │              │  │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘              │  │ │
│  │  │        │                │                │                       │  │ │
│  │  │        └────────────────┼────────────────┘                       │  │ │
│  │  │                         │                                        │  │ │
│  │  │                         ▼                                        │  │ │
│  │  │              ┌─────────────────────┐                             │  │ │
│  │  │              │   Tool Registry     │                             │  │ │
│  │  │              │   (aggregated)      │                             │  │ │
│  │  │              └─────────────────────┘                             │  │ │
│  │  │                         │                                        │  │ │
│  │  └─────────────────────────┼────────────────────────────────────────┘  │ │
│  │                            │                                           │ │
│  │  ┌─────────────────────────▼────────────────────────────────────────┐  │ │
│  │  │                 WebSocket Connection                              │  │ │
│  │  │                 to TPMJS Cloud                                    │  │ │
│  │  │                                                                   │  │ │
│  │  │  • Registers available tools                                      │  │ │
│  │  │  • Receives tool call requests                                    │  │ │
│  │  │  • Sends tool results                                             │  │ │
│  │  │  • Auto-reconnects on disconnect                                  │  │ │
│  │  └───────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tool Call Flow

```
Step-by-step: User asks Claude to take a screenshot of GitHub

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude Desktop │     │   TPMJS Cloud   │     │  User's Bridge  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  tools/call           │                       │
         │  "chrome--screenshot" │                       │
         │ ─────────────────────▶│                       │
         │                       │                       │
         │                       │  Parse tool name      │
         │                       │  "chrome--screenshot" │
         │                       │  → server: chrome     │
         │                       │  → tool: screenshot   │
         │                       │                       │
         │                       │  Lookup server        │
         │                       │  chrome = bridge type │
         │                       │                       │
         │                       │  Check bridge status  │
         │                       │  → connected ✓        │
         │                       │                       │
         │                       │  tool_call            │
         │                       │ ─────────────────────▶│
         │                       │  {                    │
         │                       │    serverId: "chrome",│
         │                       │    toolName: "screenshot",
         │                       │    args: {}           │
         │                       │  }                    │
         │                       │                       │
         │                       │                       │  Route to chrome
         │                       │                       │  MCP client
         │                       │                       │
         │                       │                       │  client.callTool({
         │                       │                       │    name: "screenshot",
         │                       │                       │    arguments: {}
         │                       │                       │  })
         │                       │                       │
         │                       │                       │  ┌─────────────┐
         │                       │                       │  │ Chrome      │
         │                       │                       │──│ DevTools    │
         │                       │                       │  │ Protocol    │
         │                       │                       │  └─────────────┘
         │                       │                       │
         │                       │                       │  Screenshot taken
         │                       │                       │
         │                       │  tool_result          │
         │                       │ ◀─────────────────────│
         │                       │  {                    │
         │                       │    callId: "...",     │
         │                       │    result: {          │
         │                       │      content: [{      │
         │                       │        type: "image", │
         │                       │        data: "base64" │
         │                       │      }]               │
         │                       │    }                  │
         │                       │  }                    │
         │                       │                       │
         │  MCP result           │                       │
         │ ◀─────────────────────│                       │
         │  {                    │                       │
         │    content: [{        │                       │
         │      type: "image",   │                       │
         │      data: "base64"   │                       │
         │    }]                 │                       │
         │  }                    │                       │
         │                       │                       │
         ▼                       ▼                       ▼
```

---

## User Experience

### Initial Setup

#### Step 1: Install Bridge

```bash
npm install -g @tpmjs/bridge
```

#### Step 2: Initialize Configuration

```bash
tpmjs-bridge init

# Output:
# Created ~/.tpmjs/bridge.json
# Created ~/.tpmjs/credentials.json
#
# Next steps:
# 1. Run: tpmjs-bridge login
# 2. Add MCP servers to ~/.tpmjs/bridge.json
# 3. Run: tpmjs-bridge start
```

#### Step 3: Login

```bash
tpmjs-bridge login

# Opens browser to tpmjs.com/auth/bridge
# User authenticates
# Token saved to ~/.tpmjs/credentials.json

# Output:
# ✓ Logged in as ajax@example.com
```

#### Step 4: Add MCP Servers

```bash
# Add from preset list
tpmjs-bridge add chrome-devtools
tpmjs-bridge add blender
tpmjs-bridge add filesystem --args "/home/user/documents"

# Or manually edit ~/.tpmjs/bridge.json
```

**Config file structure:**

```json
{
  "servers": [
    {
      "id": "chrome-devtools",
      "name": "Chrome DevTools",
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp"],
      "env": {}
    },
    {
      "id": "blender",
      "name": "Blender",
      "command": "uvx",
      "args": ["blender-mcp"],
      "env": {}
    },
    {
      "id": "filesystem",
      "name": "Filesystem",
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-filesystem", "/home/user/documents"],
      "env": {}
    }
  ]
}
```

#### Step 5: Start Bridge

```bash
tpmjs-bridge start

# Output:
# Starting MCP servers...
#   ✓ chrome-devtools: 5 tools (navigate, screenshot, click, type, evaluate)
#   ✓ blender: 12 tools (create_object, modify_mesh, render, ...)
#   ✓ filesystem: 4 tools (read_file, write_file, list_directory, search)
#
# Connecting to TPMJS...
#   ✓ Connected as ajax@example.com
#   ✓ Registered 21 tools
#
# Bridge running. Press Ctrl+C to stop.
#
# Your tools are available at:
# https://tpmjs.com/api/mcp/ajax/unified/http
```

### Managing Tools in UI

#### Dashboard View

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Collection: unified                                                       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Bridge Status: ● Connected                          Last seen: just now  │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Your MCP Endpoint (copy to Claude Desktop config):                  │ │
│  │                                                                      │ │
│  │  https://tpmjs.com/api/mcp/ajax/unified/http                  [Copy] │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ═══════════════════════════════════════════════════════════════════════  │
│                                                                            │
│  TOOLS IN COLLECTION (8)                                                   │
│                                                                            │
│  📦 npm Tools                                                              │
│  ├── @tpmjs/hello / helloWorldTool                                        │
│  └── @tpmjs/weather / getWeather                                          │
│                                                                            │
│  🔗 chrome-devtools                                        ● Connected    │
│  ├── navigate          Navigate browser to URL              [−]           │
│  ├── screenshot        Take page screenshot                 [−]           │
│  └── click             Click an element                     [−]           │
│                                                                            │
│  🔗 blender                                                ● Connected    │
│  ├── create_object     Create 3D object                     [−]           │
│  ├── render            Render scene to image                [−]           │
│  └── export            Export to file format                [−]           │
│                                                                            │
│  ═══════════════════════════════════════════════════════════════════════  │
│                                                                            │
│  AVAILABLE FROM BRIDGE (not in collection)                   [+ Add All]  │
│                                                                            │
│  🔗 chrome-devtools                                                        │
│  ├── type              Type text into element                [+]          │
│  └── evaluate          Run JavaScript                        [+]          │
│                                                                            │
│  🔗 blender                                                                │
│  ├── modify_mesh       Modify mesh geometry                  [+]          │
│  ├── apply_material    Apply material                        [+]          │
│  ├── animate           Create animation                      [+]          │
│  └── ... 6 more                                              [+]          │
│                                                                            │
│  🔗 filesystem                                                             │
│  ├── read_file         Read file contents                    [+]          │
│  ├── write_file        Write to file                         [+]          │
│  ├── list_directory    List directory contents               [+]          │
│  └── search            Search for files                      [+]          │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Adding a Tool

User clicks [+] next to a tool:

```
┌─────────────────────────────────────────────────────────┐
│  Add Tool to Collection                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Tool: blender / modify_mesh                            │
│                                                         │
│  Description:                                           │
│  Modify the geometry of a mesh object in Blender.       │
│  Supports operations like subdivide, smooth, and        │
│  extrude.                                               │
│                                                         │
│  Parameters:                                            │
│  ┌───────────────────────────────────────────────────┐ │
│  │ object_name  (string, required)                   │ │
│  │   Name of the mesh object to modify               │ │
│  │                                                   │ │
│  │ operation    (enum, required)                     │ │
│  │   One of: subdivide, smooth, extrude, bevel       │ │
│  │                                                   │ │
│  │ amount       (number, optional)                   │ │
│  │   Amount/intensity of the operation               │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ⚠️  Requires bridge connection                        │
│                                                         │
│                         [Cancel]  [Add to Collection]   │
└─────────────────────────────────────────────────────────┘
```

#### Offline State

When bridge is disconnected:

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Collection: unified                                                       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Bridge Status: ○ Disconnected                    Last seen: 2 hours ago  │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  ⚠️  Bridge tools unavailable                                        │ │
│  │                                                                      │ │
│  │  To reconnect, run on your machine:                                  │ │
│  │  $ tpmjs-bridge start                                                │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  TOOLS IN COLLECTION (8)                                                   │
│                                                                            │
│  📦 npm Tools                                              ● Available    │
│  ├── @tpmjs/hello / helloWorldTool                                        │
│  └── @tpmjs/weather / getWeather                                          │
│                                                                            │
│  🔗 chrome-devtools                                        ○ Offline      │
│  ├── navigate          ⚠️ Requires bridge                                 │
│  ├── screenshot        ⚠️ Requires bridge                                 │
│  └── click             ⚠️ Requires bridge                                 │
│                                                                            │
│  🔗 blender                                                ○ Offline      │
│  ├── create_object     ⚠️ Requires bridge                                 │
│  └── render            ⚠️ Requires bridge                                 │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Specification

### Package: `@tpmjs/bridge`

#### Installation

```bash
npm install -g @tpmjs/bridge
# or
npx @tpmjs/bridge <command>
```

#### CLI Commands

| Command | Description |
|---------|-------------|
| `init` | Create config files |
| `login` | Authenticate with TPMJS |
| `logout` | Remove credentials |
| `add <preset>` | Add MCP server from preset |
| `remove <id>` | Remove MCP server |
| `list` | List configured servers |
| `start` | Start bridge daemon |
| `stop` | Stop bridge daemon |
| `status` | Show connection status |
| `config` | Open config file in editor |

#### Config Files

**~/.tpmjs/bridge.json**
```json
{
  "servers": [
    {
      "id": "chrome-devtools",
      "name": "Chrome DevTools",
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp"],
      "env": {
        "CHROME_PATH": "/Applications/Google Chrome.app"
      },
      "disabled": false
    }
  ]
}
```

**~/.tpmjs/credentials.json**
```json
{
  "apiKey": "tpmjs_sk_xxxxxxxxxxxxxxxxxxxx",
  "userId": "user_abc123",
  "email": "user@example.com",
  "expiresAt": "2026-01-12T00:00:00Z"
}
```

#### Presets

Built-in presets for common MCP servers:

| Preset | Package | Description |
|--------|---------|-------------|
| `chrome-devtools` | `chrome-devtools-mcp` | Chrome browser automation |
| `browser-mcp` | `@anthropic/browser-mcp` | Puppeteer-based automation |
| `filesystem` | `@anthropic/mcp-filesystem` | File system access |
| `git` | `@anthropic/mcp-git` | Git operations |
| `slack` | `@anthropic/mcp-slack` | Slack integration |
| `blender` | `blender-mcp` | Blender 3D automation |
| `postgres` | `@anthropic/mcp-postgres` | PostgreSQL access |

### Package: `@tpmjs/mcp-client`

Internal library for connecting to MCP servers.

```typescript
import { MCPClientManager } from '@tpmjs/mcp-client';

const manager = new MCPClientManager();

// Connect to a stdio-based MCP server
await manager.connect({
  id: 'chrome',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', 'chrome-devtools-mcp'],
});

// List tools
const tools = await manager.listTools('chrome');

// Call a tool
const result = await manager.callTool('chrome', 'screenshot', {
  fullPage: true
});

// Disconnect
await manager.disconnect('chrome');
```

### WebSocket Protocol

#### Connection

```
wss://tpmjs.com/api/bridge?token=tpmjs_sk_your_api_key_here
```

**Note:** All TPMJS API endpoints require authentication. Generate an API key from your dashboard at Settings > TPMJS API Keys. API keys use the `tpmjs_sk_` prefix.

#### Messages: Bridge → TPMJS

**Register Tools**
```json
{
  "type": "register",
  "tools": [
    {
      "serverId": "chrome-devtools",
      "serverName": "Chrome DevTools",
      "name": "screenshot",
      "description": "Take a screenshot of the current page",
      "inputSchema": {
        "type": "object",
        "properties": {
          "fullPage": {
            "type": "boolean",
            "description": "Capture full scrollable page"
          }
        }
      }
    }
  ]
}
```

**Tool Result**
```json
{
  "type": "tool_result",
  "callId": "call_abc123",
  "result": {
    "content": [
      {
        "type": "image",
        "mimeType": "image/png",
        "data": "base64..."
      }
    ]
  }
}
```

**Tool Error**
```json
{
  "type": "tool_error",
  "callId": "call_abc123",
  "error": {
    "code": "EXECUTION_FAILED",
    "message": "Chrome is not running"
  }
}
```

**Heartbeat**
```json
{
  "type": "heartbeat",
  "timestamp": 1705123456789
}
```

#### Messages: TPMJS → Bridge

**Tool Call**
```json
{
  "type": "tool_call",
  "callId": "call_abc123",
  "serverId": "chrome-devtools",
  "toolName": "screenshot",
  "args": {
    "fullPage": true
  }
}
```

**Ping**
```json
{
  "type": "ping"
}
```

---

## Database Schema

### New Models

```prisma
// Track active bridge connections
model BridgeConnection {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Connection state
  status    String   @default("disconnected") // "connected" | "disconnected"
  socketId  String?  // Internal socket identifier for routing

  // Cached tool definitions from bridge
  tools     Json     @default("[]")

  // Metadata
  lastSeen  DateTime?
  clientVersion String?
  clientOS  String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
}

// Track which bridge tools are added to collections
model CollectionBridgeTool {
  id           String     @id @default(cuid())
  collectionId String
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  // Reference to bridge tool
  serverId     String     // e.g., "chrome-devtools"
  toolName     String     // e.g., "screenshot"

  // Display customization
  displayName  String?    // Override tool name in MCP
  note         String?    // User notes

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@unique([collectionId, serverId, toolName])
  @@index([collectionId])
}

// Update Collection model
model Collection {
  // ... existing fields ...

  bridgeTools CollectionBridgeTool[]
}
```

### Migration

```sql
-- CreateTable
CREATE TABLE "BridgeConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "socketId" TEXT,
    "tools" JSONB NOT NULL DEFAULT '[]',
    "lastSeen" TIMESTAMP(3),
    "clientVersion" TEXT,
    "clientOS" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BridgeConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionBridgeTool" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "displayName" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionBridgeTool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BridgeConnection_userId_key" ON "BridgeConnection"("userId");
CREATE INDEX "BridgeConnection_status_idx" ON "BridgeConnection"("status");
CREATE UNIQUE INDEX "CollectionBridgeTool_collectionId_serverId_toolName_key"
    ON "CollectionBridgeTool"("collectionId", "serverId", "toolName");

-- AddForeignKey
ALTER TABLE "BridgeConnection" ADD CONSTRAINT "BridgeConnection_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CollectionBridgeTool" ADD CONSTRAINT "CollectionBridgeTool_collectionId_fkey"
    FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## API Specification

### Bridge WebSocket Endpoint

**Endpoint**: `GET /api/bridge`

**Query Parameters**:
- `token` (required): User's TPMJS API key (format: `tpmjs_sk_...`)

**Upgrade**: WebSocket

**Authentication**: Validates API key with `bridge:connect` scope, returns 401 if invalid

**Example**:
```bash
# Connect via WebSocket with API key
wscat -c 'wss://tpmjs.com/api/bridge?token=tpmjs_sk_your_api_key_here'
```

### Bridge Status API

**Endpoint**: `GET /api/user/bridge`

**Authentication**: Requires API key with `bridge:connect` scope
```bash
curl https://tpmjs.com/api/user/bridge \
  -H 'Authorization: Bearer tpmjs_sk_your_api_key_here'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "connected",
    "lastSeen": "2025-01-12T10:30:00Z",
    "toolCount": 21,
    "servers": [
      {
        "id": "chrome-devtools",
        "name": "Chrome DevTools",
        "toolCount": 5,
        "tools": ["navigate", "screenshot", "click", "type", "evaluate"]
      },
      {
        "id": "blender",
        "name": "Blender",
        "toolCount": 12,
        "tools": ["create_object", "modify_mesh", "render", "..."]
      }
    ]
  }
}
```

### Collection Bridge Tools API

All collection endpoints require API key with `collection:read` scope.

**Add Tool**: `POST /api/collections/{id}/bridge-tools`

```bash
curl -X POST 'https://tpmjs.com/api/collections/{id}/bridge-tools' \
  -H 'Authorization: Bearer tpmjs_sk_your_api_key_here' \
  -H 'Content-Type: application/json' \
  -d '{
    "serverId": "chrome-devtools",
    "toolName": "screenshot"
  }'
```

**Remove Tool**: `DELETE /api/collections/{id}/bridge-tools/{toolId}`

**List Tools**: `GET /api/collections/{id}/bridge-tools`

```json
{
  "success": true,
  "data": [
    {
      "id": "cbt_abc123",
      "serverId": "chrome-devtools",
      "toolName": "screenshot",
      "displayName": null,
      "note": null,
      "available": true
    }
  ]
}
```

### Updated MCP Handlers

**tools/list** now includes bridge tools:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "tpmjs-hello--helloWorldTool",
        "description": "Says hello world",
        "inputSchema": { ... }
      },
      {
        "name": "chrome--screenshot",
        "description": "Take a screenshot",
        "inputSchema": { ... }
      },
      {
        "name": "blender--create_object",
        "description": "Create 3D object",
        "inputSchema": { ... }
      }
    ]
  }
}
```

**tools/call** routes appropriately:

```typescript
async function handleToolsCall(toolName: string, args: unknown) {
  const [prefix, actualName] = parseToolName(toolName);

  if (isNpmTool(prefix)) {
    // Route to sandbox executor
    return executeNpmTool(prefix, actualName, args);
  }

  if (isBridgeTool(prefix)) {
    // Route to user's bridge
    const bridge = await getBridgeConnection(userId);
    if (!bridge || bridge.status !== 'connected') {
      throw new Error('Bridge not connected. Run `tpmjs-bridge start` to connect.');
    }
    return callBridgeTool(bridge, prefix, actualName, args);
  }
}
```

---

## Security Considerations

### Authentication

1. **Bridge Authentication**: API key required for WebSocket connection
2. **Key Rotation**: Support key rotation without disconnecting active bridges
3. **Session Tokens**: Short-lived session tokens for active connections

### Authorization

1. **User Isolation**: Each user's bridge is isolated
2. **Collection Scoping**: Bridge tools only accessible in user's own collections
3. **Tool Whitelisting**: Users explicitly add tools to collections

### Data Protection

1. **No Credential Storage**: Bridge stores credentials locally only
2. **Encrypted Transport**: WSS required (TLS)
3. **Tool Arguments**: Logged but redacted for sensitive fields

### Rate Limiting

1. **Connection Limit**: 1 bridge per user
2. **Tool Call Rate**: 60 calls/minute per bridge
3. **Reconnection Backoff**: Exponential backoff on repeated failures

---

## Implementation Phases

### Phase 1: Bridge Core (3-4 weeks)

**Goal**: Basic bridge functionality

**Deliverables**:
- [ ] `@tpmjs/mcp-client` package
- [ ] `@tpmjs/bridge` CLI with `init`, `start`, `stop`
- [ ] WebSocket endpoint `/api/bridge`
- [ ] `BridgeConnection` database model
- [ ] Basic UI showing bridge status

**Acceptance Criteria**:
- Bridge can connect to TPMJS
- Bridge can spawn local MCP servers
- Tools are registered with TPMJS
- Tool calls route through bridge

### Phase 2: Collection Integration (2 weeks)

**Goal**: Add bridge tools to collections

**Deliverables**:
- [ ] `CollectionBridgeTool` model
- [ ] API for adding/removing bridge tools
- [ ] UI for managing bridge tools in collections
- [ ] Updated MCP handlers for bridge tools

**Acceptance Criteria**:
- Users can add bridge tools to collections
- MCP endpoint includes selected bridge tools
- Tool calls execute correctly

### Phase 3: Polish & Presets (2 weeks)

**Goal**: Great user experience

**Deliverables**:
- [ ] `tpmjs-bridge add <preset>` command
- [ ] Preset library for common MCP servers
- [ ] Auto-reconnection logic
- [ ] Better error messages
- [ ] Connection health monitoring

**Acceptance Criteria**:
- New users can set up in <5 minutes
- Bridge handles disconnections gracefully
- Clear feedback when things go wrong

### Phase 4: Advanced Features (Ongoing)

**Goal**: Power user features

**Deliverables**:
- [ ] Multiple bridge support (different machines)
- [ ] Bridge groups/profiles
- [ ] Tool filtering/search in UI
- [ ] Usage analytics
- [ ] Browser extension alternative to CLI

---

## Success Metrics

### Adoption

| Metric | Target (3 months) |
|--------|-------------------|
| Bridge installs | 1,000 |
| Daily active bridges | 200 |
| Tools registered via bridge | 5,000 |

### Reliability

| Metric | Target |
|--------|--------|
| Bridge uptime | 99% (when running) |
| Tool call success rate | 95% |
| Reconnection success | 99% |

### Performance

| Metric | Target |
|--------|--------|
| Tool call latency (p50) | <500ms |
| Tool call latency (p95) | <2000ms |
| Bridge startup time | <10s |

---

## Open Questions

### Q1: Multiple Bridges?

**Question**: Should we support multiple bridges per user (e.g., work laptop + home desktop)?

**Options**:
1. One bridge per user (simpler)
2. Multiple bridges with naming (more flexible)
3. Bridge "profiles" that can be switched

**Recommendation**: Start with one, add multiple in Phase 4

### Q2: Offline Tool Caching?

**Question**: Should bridge tools show in MCP list when bridge is offline?

**Options**:
1. Hide tools when offline
2. Show tools but return error on call
3. Cache last-known tools, show with warning

**Recommendation**: Option 3 - better UX, clear expectations

### Q3: Tool Permissions?

**Question**: Should we add permission scopes to bridge tools?

**Options**:
1. All-or-nothing access
2. Per-tool permissions
3. Capability-based (read, write, execute)

**Recommendation**: Start with all-or-nothing, add granular later

### Q4: Daemon vs On-Demand?

**Question**: Should bridge run as a daemon or on-demand?

**Options**:
1. Daemon (always running)
2. On-demand (start when needed)
3. Hybrid (start on login, sleep when idle)

**Recommendation**: Daemon for now, easier to reason about

---

## Appendix

### A: Example Bridge Session

```
$ tpmjs-bridge start --verbose

[10:30:00] Loading config from ~/.tpmjs/bridge.json
[10:30:00] Found 3 servers configured

[10:30:00] Starting chrome-devtools...
[10:30:01]   Spawning: npx -y chrome-devtools-mcp
[10:30:03]   Connected via stdio
[10:30:03]   Discovering tools...
[10:30:03]   Found 5 tools: navigate, screenshot, click, type, evaluate

[10:30:03] Starting blender...
[10:30:03]   Spawning: uvx blender-mcp
[10:30:05]   Connected via stdio
[10:30:05]   Discovering tools...
[10:30:05]   Found 12 tools: create_object, modify_mesh, render, ...

[10:30:05] Starting filesystem...
[10:30:05]   Spawning: npx -y @anthropic/mcp-filesystem /home/user
[10:30:06]   Connected via stdio
[10:30:06]   Discovering tools...
[10:30:06]   Found 4 tools: read_file, write_file, list_directory, search

[10:30:06] Connecting to TPMJS...
[10:30:06]   WebSocket: wss://tpmjs.com/api/bridge
[10:30:07]   Authenticated as ajax@example.com
[10:30:07]   Registering 21 tools...
[10:30:07]   Registration complete

[10:30:07] Bridge ready!
[10:30:07] Tools available at: https://tpmjs.com/api/mcp/ajax/unified/http

[10:32:15] Tool call: chrome-devtools/navigate
[10:32:15]   Args: { url: "https://github.com" }
[10:32:16]   Result: Success (1.2s)

[10:32:18] Tool call: chrome-devtools/screenshot
[10:32:18]   Args: { fullPage: true }
[10:32:20]   Result: Success (1.8s)

^C
[10:45:00] Shutting down...
[10:45:00]   Disconnecting from TPMJS
[10:45:00]   Stopping chrome-devtools
[10:45:00]   Stopping blender
[10:45:00]   Stopping filesystem
[10:45:01] Bridge stopped
```

### B: Claude Desktop Configuration

**Before (multiple servers)**:
```json
{
  "mcpServers": {
    "tpmjs": {
      "type": "url",
      "url": "https://tpmjs.com/api/mcp/ajax/tools/http"
    },
    "chrome": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp"]
    },
    "blender": {
      "command": "uvx",
      "args": ["blender-mcp"]
    },
    "files": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-filesystem", "/home/user"]
    }
  }
}
```

**After (single server)**:
```json
{
  "mcpServers": {
    "tpmjs": {
      "type": "url",
      "url": "https://tpmjs.com/api/mcp/ajax/unified/http"
    }
  }
}
```

### C: Error Messages

| Scenario | Error Message |
|----------|---------------|
| Bridge not connected | "Bridge not connected. Run `tpmjs-bridge start` on your machine to enable local tools." |
| Tool not found | "Tool 'blender--render' not found. Make sure it's added to your collection." |
| Server not responding | "The blender MCP server is not responding. Check that Blender is running." |
| Timeout | "Tool call timed out after 5 minutes. The operation may still be running." |
| Auth failed | "Bridge authentication failed. Run `tpmjs-bridge login` to refresh credentials." |
