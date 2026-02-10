import { prisma } from '@tpmjs/db';
import { BulkAddToolsFromPackageSchema, COLLECTION_LIMITS } from '@tpmjs/types/collection';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { logActivity } from '~/lib/activity';
import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const API_VERSION = '1.0.0';

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
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/collections/[id]/tools/from-package
 * Bulk add all tools from a package to a collection
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id: collectionId } = await context.params;

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

    // Verify collection exists and user owns it
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: { _count: { select: { tools: true } } },
    });

    if (!collection) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Collection not found' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 404 }
      );
    }

    if (collection.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = BulkAddToolsFromPackageSchema.safeParse(body);

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

    const { npmPackageName } = parseResult.data;

    // Find the package and all its tools
    const pkg = await prisma.package.findUnique({
      where: { npmPackageName },
      include: {
        tools: {
          select: {
            id: true,
            name: true,
            description: true,
            package: {
              select: {
                id: true,
                npmPackageName: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: `Package '${npmPackageName}' not found` },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 404 }
      );
    }

    if (pkg.tools.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NO_TOOLS', message: `Package '${npmPackageName}' has no tools` },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 400 }
      );
    }

    // Fetch existing tool IDs in collection to determine dupes
    const existingEntries = await prisma.collectionTool.findMany({
      where: { collectionId },
      select: { toolId: true },
    });
    const existingToolIds = new Set(existingEntries.map((e) => e.toolId));

    // Filter out tools already in the collection
    const newTools = pkg.tools.filter((t) => !existingToolIds.has(t.id));

    // Calculate available slots
    const currentCount = collection._count.tools;
    const availableSlots = COLLECTION_LIMITS.MAX_TOOLS_PER_COLLECTION - currentCount;
    const limitReached = newTools.length > availableSlots;
    const toolsToAdd = newTools.slice(0, Math.max(0, availableSlots));

    if (toolsToAdd.length > 0) {
      // Get next position
      const maxPositionResult = await prisma.collectionTool.aggregate({
        where: { collectionId },
        _max: { position: true },
      });
      let nextPosition = (maxPositionResult._max.position ?? -1) + 1;

      // Bulk insert
      await prisma.collectionTool.createMany({
        data: toolsToAdd.map((tool) => ({
          collectionId,
          toolId: tool.id,
          position: nextPosition++,
        })),
        skipDuplicates: true,
      });
    }

    const skipped = pkg.tools.length - newTools.length;

    // Log activity (fire-and-forget)
    if (toolsToAdd.length > 0) {
      logActivity({
        userId: session.user.id,
        type: 'COLLECTION_TOOLS_BULK_ADDED',
        targetName: collection.name,
        targetType: 'collection',
        collectionId,
        metadata: {
          packageName: npmPackageName,
          count: toolsToAdd.length,
          skipped,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          added: toolsToAdd.length,
          skipped,
          limitReached,
          tools: toolsToAdd.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            package: t.package,
          })),
        },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API Error] POST /api/collections/[id]/tools/from-package:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to bulk add tools' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
