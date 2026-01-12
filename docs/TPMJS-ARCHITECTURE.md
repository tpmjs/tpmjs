# TPMJS: Tool Platform for Model Junctions

A comprehensive guide to how TPMJS works, its architecture, and strategies for handling local/computer-controlling tools in a remote execution environment.

---

## Table of Contents

1. [What is TPMJS?](#what-is-tpmjs)
2. [Core Architecture](#core-architecture)
3. [Tool Execution Flow](#tool-execution-flow)
4. [The Local Tool Challenge](#the-local-tool-challenge)
5. [Solution Strategies](#solution-strategies)
6. [Implementation Roadmap](#implementation-roadmap)

---

## What is TPMJS?

TPMJS (Tool Platform for Model Junctions) is an open platform for discovering, sharing, and executing AI agent tools. Think of it as "npm for AI tools" - developers publish tool packages to npm with a special `tpmjs` field, and the platform automatically discovers, catalogs, and makes them executable through AI agents.

### Key Capabilities

- **Tool Discovery**: Automatically syncs with npm to find packages with the `tpmjs` keyword
- **Tool Registry**: Catalogs tools with metadata, quality scores, and health checks
- **Agent Builder**: Create AI agents with custom tool collections
- **Remote Execution**: Execute npm package tools in isolated sandbox environments
- **Multi-Provider Support**: Works with OpenAI, Anthropic, Google, Groq, Mistral, and more
- **MCP Protocol Support**: Expose collections as MCP servers for use with Claude Desktop, etc.

### How Tools Get Published

Developers add a `tpmjs` field to their package.json:

```json
{
  "name": "@company/my-tool",
  "keywords": ["tpmjs"],
  "tpmjs": {
    "tools": {
      "myTool": {
        "description": "Does something useful",
        "export": "myTool"
      }
    }
  }
}
```

The platform discovers this via npm's changes feed and keyword search, validates the package, and adds it to the registry.

---

## Core Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         TPMJS Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │  Web App    │    │  Playground │    │    NPM Registry     │ │
│  │  (Next.js)  │    │  (Testing)  │    │  (Package Source)   │ │
│  └──────┬──────┘    └──────┬──────┘    └──────────┬──────────┘ │
│         │                  │                      │             │
│         ▼                  ▼                      ▼             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    API Layer                                ││
│  │  • /api/chat - Agent conversations                          ││
│  │  • /api/sync - NPM package discovery                        ││
│  │  • /api/agents - Agent CRUD                                 ││
│  │  • /api/mcp - MCP protocol endpoints                        ││
│  └─────────────────────────────────────────────────────────────┘│
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  Tool Execution Layer                       ││
│  │                                                             ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ ││
│  │  │   Sandbox   │  │   Custom    │  │    Local Executor   │ ││
│  │  │  Executor   │  │  Executor   │  │    (Future)         │ ││
│  │  │  (Default)  │  │  (User URL) │  │                     │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema (Key Models)

```
Package (npm-level metadata)
  ├── Tool (individual tool within package)
  │     ├── inputSchema (JSON Schema)
  │     ├── health status (HEALTHY/BROKEN/UNKNOWN)
  │     └── quality score
  │
Agent (user-created AI agent)
  ├── Collections (grouped tools)
  │     ├── CollectionTool (join table)
  │     ├── executorConfig
  │     └── envVars
  ├── Individual Tools
  ├── Conversations
  │     └── Messages (USER/ASSISTANT/TOOL)
  └── Configuration
        ├── provider, modelId
        ├── systemPrompt
        ├── executorType, executorConfig
        └── envVars
```

### Executor Types

1. **Sandbox Executor (Default)**
   - Remote service that loads npm packages dynamically
   - Isolated execution environment
   - 5-minute timeout per execution
   - Supports environment variables

2. **Custom Executor**
   - User-provided URL endpoint
   - Optional API key authentication
   - Same interface as sandbox executor
   - Useful for private tools or specialized environments

3. **Configuration Cascade**
   ```
   Agent Config → Collection Config → System Default
   ```

---

## Tool Execution Flow

### End-to-End Request Flow

```
User Message
    │
    ▼
┌─────────────────────────────────────────┐
│          Chat API Endpoint              │
│  /api/chat/[user]/[agent]/conversation  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│           Agent Resolution              │
│  • Fetch agent with collections/tools   │
│  • Resolve executor config              │
│  • Merge environment variables          │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│           Build Tool Definitions        │
│  • Convert TPMJS tools → AI SDK tools   │
│  • Create execute functions with config │
│  • Inject env vars into executors       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│           AI Provider Stream            │
│  • Stream text response                 │
│  • Intercept tool calls                 │
│  • Execute tools and stream results     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│           Tool Execution                │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  executeWithExecutor()          │   │
│  │  → resolveExecutorConfig()      │   │
│  │  → executePackage() [sandbox]   │   │
│  │     OR                          │   │
│  │  → executeWithCustomUrl()       │   │
│  └─────────────────────────────────┘   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│           Remote Sandbox Service        │
│  • Dynamic import via esm.sh            │
│  • Execute tool function                │
│  • Return result                        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│           Response & Persistence        │
│  • Stream result to client (SSE)        │
│  • Save messages to database            │
│  • Track token usage                    │
└─────────────────────────────────────────┘
```

### SSE Event Types

```typescript
// During streaming, clients receive these events:
{ type: 'chunk', content: 'AI response text...' }
{ type: 'tool_call', toolCallId, toolName, args }
{ type: 'tool_result', toolCallId, toolName, result }
{ type: 'tokens', inputTokens, outputTokens }
{ type: 'complete' }
```

---

## The Local Tool Challenge

### The Problem

Many powerful AI tools require access to the user's local environment:

| Tool Type | Examples | Why Local? |
|-----------|----------|------------|
| **Browser Automation** | Chrome control, Puppeteer, Playwright | Needs access to user's browser, sessions, cookies |
| **File System** | Read/write local files | Operates on user's documents |
| **Desktop Automation** | Mouse/keyboard control, screenshots | Interacts with user's desktop |
| **Development Tools** | Git, terminal, IDE | Operates in user's dev environment |
| **System Utilities** | Clipboard, notifications, system settings | Requires OS-level access |
| **Database Access** | Local PostgreSQL, SQLite | Connects to local database servers |

### Current TPMJS Limitation

TPMJS executes tools in a **remote sandbox environment**:

```
User's Machine                    TPMJS Cloud
┌─────────────┐                  ┌─────────────────────┐
│             │                  │                     │
│  Browser    │ ──HTTP POST───▶ │  Sandbox Executor   │
│  (Chat UI)  │                  │  (Isolated VM)      │
│             │                  │                     │
│  Chrome     │                  │  ✗ No access to     │
│  Files      │                  │    user's Chrome    │
│  Desktop    │                  │  ✗ No access to     │
│             │                  │    user's files     │
└─────────────┘                  └─────────────────────┘
```

Tools that need local access simply **cannot work** in the remote sandbox because:

1. **No Network Path**: The sandbox cannot "reach back" to the user's machine
2. **Security Isolation**: Sandboxes are intentionally isolated for security
3. **Session State**: User's browser sessions, cookies, and auth state are local
4. **Hardware Access**: Screen, mouse, keyboard are local peripherals

### MCP: A Partial Solution

The **Model Context Protocol (MCP)** addresses this by running tools locally:

```
User's Machine
┌────────────────────────────────────────────────────┐
│                                                    │
│  ┌─────────────┐    ┌─────────────┐               │
│  │  Claude     │    │  MCP Server │               │
│  │  Desktop    │◀──▶│  (Local)    │               │
│  └─────────────┘    └──────┬──────┘               │
│                            │                      │
│                            ▼                      │
│                     ┌─────────────┐               │
│                     │  Chrome     │               │
│                     │  Files      │               │
│                     │  Desktop    │               │
│                     └─────────────┘               │
└────────────────────────────────────────────────────┘
```

**But MCP has limitations:**
- Only works with MCP-compatible clients (Claude Desktop, some IDEs)
- Cannot be used from web interfaces
- Requires manual server setup per user
- No centralized tool discovery/registry

---

## Solution Strategies

The goal is to enable local tool execution while maintaining TPMJS's web-based, shareable agent experience. Here are potential approaches:

### Strategy 1: Hybrid Executor Bridge

**Concept**: User runs a lightweight agent on their machine that bridges TPMJS to local tools.

```
User's Machine                    TPMJS Cloud
┌────────────────────────┐       ┌─────────────────────┐
│                        │       │                     │
│  ┌─────────────────┐  │       │  ┌───────────────┐  │
│  │  Local Bridge   │◀─┼─WSS──▶│  │  TPMJS API    │  │
│  │  Agent          │  │       │  └───────────────┘  │
│  └────────┬────────┘  │       │                     │
│           │           │       │  Tool execution     │
│           ▼           │       │  request comes in   │
│  ┌─────────────────┐  │       │         │           │
│  │  Local Tools    │  │       │         ▼           │
│  │  • Chrome       │  │       │  If local tool:     │
│  │  • Files        │  │       │    → Forward to     │
│  │  • Desktop      │  │       │      user's bridge  │
│  └─────────────────┘  │       │  Else:              │
│                        │       │    → Use sandbox    │
└────────────────────────┘       └─────────────────────┘
```

**Implementation Details:**

1. **Bridge Agent**:
   - Electron app, CLI tool, or background service
   - Maintains WebSocket connection to TPMJS
   - Listens for tool execution requests
   - Executes local tools and returns results

2. **Routing Logic**:
   - Tools marked with `local: true` in metadata
   - TPMJS routes these to user's connected bridge
   - Falls back to remote execution for non-local tools

3. **Authentication**:
   - Bridge authenticates with user's TPMJS API key
   - Each bridge registered to specific user/agent
   - Secure tunnel for sensitive operations

**Pros:**
- Works from web UI
- Mix of local and remote tools
- User controls what's exposed

**Cons:**
- Requires user to install/run software
- Bridge must stay connected
- Adds latency for local calls

---

### Strategy 2: Browser Extension with Native Messaging

**Concept**: Browser extension handles local tool execution via native messaging host.

```
Browser (TPMJS Chat)
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌─────────────┐    ┌─────────────────────────────┐│
│  │  TPMJS      │    │  TPMJS Extension            ││
│  │  Web App    │◀──▶│  • Intercepts local calls   ││
│  └─────────────┘    │  • Native messaging         ││
│                     └──────────────┬──────────────┘│
└────────────────────────────────────┼───────────────┘
                                     │
                    ┌────────────────▼───────────────┐
                    │  Native Messaging Host         │
                    │  (Python/Node process)         │
                    │                                │
                    │  ┌─────────────────────────┐   │
                    │  │  Local Tool Executors   │   │
                    │  │  • Puppeteer            │   │
                    │  │  • File system          │   │
                    │  │  • Shell commands       │   │
                    │  └─────────────────────────┘   │
                    └────────────────────────────────┘
```

**Implementation Details:**

1. **Browser Extension**:
   - Injects into TPMJS pages
   - Intercepts tool execution for local-marked tools
   - Communicates via native messaging

2. **Native Messaging Host**:
   - Installed separately on user's machine
   - Registered with browser for extension communication
   - Executes actual local operations

3. **Tool Routing**:
   - Extension registers available local tools
   - TPMJS checks for local tool availability
   - Routes appropriately

**Pros:**
- Seamless web experience
- No separate app window needed
- Browser handles connection management

**Cons:**
- Chrome/Firefox only (browser dependency)
- Complex installation (extension + native host)
- Native messaging has message size limits

---

### Strategy 3: Local-First with Cloud Sync

**Concept**: Run agent locally with cloud sync for sharing/collaboration.

```
User's Machine (Primary)              TPMJS Cloud
┌──────────────────────────┐         ┌─────────────────────┐
│                          │         │                     │
│  ┌────────────────────┐  │         │  ┌───────────────┐  │
│  │  TPMJS Desktop     │◀─┼──sync──▶│  │  Agent Config │  │
│  │  (Electron/Tauri)  │  │         │  │  Conversations│  │
│  └────────┬───────────┘  │         │  │  Tool Registry│  │
│           │              │         │  └───────────────┘  │
│           ▼              │         │                     │
│  ┌────────────────────┐  │         │  For sharing:       │
│  │  Local Execution   │  │         │  Expose via URL     │
│  │  • All tools run   │  │         │  with remote exec   │
│  │    locally         │  │         │                     │
│  └────────────────────┘  │         │                     │
└──────────────────────────┘         └─────────────────────┘
```

**Implementation Details:**

1. **Desktop Application**:
   - Full TPMJS experience in native app
   - All tool execution happens locally
   - Syncs agent configs and conversations to cloud

2. **Sharing Mode**:
   - Public agents can run from cloud
   - Non-local tools execute remotely
   - Local tools marked as "requires desktop app"

3. **Hybrid Operation**:
   - Use web when away from main machine
   - Use desktop for full local access
   - Conversations sync between both

**Pros:**
- Full local access
- Works offline
- Best performance for local tools

**Cons:**
- Requires desktop app installation
- Sync complexity
- Different experience web vs desktop

---

### Strategy 4: Tunnel Service (ngrok-style)

**Concept**: User runs local executor and exposes it via secure tunnel.

```
User's Machine                    TPMJS Cloud
┌──────────────────────────┐     ┌─────────────────────────────┐
│                          │     │                             │
│  ┌────────────────────┐  │     │  ┌───────────────────────┐  │
│  │  Local Executor    │  │     │  │  Tunnel Service       │  │
│  │  + TPMJS Tunnel    │──┼────▶│  │  user123.tpmjs.tunnel │  │
│  └────────┬───────────┘  │     │  └───────────┬───────────┘  │
│           │              │     │              │               │
│           ▼              │     │              ▼               │
│  ┌────────────────────┐  │     │  ┌───────────────────────┐  │
│  │  Local Resources   │  │     │  │  Agent routes local   │  │
│  │  • Chrome          │  │     │  │  tools to tunnel URL  │  │
│  │  • Files           │  │     │  └───────────────────────┘  │
│  └────────────────────┘  │     │                             │
└──────────────────────────┘     └─────────────────────────────┘
```

**Implementation Details:**

1. **Tunnel CLI**:
   ```bash
   npx tpmjs-tunnel --port 3847 --token <api-key>
   ```
   - Starts local executor service
   - Connects to TPMJS tunnel service
   - Gets assigned a unique tunnel URL

2. **Agent Configuration**:
   - User sets executor type to "tunnel"
   - TPMJS routes tool calls to their tunnel URL
   - Tunnel forwards to local executor

3. **Security**:
   - Authenticated tunnel connection
   - HTTPS everywhere
   - User can whitelist specific tools

**Pros:**
- Simple CLI-based setup
- Works with any tools
- User controls exposure

**Cons:**
- Tunnel must stay connected
- Potential latency
- Costs for tunnel infrastructure

---

### Strategy 5: WebRTC Peer Connection

**Concept**: Direct peer-to-peer connection between browser and local executor.

```
Browser (TPMJS Chat)                  User's Machine
┌─────────────────────────┐          ┌─────────────────────┐
│                         │          │                     │
│  TPMJS Web App          │◀─WebRTC─▶│  Local Executor     │
│  with WebRTC client     │          │  with WebRTC server │
│                         │          │                     │
│  ┌───────────────────┐  │          │  ┌───────────────┐  │
│  │ Tool call comes in│  │          │  │ Execute local │  │
│  │ Check: is local?  │  │          │  │ tool, return  │  │
│  │ Yes → Send P2P    │  │          │  │ result P2P    │  │
│  │ No  → Send cloud  │  │          │  └───────────────┘  │
│  └───────────────────┘  │          │                     │
└─────────────────────────┘          └─────────────────────┘
         │
         │ Signaling
         ▼
┌─────────────────────────┐
│  TPMJS Signaling Server │
│  (Connection setup only)│
└─────────────────────────┘
```

**Implementation Details:**

1. **WebRTC Setup**:
   - TPMJS provides signaling server
   - Browser and local executor establish P2P connection
   - Data channel for tool calls/results

2. **Local Executor**:
   - Desktop app or CLI with WebRTC support
   - Advertises available local tools
   - Handles incoming tool calls

3. **Connection Flow**:
   - User opens TPMJS, local executor connects
   - Signaling exchanges connection info
   - Direct P2P connection established
   - Tool calls bypass cloud entirely

**Pros:**
- Very low latency
- No tunnel infrastructure needed
- Direct, secure connection

**Cons:**
- WebRTC complexity (NAT traversal)
- May not work on all networks
- Both ends need WebRTC support

---

### Strategy 6: Container-Based Local Executor

**Concept**: User runs a Docker container that connects to TPMJS.

```bash
docker run -v /home:/home \
  -e TPMJS_API_KEY=xxx \
  ghcr.io/tpmjs/local-executor
```

```
User's Machine (Docker)              TPMJS Cloud
┌────────────────────────────┐      ┌─────────────────────┐
│                            │      │                     │
│  ┌──────────────────────┐  │      │  ┌───────────────┐  │
│  │  TPMJS Container     │◀─┼─WSS─▶│  │  TPMJS API    │  │
│  │  • Pre-installed     │  │      │  └───────────────┘  │
│  │    tools             │  │      │                     │
│  │  • Mount user dirs   │  │      │  Routes local tools │
│  └──────────┬───────────┘  │      │  to container       │
│             │              │      │                     │
│  ┌──────────▼───────────┐  │      │                     │
│  │  Mounted Volumes     │  │      │                     │
│  │  • /home (files)     │  │      │                     │
│  │  • /var/run/docker   │  │      │                     │
│  │    (nested Docker)   │  │      │                     │
│  └──────────────────────┘  │      │                     │
└────────────────────────────┘      └─────────────────────┘
```

**Implementation Details:**

1. **Container Image**:
   - Pre-installed common tools (Puppeteer, etc.)
   - WebSocket client to TPMJS
   - Configurable volume mounts

2. **Tool Execution**:
   - Container receives tool calls via WebSocket
   - Executes with access to mounted volumes
   - Returns results

3. **Browser Automation**:
   - Container could run headless Chrome
   - Or use browser running on host via port mapping
   - VNC for visual debugging

**Pros:**
- Consistent environment
- Easy distribution via Docker Hub
- Isolated yet with controlled access

**Cons:**
- Docker dependency
- Limited GUI access
- Complex browser automation setup

---

### Strategy 7: Agent-to-Agent Delegation

**Concept**: Cloud agent delegates local tasks to user's local agent.

```
TPMJS Cloud                          User's Machine
┌─────────────────────────────┐     ┌─────────────────────────┐
│                             │     │                         │
│  ┌───────────────────────┐  │     │  ┌───────────────────┐  │
│  │  Cloud Agent          │  │     │  │  Local Agent      │  │
│  │  (Primary)            │  │     │  │  (MCP Server)     │  │
│  │                       │  │     │  │                   │  │
│  │  When local tool      │──┼────▶│  │  Receives task,   │  │
│  │  needed, delegate to  │  │     │  │  executes locally │  │
│  │  local agent          │◀─┼─────│  │  returns result   │  │
│  └───────────────────────┘  │     │  └───────────────────┘  │
│                             │     │         │               │
│                             │     │         ▼               │
│                             │     │  ┌───────────────────┐  │
│                             │     │  │  Chrome, Files    │  │
│                             │     │  └───────────────────┘  │
└─────────────────────────────┘     └─────────────────────────┘
```

**Implementation Details:**

1. **Local Agent**:
   - Runs as MCP server
   - Connected to cloud agent via tool
   - Advertises local capabilities

2. **Delegation Tool**:
   ```typescript
   delegateToLocal({
     task: "Take a screenshot of the current page",
     context: { ... }
   })
   ```

3. **Execution Flow**:
   - Cloud agent determines task needs local access
   - Uses delegation tool to send to local agent
   - Local agent executes and returns result
   - Cloud agent incorporates result

**Pros:**
- Clean separation of concerns
- Cloud agent coordinates, local executes
- Scales well conceptually

**Cons:**
- Adds complexity (two agents)
- Potential context loss between agents
- Requires sophisticated delegation logic

---

### Strategy 8: Progressive Enhancement

**Concept**: Same tools work in cloud (limited) and local (full), with graceful degradation.

```typescript
// Tool definition with progressive capability
{
  name: "readFile",
  capabilities: {
    remote: {
      description: "Read files from sandboxed storage",
      restrictions: ["sandbox-only", "size-limit-1mb"]
    },
    local: {
      description: "Read any accessible file",
      restrictions: []
    }
  },
  execute: async (input, context) => {
    if (context.isLocal) {
      return fs.readFile(input.path);
    } else {
      return sandboxFs.readFile(input.sandboxPath);
    }
  }
}
```

**Implementation Details:**

1. **Tool Metadata**:
   - Tools declare remote and local capabilities
   - Different restrictions per environment
   - Same function name, different behaviors

2. **UI Indication**:
   - Show which capabilities are available
   - Prompt user to connect local executor for full access
   - Graceful fallback to remote when local unavailable

3. **Runtime Detection**:
   - Check for local executor connection
   - Route to appropriate implementation
   - Surface limitations in tool output

**Pros:**
- Works everywhere, better locally
- Clear capability communication
- No hard failures

**Cons:**
- Dual implementation complexity
- User confusion about capabilities
- Tool authors must handle both cases

---

### Strategy 9: Cloudflare Workers + Durable Objects

**Concept**: Edge execution with persistent state, user provides API access.

```
User configures API credentials
          │
          ▼
┌─────────────────────────────────────────────────────┐
│                Cloudflare Edge                       │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  Durable Object (per user)                     │ │
│  │  • Persistent WebSocket to user services       │ │
│  │  • Cached credentials (encrypted)              │ │
│  │  • Session state for browser automation        │ │
│  └────────────────────────────────────────────────┘ │
│                        │                             │
│         ┌──────────────┴──────────────┐             │
│         ▼                             ▼             │
│  ┌────────────┐              ┌────────────────────┐ │
│  │ Tool Exec  │              │ Browser (remote)   │ │
│  │ (fast)     │              │ via Browserless.io │ │
│  └────────────┘              └────────────────────┘ │
└─────────────────────────────────────────────────────┘
         │
         ▼
User's configured services
(if they have public APIs)
```

**Implementation Details:**

1. **Edge Functions**:
   - Execute tools at edge, close to user
   - Durable Objects maintain state
   - Low latency for most operations

2. **Remote Browser Services**:
   - Integrate with Browserless, Browserbase, etc.
   - User provides API keys for these services
   - Browser runs "close enough" to cloud

3. **User's Services**:
   - If user has self-hosted services with APIs
   - Configure credentials in TPMJS
   - Edge function calls user's services

**Pros:**
- Low latency edge execution
- No local installation required
- Scales with Cloudflare infrastructure

**Cons:**
- Still remote execution
- Requires paid browser services
- Not truly local access

---

### Strategy 10: Sandboxed Local VM

**Concept**: TPMJS provisions a secure VM on user's machine.

```
User's Machine
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Host OS                                             │
│  ┌────────────────────────────────────────────────┐ │
│  │                                                │ │
│  │  ┌──────────────────────────────────────────┐ │ │
│  │  │  TPMJS Sandbox VM                        │ │ │
│  │  │  (Firecracker/gVisor/WASM)              │ │ │
│  │  │                                          │ │ │
│  │  │  • Controlled network access             │ │ │
│  │  │  • Mounted specific directories          │ │ │
│  │  │  • Pre-approved tools only               │ │ │
│  │  │  • Resource limits (CPU, RAM, time)      │ │ │
│  │  └──────────────────────────────────────────┘ │ │
│  │                                                │ │
│  │  User approves:                                │ │
│  │  ✓ Mount ~/Documents (read-only)              │ │
│  │  ✓ Allow outbound HTTPS                       │ │
│  │  ✗ Deny keylogger access                      │ │
│  │                                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Implementation Details:**

1. **Micro-VM Technology**:
   - Firecracker for lightweight VMs
   - gVisor for container sandboxing
   - WebAssembly for in-browser sandboxing

2. **Capability-Based Security**:
   - User explicitly grants permissions
   - File system mounts with restrictions
   - Network access whitelisting
   - Hardware access controls

3. **Tool Verification**:
   - Only signed/verified tools can run
   - Code review for local-capable tools
   - Sandboxed execution even locally

**Pros:**
- Security through isolation
- Fine-grained permissions
- Local but controlled

**Cons:**
- Complex implementation
- Performance overhead
- Still limited vs native access

---

## Implementation Roadmap

Based on complexity, impact, and user experience, here's a suggested prioritization:

### Phase 1: Foundation (Weeks 1-4)

**Strategy 4: Tunnel Service**
- Lowest friction entry point
- Works with existing TPMJS architecture
- Users already familiar with ngrok-style tools

**Deliverables:**
1. `tpmjs-tunnel` CLI package
2. Tunnel relay service on tpmjs.com
3. Agent executor type "tunnel"
4. Documentation and getting started guide

### Phase 2: Better UX (Weeks 5-8)

**Strategy 2: Browser Extension**
- Eliminates CLI requirement for web users
- Seamless web experience
- Works on any platform with Chrome/Firefox

**Deliverables:**
1. TPMJS Browser Extension
2. Native messaging host installer
3. Local tool capability detection
4. Extension distribution (Chrome Web Store, Firefox Add-ons)

### Phase 3: Power Users (Weeks 9-12)

**Strategy 3: Local-First Desktop App**
- Full power for power users
- Offline support
- Best performance

**Deliverables:**
1. TPMJS Desktop (Electron or Tauri)
2. Sync protocol for agents/conversations
3. Hybrid mode (web fallback)

### Phase 4: Advanced (Future)

**Strategy 8: Progressive Enhancement**
- Make existing tools smarter
- Better capability communication
- Graceful degradation

**Strategy 6: Container-Based Executor**
- For DevOps/engineer users
- Reproducible environments
- CI/CD integration

---

## Summary

TPMJS's remote execution model works well for stateless, API-based tools but faces challenges with local/computer-controlling tools. The solution isn't one-size-fits-all:

| User Type | Best Strategy | Why |
|-----------|---------------|-----|
| **Casual User** | Browser Extension | No CLI, just install extension |
| **Developer** | Tunnel Service | Familiar CLI workflow |
| **Power User** | Desktop App | Full control, best performance |
| **Enterprise** | Container + Custom Executor | Controlled, auditable |

The key insight is that **local execution isn't a single feature but a spectrum** of approaches, each with different trade-offs between:
- Ease of setup
- Security
- Performance
- Capability breadth

TPMJS should support multiple approaches, letting users choose based on their needs and comfort level.
