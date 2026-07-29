import { type Prisma, prisma } from '@tpmjs/db';
import { activeToolFilter } from '~/lib/tool-health-policy';
import type { DiscoveryTool, PublicCollection } from './types';

export const INITIAL_DISCOVERY_LIMIT = 50;

const discoveryToolSelect = {
  id: true,
  name: true,
  description: true,
  qualityScore: true,
  likeCount: true,
  importHealth: true,
  executionHealth: true,
  consecutiveImportFailures: true,
  lastHealthCheck: true,
  createdAt: true,
  package: {
    select: {
      npmPackageName: true,
      npmVersion: true,
      npmPublishedAt: true,
      category: true,
      npmRepository: true,
      isOfficial: true,
      npmDownloadsLastMonth: true,
    },
  },
} satisfies Prisma.ToolSelect;

type DiscoveryToolRow = Prisma.ToolGetPayload<{ select: typeof discoveryToolSelect }>;

function normalizeRepository(
  repository: Prisma.JsonValue | null
): DiscoveryTool['package']['npmRepository'] {
  if (!repository || typeof repository !== 'object' || Array.isArray(repository)) return null;

  const { url, type } = repository as Record<string, unknown>;
  return typeof url === 'string' && typeof type === 'string' ? { url, type } : null;
}

export function serializeDiscoveryTool(tool: DiscoveryToolRow): DiscoveryTool {
  return {
    id: tool.id,
    name: tool.name,
    description: tool.description,
    qualityScore: tool.qualityScore?.toString() ?? null,
    likeCount: tool.likeCount,
    importHealth: tool.importHealth,
    executionHealth: tool.executionHealth,
    consecutiveImportFailures: tool.consecutiveImportFailures,
    lastHealthCheck: tool.lastHealthCheck?.toISOString() ?? null,
    createdAt: tool.createdAt.toISOString(),
    package: {
      npmPackageName: tool.package.npmPackageName,
      npmVersion: tool.package.npmVersion,
      npmPublishedAt: tool.package.npmPublishedAt.toISOString(),
      category: tool.package.category,
      npmRepository: normalizeRepository(tool.package.npmRepository),
      isOfficial: tool.package.isOfficial,
      npmDownloadsLastMonth: tool.package.npmDownloadsLastMonth,
    },
  };
}

export async function loadInitialTools(
  searchQuery: string,
  limit = INITIAL_DISCOVERY_LIMIT
): Promise<DiscoveryTool[]> {
  const query = searchQuery.trim();
  const tools = await prisma.tool.findMany({
    where: {
      // Keep chronically broken tools in the registry (never delist); the
      // health-tier ordering below sinks them beneath every healthy tool.
      ...activeToolFilter(),
      ...(query && {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { package: { npmPackageName: { contains: query, mode: 'insensitive' } } },
        ],
      }),
    },
    select: discoveryToolSelect,
    orderBy: [
      { importHealth: 'asc' }, // Demote BROKEN below HEALTHY/UNKNOWN (enum order)
      { qualityScore: 'desc' },
      { package: { npmDownloadsLastMonth: 'desc' } },
      { createdAt: 'desc' },
    ],
    take: limit,
  });

  return tools.map(serializeDiscoveryTool);
}

const publicCollectionSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  likeCount: true,
  forkCount: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      image: true,
      username: true,
    },
  },
  _count: {
    select: { tools: true },
  },
} satisfies Prisma.CollectionSelect;

type PublicCollectionRow = Prisma.CollectionGetPayload<{ select: typeof publicCollectionSelect }>;

export function serializePublicCollection(collection: PublicCollectionRow): PublicCollection {
  return {
    id: collection.id,
    slug: collection.slug,
    name: collection.name,
    description: collection.description,
    likeCount: collection.likeCount,
    forkCount: collection.forkCount,
    toolCount: collection._count.tools,
    createdAt: collection.createdAt.toISOString(),
    createdBy: collection.user,
  };
}

export async function loadInitialCollections(
  limit = INITIAL_DISCOVERY_LIMIT
): Promise<{ collections: PublicCollection[]; hasMore: boolean }> {
  const rows = await prisma.collection.findMany({
    where: { isPublic: true },
    select: publicCollectionSelect,
    orderBy: [{ likeCount: 'desc' }, { createdAt: 'desc' }],
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  return {
    collections: rows.slice(0, limit).map(serializePublicCollection),
    hasMore,
  };
}
