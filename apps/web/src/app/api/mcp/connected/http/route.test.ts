import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyAccessToken: vi.fn(),
  grant: vi.fn(),
  collections: vi.fn(),
  keys: vi.fn(),
  searchTools: vi.fn(),
  executeWithExecutor: vi.fn(),
  trackExecution: vi.fn(),
}));

vi.mock('better-auth/oauth2', () => ({ verifyAccessToken: mocks.verifyAccessToken }));
vi.mock('@tpmjs/db', () => ({
  prisma: {
    oAuthToolGrant: { findUnique: mocks.grant },
    collection: { findMany: mocks.collections },
    userApiKey: { findMany: mocks.keys },
  },
}));
vi.mock('~/lib/search/tool-search', () => ({ searchTools: mocks.searchTools }));
vi.mock('~/lib/executors', () => ({ executeWithExecutor: mocks.executeWithExecutor }));
vi.mock('~/lib/crypto/api-keys', () => ({ decryptApiKey: () => 'top-secret-account-key' }));
vi.mock('~/lib/tracking/executions', () => ({ trackExecution: mocks.trackExecution }));

import { POST } from './route';

const packageInfo = {
  npmPackageName: '@tpmjs/tools-mail',
  npmVersion: '1.0.0',
  env: [{ name: 'RESEND_API_KEY', required: true }],
};
const tool = { id: 'mail-tool', name: 'sendEmail', isActive: true, package: packageInfo };
const request = (name: string, args: Record<string, unknown> = {}) =>
  new Request('https://tpmjs.com/api/mcp/connected/http', {
    method: 'POST',
    headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name, arguments: args },
    }),
  });

describe('connected MCP grant boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyAccessToken.mockResolvedValue({
      sub: 'user-1',
      azp: 'client-1',
      scope: 'mcp:read mcp:execute',
    });
    mocks.grant.mockResolvedValue({
      collectionIds: ['collection-1'],
      toolIds: ['@tpmjs/tools-mail::sendEmail'],
    });
    mocks.collections.mockResolvedValue([
      {
        id: 'collection-1',
        name: 'Mail',
        envVars: { RESEND_API_KEY: 'collection-key', OTHER_SECRET: 'do-not-pass' },
        credentialBindings: [
          {
            packageName: '@tpmjs/tools-mail',
            envName: 'RESEND_API_KEY',
            keyName: 'RESEND_API_KEY',
          },
        ],
        tools: [{ tool }],
      },
    ]);
    mocks.keys.mockResolvedValue([
      { keyName: 'RESEND_API_KEY', encryptedKey: 'cipher', keyIv: 'iv' },
      { keyName: 'OTHER_SECRET', encryptedKey: 'cipher', keyIv: 'iv' },
    ]);
    mocks.executeWithExecutor.mockResolvedValue({ success: true, output: { sent: true } });
  });

  it('rejects an ungranted tool before it reaches the executor', async () => {
    const response = await POST(
      request('execute_tool', { packageName: '@tpmjs/tools-mail', toolName: 'deleteAll' })
    );
    expect(response.status).toBe(403);
    expect(mocks.executeWithExecutor).not.toHaveBeenCalled();
  });

  it('passes only declared credentials for a selected tool', async () => {
    const response = await POST(
      request('execute_tool', { packageName: '@tpmjs/tools-mail', toolName: 'sendEmail' })
    );
    expect(response.status).toBe(200);
    expect(mocks.executeWithExecutor).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        env: { RESEND_API_KEY: 'top-secret-account-key' },
      })
    );
    expect(JSON.stringify(await response.json())).not.toContain('top-secret-account-key');
  });

  it('does not use a vaulted key without an explicit collection binding', async () => {
    mocks.collections.mockResolvedValue([
      {
        id: 'collection-1',
        name: 'Mail',
        envVars: null,
        credentialBindings: [],
        tools: [{ tool }],
      },
    ]);
    const response = await POST(
      request('execute_tool', { packageName: '@tpmjs/tools-mail', toolName: 'sendEmail' })
    );
    expect(response.status).toBe(200);
    expect((await response.json()).result.isError).toBe(true);
    expect(mocks.executeWithExecutor).not.toHaveBeenCalled();
  });

  it('does not expose execution to a read-only grant', async () => {
    mocks.verifyAccessToken.mockResolvedValue({
      sub: 'user-1',
      azp: 'client-1',
      scope: 'mcp:read',
    });
    const response = await POST(
      new Request('https://tpmjs.com/api/mcp/connected/http', {
        method: 'POST',
        headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
      })
    );
    const body = await response.json();
    expect(body.result.tools.map((item: { name: string }) => item.name)).toEqual(['search_tools']);
  });
});
