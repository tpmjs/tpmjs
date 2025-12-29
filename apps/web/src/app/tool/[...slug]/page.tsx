import { prisma } from '@tpmjs/db';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { type Tool, ToolDetailClient } from './ToolDetailClient';

export const dynamic = 'force-dynamic';

interface ToolDetailPageProps {
  params: Promise<{ slug: string[] }>;
}

/**
 * Parse the URL slug to extract package name and optional export name
 */
function parseSlug(slug: string[]): { packageName: string; exportName?: string } {
  // URL-decode slug components (@ comes as %40)
  const decodedSlug = slug.map((s) => decodeURIComponent(s));

  if (decodedSlug[0]?.startsWith('@')) {
    // Scoped package: ['@scope', 'package', 'exportName?']
    const packageName = decodedSlug.slice(0, 2).join('/');
    const exportName = decodedSlug[2];
    return { packageName, exportName };
  }
  // Unscoped: ['package', 'exportName?']
  return { packageName: decodedSlug[0] || '', exportName: decodedSlug[1] };
}

/**
 * Fetch tool data from database
 */
async function getTool(slug: string[]): Promise<Tool | null> {
  const { packageName, exportName } = parseSlug(slug);

  if (!packageName) {
    return null;
  }

  // First find the package by npm name
  const pkg = await prisma.package.findUnique({
    where: { npmPackageName: packageName },
  });

  if (!pkg) {
    return null;
  }

  // Then find the tool using packageId
  const tool = await prisma.tool.findFirst({
    where: {
      packageId: pkg.id,
      ...(exportName && { name: exportName }),
    },
    include: {
      package: true,
    },
    orderBy: { qualityScore: 'desc' },
  });

  if (!tool) {
    return null;
  }

  // Transform Prisma result to Tool interface
  return {
    id: tool.id,
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters as Tool['parameters'],
    inputSchema: tool.inputSchema as Tool['inputSchema'],
    schemaSource: tool.schemaSource as Tool['schemaSource'],
    schemaExtractedAt: tool.schemaExtractedAt?.toISOString() ?? null,
    toolDiscoverySource: tool.toolDiscoverySource as Tool['toolDiscoverySource'],
    returns: tool.returns as Tool['returns'],
    aiAgent: tool.aiAgent as Tool['aiAgent'],
    qualityScore: tool.qualityScore?.toString() ?? null,
    importHealth: tool.importHealth ?? undefined,
    executionHealth: tool.executionHealth ?? undefined,
    healthCheckError: tool.healthCheckError ?? null,
    lastHealthCheck: tool.lastHealthCheck?.toISOString() ?? null,
    createdAt: tool.createdAt.toISOString(),
    updatedAt: tool.updatedAt.toISOString(),
    package: {
      id: tool.package.id,
      npmPackageName: tool.package.npmPackageName,
      npmVersion: tool.package.npmVersion,
      npmDescription: tool.package.npmDescription,
      npmHomepage: tool.package.npmHomepage,
      category: tool.package.category,
      npmRepository: tool.package.npmRepository as Tool['package']['npmRepository'],
      isOfficial: tool.package.isOfficial,
      npmDownloadsLastMonth: tool.package.npmDownloadsLastMonth,
      npmKeywords: tool.package.npmKeywords,
      npmReadme: tool.package.npmReadme,
      npmAuthor: tool.package.npmAuthor as Tool['package']['npmAuthor'],
      npmMaintainers: tool.package.npmMaintainers as Tool['package']['npmMaintainers'],
      npmLicense: tool.package.npmLicense,
      githubStars: tool.package.githubStars,
      frameworks: tool.package.frameworks,
      tier: tool.package.tier,
      createdAt: tool.package.createdAt.toISOString(),
      updatedAt: tool.package.updatedAt.toISOString(),
    },
  };
}

/**
 * Generate metadata for the tool page
 */
export async function generateMetadata({ params }: ToolDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getTool(slug);

  if (!tool) {
    return {
      title: 'Tool Not Found',
      description: 'The requested tool could not be found.',
    };
  }

  const { packageName, exportName } = parseSlug(slug);
  const ogPath = exportName
    ? `/api/og/tool/${encodeURIComponent(packageName)}/${encodeURIComponent(exportName)}`
    : `/api/og/tool/${encodeURIComponent(packageName)}`;

  return {
    title: `${tool.name} | TPMJS`,
    description: tool.description || `${tool.name} - AI tool from ${tool.package.npmPackageName}`,
    keywords: [tool.package.category, 'AI', 'npm', 'tool', tool.name, tool.package.npmPackageName],
    openGraph: {
      title: tool.name,
      description: tool.description,
      type: 'website',
      images: [
        {
          url: ogPath,
          width: 1200,
          height: 630,
          alt: `${tool.name} - TPMJS Tool`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: tool.name,
      description: tool.description,
      images: [ogPath],
    },
  };
}

/**
 * Tool detail page - server component
 */
export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { slug } = await params;
  const tool = await getTool(slug);

  if (!tool) {
    notFound();
  }

  return <ToolDetailClient tool={tool} slug={slug.join('/')} />;
}
