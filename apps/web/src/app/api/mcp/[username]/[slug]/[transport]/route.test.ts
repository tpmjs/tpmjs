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
  getClientMetadata: vi.fn(),
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

import { POST } from './route';

const context = {
  params: Promise.resolve({ username: 'ajax', slug: 'public-tools', transport: 'http' }),
};

function request(method: string, id = 1): NextRequest {
  return new NextRequest('https://tpmjs.test/api/mcp/ajax/public-tools/http', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method }),
  });
}

describe('public collection MCP contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({
      authenticated: false,
      error: 'Missing authorization header',
    });
    mocks.findUser.mockResolvedValue({ id: 'user_1', username: 'ajax' });
    mocks.findCollection.mockResolvedValue({
      id: 'collection_1',
      name: 'Public Tools',
      description: null,
      userId: 'user_1',
      isPublic: true,
    });
    mocks.handleInitialize.mockReturnValue({
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'Public Tools', version: '1.0.0' },
      },
    });
    mocks.handleToolsList.mockResolvedValue({
      jsonrpc: '2.0',
      id: 2,
      result: { tools: [] },
    });
  });

  it('initializes a public MCP server without authentication', async () => {
    const response = await POST(request('initialize'), context);

    expect(response.status).toBe(200);
    expect(response.headers.get('mcp-session-id')).toBeTruthy();
    await expect(response.json()).resolves.toMatchObject({
      jsonrpc: '2.0',
      id: 1,
      result: { protocolVersion: '2024-11-05' },
    });
  });

  it('lists public collection tools without authentication', async () => {
    const response = await POST(request('tools/list', 2), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      jsonrpc: '2.0',
      id: 2,
      result: { tools: [] },
    });
  });

  it('does not expose a private collection to an anonymous caller', async () => {
    mocks.findCollection.mockResolvedValueOnce({
      id: 'collection_2',
      name: 'Private Tools',
      description: null,
      userId: 'user_1',
      isPublic: false,
    });

    const response = await POST(request('initialize'), context);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { message: 'Collection not found' },
    });
    expect(mocks.handleInitialize).not.toHaveBeenCalled();
  });
});
