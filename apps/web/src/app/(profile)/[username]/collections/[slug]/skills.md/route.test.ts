import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUser: vi.fn(),
  findCollection: vi.fn(),
  updateCollection: vi.fn(),
  findGenerationJob: vi.fn(),
  createGenerationJob: vi.fn(),
  findGenerationJobById: vi.fn(),
  updateGenerationJob: vi.fn(),
  findToolSkills: vi.fn(),
  upsertToolSkills: vi.fn(),
  fetchMultiplePackageSources: vi.fn(),
  fetchPackageSource: vi.fn(),
  generateSkillsMarkdown: vi.fn(),
  generateToolSkillsBatch: vi.fn(),
}));

vi.mock('@tpmjs/db', () => ({
  prisma: {
    user: { findUnique: mocks.findUser },
    collection: {
      findFirst: mocks.findCollection,
      update: mocks.updateCollection,
    },
    skillsGenerationJob: {
      findFirst: mocks.findGenerationJob,
      create: mocks.createGenerationJob,
      findUnique: mocks.findGenerationJobById,
      update: mocks.updateGenerationJob,
    },
    toolSkillsCache: {
      findMany: mocks.findToolSkills,
      upsert: mocks.upsertToolSkills,
    },
  },
}));

vi.mock('~/lib/ai/package-source-fetcher', () => ({
  fetchMultiplePackageSources: mocks.fetchMultiplePackageSources,
  fetchPackageSource: mocks.fetchPackageSource,
}));

vi.mock('~/lib/ai/skills-generator', () => ({
  generateSkillsMarkdown: mocks.generateSkillsMarkdown,
}));

vi.mock('~/lib/ai/tool-skills-generator', () => ({
  generateToolSkillsBatch: mocks.generateToolSkillsBatch,
}));

import { GET } from './route';

const tool = {
  id: 'tool-1',
  name: 'lookupWeather',
  description: 'Looks up current weather for a city.',
  inputSchema: {
    type: 'object',
    properties: { city: { type: 'string' } },
    required: ['city'],
  },
  package: {
    npmPackageName: '@example/weather-tools',
    npmVersion: '2.1.0',
  },
};

function collection(overrides: Record<string, unknown> = {}) {
  return {
    id: 'collection-1',
    name: 'Weather',
    slug: 'weather',
    description: 'Weather utilities.',
    isPublic: true,
    skillsMarkdown: null,
    skillsGeneratedAt: null,
    tools: [{ tool }],
    ...overrides,
  };
}

function request(): NextRequest {
  return new NextRequest('https://tpmjs.com/alice/collections/weather/skills.md');
}

const context = {
  params: Promise.resolve({ username: 'alice', slug: 'weather' }),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  mocks.findUser.mockResolvedValue({ id: 'user-1', username: 'alice' });
  mocks.fetchMultiplePackageSources.mockResolvedValue([]);
  mocks.updateCollection.mockResolvedValue({});
  mocks.findGenerationJob.mockResolvedValue(null);
  mocks.findToolSkills.mockResolvedValue([]);
  mocks.upsertToolSkills.mockResolvedValue({});
  mocks.updateGenerationJob.mockResolvedValue({});
  mocks.fetchPackageSource.mockRejectedValue(new Error('source unavailable'));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GET skills.md', () => {
  it('returns and caches current registry documentation when OpenAI is unavailable', async () => {
    mocks.findCollection.mockResolvedValue(collection());
    mocks.generateSkillsMarkdown.mockRejectedValue(new Error('quota exceeded'));

    const response = await GET(request(), context);
    const markdown = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Generation-Mode')).toBe('registry-fallback');
    expect(markdown).toContain('# Agent Skills Declaration: Weather');
    expect(markdown).toContain('`@example/weather-tools@2.1.0`');
    expect(markdown).toContain('"city"');
    expect(markdown).toContain('Generated deterministically from TPMJS registry metadata');
    expect(mocks.updateCollection).toHaveBeenCalledWith({
      where: { id: 'collection-1' },
      data: {
        skillsMarkdown: markdown,
        skillsGeneratedAt: expect.any(Date),
      },
    });
  });

  it('serves a stale rich document without overwriting it when revalidation fails', async () => {
    const staleMarkdown = '# Existing source-analyzed documentation';
    mocks.findCollection.mockResolvedValue(
      collection({
        skillsMarkdown: staleMarkdown,
        skillsGeneratedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      })
    );
    mocks.generateSkillsMarkdown.mockRejectedValue(new Error('quota exceeded'));

    const response = await GET(request(), context);

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Cache')).toBe('STALE');
    expect(response.headers.get('X-Generation-Mode')).toBe('stale-cache');
    expect(await response.text()).toBe(staleMarkdown);
    expect(mocks.updateCollection).not.toHaveBeenCalled();
  });

  it('does not overwrite rich per-tool caches with fallback sections', async () => {
    const tools = Array.from({ length: 20 }, (_, index) => ({
      tool: {
        ...tool,
        id: `tool-${index}`,
        name: `weatherTool${index}`,
      },
    }));
    mocks.findCollection.mockResolvedValue(collection({ tools }));
    mocks.createGenerationJob.mockResolvedValue({
      id: 'job-1',
      currentBatch: 0,
      totalBatches: 2,
      completedToolIds: [],
    });
    mocks.generateToolSkillsBatch.mockImplementation(async (batchTools) => {
      return new Map(
        batchTools.map((batchTool: { id: string; name: string }) => [
          batchTool.id,
          {
            markdown: `### Skill: ${batchTool.name}\n\nRegistry fallback.`,
            generationMode: 'registry-fallback' as const,
          },
        ])
      );
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 202 })));

    const response = await GET(request(), context);

    expect(response.status).toBe(202);
    expect(mocks.upsertToolSkills).toHaveBeenCalledTimes(10);
    for (const [args] of mocks.upsertToolSkills.mock.calls) {
      expect(args.update).toEqual({});
      expect(args.create.skillsMarkdown).toContain('Registry fallback');
    }
  });
});
