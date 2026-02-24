import { randomBytes } from 'node:crypto';
import { prisma } from '@tpmjs/db';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { DEFAULT_API_KEY_SCOPES, generateApiKey } from '~/lib/api-keys';
import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const VALID_EDITORS = ['claude-code', 'cursor', 'windsurf', 'claude-desktop'] as const;
type Editor = (typeof VALID_EDITORS)[number];

interface MappingInput {
  collectionId: string;
  collectionSlug: string;
  collectionName: string;
  editor: Editor;
}

interface CreateTokenBody {
  mappings: MappingInput[];
  createApiKey?: boolean;
  claimCode?: string; // From install.sh polling flow
}

/**
 * POST /api/setup/create-token
 *
 * Creates a one-time setup token for the install.sh flow.
 * Called from the web UI (authenticated via session).
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateTokenBody = await request.json();
    const { mappings, createApiKey, claimCode } = body;

    // Validate mappings
    if (!Array.isArray(mappings) || mappings.length === 0) {
      return NextResponse.json({ error: 'At least one mapping is required' }, { status: 400 });
    }

    if (mappings.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 mappings allowed' }, { status: 400 });
    }

    for (const mapping of mappings) {
      if (!mapping.collectionId || !mapping.collectionSlug || !mapping.collectionName) {
        return NextResponse.json(
          { error: 'Each mapping must include collectionId, collectionSlug, and collectionName' },
          { status: 400 }
        );
      }
      if (!VALID_EDITORS.includes(mapping.editor as Editor)) {
        return NextResponse.json(
          {
            error: `Invalid editor "${mapping.editor}". Must be one of: ${VALID_EDITORS.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // Validate all collections belong to the user
    const collectionIds = mappings.map((m) => m.collectionId);
    const collections = await prisma.collection.findMany({
      where: {
        id: { in: collectionIds },
        userId: session.user.id,
      },
      select: { id: true },
    });

    const ownedIds = new Set(collections.map((c) => c.id));
    const invalidIds = collectionIds.filter((id) => !ownedIds.has(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Collections not found or not owned by you: ${invalidIds.join(', ')}` },
        { status: 403 }
      );
    }

    // Determine whether to create an API key
    let rawApiKey: string | undefined;

    const shouldCreateKey =
      createApiKey ||
      (await prisma.tpmjsApiKey.count({
        where: { userId: session.user.id, isActive: true },
      })) === 0;

    if (shouldCreateKey) {
      const { rawKey, keyHash, keyPrefix } = generateApiKey();
      rawApiKey = rawKey;

      await prisma.tpmjsApiKey.create({
        data: {
          userId: session.user.id,
          name: 'Setup (auto-created)',
          keyHash,
          keyPrefix,
          scopes: DEFAULT_API_KEY_SCOPES,
        },
      });
    }

    // Generate a random 32-byte hex token
    const token = randomBytes(32).toString('hex');

    // Create the SetupToken with 1 hour expiry
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.setupToken.create({
      data: {
        userId: session.user.id,
        token,
        ...(claimCode && { claimCode }),
        config: {
          mappings: mappings.map((m) => ({
            collectionId: m.collectionId,
            collectionSlug: m.collectionSlug,
            collectionName: m.collectionName,
            editor: m.editor,
          })),
          // Store raw key in the token config so the redeem endpoint can return it
          // to the install script. This is safe because the token is single-use and
          // expires in 1 hour.
          ...(rawApiKey && { apiKey: rawApiKey }),
        },
        expiresAt,
      },
    });

    const installCommand = `curl -fsSL https://tpmjs.com/install.sh | bash -s -- --token=${token}`;

    return NextResponse.json({
      token,
      installCommand,
      ...(rawApiKey && { apiKey: rawApiKey }),
    });
  } catch (error) {
    console.error('[Setup] Error creating token:', error);
    return NextResponse.json({ error: 'Failed to create setup token' }, { status: 500 });
  }
}
