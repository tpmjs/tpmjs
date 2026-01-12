import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, hasScope } from '~/lib/api-keys/middleware';
import { trackUsage } from '~/lib/api-keys/usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Bridge Registration & Status API
 *
 * POST: Register bridge tools
 * GET: Get bridge status and pending tool calls
 * DELETE: Disconnect bridge
 *
 * Authentication: Supports both session auth and TPMJS API key auth.
 * Requires 'bridge:connect' scope for API key access.
 */

// POST: Register bridge and its tools
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let authResult: Awaited<ReturnType<typeof authenticateRequest>> | null = null;

  try {
    // Authenticate request (supports both session and API key)
    authResult = await authenticateRequest();

    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check scope for API key auth
    if (authResult.authenticated && !authResult.isSessionAuth) {
      if (!hasScope(authResult, 'bridge:connect')) {
        return NextResponse.json(
          { error: 'API key does not have bridge:connect scope' },
          { status: 403 }
        );
      }
    }

    // Get user for bridge operations
    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, tools, callId, result, error: toolError } = body;

    if (type === 'register') {
      // Register bridge and tools
      await prisma.bridgeConnection.upsert({
        where: { userId },
        update: {
          status: 'connected',
          tools: tools || [],
          lastSeen: new Date(),
          clientVersion: body.clientVersion,
          clientOS: body.clientOS,
        },
        create: {
          userId,
          status: 'connected',
          tools: tools || [],
          lastSeen: new Date(),
          clientVersion: body.clientVersion,
          clientOS: body.clientOS,
        },
      });

      // Track usage
      trackUsage({
        apiKeyId: authResult?.apiKeyId ?? undefined,
        userId,
        endpoint: '/api/bridge',
        method: 'POST',
        statusCode: 200,
        latencyMs: Date.now() - startTime,
        resourceType: 'bridge',
      });

      return NextResponse.json({
        success: true,
        message: `Registered ${tools?.length || 0} tools`,
      });
    }

    if (type === 'tool_result') {
      // Store tool result for polling
      // We use a simple in-memory store for now
      // In production, use Redis or similar
      const key = `bridge_result:${callId}`;
      pendingResults.set(key, { result, error: toolError, timestamp: Date.now() });

      return NextResponse.json({ success: true });
    }

    if (type === 'heartbeat') {
      // Update last seen
      await prisma.bridgeConnection.update({
        where: { userId },
        data: { lastSeen: new Date() },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Bridge POST error:', error);

    // Track error
    if (authResult?.userId) {
      trackUsage({
        apiKeyId: authResult?.apiKeyId ?? undefined,
        userId: authResult.userId,
        endpoint: '/api/bridge',
        method: 'POST',
        statusCode: 500,
        latencyMs: Date.now() - startTime,
        resourceType: 'bridge',
        errorCode: 'INTERNAL_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Internal error',
      });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// GET: Get pending tool calls (polling)
export async function GET(_request: NextRequest) {
  try {
    // Authenticate request (supports both session and API key)
    const authResult = await authenticateRequest();

    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check scope for API key auth
    if (!authResult.isSessionAuth && !hasScope(authResult, 'bridge:connect')) {
      return NextResponse.json(
        { error: 'API key does not have bridge:connect scope' },
        { status: 403 }
      );
    }

    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pending tool calls for this user
    const pendingCalls = Array.from(pendingToolCalls.entries())
      .filter(([key]) => key.startsWith(`${userId}:`))
      .map(([key, value]) => {
        pendingToolCalls.delete(key); // Remove after returning
        return value;
      });

    // Update last seen
    await prisma.bridgeConnection.update({
      where: { userId },
      data: { lastSeen: new Date() },
    });

    return NextResponse.json({
      success: true,
      calls: pendingCalls,
    });
  } catch (error) {
    console.error('Bridge GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// DELETE: Disconnect bridge
export async function DELETE(_request: NextRequest) {
  try {
    // Authenticate request (supports both session and API key)
    const authResult = await authenticateRequest();

    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check scope for API key auth
    if (!authResult.isSessionAuth && !hasScope(authResult, 'bridge:connect')) {
      return NextResponse.json(
        { error: 'API key does not have bridge:connect scope' },
        { status: 403 }
      );
    }

    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.bridgeConnection.update({
      where: { userId },
      data: { status: 'disconnected' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bridge DELETE error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// In-memory stores for tool calls and results
// In production, use Redis or a proper message queue
const pendingToolCalls = new Map<
  string,
  {
    callId: string;
    serverId: string;
    toolName: string;
    args: Record<string, unknown>;
    timestamp: number;
  }
>();

const pendingResults = new Map<
  string,
  {
    result?: unknown;
    error?: { code: string; message: string };
    timestamp: number;
  }
>();

// Helper function to queue a tool call for a user's bridge
export function queueBridgeToolCall(
  userId: string,
  callId: string,
  serverId: string,
  toolName: string,
  args: Record<string, unknown>
): void {
  const key = `${userId}:${callId}`;
  pendingToolCalls.set(key, {
    callId,
    serverId,
    toolName,
    args,
    timestamp: Date.now(),
  });
}

// Helper function to wait for a tool result
export async function waitForBridgeResult(
  callId: string,
  timeoutMs: number = 300000 // 5 minutes
): Promise<{ result?: unknown; error?: { code: string; message: string } }> {
  const key = `bridge_result:${callId}`;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const result = pendingResults.get(key);
    if (result) {
      pendingResults.delete(key);
      return result;
    }
    // Wait 100ms before checking again
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { error: { code: 'TIMEOUT', message: 'Bridge tool call timed out' } };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes

  for (const [key, value] of pendingToolCalls.entries()) {
    if (now - value.timestamp > maxAge) {
      pendingToolCalls.delete(key);
    }
  }

  for (const [key, value] of pendingResults.entries()) {
    if (now - value.timestamp > maxAge) {
      pendingResults.delete(key);
    }
  }
}, 60000); // Run every minute
