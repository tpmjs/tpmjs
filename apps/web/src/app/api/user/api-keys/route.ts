import { prisma } from '@tpmjs/db';
import { AddApiKeySchema } from '@tpmjs/types/agent';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '~/lib/auth';
import { encryptApiKey, getKeyHint } from '~/lib/crypto/api-keys';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
        provider: true,
        keyHint: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
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
 * Add or update an API key for a provider
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = AddApiKeySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { provider, apiKey } = parsed.data;
    const { encrypted, iv } = encryptApiKey(apiKey);
    const keyHint = getKeyHint(apiKey);

    const result = await prisma.userApiKey.upsert({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider,
        },
      },
      create: {
        userId: session.user.id,
        provider,
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
        provider: true,
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
