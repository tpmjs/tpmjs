import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const API_VERSION = '1.0.0';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    version: string;
    timestamp: string;
    requestId?: string;
  };
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/public/agents/[id]
 * Get a single public agent with its tools
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;

  try {
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
        tools: {
          include: {
            tool: {
              include: {
                package: {
                  select: {
                    id: true,
                    npmPackageName: true,
                    category: true,
                  },
                },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        collections: {
          include: {
            collection: {
              select: {
                id: true,
                name: true,
                description: true,
                isPublic: true,
                _count: { select: { tools: true } },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        _count: { select: { tools: true, collections: true } },
      },
    });

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Agent not found' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 404 }
      );
    }

    if (!agent.isPublic) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'This agent is not public' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: agent.id,
        uid: agent.uid,
        name: agent.name,
        description: agent.description,
        provider: agent.provider,
        modelId: agent.modelId,
        systemPrompt: agent.systemPrompt,
        temperature: agent.temperature,
        maxToolCallsPerTurn: agent.maxToolCallsPerTurn,
        likeCount: agent.likeCount,
        toolCount: agent._count.tools,
        collectionCount: agent._count.collections,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
        createdBy: agent.user,
        tools: agent.tools.map((at) => ({
          id: at.id,
          toolId: at.toolId,
          position: at.position,
          addedAt: at.addedAt,
          tool: {
            id: at.tool.id,
            name: at.tool.name,
            description: at.tool.description,
            likeCount: at.tool.likeCount,
            package: at.tool.package,
          },
        })),
        collections: agent.collections
          .filter((ac) => ac.collection.isPublic)
          .map((ac) => ({
            id: ac.id,
            collectionId: ac.collectionId,
            position: ac.position,
            addedAt: ac.addedAt,
            collection: {
              id: ac.collection.id,
              name: ac.collection.name,
              description: ac.collection.description,
              toolCount: ac.collection._count.tools,
            },
          })),
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] GET /api/public/agents/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch agent' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
