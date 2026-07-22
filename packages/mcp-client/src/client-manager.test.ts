import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => {
  type TransportKind = 'stdio' | 'streamable-http' | 'sse';

  interface MockTransport {
    kind: TransportKind;
    url?: URL;
    options: unknown;
  }

  class MockStreamableHTTPError extends Error {
    readonly code: number | undefined;

    constructor(code: number | undefined, message?: string) {
      super(message);
      this.code = code;
    }
  }

  const state = {
    clients: [] as MockClient[],
    transports: [] as MockTransport[],
    connectErrors: [] as Array<Error | undefined>,
    listToolsError: undefined as Error | undefined,
    tools: [
      {
        name: 'example',
        description: 'Example tool',
        inputSchema: { type: 'object' as const },
      },
    ],
    callToolResult: {
      content: [{ type: 'text' as const, text: 'done' }],
      isError: false,
    },
  };

  class MockClient {
    closed = false;
    connectOptions: unknown;
    connectedTransport: MockTransport | undefined;
    listToolsCalls = 0;
    callToolRequests: unknown[] = [];

    constructor() {
      state.clients.push(this);
    }

    async connect(transport: MockTransport, options?: unknown): Promise<void> {
      this.connectedTransport = transport;
      this.connectOptions = options;
      const error = state.connectErrors.shift();
      if (error) throw error;
    }

    async listTools() {
      this.listToolsCalls += 1;
      if (state.listToolsError) throw state.listToolsError;
      return { tools: state.tools };
    }

    async callTool(request: unknown) {
      this.callToolRequests.push(request);
      return state.callToolResult;
    }

    async close(): Promise<void> {
      this.closed = true;
    }
  }

  class MockStdioClientTransport implements MockTransport {
    readonly kind = 'stdio';

    constructor(readonly options: unknown) {
      state.transports.push(this);
    }
  }

  class MockStreamableHTTPClientTransport implements MockTransport {
    readonly kind = 'streamable-http';
    terminated = false;

    constructor(
      readonly url: URL,
      readonly options: unknown
    ) {
      state.transports.push(this);
    }

    async terminateSession(): Promise<void> {
      this.terminated = true;
    }
  }

  class MockSSEClientTransport implements MockTransport {
    readonly kind = 'sse';

    constructor(
      readonly url: URL,
      readonly options: unknown
    ) {
      state.transports.push(this);
    }
  }

  return {
    MockClient,
    MockSSEClientTransport,
    MockStdioClientTransport,
    MockStreamableHTTPClientTransport,
    MockStreamableHTTPError,
    state,
  };
});

vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({ Client: sdk.MockClient }));
vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
  StdioClientTransport: sdk.MockStdioClientTransport,
}));
vi.mock('@modelcontextprotocol/sdk/client/sse.js', () => ({
  SSEClientTransport: sdk.MockSSEClientTransport,
}));
vi.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => ({
  StreamableHTTPClientTransport: sdk.MockStreamableHTTPClientTransport,
  StreamableHTTPError: sdk.MockStreamableHTTPError,
}));

import { MCPClientManager } from './client-manager.js';

describe('MCPClientManager transports', () => {
  beforeEach(() => {
    sdk.state.clients.length = 0;
    sdk.state.transports.length = 0;
    sdk.state.connectErrors.length = 0;
    sdk.state.listToolsError = undefined;
    sdk.state.tools = [
      {
        name: 'example',
        description: 'Example tool',
        inputSchema: { type: 'object' },
      },
    ];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('connects to stdio servers and exposes the negotiated transport', async () => {
    const manager = new MCPClientManager();
    const tools = await manager.connect({
      id: 'local',
      name: 'Local server',
      transport: 'stdio',
      command: 'node',
      args: ['server.js'],
      env: { EXAMPLE: 'yes' },
      connectTimeoutMs: 2_500,
    });

    expect(tools).toEqual(sdk.state.tools);
    expect(sdk.state.transports).toHaveLength(1);
    expect(sdk.state.transports[0]).toMatchObject({
      kind: 'stdio',
      options: {
        command: 'node',
        args: ['server.js'],
        env: { EXAMPLE: 'yes' },
      },
    });
    expect(sdk.state.clients[0]?.connectOptions).toEqual({ timeout: 2_500 });
    expect(manager.getServer('local')).toMatchObject({
      status: 'connected',
      transport: 'stdio',
    });

    await manager.disconnect('local');
    expect(sdk.state.clients[0]?.closed).toBe(true);
  });

  it('uses Streamable HTTP for modern remote servers', async () => {
    const manager = new MCPClientManager();
    await manager.connect({
      id: 'remote',
      name: 'Remote server',
      transport: 'streamable-http',
      url: 'https://example.com/mcp',
      headers: { Authorization: 'Bearer token' },
      connectTimeoutMs: 15_000,
    });

    expect(sdk.state.transports).toHaveLength(1);
    expect(sdk.state.transports[0]).toMatchObject({
      kind: 'streamable-http',
      url: new URL('https://example.com/mcp'),
      options: {
        requestInit: { headers: { Authorization: 'Bearer token' } },
      },
    });
    expect(manager.getServer('remote')?.transport).toBe('streamable-http');

    await manager.disconnect('remote');
    expect(sdk.state.transports[0]).toMatchObject({ terminated: true });
    expect(sdk.state.clients[0]?.closed).toBe(true);
  });

  it('falls back with a fresh client when a legacy server rejects HTTP initialization', async () => {
    sdk.state.connectErrors.push(
      new sdk.MockStreamableHTTPError(405, 'Method not allowed'),
      undefined
    );
    const manager = new MCPClientManager();

    await manager.connect({
      id: 'legacy',
      name: 'Legacy server',
      transport: 'streamable-http',
      url: 'https://example.com/sse',
      headers: { 'X-API-Key': 'secret' },
    });

    expect(sdk.state.transports.map(({ kind }) => kind)).toEqual(['streamable-http', 'sse']);
    expect(sdk.state.clients).toHaveLength(2);
    expect(sdk.state.clients[0]?.closed).toBe(true);
    expect(sdk.state.clients[1]?.closed).toBe(false);
    expect(manager.getServer('legacy')?.transport).toBe('sse');

    const sseOptions = sdk.state.transports[1]?.options as {
      requestInit: RequestInit;
      eventSourceInit: { fetch: typeof fetch };
    };
    expect(sseOptions.requestInit).toEqual({ headers: { 'X-API-Key': 'secret' } });

    const fetchMock = vi.fn(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        new Response(null, { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);
    await sseOptions.eventSourceInit.fetch('https://example.com/sse', {
      headers: { Existing: 'value' },
    });
    const sentHeaders = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(sentHeaders.get('Existing')).toBe('value');
    expect(sentHeaders.get('X-API-Key')).toBe('secret');
  });

  it('honors an explicit request to disable legacy SSE fallback', async () => {
    const failure = new sdk.MockStreamableHTTPError(405, 'Method not allowed');
    sdk.state.connectErrors.push(failure);
    const manager = new MCPClientManager();

    await expect(
      manager.connect({
        id: 'modern-only',
        name: 'Modern-only server',
        transport: 'streamable-http',
        url: 'https://example.com/mcp',
        fallbackToSse: false,
      })
    ).rejects.toBe(failure);

    expect(sdk.state.transports.map(({ kind }) => kind)).toEqual(['streamable-http']);
    expect(sdk.state.clients[0]?.closed).toBe(true);
  });

  it('preserves both protocol failures when modern and legacy connections fail', async () => {
    const modernFailure = new sdk.MockStreamableHTTPError(405, 'Method not allowed');
    const legacyFailure = new Error('Legacy stream unavailable');
    sdk.state.connectErrors.push(modernFailure, legacyFailure);
    const manager = new MCPClientManager();

    const connection = manager.connect({
      id: 'broken-legacy',
      name: 'Broken legacy server',
      transport: 'streamable-http',
      url: 'https://example.com/mcp',
    });

    await expect(connection).rejects.toMatchObject({
      message: 'Unable to connect to Broken legacy server with Streamable HTTP or legacy SSE',
      errors: [modernFailure, legacyFailure],
    });
    expect(sdk.state.clients).toHaveLength(2);
    expect(sdk.state.clients.every(({ closed }) => closed)).toBe(true);
  });

  it('does not hide server failures behind an unrelated SSE attempt', async () => {
    const failure = new sdk.MockStreamableHTTPError(503, 'Unavailable');
    sdk.state.connectErrors.push(failure);
    const manager = new MCPClientManager();

    await expect(
      manager.connect({
        id: 'remote',
        name: 'Remote server',
        transport: 'streamable-http',
        url: 'https://example.com/mcp',
      })
    ).rejects.toBe(failure);

    expect(sdk.state.transports.map(({ kind }) => kind)).toEqual(['streamable-http']);
    expect(sdk.state.clients[0]?.closed).toBe(true);
  });

  it('supports an explicit legacy SSE connection', async () => {
    const manager = new MCPClientManager();
    await manager.connect({
      id: 'legacy',
      name: 'Legacy server',
      transport: 'sse',
      url: 'https://example.com/sse',
    });

    expect(sdk.state.transports.map(({ kind }) => kind)).toEqual(['sse']);
    expect(manager.getServer('legacy')?.transport).toBe('sse');
  });

  it('can connect without discovery before invoking a known tool', async () => {
    const manager = new MCPClientManager();
    const tools = await manager.connect(
      {
        id: 'remote',
        name: 'Remote server',
        transport: 'streamable-http',
        url: 'https://example.com/mcp',
      },
      { discoverTools: false }
    );

    expect(tools).toEqual([]);
    expect(sdk.state.clients[0]?.listToolsCalls).toBe(0);
    await expect(manager.callTool('remote', 'known-tool', { input: true })).resolves.toEqual(
      sdk.state.callToolResult
    );
    expect(sdk.state.clients[0]?.callToolRequests).toEqual([
      { name: 'known-tool', arguments: { input: true } },
    ]);
  });

  it('closes a connected client when tool discovery fails', async () => {
    sdk.state.listToolsError = new Error('tools/list failed');
    const manager = new MCPClientManager();

    await expect(
      manager.connect({
        id: 'remote',
        name: 'Remote server',
        transport: 'streamable-http',
        url: 'https://example.com/mcp',
      })
    ).rejects.toThrow('tools/list failed');

    expect(sdk.state.clients[0]?.closed).toBe(true);
    expect(manager.getServer('remote')).toBeUndefined();
  });

  it('rejects invalid connection timeouts without leaving a client open', async () => {
    const manager = new MCPClientManager();

    await expect(
      manager.connect({
        id: 'local',
        name: 'Local server',
        transport: 'stdio',
        command: 'node',
        connectTimeoutMs: 0,
      })
    ).rejects.toThrow('connectTimeoutMs must be a positive finite number');

    expect(sdk.state.clients[0]?.closed).toBe(true);
  });
});
