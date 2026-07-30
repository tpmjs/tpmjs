import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  findUser: vi.fn(),
  findCollection: vi.fn(),
  handleInitialize: vi.fn(),
  handleToolsList: vi.fn(),
  handleToolsCall: vi.fn(),
}));

vi.mock('@tpmjs/db', () => ({
  prisma: {
    user: { findUnique: mocks.findUser },
    collection: { findFirst: mocks.findCollection },
  },
}));

vi.mock('~/lib/api-keys/middleware', () => ({
  authenticateRequest: mocks.authenticateRequest,
  getClientMetadata: vi.fn(() => ({ userAgent: 'test', ipAddress: '127.0.0.1' })),
  hasScope: vi.fn(() => true),
}));

vi.mock('~/lib/api-keys/rate-limit', () => ({
  checkApiKeyRateLimit: vi.fn(),
  createRateLimitResponse: vi.fn(),
  getRateLimitHeaders: vi.fn(() => ({})),
}));

vi.mock('~/lib/api-keys/usage', () => ({ trackUsage: vi.fn() }));

vi.mock('~/lib/mcp/handlers', () => ({
  handleInitialize: mocks.handleInitialize,
  handleToolsList: mocks.handleToolsList,
  handleToolsCall: mocks.handleToolsCall,
}));

import { GET, POST } from './route';

const context = {
  params: Promise.resolve({ username: 'ajax', slug: 'box-tools' }),
};

function postRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('https://tpmjs.test/@ajax/collections/box-tools/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function getRequest(accept?: string): NextRequest {
  return new NextRequest('https://tpmjs.test/@ajax/collections/box-tools/mcp', {
    method: 'GET',
    headers: accept ? { Accept: accept } : {},
  });
}

describe('collection MCP streamable-HTTP contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({
      authenticated: false,
      error: 'Missing authorization header',
    });
    mocks.findUser.mockResolvedValue({ id: 'user_1', username: 'ajax' });
    mocks.findCollection.mockResolvedValue({
      id: 'collection_1',
      name: 'Box Tools',
      description: 'Box tools',
      userId: 'user_1',
      isPublic: true,
    });
    mocks.handleInitialize.mockReturnValue({
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: '2025-03-26',
        serverInfo: { name: 'TPMJS: Box Tools', version: '1.0.0' },
      },
    });
  });

  it('returns 202 with no body for a notification (no id)', async () => {
    const response = await POST(
      postRequest({ jsonrpc: '2.0', method: 'notifications/initialized' }),
      context
    );

    expect(response.status).toBe(202);
    await expect(response.text()).resolves.toBe('');
    expect(mocks.handleInitialize).not.toHaveBeenCalled();
    expect(mocks.handleToolsList).not.toHaveBeenCalled();
  });

  it('negotiates the requested protocol version on initialize and stays stateless', async () => {
    const response = await POST(
      postRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2025-03-26' },
      }),
      context
    );

    expect(response.status).toBe(200);
    // The route must forward the client's requested version to the handler.
    expect(mocks.handleInitialize).toHaveBeenCalledWith('Box Tools', 1, '2025-03-26');
    // Stateless server: no Mcp-Session-Id (returning one drives strict clients
    // like codex into a stateful GET-SSE session we don't offer, aborting calls).
    expect(response.headers.get('mcp-session-id')).toBeNull();
  });

  it('returns 405 for a GET that requests an SSE stream', async () => {
    const response = await GET(getRequest('text/event-stream'), context);

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
  });

  it('returns the info document for a plain (non-SSE) GET', async () => {
    const response = await GET(getRequest('application/json'), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      protocol: 'mcp',
      transport: 'http',
    });
  });
});
