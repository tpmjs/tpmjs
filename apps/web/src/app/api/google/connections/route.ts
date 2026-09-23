import { prisma } from '@tpmjs/db';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '~/lib/auth';
import { GOOGLE_TOOLS } from '~/lib/google/connection';

export const runtime = 'nodejs';

async function userId() {
  return (await auth.api.getSession({ headers: await headers() }))?.user?.id;
}

export async function GET() {
  const user = await userId();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const connections = await prisma.googleConnection.findMany({
    where: { userId: user },
    select: { id: true, email: true, scopes: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json({
    connections,
    tools: GOOGLE_TOOLS.map(({ name, description, scope }) => ({ name, description, scope })),
    configured: Boolean(
      process.env.GOOGLE_WORKSPACE_CLIENT_ID && process.env.GOOGLE_WORKSPACE_CLIENT_SECRET
    ),
  });
}

export async function DELETE(request: Request) {
  const user = await userId();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const parsed = z
    .object({ id: z.string().min(1) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid connection' }, { status: 400 });
  const connection = await prisma.googleConnection.findFirst({
    where: { id: parsed.data.id, userId: user },
  });
  if (!connection) return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
  await prisma.googleConnection.delete({ where: { id: connection.id } });
  return NextResponse.json({ disconnected: true });
}
