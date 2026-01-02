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
 * GET /api/agents/[id]/tools
 * List tools attached to an agent
 */
export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const { id } = await context.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      select: { userId: true, isPublic: true },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    const isOwner = session?.user?.id === agent.userId;
    if (!isOwner && !agent.isPublic) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const tools = await prisma.agentTool.findMany({
      where: { agentId: id },
      include: {
        tool: {
          select: {
            id: true,
            name: true,
            description: true,
            package: {
              select: {
                npmPackageName: true,
              },
            },
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: tools.map((at) => ({
        id: at.id,
        toolId: at.toolId,
        position: at.position,
        addedAt: at.addedAt,
        tool: {
          id: at.tool.id,
          name: at.tool.name,
          description: at.tool.description,
          npmPackageName: at.tool.package.npmPackageName,
        },
      })),
    });
  } catch (error) {
    console.error('Failed to get agent tools:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get agent tools' },
      { status: 500 }
    );
  }
}

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
