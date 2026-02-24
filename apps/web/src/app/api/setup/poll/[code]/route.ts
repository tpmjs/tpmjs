import { prisma } from '@tpmjs/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ code: string }>;
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
 * GET /api/setup/poll/[code]
 *
 * Called by install.sh to poll for setup completion.
 * Returns 202 (pending) until the user completes setup on the web,
 * then returns the config payload and marks the token as redeemed.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;

    if (!code || code.length < 8) {
      return NextResponse.json({ status: 'error', error: 'Invalid claim code' }, { status: 400 });
    }

    // Look for a SetupToken with this claim code
    const setupToken = await prisma.setupToken.findUnique({
      where: { claimCode: code },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
    });

    // No token yet — user hasn't completed setup
    if (!setupToken) {
      return NextResponse.json({ status: 'pending' }, { status: 202 });
    }

    // Token exists but already redeemed
    if (setupToken.redeemed) {
      return NextResponse.json(
        { status: 'error', error: 'This setup has already been completed' },
        { status: 410 }
      );
    }

    // Token expired
    if (setupToken.expiresAt < new Date()) {
      return NextResponse.json(
        { status: 'error', error: 'Setup session expired' },
        { status: 410 }
      );
    }

    // Token is ready — mark as redeemed and return config
    await prisma.setupToken.update({
      where: { id: setupToken.id },
      data: { redeemed: true, redeemedAt: new Date() },
    });

    const config = setupToken.config as unknown as SetupConfig;
    const username = setupToken.user.username || setupToken.user.id;

    const mappings = config.mappings.map((m) => ({
      collectionSlug: m.collectionSlug,
      collectionName: m.collectionName,
      editor: m.editor,
      mcpUrl: `https://tpmjs.com/api/mcp/${username}/${m.collectionSlug}/http`,
    }));

    return NextResponse.json({
      status: 'ready',
      username,
      mappings,
      ...(config.apiKey && { apiKey: config.apiKey }),
    });
  } catch (error) {
    console.error('[Setup] Error polling claim:', error);
    return NextResponse.json({ status: 'error', error: 'Failed to poll' }, { status: 500 });
  }
}
