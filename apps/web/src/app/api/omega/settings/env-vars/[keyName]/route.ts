import { prisma } from '@tpmjs/db';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ keyName: string }>;
};

/**
 * DELETE /api/omega/settings/env-vars/[keyName]
 * Remove an environment variable by name
 */
export async function DELETE(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { keyName } = await context.params;

    await prisma.userApiKey.deleteMany({
      where: {
        userId: session.user.id,
        keyName,
      },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Failed to delete env var:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete env var' },
      { status: 500 }
    );
  }
}
