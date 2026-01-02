import { prisma } from '@tpmjs/db';
import { AGENT_LIMITS, AddToolToAgentSchema } from '@tpmjs/types/agent';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/agents/[id]/tools
 * Add an individual tool to an agent
 */
export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = AddToolToAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check agent ownership
    const agent = await prisma.agent.findUnique({
      where: { id },
      select: { userId: true, _count: { select: { tools: true } } },
    });
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }
    if (agent.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Check tool limit
    if (agent._count.tools >= AGENT_LIMITS.MAX_TOOLS_PER_AGENT) {
      return NextResponse.json(
        { success: false, error: `Maximum ${AGENT_LIMITS.MAX_TOOLS_PER_AGENT} tools per agent` },
        { status: 400 }
      );
    }

    // Check tool exists
    const tool = await prisma.tool.findUnique({
      where: { id: parsed.data.toolId },
      select: {
        id: true,
        name: true,
        description: true,
        package: { select: { npmPackageName: true, category: true } },
      },
    });
    if (!tool) {
      return NextResponse.json({ success: false, error: 'Tool not found' }, { status: 404 });
    }

    // Check if already added
    const existing = await prisma.agentTool.findUnique({
      where: {
        agentId_toolId: { agentId: id, toolId: parsed.data.toolId },
      },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Tool already added to agent' },
        { status: 409 }
      );
    }

    // Get next position
    const maxPosition = await prisma.agentTool.aggregate({
      where: { agentId: id },
      _max: { position: true },
    });
    const position = parsed.data.position ?? (maxPosition._max.position ?? -1) + 1;

    const agentTool = await prisma.agentTool.create({
      data: {
        agentId: id,
        toolId: parsed.data.toolId,
        position,
      },
      include: {
        tool: {
          select: {
            id: true,
            name: true,
            description: true,
            package: { select: { npmPackageName: true, category: true } },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: agentTool.id,
          toolId: agentTool.toolId,
          position: agentTool.position,
          addedAt: agentTool.addedAt,
          tool: agentTool.tool,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to add tool to agent:', error);
    return NextResponse.json({ success: false, error: 'Failed to add tool' }, { status: 500 });
  }
}
