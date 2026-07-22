import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  StreamableHTTPClientTransport,
  StreamableHTTPError,
} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { MCPServerConfig, MCPTransportType } from './types.js';

export type MCPClientTransport =
  | StdioClientTransport
  | StreamableHTTPClientTransport
  | SSEClientTransport;

export interface OpenMCPConnection {
  client: Client;
  transport: MCPClientTransport;
  transportType: MCPTransportType;
}

const CLIENT_INFO = {
  name: 'tpmjs-mcp-client',
  version: '1.0.0',
} as const;

function createClient(): Client {
  return new Client(CLIENT_INFO, { capabilities: {} });
}

function connectOptions(timeoutMs: number | undefined): { timeout: number } | undefined {
  if (timeoutMs === undefined) return undefined;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError('connectTimeoutMs must be a positive finite number');
  }
  return { timeout: timeoutMs };
}

function requestInit(headers: Record<string, string> | undefined): RequestInit | undefined {
  return headers && Object.keys(headers).length > 0 ? { headers } : undefined;
}

function eventSourceFetch(headers: Record<string, string> | undefined) {
  if (!headers || Object.keys(headers).length === 0) return undefined;

  return (input: string | URL | Request, init?: RequestInit) => {
    const mergedHeaders = new Headers(init?.headers);
    for (const [name, value] of Object.entries(headers)) {
      mergedHeaders.set(name, value);
    }
    return fetch(input, { ...init, headers: mergedHeaders });
  };
}

async function connectClient(
  client: Client,
  transport: MCPClientTransport,
  timeoutMs: number | undefined
): Promise<void> {
  await client.connect(transport, connectOptions(timeoutMs));
}

async function closeQuietly(client: Client): Promise<void> {
  await client.close().catch(() => {});
}

function canFallbackToSse(error: unknown): boolean {
  return (
    error instanceof StreamableHTTPError &&
    error.code !== undefined &&
    error.code >= 400 &&
    error.code < 500
  );
}

async function openSseConnection(
  config: Extract<MCPServerConfig, { transport: 'streamable-http' | 'sse' }>
): Promise<OpenMCPConnection> {
  const url = new URL(config.url);
  const client = createClient();
  const fetchWithHeaders = eventSourceFetch(config.headers);
  const transport = new SSEClientTransport(url, {
    requestInit: requestInit(config.headers),
    ...(fetchWithHeaders
      ? {
          eventSourceInit: {
            fetch: fetchWithHeaders,
          },
        }
      : {}),
  });

  try {
    await connectClient(client, transport, config.connectTimeoutMs);
    return { client, transport, transportType: 'sse' };
  } catch (error) {
    await closeQuietly(client);
    throw error;
  }
}

/** Open one MCP connection using the configured transport. */
export async function openMCPConnection(config: MCPServerConfig): Promise<OpenMCPConnection> {
  if (config.transport === 'stdio') {
    const client = createClient();
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args ?? [],
      env: config.env,
    });

    try {
      await connectClient(client, transport, config.connectTimeoutMs);
      return { client, transport, transportType: 'stdio' };
    } catch (error) {
      await closeQuietly(client);
      throw error;
    }
  }

  if (config.transport === 'sse') {
    return openSseConnection(config);
  }

  const url = new URL(config.url);
  const client = createClient();
  const transport = new StreamableHTTPClientTransport(url, {
    requestInit: requestInit(config.headers),
    reconnectionOptions: {
      maxReconnectionDelay: 5_000,
      initialReconnectionDelay: 1_000,
      reconnectionDelayGrowFactor: 1.5,
      maxRetries: 2,
    },
  });

  try {
    await connectClient(client, transport, config.connectTimeoutMs);
    return { client, transport, transportType: 'streamable-http' };
  } catch (streamableHttpError) {
    await closeQuietly(client);

    if (config.fallbackToSse === false || !canFallbackToSse(streamableHttpError)) {
      throw streamableHttpError;
    }

    try {
      return await openSseConnection(config);
    } catch (sseError) {
      throw new AggregateError(
        [streamableHttpError, sseError],
        `Unable to connect to ${config.name} with Streamable HTTP or legacy SSE`
      );
    }
  }
}

/** Release both the remote server session and the local client transport. */
export async function closeMCPConnection(connection: OpenMCPConnection): Promise<void> {
  if (connection.transportType === 'streamable-http') {
    await (connection.transport as StreamableHTTPClientTransport)
      .terminateSession()
      .catch(() => {});
  }
  await connection.client.close();
}
