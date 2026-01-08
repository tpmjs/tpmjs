import { prisma } from '@tpmjs/db';
import { COLLECTION_LIMITS, CloneCollectionSchema } from '@tpmjs/types/collection';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

import { logActivity } from '~/lib/activity';
import {
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
} from '~/lib/api-response';
import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Generate a URL-friendly slug from a name
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

/**
 * Generate a unique slug for a collection within a user's scope
 */
async function generateUniqueSlug(userId: string, baseName: string): Promise<string> {
  let slug = slugify(baseName);
  if (!slug) slug = 'collection';

  // Check if slug exists for this user
  const existing = await prisma.collection.findFirst({
    where: { userId, slug },
    select: { id: true },
  });

  if (!existing) return slug;

  // Append numbers until unique
  let counter = 1;
  while (counter < 1000) {
    const candidate = `${slug.slice(0, 46)}-${counter}`;
    const exists = await prisma.collection.findFirst({
      where: { userId, slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
    counter++;
  }

  // Fallback: use random suffix
  return `${slug.slice(0, 42)}-${Date.now().toString(36)}`;
}

/**
 * POST /api/collections/[id]/clone
 * Clone a public collection to the current user's account
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return apiUnauthorized('Authentication required', requestId);
    }

    const { id } = await context.params;

    // Get the source collection
    const sourceCollection = await prisma.collection.findUnique({
      where: { id },
      include: {
        tools: {
          select: { toolId: true, position: true, note: true },
        },
      },
    });

    if (!sourceCollection) {
      return apiNotFound('Collection', requestId);
    }

    // Only public collections can be cloned
    if (!sourceCollection.isPublic) {
      return apiForbidden('Only public collections can be cloned', requestId);
    }

    // Don't allow cloning your own collection
    if (sourceCollection.userId === session.user.id) {
      return apiValidationError('Cannot clone your own collection', undefined, requestId);
    }

    // Check collection limit
    const existingCount = await prisma.collection.count({
      where: { userId: session.user.id },
    });

    if (existingCount >= COLLECTION_LIMITS.MAX_COLLECTIONS_PER_USER) {
      return apiValidationError(
        `Maximum ${COLLECTION_LIMITS.MAX_COLLECTIONS_PER_USER} collections allowed`,
        undefined,
        requestId
      );
    }

    // Parse optional body for custom name
    let customName: string | undefined;

    try {
      const body = await request.json();
      const parsed = CloneCollectionSchema.safeParse(body);
      if (parsed.success) {
        customName = parsed.data.name;
      }
    } catch {
      // No body or invalid JSON - use defaults
    }

    // Generate name and slug
    const name = customName || `${sourceCollection.name} (copy)`;
    const slug = await generateUniqueSlug(session.user.id, name);

    // Create the cloned collection with all its tools
    const clonedCollection = await prisma.$transaction(async (tx) => {
      // Create the collection
      const newCollection = await tx.collection.create({
        data: {
          userId: session.user.id,
          name,
          slug,
          description: sourceCollection.description,
          isPublic: false, // Cloned collections start as private
          likeCount: 1, // Start with 1 like (from owner)
        },
      });

      // Auto-like the collection
      await tx.collectionLike.create({
        data: {
          userId: session.user.id,
          collectionId: newCollection.id,
        },
      });

      // Clone tool relationships
      if (sourceCollection.tools.length > 0) {
        await tx.collectionTool.createMany({
          data: sourceCollection.tools.map((ct) => ({
            collectionId: newCollection.id,
            toolId: ct.toolId,
            position: ct.position,
            note: ct.note,
          })),
        });
      }

      return newCollection;
    });

    // Log activity
    logActivity({
      userId: session.user.id,
      type: 'COLLECTION_CLONED',
      targetName: clonedCollection.name,
      targetType: 'collection',
      collectionId: clonedCollection.id,
      metadata: { sourceCollectionId: sourceCollection.id },
    });

    return apiSuccess(
      {
        id: clonedCollection.id,
        name: clonedCollection.name,
        slug: clonedCollection.slug,
        description: clonedCollection.description,
        isPublic: clonedCollection.isPublic,
        toolCount: sourceCollection.tools.length,
        createdAt: clonedCollection.createdAt,
      },
      { requestId, status: 201 }
    );
  } catch (error) {
    console.error('[API Error] POST /api/collections/[id]/clone:', error);
    return apiInternalError('Failed to clone collection', requestId);
  }
}
