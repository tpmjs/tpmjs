import { MCPClientManager, type MCPStreamableHTTPServerConfig } from '@tpmjs/mcp-client';

export interface RemoteMcpServerConfig {
  url: string;
  authType?: 'bearer' | 'header' | null;
  authHeader?: string | null;
  authToken?: string | null;
}

export interface RemoteMcpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

interface RemoteToolCallResult {
  content: unknown[];
  isError?: boolean;
}

const CONNECT_TIMEOUT_MS = 15_000;
const REMOTE_SERVER_ID = 'remote';

/**
 * Build auth headers from server config
 */
function buildAuthHeaders(config: RemoteMcpServerConfig): Record<string, string> {
  if (!config.authType || !config.authToken) return {};

  if (config.authType === 'bearer') {
    const header = config.authHeader || 'Authorization';
    return { [header]: `Bearer ${config.authToken}` };
  }

  if (config.authType === 'header') {
    const header = config.authHeader || 'Authorization';
    return { [header]: config.authToken };
  }

  return {};
}

function clientConfig(config: RemoteMcpServerConfig): MCPStreamableHTTPServerConfig {
  return {
    id: REMOTE_SERVER_ID,
    name: new URL(config.url).host,
    transport: 'streamable-http',
    url: config.url,
    headers: buildAuthHeaders(config),
    connectTimeoutMs: CONNECT_TIMEOUT_MS,
  };
}

/**
 * Discover tools from a remote MCP server.
 * Creates a connection, calls listTools(), and disconnects.
 */
export async function discoverRemoteTools(config: RemoteMcpServerConfig): Promise<RemoteMcpTool[]> {
  const manager = new MCPClientManager();

  try {
    const tools = await manager.connect(clientConfig(config));
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema as Record<string, unknown>,
    }));
  } finally {
    await manager.disconnectAll();
  }
}

/**
 * Call a tool on a remote MCP server.
 * Creates a connection, calls the tool, and disconnects.
 */
export async function callRemoteTool(
  config: RemoteMcpServerConfig,
  toolName: string,
  args: Record<string, unknown>
): Promise<RemoteToolCallResult> {
  const manager = new MCPClientManager();

  try {
    await manager.connect(clientConfig(config), { discoverTools: false });
    return await manager.callTool(REMOTE_SERVER_ID, toolName, args);
  } finally {
    await manager.disconnectAll();
  }
}
