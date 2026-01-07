import { prisma } from '@tpmjs/db';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { logActivity } from '~/lib/activity';
import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string; toolId: string }>;
};

/**
 * DELETE /api/agents/[id]/tools/[toolId]
 * Remove an individual tool from an agent
 */
export async function DELETE(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id, toolId } = await context.params;

    // Check agent ownership and get agent name for activity log
    const agent = await prisma.agent.findUnique({
      where: { id },
      select: { userId: true, name: true },
    });
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }
    if (agent.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Get tool name for activity log
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
      select: { name: true },
    });

    // Delete the agent-tool link
    await prisma.agentTool.deleteMany({
      where: { agentId: id, toolId },
    });

    // Log activity (fire-and-forget)
    logActivity({
      userId: session.user.id,
      type: 'AGENT_TOOL_REMOVED',
      targetName: agent.name,
      targetType: 'agent',
      agentId: id,
      toolId,
      metadata: tool ? { toolName: tool.name } : undefined,
    });

    return NextResponse.json({
      success: true,
      data: { removed: true },
    });
  } catch (error) {
    console.error('Failed to remove tool from agent:', error);
    return NextResponse.json({ success: false, error: 'Failed to remove tool' }, { status: 500 });
  }
}
