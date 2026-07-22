# @tpmjs/bridge

Connect local MCP servers to [TPMJS](https://tpmjs.com) — run tools on your own machine, call them from the cloud.

<p>
  <a href="https://www.npmjs.com/package/@tpmjs/bridge"><img src="https://img.shields.io/npm/v/@tpmjs/bridge.svg" alt="npm version"></a>
  <a href="https://github.com/tpmjs/tpmjs/blob/main/LICENSE"><img src="https://img.shields.io/github/license/tpmjs/tpmjs" alt="License"></a>
</p>

TPMJS is the protocol-agnostic tool layer for AI agents — one collection served as CLI · MCP · REST · SDK · Skill. Most tools run in TPMJS's hosted sandbox, but some can only run *locally*: Chrome DevTools automation, filesystem access, local databases, or internal APIs. The **Bridge** runs on your machine, connects to any stdio MCP server via [`@tpmjs/mcp-client`](https://www.npmjs.com/package/@tpmjs/mcp-client), registers those tools with TPMJS, and then securely proxies tool calls back and forth. Your agent uses the local tools through TPMJS without ever installing them itself.

## Installation

```bash
npm install -g @tpmjs/bridge
# or run without installing
npx @tpmjs/bridge --help
```

## Quick start

```bash
# 1. Create a config file (~/.tpmjs/bridge.json)
tpmjs-bridge init

# 2. Add a local MCP server
tpmjs-bridge add filesystem \
  --command npx \
  --args "-y,@modelcontextprotocol/server-filesystem,/tmp"

# 3. Authenticate (get a key at https://tpmjs.com/dashboard/settings/api-keys)
tpmjs-bridge login --api-key YOUR_API_KEY

# 4. Start bridging — connects your servers and stays running
tpmjs-bridge start
```

Your local tools are now reachable through your TPMJS account. Press `Ctrl+C` to stop.

## Commands

```bash
tpmjs-bridge init                  # Create ~/.tpmjs/bridge.json with an example server
tpmjs-bridge login --api-key <key> # Save an API key (or set TPMJS_API_KEY)
tpmjs-bridge logout                # Remove saved credentials
tpmjs-bridge add <name>            # Add an MCP server to the config
tpmjs-bridge remove <name>         # Remove an MCP server from the config
tpmjs-bridge list                  # List configured MCP servers
tpmjs-bridge config                # Print the config file path
tpmjs-bridge start                 # Connect servers, register tools, and proxy calls
tpmjs-bridge status                # Show auth + configured-server status
```

### `add <name>` options

| Option | Default | Description |
|--------|---------|-------------|
| `--command <cmd>` | `npx` | Command that launches the MCP server |
| `--args <args>` | `""` | Comma-separated arguments (e.g. `-y,@scope/server,/path`) |

### `login` options

| Option | Description |
|--------|-------------|
| `--api-key <key>` | API key. Alternatively set the `TPMJS_API_KEY` environment variable. |

### `start` options

| Option | Description |
|--------|-------------|
| `-v, --verbose` | Log every connection, tool call, and result |
| `--url <url>` | Override the TPMJS API base URL (default `https://tpmjs.com`) |

## Configuration

- **Config file:** `~/.tpmjs/bridge.json` — `{ "servers": [ ...MCPServerConfig ] }`. Edit it directly or manage entries with `add`/`remove`.
- **Credentials:** `~/.tpmjs/credentials.json` (written with mode `0600`).
- **Environment:** `TPMJS_API_KEY` is honored by both `login` and `start`.

`start` refuses to run if you're not authenticated or if the only configured server is the placeholder `example` created by `init` — edit the config to add a real server first.

## Programmatic usage

The bridge is also exposed as a library, sharing the `MCPServerConfig` shape from `@tpmjs/mcp-client`:

```typescript
import { Bridge, loadConfig } from '@tpmjs/bridge';

const bridge = new Bridge({
  apiKey: process.env.TPMJS_API_KEY!,
  servers: loadConfig().servers,
  verbose: true,
  // apiUrl, pollInterval (1000ms), heartbeatInterval (30000ms) are optional
});

await bridge.start();
// ... later
await bridge.stop();
```

Exports: `Bridge`, `BridgeOptions`, config helpers (`loadConfig`, `saveConfig`, `createDefaultConfig`, `loadCredentials`, `saveCredentials`, `deleteCredentials`, `ensureConfigDir`, `getConfigPath`, `getCredentialsPath`), and typed HTTP contracts including `BridgePostRequest`, `BridgePollResponse`, `BridgeSuccessResponse`, `BridgeErrorResponse`, and `BridgeToolCall`. The former `BridgeToServerMessage` and `ServerToBridgeMessage` names remain as deprecated compatibility aliases.

## How it works

`start` connects to each configured MCP server, `POST`s the discovered tools to TPMJS (`/api/bridge`), then polls that endpoint over authenticated HTTP for pending tool calls, executes them against the configured server, and posts typed results back — with a periodic heartbeat. On shutdown it `DELETE`s its registration and disconnects every server.

## Links

- [Repository](https://github.com/tpmjs/tpmjs)
- [Bridge tutorial](https://tpmjs.com/docs/tutorials/bridge)
- [MCP tutorial](https://tpmjs.com/docs/tutorials/mcp)
- [@tpmjs/mcp-client](https://www.npmjs.com/package/@tpmjs/mcp-client) — the MCP transport layer this CLI is built on

## License

MIT
