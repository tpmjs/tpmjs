import { prisma } from '@tpmjs/db';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/user/bridge - Get current user's bridge status
 */
export async function GET() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bridge = await prisma.bridgeConnection.findUnique({
      where: { userId: session.user.id },
    });

    if (!bridge) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'never_connected',
          tools: [],
          lastSeen: null,
        },
      });
    }

    // Check if bridge is stale (not seen in 2 minutes)
    const isStale = bridge.lastSeen ? Date.now() - bridge.lastSeen.getTime() > 2 * 60 * 1000 : true;

    const status = isStale && bridge.status === 'connected' ? 'stale' : bridge.status;

    // Parse tools from JSON
    const tools =
      (bridge.tools as Array<{
        serverId: string;
        serverName: string;
        name: string;
        description?: string;
      }>) || [];

    // Group tools by server
    const servers: Record<string, { name: string; tools: string[] }> = {};
    for (const tool of tools) {
      const server = servers[tool.serverId] ?? {
        name: tool.serverName || tool.serverId,
        tools: [],
      };
      servers[tool.serverId] = server;
      server.tools.push(tool.name);
    }

    return NextResponse.json({
      success: true,
      data: {
        status,
        lastSeen: bridge.lastSeen?.toISOString() || null,
        clientVersion: bridge.clientVersion,
        clientOS: bridge.clientOS,
        toolCount: tools.length,
        servers: Object.entries(servers).map(([id, data]) => ({
          id,
          name: data.name,
          toolCount: data.tools.length,
          tools: data.tools,
        })),
      },
    });
  } catch (error) {
    console.error('Failed to get bridge status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
