import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  toolFindMany: vi.fn(),
  collectionFindMany: vi.fn(),
}));

vi.mock('@tpmjs/db', () => ({
  prisma: {
    tool: { findMany: dbMocks.toolFindMany },
    collection: { findMany: dbMocks.collectionFindMany },
  },
}));

import { loadInitialCollections, loadInitialTools } from './server';

describe('discovery server loaders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads a bounded, searchable, serializable tool result', async () => {
    dbMocks.toolFindMany.mockResolvedValue([
      {
        id: 'tool-1',
        name: 'helloWorldTool',
        description: 'Say hello',
        qualityScore: { toString: () => '0.91' },
        likeCount: 12,
        importHealth: 'HEALTHY',
        executionHealth: 'UNKNOWN',
        createdAt: new Date('2026-07-20T12:00:00.000Z'),
        package: {
          npmPackageName: '@tpmjs/hello',
          npmVersion: '1.2.3',
          npmPublishedAt: new Date('2026-07-19T12:00:00.000Z'),
          category: 'utilities',
          npmRepository: { url: 'https://github.com/tpmjs/hello', type: 'git' },
          isOfficial: true,
          npmDownloadsLastMonth: 1000,
        },
      },
    ]);

    await expect(loadInitialTools('  hello  ', 7)).resolves.toEqual([
      expect.objectContaining({
        id: 'tool-1',
        qualityScore: '0.91',
        createdAt: '2026-07-20T12:00:00.000Z',
        package: expect.objectContaining({
          npmPublishedAt: '2026-07-19T12:00:00.000Z',
          npmRepository: { url: 'https://github.com/tpmjs/hello', type: 'git' },
        }),
      }),
    ]);

    expect(dbMocks.toolFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 7,
        where: expect.objectContaining({
          consecutiveImportFailures: { lt: 3 },
          OR: expect.arrayContaining([
            { name: { contains: 'hello', mode: 'insensitive' } },
            { description: { contains: 'hello', mode: 'insensitive' } },
          ]),
        }),
      })
    );
  });

  it('normalizes malformed repository metadata instead of leaking arbitrary JSON', async () => {
    dbMocks.toolFindMany.mockResolvedValue([
      {
        id: 'tool-2',
        name: 'safeTool',
        description: 'Safe metadata',
        qualityScore: null,
        likeCount: 0,
        importHealth: null,
        executionHealth: null,
        createdAt: new Date('2026-07-20T12:00:00.000Z'),
        package: {
          npmPackageName: 'safe-tool',
          npmVersion: '1.0.0',
          npmPublishedAt: new Date('2026-07-19T12:00:00.000Z'),
          category: 'utilities',
          npmRepository: { unexpected: true },
          isOfficial: false,
          npmDownloadsLastMonth: null,
        },
      },
    ]);

    const [tool] = await loadInitialTools('');
    expect(tool?.package.npmRepository).toBeNull();
  });

  it('returns the first collection page and an exact has-more signal', async () => {
    const rows = Array.from({ length: 3 }, (_, index) => ({
      id: `collection-${index}`,
      slug: index === 0 ? 'research' : null,
      name: `Collection ${index}`,
      description: null,
      likeCount: 3 - index,
      forkCount: index,
      createdAt: new Date(`2026-07-${20 - index}T12:00:00.000Z`),
      user: {
        id: 'user-1',
        name: 'Maintainer',
        image: null,
        username: 'maintainer',
      },
      _count: { tools: index + 1 },
    }));
    dbMocks.collectionFindMany.mockResolvedValue(rows);

    await expect(loadInitialCollections(2)).resolves.toEqual({
      collections: [
        expect.objectContaining({
          id: 'collection-0',
          slug: 'research',
          toolCount: 1,
          createdAt: '2026-07-20T12:00:00.000Z',
        }),
        expect.objectContaining({ id: 'collection-1', slug: null, toolCount: 2 }),
      ],
      hasMore: true,
    });

    expect(dbMocks.collectionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3, where: { isPublic: true } })
    );
  });
});
