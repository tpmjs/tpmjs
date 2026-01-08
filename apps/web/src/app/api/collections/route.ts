import { prisma } from '@tpmjs/db';
import { COLLECTION_LIMITS, CreateCollectionSchema } from '@tpmjs/types/collection';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { logActivity } from '~/lib/activity';
import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const API_VERSION = '1.0.0';

/**
 * Generate a URL-friendly slug from a name
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .replace(/^-+|-+$/g, '') // Trim hyphens
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
 * Standard API response structure
 */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    version: string;
    timestamp: string;
    requestId?: string;
  };
  pagination?: {
    limit: number;
    offset: number;
    count: number;
    hasMore: boolean;
  };
}

/**
 * GET /api/collections
 * List all collections for the authenticated user
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();

  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 401 }
      );
    }

    // Parse pagination and search params
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Math.max(Number.parseInt(searchParams.get('limit') || '20', 10), 1), 50);
    const offset = Math.max(Number.parseInt(searchParams.get('offset') || '0', 10), 0);
    const search = searchParams.get('search')?.trim();

    // Fetch collections with tool count
    const collections = await prisma.collection.findMany({
      where: {
        userId: session.user.id,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        _count: { select: { tools: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip: offset,
    });

    const hasMore = collections.length > limit;
    const data = hasMore ? collections.slice(0, limit) : collections;

    return NextResponse.json({
      success: true,
      data: data.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        isPublic: c.isPublic,
        toolCount: c._count.tools,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      pagination: { limit, offset, count: data.length, hasMore },
    });
  } catch (error) {
    console.error('[API Error] GET /api/collections:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch collections' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/collections
 * Create a new collection
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();

  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = CreateCollectionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: { errors: parseResult.error.flatten().fieldErrors },
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 400 }
      );
    }

    const { name, description, isPublic } = parseResult.data;

    // Check collection limit
    const existingCount = await prisma.collection.count({
      where: { userId: session.user.id },
    });

    if (existingCount >= COLLECTION_LIMITS.MAX_COLLECTIONS_PER_USER) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LIMIT_EXCEEDED',
            message: `Maximum ${COLLECTION_LIMITS.MAX_COLLECTIONS_PER_USER} collections allowed`,
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 400 }
      );
    }

    // Check for duplicate name (case-insensitive)
    const existingCollection = await prisma.collection.findFirst({
      where: {
        userId: session.user.id,
        name: { equals: name, mode: 'insensitive' },
      },
    });

    if (existingCollection) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_NAME',
            message: 'A collection with this name already exists',
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 409 }
      );
    }

    // Generate unique slug for the collection
    const slug = await generateUniqueSlug(session.user.id, name);

    // Create collection with auto-like (user likes their own collection)
    const collection = await prisma.$transaction(async (tx) => {
      const newCollection = await tx.collection.create({
        data: {
          userId: session.user.id,
          name,
          slug,
          description: description || null,
          isPublic,
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

      return newCollection;
    });

    // Log activity (fire-and-forget)
    logActivity({
      userId: session.user.id,
      type: 'COLLECTION_CREATED',
      targetName: collection.name,
      targetType: 'collection',
      collectionId: collection.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: collection.id,
          name: collection.name,
          slug: collection.slug,
          description: collection.description,
          isPublic: collection.isPublic,
          toolCount: 0,
          createdAt: collection.createdAt,
          updatedAt: collection.updatedAt,
        },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API Error] POST /api/collections:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create collection' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
