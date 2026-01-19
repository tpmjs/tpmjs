import { prisma } from '@tpmjs/db';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CollectionDetailClient, type PublicCollection } from './CollectionDetailClient';

export const dynamic = 'force-dynamic';

interface CollectionPageProps {
  params: Promise<{ username: string; slug: string }>;
}

/**
 * Fetch collection data from database
 */
async function getCollection(username: string, slug: string): Promise<PublicCollection | null> {
  // Remove @ prefix if present
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

  const collection = await prisma.collection.findFirst({
    where: {
      slug,
      user: { username: cleanUsername },
      isPublic: true,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
        },
      },
      tools: {
        include: {
          tool: {
            include: {
              package: {
                select: {
                  npmPackageName: true,
                  category: true,
                },
              },
            },
          },
        },
        orderBy: { position: 'asc' },
      },
      forkedFrom: {
        include: {
          user: {
            select: { username: true },
          },
        },
      },
    },
  });

  if (!collection) {
    return null;
  }

  // Parse useCases from Json field
  const useCases = collection.useCases as
    | {
        id: string;
        userPrompt: string;
        description: string;
        toolSequence: {
          toolName: string;
          packageName: string;
          purpose: string;
          order: number;
        }[];
      }[]
    | null;

  return {
    id: collection.id,
    slug: collection.slug || '',
    name: collection.name,
    description: collection.description,
    likeCount: collection.likeCount,
    toolCount: collection.tools.length,
    forkCount: collection.forkCount,
    createdAt: collection.createdAt.toISOString(),
    createdBy: {
      id: collection.user.id,
      username: collection.user.username || '',
      name: collection.user.name || '',
      image: collection.user.image,
    },
    tools: collection.tools.map((ct) => ({
      id: ct.id,
      toolId: ct.toolId,
      position: ct.position,
      note: ct.note,
      tool: {
        id: ct.tool.id,
        name: ct.tool.name,
        description: ct.tool.description,
        likeCount: ct.tool.likeCount,
        package: {
          npmPackageName: ct.tool.package.npmPackageName,
          category: ct.tool.package.category,
        },
      },
    })),
    forkedFromId: collection.forkedFromId,
    forkedFrom: collection.forkedFrom
      ? {
          id: collection.forkedFrom.id,
          name: collection.forkedFrom.name,
          slug: collection.forkedFrom.slug || '',
          user: {
            username: collection.forkedFrom.user.username || '',
          },
        }
      : null,
    useCases: useCases ?? null,
    useCasesGeneratedAt: collection.useCasesGeneratedAt?.toISOString() ?? null,
  };
}

/**
 * Generate metadata for OG tags and SEO
 */
export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { username, slug } = await params;
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
  const collection = await getCollection(username, slug);

  if (!collection) {
    return {
      title: 'Collection Not Found | TPMJS',
      description: 'The requested collection could not be found.',
    };
  }

  const title = `${collection.name} | TPMJS`;
  const description =
    collection.description ||
    `${collection.name} - A collection of ${collection.toolCount} AI tools curated by @${cleanUsername}`;

  // Generate a list of tool names for keywords
  const toolNames = collection.tools.slice(0, 5).map((t) => t.tool.name);
  const keywords = ['TPMJS', 'AI', 'MCP', 'tools', 'collection', ...toolNames];

  // OG image URL - for now use default, can add custom collection OG later
  const ogImageUrl = `/api/og/collection/${encodeURIComponent(cleanUsername)}/${encodeURIComponent(slug)}`;

  const canonicalUrl = `https://tpmjs.com/${cleanUsername}/collections/${slug}`;

  return {
    title,
    description,
    keywords,
    authors: [{ name: `@${cleanUsername}` }],
    openGraph: {
      title: collection.name,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName: 'TPMJS',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${collection.name} - TPMJS Collection`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: collection.name,
      description,
      site: '@tpmjs_registry',
      creator: `@${cleanUsername}`,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

/**
 * Collection detail page - server component
 */
export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const { username, slug } = await params;
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
  const collection = await getCollection(username, slug);

  if (!collection) {
    notFound();
  }

  return <CollectionDetailClient collection={collection} username={cleanUsername} />;
}
