import { beforeEach, describe, expect, it, vi } from 'vitest';

const mcp = vi.hoisted(() => {
  const state = {
    connectResult: [
      {
        name: 'search',
        description: 'Search tools',
        inputSchema: { type: 'object' as const },
      },
    ],
    connectError: undefined as Error | undefined,
    toolResult: {
      content: [{ type: 'text' as const, text: 'result' }],
      isError: false,
    },
    managers: [] as MockManager[],
  };

  class MockManager {
    connectCalls: unknown[][] = [];
    callToolCalls: unknown[][] = [];
    disconnectCalls = 0;

    constructor() {
      state.managers.push(this);
    }

    async connect(...args: unknown[]) {
      this.connectCalls.push(args);
      if (state.connectError) throw state.connectError;
      return state.connectResult;
    }

    async callTool(...args: unknown[]) {
      this.callToolCalls.push(args);
      return state.toolResult;
    }

    async disconnectAll() {
      this.disconnectCalls += 1;
    }
  }

  return { MockManager, state };
});

vi.mock('@tpmjs/mcp-client', () => ({ MCPClientManager: mcp.MockManager }));

import { callRemoteTool, discoverRemoteTools } from './remote-client';

describe('remote MCP client adapter', () => {
  beforeEach(() => {
    mcp.state.managers.length = 0;
    mcp.state.connectError = undefined;
  });

  it('discovers tools through the shared Streamable HTTP client', async () => {
    await expect(
      discoverRemoteTools({
        url: 'https://tools.example.com/mcp',
        authType: 'bearer',
        authToken: 'token',
      })
    ).resolves.toEqual(mcp.state.connectResult);

    expect(mcp.state.managers[0]?.connectCalls).toEqual([
      [
        {
          id: 'remote',
          name: 'tools.example.com',
          transport: 'streamable-http',
          url: 'https://tools.example.com/mcp',
          headers: { Authorization: 'Bearer token' },
          connectTimeoutMs: 15_000,
        },
      ],
    ]);
    expect(mcp.state.managers[0]?.disconnectCalls).toBe(1);
  });

  it('skips discovery before invoking a known remote tool', async () => {
    await expect(
      callRemoteTool(
        {
          url: 'https://tools.example.com/mcp',
          authType: 'header',
          authHeader: 'X-API-Key',
          authToken: 'secret',
        },
        'known-tool',
        { value: 42 }
      )
    ).resolves.toEqual(mcp.state.toolResult);

    expect(mcp.state.managers[0]?.connectCalls[0]).toEqual([
      {
        id: 'remote',
        name: 'tools.example.com',
        transport: 'streamable-http',
        url: 'https://tools.example.com/mcp',
        headers: { 'X-API-Key': 'secret' },
        connectTimeoutMs: 15_000,
      },
      { discoverTools: false },
    ]);
    expect(mcp.state.managers[0]?.callToolCalls).toEqual([['remote', 'known-tool', { value: 42 }]]);
    expect(mcp.state.managers[0]?.disconnectCalls).toBe(1);
  });

  it('always runs cleanup after a failed connection', async () => {
    mcp.state.connectError = new Error('connection failed');

    await expect(discoverRemoteTools({ url: 'https://tools.example.com/mcp' })).rejects.toThrow(
      'connection failed'
    );
    expect(mcp.state.managers[0]?.disconnectCalls).toBe(1);
  });
});
