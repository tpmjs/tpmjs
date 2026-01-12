# MCP Bridge Implementation Status

**Last Updated:** 2026-01-12

## Overview

The MCP Bridge system allows users to connect local MCP servers (like Chrome DevTools, file systems, or custom tools) to their TPMJS collections. Tools running on the user's machine can be accessed remotely through TPMJS.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Machine                            │
│  ┌─────────────┐     ┌─────────────────────────────────────┐    │
│  │ MCP Server  │────▶│         @tpmjs/bridge CLI           │    │
│  │ (stdio)     │     │  - Connects to local MCP servers    │    │
│  └─────────────┘     │  - Polls TPMJS for tool calls       │    │
│  ┌─────────────┐     │  - Executes tools locally           │    │
│  │ MCP Server  │────▶│  - Returns results to TPMJS         │    │
│  │ (stdio)     │     └──────────────┬──────────────────────┘    │
│  └─────────────┘                    │                            │
└─────────────────────────────────────┼────────────────────────────┘
                                      │ HTTP Polling
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                         TPMJS Cloud                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │  /api/bridge    │    │  MCP Handlers   │    │  Database   │  │
│  │  - Registration │◀──▶│  - tools/list   │◀──▶│  - Bridge   │  │
│  │  - Tool calls   │    │  - tools/call   │    │    Connection│  │
│  │  - Results      │    │                 │    │  - Bridge   │  │
│  └─────────────────┘    └─────────────────┘    │    Tools    │  │
│                                                 └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Packages Created

### 1. `@tpmjs/mcp-client` (packages/mcp-client)

MCP client library for connecting to MCP servers.

**Features:**
- Connect to MCP servers via stdio transport
- Discover tools from servers
- Execute tool calls
- Manage multiple server connections

**Usage:**
```typescript
import { MCPClientManager } from '@tpmjs/mcp-client';

const manager = new MCPClientManager();
const tools = await manager.connect({
  id: 'my-server',
  name: 'My MCP Server',
  transport: 'stdio',
  command: 'node',
  args: ['./server.js']
});

const result = await manager.callTool('my-server', 'toolName', { arg: 'value' });
await manager.disconnectAll();
```

### 2. `@tpmjs/bridge` (packages/bridge)

CLI for users to run on their local machine.

**Commands:**
```bash
tpmjs-bridge init              # Create config file
tpmjs-bridge login             # Authenticate with TPMJS
tpmjs-bridge logout            # Remove credentials
tpmjs-bridge add <name>        # Add an MCP server
tpmjs-bridge remove <name>     # Remove an MCP server
tpmjs-bridge list              # List configured servers
tpmjs-bridge config            # Show config path
tpmjs-bridge start             # Start the bridge
tpmjs-bridge status            # Show bridge status
```

**Config file:** `~/.tpmjs/bridge.json`
```json
{
  "servers": [
    {
      "id": "chrome-devtools",
      "name": "Chrome DevTools",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic/claude-in-chrome"]
    }
  ]
}
```

### 3. `@tpmjs/test-file-writer` (packages/tools/test-file-writer)

Test MCP server for development and testing.

**Tools:**
- `write_file` - Write content to a file
- `read_file` - Read content from a file
- `list_files` - List all files
- `delete_file` - Delete a file
- `get_info` - Get server info

**Files stored in:** `~/.tpmjs/test-files/`

## Database Schema

### BridgeConnection

Tracks active bridge connections per user.

```prisma
model BridgeConnection {
  id            String    @id @default(cuid())
  userId        String    @unique @map("user_id")
  user          User      @relation(...)
  status        String    @default("disconnected") // 'connected' | 'disconnected'
  socketId      String?   // Internal routing identifier
  tools         Json      @default("[]") // Cached tool definitions
  lastSeen      DateTime?
  clientVersion String?
  clientOS      String?
}
```

### CollectionBridgeTool

Links bridge tools to collections.

```prisma
model CollectionBridgeTool {
  id           String     @id @default(cuid())
  collectionId String
  collection   Collection @relation(...)
  serverId     String     // e.g., "chrome-devtools"
  toolName     String     // e.g., "screenshot"
  displayName  String?    // Custom display name
  note         String?    // User notes
}
```

## API Endpoints

### Bridge Communication API

**`POST /api/bridge`** - Bridge registration and tool results
```typescript
// Register bridge
{ type: 'register', tools: [...], clientVersion: '0.1.0', clientOS: 'darwin' }

// Submit tool result
{ type: 'result', callId: 'xxx', result: {...} }

// Submit tool error
{ type: 'result', callId: 'xxx', error: { message: '...' } }

// Heartbeat
{ type: 'heartbeat' }
```

**`GET /api/bridge`** - Poll for pending tool calls
```typescript
// Response
{ calls: [{ callId: 'xxx', serverId: 'chrome', toolName: 'screenshot', args: {} }] }
```

**`DELETE /api/bridge`** - Disconnect bridge

### User Bridge Status API

**`GET /api/user/bridge`** - Get bridge status for current user
```typescript
{
  status: 'connected' | 'disconnected' | 'stale' | 'never_connected',
  lastSeen: '2026-01-12T...',
  clientVersion: '0.1.0',
  clientOS: 'darwin',
  toolCount: 5,
  servers: [{ id: 'chrome', name: 'Chrome', toolCount: 3, tools: [...] }]
}
```

### Collection Bridge Tools API

**`GET /api/collections/[id]/bridge-tools`** - List bridge tools in collection
**`POST /api/collections/[id]/bridge-tools`** - Add bridge tool to collection
**`PATCH /api/collections/[id]/bridge-tools/[id]`** - Update bridge tool
**`DELETE /api/collections/[id]/bridge-tools/[id]`** - Remove bridge tool

## MCP Handler Integration

Bridge tools are included in MCP `tools/list` responses when:
1. The collection has bridge tools added
2. The collection owner has an active bridge connection
3. The bridge status is "connected"

Bridge tool names use the format: `bridge--{serverId}--{toolName}`

Example: `bridge--chrome-devtools--screenshot`

## UI

### Bridge Settings Page

Location: `/dashboard/settings/bridge`

Features:
- Shows connection status (connected/disconnected/stale/never_connected)
- Lists connected MCP servers and their tools
- Shows last seen time, client version, platform
- Quick start instructions for new users

### Navigation

Bridge link added to dashboard sidebar under "Bridge" with link icon.

## Testing Results

All components tested successfully:

| Component | Status | Notes |
|-----------|--------|-------|
| MCPClientManager | ✅ Pass | Connects, discovers tools, executes calls |
| Test File Writer | ✅ Pass | All 5 tools work correctly |
| Bridge CLI | ✅ Pass | All commands work |
| Bridge Class | ✅ Pass | Connects to servers, registers, polls |
| API Endpoints | ✅ Pass | Auth validation works |
| Type Check | ✅ Pass | No type errors |
| Lint | ✅ Pass | Only pre-existing warnings |

## What's Working

1. **Local MCP Server Connection** - Bridge connects to local MCP servers via stdio
2. **Tool Discovery** - Automatically discovers tools from connected servers
3. **Tool Execution** - Can execute tools and return results
4. **HTTP Polling** - Vercel-compatible polling instead of WebSocket
5. **Bridge CLI** - Full CLI with init, login, add, remove, start commands
6. **API Endpoints** - All endpoints implemented with proper auth
7. **Database Schema** - Bridge connections and collection tools stored
8. **MCP Integration** - Bridge tools included in MCP tools/list
9. **UI** - Bridge status page with connection info

## What Needs Manual Testing

1. **End-to-End Flow** - Requires logging in via web UI and getting a session token
2. **Real MCP Servers** - Test with Chrome DevTools, filesystem, etc.
3. **Tool Execution via MCP** - Call bridge tools through the MCP protocol
4. **Collection Integration** - Add bridge tools to collections via UI

## How to Test Locally

```bash
# 1. Build packages
pnpm --filter=@tpmjs/mcp-client build
pnpm --filter=@tpmjs/bridge build
pnpm --filter=@tpmjs/test-file-writer build

# 2. Initialize bridge config
node packages/bridge/dist/cli.js init

# 3. Add test server
node packages/bridge/dist/cli.js add test-file-writer \
  --command "node" \
  --args "$(pwd)/packages/tools/test-file-writer/dist/server.js"

# 4. Start dev server
pnpm --filter=@tpmjs/web dev

# 5. Log in via browser, get session token

# 6. Start bridge (with real token)
node packages/bridge/dist/cli.js start --token <session-token>

# 7. Visit /dashboard/settings/bridge to see status
```

## Future Improvements

- [ ] Proper API key authentication (not session tokens)
- [ ] Redis for tool call queuing (production)
- [ ] WebSocket support for lower latency
- [ ] Bridge tool UI in collection editor
- [ ] Tool call logging and debugging
- [ ] Rate limiting for bridge connections
- [ ] Multiple bridge instances per user
- [ ] Bridge health monitoring alerts

## Files Changed/Created

### New Packages
- `packages/mcp-client/` - MCP client library
- `packages/bridge/` - Bridge CLI
- `packages/tools/test-file-writer/` - Test MCP server

### Database
- `packages/db/prisma/schema.prisma` - Added BridgeConnection, CollectionBridgeTool

### API Routes
- `apps/web/src/app/api/bridge/route.ts` - Bridge API
- `apps/web/src/app/api/user/bridge/route.ts` - User bridge status
- `apps/web/src/app/api/collections/[id]/bridge-tools/route.ts` - Collection bridge tools
- `apps/web/src/app/api/collections/[id]/bridge-tools/[bridgeToolId]/route.ts` - Single bridge tool

### MCP Integration
- `apps/web/src/lib/mcp/handlers.ts` - Updated to include bridge tools
- `apps/web/src/lib/mcp/tool-converter.ts` - Added bridge tool conversion
- `apps/web/src/lib/mcp/index.ts` - Updated exports

### UI
- `apps/web/src/app/dashboard/settings/bridge/page.tsx` - Bridge status page
- `apps/web/src/components/dashboard/DashboardLayout.tsx` - Added Bridge nav link

### Types
- `packages/types/src/collection.ts` - Added bridge tool schemas
