import { prisma } from '@tpmjs/db';
import { NextResponse } from 'next/server';
import { API_KEY_SCOPES } from '~/lib/api-keys';
import { requireAuth } from '~/lib/api-keys/middleware';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/memories/:id - Get a single memory
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { auth, errorResponse } = await requireAuth(API_KEY_SCOPES.MEMORY_READ);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  const memory = await prisma.memory.findFirst({
    where: { id, userId: auth!.userId! },
    select: {
      id: true,
      content: true,
      summary: true,
      namespace: true,
      tags: true,
      source: true,
      sourceAgent: true,
      sourceContext: true,
      contentSizeBytes: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!memory) {
    return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: memory });
}

/**
 * DELETE /api/memories/:id - Delete a memory
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { auth, errorResponse } = await requireAuth(API_KEY_SCOPES.MEMORY_WRITE);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  // Verify ownership before deleting
  const memory = await prisma.memory.findFirst({
    where: { id, userId: auth!.userId! },
    select: { id: true },
  });

  if (!memory) {
    return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
  }

  await prisma.memory.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
