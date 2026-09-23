import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  findCollection: vi.fn(),
}));

vi.mock('@tpmjs/db', () => ({
  prisma: { collection: { findUnique: mocks.findCollection } },
}));
vi.mock('~/lib/api-keys/middleware', () => ({
  authenticateRequest: mocks.authenticateRequest,
}));
vi.mock('~/lib/activity', () => ({ logActivity: vi.fn() }));

import { GET } from './route';

const request = new NextRequest('https://tpmjs.com/api/collections/public-collection');
const context = { params: Promise.resolve({ id: 'public-collection' }) };

describe('collection credentials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findCollection.mockResolvedValue({
      id: 'public-collection',
      userId: 'owner',
      isPublic: true,
      envVars: { RESEND_API_KEY: 'secret-never-share' },
      executorConfig: { apiKey: 'another-secret-never-share' },
      user: { username: 'owner' },
      tools: [],
      _count: { tools: 0 },
    });
  });

  it('does not disclose a public collection owner secret to another signed-in user', async () => {
    mocks.authenticateRequest.mockResolvedValue({ authenticated: true, userId: 'visitor' });
    const response = await GET(request, context);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.envVars).toBeNull();
    expect(body.data.executorConfig).toBeNull();
    expect(JSON.stringify(body)).not.toContain('secret-never-share');
  });

  it('keeps owner editing available', async () => {
    mocks.authenticateRequest.mockResolvedValue({ authenticated: true, userId: 'owner' });
    const response = await GET(request, context);
    expect(response.status).toBe(200);
    expect((await response.json()).data.envVars).toEqual({
      RESEND_API_KEY: 'secret-never-share',
    });
  });
});
