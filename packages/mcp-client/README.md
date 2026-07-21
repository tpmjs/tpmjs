# @tpmjs/mcp-client

A small MCP (Model Context Protocol) client library for connecting to stdio MCP servers and managing many of them at once.

<p>
  <a href="https://www.npmjs.com/package/@tpmjs/mcp-client"><img src="https://img.shields.io/npm/v/@tpmjs/mcp-client.svg" alt="npm version"></a>
  <a href="https://github.com/tpmjs/tpmjs/blob/main/LICENSE"><img src="https://img.shields.io/github/license/tpmjs/tpmjs" alt="License"></a>
</p>

`@tpmjs/mcp-client` wraps the official [`@modelcontextprotocol/sdk`](https://modelcontextprotocol.io) client with a `MCPClientManager` that connects to one or more **stdio** MCP servers, discovers their tools, calls them, and tracks connection status. It's the transport layer that [`@tpmjs/bridge`](https://www.npmjs.com/package/@tpmjs/bridge) uses to expose local MCP servers up to [TPMJS](https://tpmjs.com) — the protocol-agnostic tool layer for AI agents (one collection served as CLI · MCP · REST · SDK · Skill). Use it directly whenever you want to drive several local MCP servers from a single Node.js process.

## Installation

```bash
npm install @tpmjs/mcp-client
# or
pnpm add @tpmjs/mcp-client
```

## Usage

```typescript
import { MCPClientManager } from '@tpmjs/mcp-client';

const manager = new MCPClientManager({
  onStatusChange: (serverId, status, error) => {
    console.log(`${serverId}: ${status}${error ? ` (${error})` : ''}`);
  },
});

// Connect to a stdio MCP server — returns its discovered tools
const tools = await manager.connect({
  id: 'filesystem',
  name: 'Filesystem',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
  env: { LOG_LEVEL: 'info' },
});

console.log(tools.map((t) => t.name));

// Call a tool on that server
const result = await manager.callTool('filesystem', 'read_file', {
  path: '/tmp/example.txt',
});
console.log(result.content, result.isError);

// Clean up
await manager.disconnectAll();
```

## API

### `new MCPClientManager(options?)`

- `options.onStatusChange?: (serverId, status, error?) => void` — fired whenever a server's status changes. `status` is one of `'disconnected' | 'connecting' | 'connected' | 'error'`.

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `connect(config: MCPServerConfig)` | `Promise<MCPTool[]>` | Spawn/connect to a stdio server, list its tools, and track it. Reconnects if the `id` is already connected. |
| `disconnect(serverId: string)` | `Promise<void>` | Close and forget a single server. |
| `disconnectAll()` | `Promise<void>` | Close every connected server. |
| `listTools(serverId: string)` | `MCPTool[]` | Cached tools for one server (throws if not connected). |
| `listAllTools()` | `Array<{ serverId, serverName, tool }>` | Flattened tools across all connected servers. |
| `callTool(serverId, toolName, args)` | `Promise<MCPToolResult>` | Invoke a tool; throws if the server isn't connected. |
| `getServers()` | `ConnectedServer[]` | Status + tools for every known server. |
| `getServer(serverId: string)` | `ConnectedServer \| undefined` | Status + tools for one server. |
| `isConnected(serverId: string)` | `boolean` | Whether a server is currently connected. |

### Types

```typescript
interface MCPServerConfig {
  id: string;                       // unique id
  name: string;                     // display name
  transport: 'stdio';               // only stdio is supported today
  command: string;                  // e.g. 'npx'
  args?: string[];
  env?: Record<string, string>;
}

interface MCPTool {
  name: string;
  description?: string;
  inputSchema: { type: 'object'; properties?: Record<string, unknown>; required?: string[]; [k: string]: unknown };
}

interface MCPToolResult {
  content: Array<{ type: 'text' | 'image' | 'resource'; text?: string; mimeType?: string; data?: string; [k: string]: unknown }>;
  isError?: boolean;
}

type MCPClientStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ConnectedServer {
  id: string;
  name: string;
  status: MCPClientStatus;
  tools: MCPTool[];
  error?: string;
}
```

> **Note:** Only the `stdio` transport is implemented. HTTP/SSE MCP transports are not supported by this package.

## Links

- [Repository](https://github.com/tpmjs/tpmjs)
- [MCP tutorial](https://tpmjs.com/docs/tutorials/mcp)
- [@tpmjs/bridge](https://www.npmjs.com/package/@tpmjs/bridge) — expose local MCP servers to TPMJS
- [Model Context Protocol](https://modelcontextprotocol.io)

## License

MIT
