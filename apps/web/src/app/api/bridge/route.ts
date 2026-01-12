import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Bridge Registration & Status API
 *
 * POST: Register bridge tools
 * GET: Get bridge status and pending tool calls
 * DELETE: Disconnect bridge
 */

// Validate API key and get user
async function validateApiKey(token: string | null | undefined) {
  if (!token) return null;

  // For now, use session-based auth
  // In production, you'd want proper API key validation with encrypted keys
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  return session?.user || null;
}

// POST: Register bridge and its tools
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    const user = await validateApiKey(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, tools, callId, result, error: toolError } = body;

    if (type === 'register') {
      // Register bridge and tools
      await prisma.bridgeConnection.upsert({
        where: { userId: user.id },
        update: {
          status: 'connected',
          tools: tools || [],
          lastSeen: new Date(),
          clientVersion: body.clientVersion,
          clientOS: body.clientOS,
        },
        create: {
          userId: user.id,
          status: 'connected',
          tools: tools || [],
          lastSeen: new Date(),
          clientVersion: body.clientVersion,
          clientOS: body.clientOS,
        },
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
        where: { userId: user.id },
        data: { lastSeen: new Date() },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Bridge POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// GET: Get pending tool calls (polling)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    const user = await validateApiKey(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pending tool calls for this user
    const pendingCalls = Array.from(pendingToolCalls.entries())
      .filter(([key]) => key.startsWith(`${user.id}:`))
      .map(([key, value]) => {
        pendingToolCalls.delete(key); // Remove after returning
        return value;
      });

    // Update last seen
    await prisma.bridgeConnection.update({
      where: { userId: user.id },
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
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    const user = await validateApiKey(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.bridgeConnection.update({
      where: { userId: user.id },
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
