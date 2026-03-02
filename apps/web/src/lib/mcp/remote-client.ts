import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// Defensive guard: MCP SDK v1.25+ OAuth handling may attempt to monkey-patch
// history.pushState for OAuth callback detection. In some server environments
// (Vercel Node.js runtime), history may exist but pushState is non-writable,
// causing a TypeError. Make pushState writable before the SDK attempts to patch it.
if (typeof globalThis.history !== 'undefined') {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis.history, 'pushState');
  if (descriptor && !descriptor.writable && !descriptor.set) {
    try {
      Object.defineProperty(globalThis.history, 'pushState', {
        ...descriptor,
        writable: true,
        configurable: true,
      });
    } catch {
      // Cannot make pushState writable — environment does not allow it
    }
  }
}

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

/**
 * Create an MCP client and connect to a remote server.
 * Tries StreamableHTTP first, falls back to SSE.
 */
async function connectToRemote(
  config: RemoteMcpServerConfig
): Promise<{ client: Client; transport: StreamableHTTPClientTransport | SSEClientTransport }> {
  const url = new URL(config.url);
  const headers = buildAuthHeaders(config);
  const requestInit: RequestInit = Object.keys(headers).length > 0 ? { headers } : {};

  const client = new Client({ name: 'tpmjs-aggregator', version: '1.0.0' }, { capabilities: {} });

  // Try StreamableHTTP first
  try {
    const transport = new StreamableHTTPClientTransport(url, {
      requestInit,
      reconnectionOptions: {
        maxReconnectionDelay: 5000,
        initialReconnectionDelay: 1000,
        reconnectionDelayGrowFactor: 1.5,
        maxRetries: 0,
      },
    });

    await Promise.race([
      client.connect(transport),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), CONNECT_TIMEOUT_MS)
      ),
    ]);

    return { client, transport };
  } catch {
    // StreamableHTTP failed, try SSE
  }

  // Fallback to SSE transport
  const sseClient = new Client(
    { name: 'tpmjs-aggregator', version: '1.0.0' },
    { capabilities: {} }
  );

  const sseTransport = new SSEClientTransport(url, {
    requestInit,
    eventSourceInit: {
      fetch: (input: string | URL | Request, init?: RequestInit) =>
        fetch(input, {
          ...init,
          headers: { ...(init?.headers as Record<string, string>), ...headers },
        }),
    },
  });

  await Promise.race([
    sseClient.connect(sseTransport),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), CONNECT_TIMEOUT_MS)
    ),
  ]);

  return { client: sseClient, transport: sseTransport };
}

/**
 * Discover tools from a remote MCP server.
 * Creates a connection, calls listTools(), and disconnects.
 */
export async function discoverRemoteTools(config: RemoteMcpServerConfig): Promise<RemoteMcpTool[]> {
  const { client, transport } = await connectToRemote(config);

  try {
    const result = await client.listTools();
    return result.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema as Record<string, unknown>,
    }));
  } finally {
    await transport.close().catch(() => {});
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
  const { client, transport } = await connectToRemote(config);

  try {
    const result = await client.callTool({ name: toolName, arguments: args });
    return {
      content: result.content as unknown[],
      isError: result.isError as boolean | undefined,
    };
  } finally {
    await transport.close().catch(() => {});
  }
}
