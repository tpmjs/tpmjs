import { prisma } from '@tpmjs/db';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '~/lib/auth';
import { encryptApiKey, getKeyHint } from '~/lib/crypto/api-keys';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AddKeySchema = z.object({
  keyName: z.string().min(1).max(100),
  keyValue: z.string().min(1),
});

/**
 * GET /api/user/api-keys
 * List user's stored API keys (masked)
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const apiKeys = await prisma.userApiKey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        keyName: true,
        keyHint: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { keyName: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: apiKeys,
    });
  } catch (error) {
    console.error('Failed to list API keys:', error);
    return NextResponse.json({ success: false, error: 'Failed to list API keys' }, { status: 500 });
  }
}

/**
 * POST /api/user/api-keys
 * Add or update an API key
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = AddKeySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { keyName, keyValue } = parsed.data;

    // Check encryption secret
    if (!process.env.API_KEY_ENCRYPTION_SECRET) {
      console.error('[api-keys] API_KEY_ENCRYPTION_SECRET not set');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { encrypted, iv } = encryptApiKey(keyValue);
    const keyHint = getKeyHint(keyValue);

    const result = await prisma.userApiKey.upsert({
      where: {
        userId_keyName: {
          userId: session.user.id,
          keyName,
        },
      },
      create: {
        userId: session.user.id,
        keyName,
        encryptedKey: encrypted,
        keyIv: iv,
        keyHint,
      },
      update: {
        encryptedKey: encrypted,
        keyIv: iv,
        keyHint,
      },
      select: {
        id: true,
        keyName: true,
        keyHint: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Failed to save API key:', error);
    return NextResponse.json({ success: false, error: 'Failed to save API key' }, { status: 500 });
  }
}
