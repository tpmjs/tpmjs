import { prisma } from '@tpmjs/db';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string; collectionId: string }>;
};

/**
 * DELETE /api/agents/[id]/collections/[collectionId]
 * Remove a collection from an agent
 */
export async function DELETE(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id, collectionId } = await context.params;

    // Check agent ownership
    const agent = await prisma.agent.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }
    if (agent.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Delete the agent-collection link
    await prisma.agentCollection.deleteMany({
      where: { agentId: id, collectionId },
    });

    return NextResponse.json({
      success: true,
      data: { removed: true },
    });
  } catch (error) {
    console.error('Failed to remove collection from agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove collection' },
      { status: 500 }
    );
  }
}
