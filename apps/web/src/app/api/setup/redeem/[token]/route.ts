import { prisma } from '@tpmjs/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ token: string }>;
}

interface ConfigMapping {
  collectionId: string;
  collectionSlug: string;
  collectionName: string;
  editor: string;
}

interface SetupConfig {
  mappings: ConfigMapping[];
  apiKey?: string;
}

/**
 * GET /api/setup/redeem/[token]
 *
 * Called by install.sh to redeem a setup token and get the configuration payload.
 * One-time use - marks the token as redeemed after successful retrieval.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;

    if (!token || token.length !== 64) {
      return NextResponse.json({ success: false, error: 'Invalid token format' }, { status: 400 });
    }

    // Look up the token
    const setupToken = await prisma.setupToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!setupToken) {
      return NextResponse.json({ success: false, error: 'Token not found' }, { status: 404 });
    }

    // Check if already redeemed
    if (setupToken.redeemed) {
      return NextResponse.json(
        { success: false, error: 'Token has already been redeemed' },
        { status: 410 }
      );
    }

    // Check if expired
    if (setupToken.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'Token has expired' }, { status: 410 });
    }

    // Mark as redeemed
    await prisma.setupToken.update({
      where: { id: setupToken.id },
      data: {
        redeemed: true,
        redeemedAt: new Date(),
      },
    });

    const config = setupToken.config as unknown as SetupConfig;
    const username = setupToken.user.username || setupToken.user.id;

    // Build the response payload
    const mappings = config.mappings.map((m) => ({
      collectionSlug: m.collectionSlug,
      collectionName: m.collectionName,
      editor: m.editor,
      mcpUrl: `https://tpmjs.com/@${username}/collections/${m.collectionSlug}/mcp`,
    }));

    return NextResponse.json({
      success: true,
      username,
      mappings,
      ...(config.apiKey && { apiKey: config.apiKey }),
    });
  } catch (error) {
    console.error('[Setup] Error redeeming token:', error);
    return NextResponse.json({ success: false, error: 'Failed to redeem token' }, { status: 500 });
  }
}
