import { prisma } from '@tpmjs/db';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { generateApiKey } from '~/lib/api-keys';
import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/user/tpmjs-api-keys/[id]/rotate
 *
 * Rotate an API key - generates a new key while keeping the same ID,
 * name, scopes, and settings. The old key is immediately invalidated.
 *
 * Returns the new raw key - it will not be shown again!
 */
export async function POST(_request: Request, { params }: RouteParams) {
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

    // Generate new key
    const { rawKey, keyHash, keyPrefix } = generateApiKey();

    // Update the key with new hash and prefix
    const apiKey = await prisma.tpmjsApiKey.update({
      where: { id },
      data: {
        keyHash,
        keyPrefix,
        // Reset lastUsedAt since it's a new key
        lastUsedAt: null,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        rateLimit: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      apiKey: {
        ...apiKey,
        key: rawKey, // IMPORTANT: Only shown once!
      },
      message: 'API key rotated. Copy the new key now - it will not be shown again!',
    });
  } catch (error) {
    console.error('[API Keys] Error rotating key:', error);
    return NextResponse.json({ error: 'Failed to rotate API key' }, { status: 500 });
  }
}
