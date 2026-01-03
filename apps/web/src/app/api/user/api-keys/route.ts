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
  const startTime = Date.now();
  console.log('[api-keys] POST request received');

  try {
    // Step 1: Auth check
    console.log('[api-keys] Checking session...');
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      console.log('[api-keys] Unauthorized - no session or user id');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[api-keys] Session valid for user:', session.user.id);

    // Step 2: Parse request body
    console.log('[api-keys] Parsing request body...');
    let body: unknown;
    try {
      body = await request.json();
      console.log('[api-keys] Body parsed, provider:', (body as { provider?: string })?.provider);
    } catch (parseError) {
      console.error('[api-keys] Failed to parse JSON body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Step 3: Validate schema
    console.log('[api-keys] Validating schema...');
    const parsed = AddApiKeySchema.safeParse(body);
    if (!parsed.success) {
      console.error('[api-keys] Schema validation failed:', parsed.error.flatten());
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    console.log('[api-keys] Schema valid, provider:', parsed.data.provider);

    const { provider, apiKey } = parsed.data;
    console.log('[api-keys] API key length:', apiKey.length, 'chars');

    // Step 4: Encrypt the key
    console.log('[api-keys] Encrypting API key...');
    let encrypted: string;
    let iv: string;
    try {
      const hasEncryptionSecret = !!process.env.API_KEY_ENCRYPTION_SECRET;
      console.log('[api-keys] API_KEY_ENCRYPTION_SECRET present:', hasEncryptionSecret);
      if (!hasEncryptionSecret) {
        console.error('[api-keys] CRITICAL: API_KEY_ENCRYPTION_SECRET is not set!');
        return NextResponse.json(
          { success: false, error: 'Server configuration error: encryption not configured' },
          { status: 500 }
        );
      }
      const result = encryptApiKey(apiKey);
      encrypted = result.encrypted;
      iv = result.iv;
      console.log('[api-keys] Encryption successful, encrypted length:', encrypted.length);
    } catch (encryptError) {
      console.error('[api-keys] Encryption failed:', encryptError);
      return NextResponse.json(
        { success: false, error: 'Failed to encrypt API key' },
        { status: 500 }
      );
    }

    const keyHint = getKeyHint(apiKey);
    console.log('[api-keys] Key hint:', keyHint);

    // Step 5: Upsert to database
    console.log('[api-keys] Upserting to database...');
    console.log('[api-keys] Where clause: userId_provider =', { userId: session.user.id, provider });

    let result;
    try {
      result = await prisma.userApiKey.upsert({
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
      console.log('[api-keys] Upsert successful:', result.provider, 'updated at', result.updatedAt);
    } catch (dbError) {
      console.error('[api-keys] Database upsert failed:', dbError);
      console.error('[api-keys] Database error details:', {
        name: (dbError as Error).name,
        message: (dbError as Error).message,
        stack: (dbError as Error).stack?.slice(0, 500),
      });
      return NextResponse.json(
        { success: false, error: 'Failed to save API key to database' },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`[api-keys] POST completed successfully in ${duration}ms`);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[api-keys] Unexpected error after ${duration}ms:`, error);
    console.error('[api-keys] Error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack?.slice(0, 500),
    });
    return NextResponse.json({ success: false, error: 'Failed to save API key' }, { status: 500 });
  }
}
