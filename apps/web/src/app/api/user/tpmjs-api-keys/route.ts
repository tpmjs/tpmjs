import { prisma } from '@tpmjs/db';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  type ApiKeyScope,
  DEFAULT_API_KEY_SCOPES,
  generateApiKey,
  maskApiKey,
} from '~/lib/api-keys';
import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/user/tpmjs-api-keys
 *
 * List all API keys for the authenticated user.
 * Requires session auth (not API key auth) for security.
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKeys = await prisma.tpmjsApiKey.findMany({
      where: { userId: session.user.id },
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      apiKeys: apiKeys.map((key) => ({
        ...key,
        maskedKey: maskApiKey(key.keyPrefix),
      })),
    });
  } catch (error) {
    console.error('[API Keys] Error listing keys:', error);
    return NextResponse.json({ error: 'Failed to list API keys' }, { status: 500 });
  }
}

/**
 * POST /api/user/tpmjs-api-keys
 *
 * Create a new API key for the authenticated user.
 * Returns the raw key ONLY ONCE - it cannot be retrieved again.
 *
 * Request body:
 * {
 *   name: string;          // Required: User-friendly name
 *   scopes?: string[];     // Optional: Permissions (defaults to all)
 *   expiresAt?: string;    // Optional: ISO date string for expiration
 * }
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, scopes, expiresAt } = body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 });
    }

    // Validate scopes
    const validScopes: ApiKeyScope[] = scopes?.length > 0 ? scopes : DEFAULT_API_KEY_SCOPES;

    // Validate expiration
    let expiresAtDate: Date | undefined;
    if (expiresAt) {
      expiresAtDate = new Date(expiresAt);
      if (Number.isNaN(expiresAtDate.getTime())) {
        return NextResponse.json({ error: 'Invalid expiration date' }, { status: 400 });
      }
      if (expiresAtDate <= new Date()) {
        return NextResponse.json(
          { error: 'Expiration date must be in the future' },
          { status: 400 }
        );
      }
    }

    // Check key limit (max 10 keys per user)
    const existingKeyCount = await prisma.tpmjsApiKey.count({
      where: { userId: session.user.id },
    });

    if (existingKeyCount >= 10) {
      return NextResponse.json(
        { error: 'Maximum of 10 API keys allowed. Please delete an existing key first.' },
        { status: 400 }
      );
    }

    // Generate the key
    const { rawKey, keyHash, keyPrefix } = generateApiKey();

    // Create the key in database
    const apiKey = await prisma.tpmjsApiKey.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        keyHash,
        keyPrefix,
        scopes: validScopes,
        expiresAt: expiresAtDate,
      },
    });

    // Return the raw key - ONLY TIME it's shown!
    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: rawKey, // IMPORTANT: Only shown once!
        keyPrefix: apiKey.keyPrefix,
        scopes: apiKey.scopes,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
      message: 'API key created. Copy the key now - it will not be shown again!',
    });
  } catch (error) {
    console.error('[API Keys] Error creating key:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}
