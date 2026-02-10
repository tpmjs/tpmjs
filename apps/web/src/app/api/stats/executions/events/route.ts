import type { Prisma } from '@prisma/client';
import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { API_KEY_SCOPES } from '~/lib/api-keys';
import { authenticateRequest, hasScope } from '~/lib/api-keys/middleware';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/stats/executions/events
 * Query execution events with filtering and pagination.
 *
 * Query params:
 * - eventType: filter by event type (tool_call, agent_run, etc.)
 * - source: filter by source (mcp_http, agent_chat, etc.)
 * - toolId: filter by tool ID
 * - collectionId: filter by collection ID
 * - agentId: filter by agent ID
 * - limit: max results (default 50, max 100)
 * - cursor: ISO timestamp for cursor-based pagination (returns events before this time)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Authenticate - require session or API key with usage:read scope
  const authResult = await authenticateRequest();

  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!authResult.isSessionAuth && !hasScope(authResult, API_KEY_SCOPES.USAGE_READ)) {
    return NextResponse.json({ error: 'API key does not have usage:read scope' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const eventType = searchParams.get('eventType');
  const source = searchParams.get('source');
  const toolId = searchParams.get('toolId');
  const collectionId = searchParams.get('collectionId');
  const agentId = searchParams.get('agentId');
  const cursor = searchParams.get('cursor');
  const limit = Math.min(Number.parseInt(searchParams.get('limit') || '50', 10), 100);

  try {
    const where: Prisma.ExecutionEventWhereInput = {
      // Scope to the authenticated user's events
      userId: authResult.userId ?? undefined,
    };

    if (eventType) where.eventType = eventType;
    if (source) where.source = source;
    if (toolId) where.toolId = toolId;
    if (collectionId) where.collectionId = collectionId;
    if (agentId) where.agentId = agentId;
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    const events = await prisma.executionEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = events.length > limit;
    const paginatedEvents = hasMore ? events.slice(0, limit) : events;

    return NextResponse.json({
      success: true,
      data: paginatedEvents,
      pagination: {
        limit,
        hasMore,
        nextCursor:
          hasMore && paginatedEvents.length > 0
            ? paginatedEvents[paginatedEvents.length - 1]!.createdAt.toISOString()
            : null,
      },
    });
  } catch (error) {
    console.error('[API Error] GET /api/stats/executions/events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch execution events' },
      { status: 500 }
    );
  }
}
