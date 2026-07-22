import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mcp = vi.hoisted(() => {
  const tool = {
    name: 'echo',
    description: 'Echo a value',
    inputSchema: {
      type: 'object' as const,
      properties: { value: { type: 'string' } },
    },
  };

  const state = {
    instances: [] as MockMCPClientManager[],
    callToolError: undefined as Error | undefined,
    result: {
      content: [{ type: 'text' as const, text: 'echoed' }],
      isError: false,
    },
  };

  class MockMCPClientManager {
    disconnected = false;

    constructor() {
      state.instances.push(this);
    }

    async connect() {
      return [tool];
    }

    listAllTools() {
      return [
        {
          serverId: 'local',
          serverName: 'Local server',
          tool,
        },
      ];
    }

    async callTool() {
      if (state.callToolError) throw state.callToolError;
      return state.result;
    }

    async disconnectAll() {
      this.disconnected = true;
    }
  }

  return { MockMCPClientManager, state };
});

vi.mock('@tpmjs/mcp-client', () => ({ MCPClientManager: mcp.MockMCPClientManager }));

import { Bridge } from './bridge.js';

const server = {
  id: 'local',
  name: 'Local server',
  transport: 'stdio' as const,
  command: 'node',
  args: ['server.js'],
};

interface FetchRecord {
  method: string;
  body?: { type?: string; [key: string]: unknown };
}

function installBridgeApi(toolCall: boolean, toolResultStatus = 200): FetchRecord[] {
  const records: FetchRecord[] = [];
  let returnedCall = false;

  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      const body =
        typeof init?.body === 'string' ? (JSON.parse(init.body) as FetchRecord['body']) : undefined;
      records.push({ method, body });

      if (method === 'GET') {
        const calls =
          toolCall && !returnedCall
            ? [
                {
                  callId: 'call-1',
                  serverId: 'local',
                  toolName: 'echo',
                  args: { value: 'hello' },
                  timestamp: 1,
                },
              ]
            : [];
        returnedCall = true;
        return Response.json({ success: true, calls });
      }

      if (body?.type === 'tool_result' && toolResultStatus !== 200) {
        return new Response('delivery unavailable', { status: toolResultStatus });
      }

      return Response.json({ success: true });
    })
  );

  return records;
}

describe('Bridge HTTP polling contract', () => {
  beforeEach(() => {
    mcp.state.instances.length = 0;
    mcp.state.callToolError = undefined;
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('registers tools and returns successful calls as typed tool_result payloads', async () => {
    const records = installBridgeApi(true);
    const bridge = new Bridge({
      apiKey: 'test-key',
      apiUrl: 'https://example.test',
      servers: [server],
      pollInterval: 60_000,
      heartbeatInterval: 60_000,
    });

    await bridge.start();
    await vi.waitFor(() => {
      expect(records.some((record) => record.body?.type === 'tool_result')).toBe(true);
    });

    expect(records[0]).toMatchObject({
      method: 'POST',
      body: {
        type: 'register',
        clientVersion: '0.1.0',
        tools: [{ serverId: 'local', serverName: 'Local server', name: 'echo' }],
      },
    });
    expect(records.find((record) => record.body?.type === 'tool_result')).toEqual({
      method: 'POST',
      body: {
        type: 'tool_result',
        callId: 'call-1',
        result: mcp.state.result,
      },
    });

    await bridge.stop();
    expect(mcp.state.instances[0]?.disconnected).toBe(true);
  });

  it('uses tool_result with a structured error when local execution fails', async () => {
    mcp.state.callToolError = new Error('local server failed');
    const records = installBridgeApi(true);
    const bridge = new Bridge({
      apiKey: 'test-key',
      apiUrl: 'https://example.test',
      servers: [server],
      pollInterval: 60_000,
      heartbeatInterval: 60_000,
    });

    await bridge.start();
    await vi.waitFor(() => {
      expect(records.some((record) => record.body?.type === 'tool_result')).toBe(true);
    });

    expect(records.find((record) => record.body?.type === 'tool_result')).toEqual({
      method: 'POST',
      body: {
        type: 'tool_result',
        callId: 'call-1',
        error: { code: 'EXECUTION_FAILED', message: 'local server failed' },
      },
    });

    await bridge.stop();
  });

  it('cleans up MCP connections when HTTP registration fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('temporarily unavailable', { status: 503 }))
    );
    const bridge = new Bridge({
      apiKey: 'test-key',
      apiUrl: 'https://example.test',
      servers: [server],
    });

    await expect(bridge.start()).rejects.toThrow(
      'Bridge register failed with HTTP 503: temporarily unavailable'
    );
    expect(mcp.state.instances[0]?.disconnected).toBe(true);
  });

  it('does not relabel a successful execution when result delivery fails', async () => {
    const records = installBridgeApi(true, 503);
    const bridge = new Bridge({
      apiKey: 'test-key',
      apiUrl: 'https://example.test',
      servers: [server],
      pollInterval: 60_000,
      heartbeatInterval: 60_000,
    });

    await bridge.start();
    await vi.waitFor(() => {
      expect(records.filter((record) => record.body?.type === 'tool_result')).toHaveLength(1);
    });

    expect(records.find((record) => record.body?.type === 'tool_result')?.body).toEqual({
      type: 'tool_result',
      callId: 'call-1',
      result: mcp.state.result,
    });

    await bridge.stop();
  });
});
