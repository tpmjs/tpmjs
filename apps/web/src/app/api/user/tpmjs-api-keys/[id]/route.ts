import { prisma } from '@tpmjs/db';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { maskApiKey } from '~/lib/api-keys';
import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/user/tpmjs-api-keys/[id]
 *
 * Get details for a specific API key.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const apiKey = await prisma.tpmjsApiKey.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        rateLimit: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            usageRecords: true,
          },
        },
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      apiKey: {
        ...apiKey,
        maskedKey: maskApiKey(apiKey.keyPrefix),
        usageRecordCount: apiKey._count.usageRecords,
      },
    });
  } catch (error) {
    console.error('[API Keys] Error getting key:', error);
    return NextResponse.json({ error: 'Failed to get API key' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/tpmjs-api-keys/[id]
 *
 * Update an API key (name, scopes, isActive, expiresAt).
 *
 * Request body:
 * {
 *   name?: string;
 *   scopes?: string[];
 *   isActive?: boolean;
 *   expiresAt?: string | null;
 * }
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, scopes, isActive, expiresAt } = body;

    // Verify ownership
    const existing = await prisma.tpmjsApiKey.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Build update data
    const updateData: {
      name?: string;
      scopes?: string[];
      isActive?: boolean;
      expiresAt?: Date | null;
    } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      }
      if (name.length > 100) {
        return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (scopes !== undefined) {
      if (!Array.isArray(scopes)) {
        return NextResponse.json({ error: 'Scopes must be an array' }, { status: 400 });
      }
      updateData.scopes = scopes;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
      }
      updateData.isActive = isActive;
    }

    if (expiresAt !== undefined) {
      if (expiresAt === null) {
        updateData.expiresAt = null;
      } else {
        const date = new Date(expiresAt);
        if (Number.isNaN(date.getTime())) {
          return NextResponse.json({ error: 'Invalid expiration date' }, { status: 400 });
        }
        if (date <= new Date()) {
          return NextResponse.json(
            { error: 'Expiration date must be in the future' },
            { status: 400 }
          );
        }
        updateData.expiresAt = date;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const apiKey = await prisma.tpmjsApiKey.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        rateLimit: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      apiKey: {
        ...apiKey,
        maskedKey: maskApiKey(apiKey.keyPrefix),
      },
    });
  } catch (error) {
    console.error('[API Keys] Error updating key:', error);
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });
  }
}

/**
 * DELETE /api/user/tpmjs-api-keys/[id]
 *
 * Delete an API key. This is permanent and cannot be undone.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.tpmjsApiKey.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    await prisma.tpmjsApiKey.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error) {
    console.error('[API Keys] Error deleting key:', error);
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
  }
}
