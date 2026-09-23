import { prisma } from '@tpmjs/db';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '~/lib/auth';
import { googleCollections } from '~/lib/google/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const grantSchema = z.object({
  clientId: z.string().min(1).max(256),
  collectionIds: z.array(z.string().min(1)).max(100),
  toolIds: z.array(z.string().min(1).max(512)).max(1000),
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const grants = await prisma.oAuthToolGrant.findMany({
    where: { userId: session.user.id },
    select: {
      clientId: true,
      collectionIds: true,
      toolIds: true,
      updatedAt: true,
      client: { select: { name: true, uri: true, disabled: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json({ grants });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const parsed = grantSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid grant' }, { status: 400 });
  const { clientId, collectionIds, toolIds } = parsed.data;
  const client = await prisma.oauthClient.findUnique({
    where: { clientId },
    select: { disabled: true },
  });
  if (!client || client.disabled)
    return NextResponse.json({ error: 'Client unavailable' }, { status: 404 });
  const uniqueCollections = [...new Set(collectionIds)];
  const uniqueTools = [...new Set(toolIds)];
  const collections = await prisma.collection.findMany({
    where: { id: { in: uniqueCollections }, userId: session.user.id },
    select: {
      id: true,
      tools: {
        select: { tool: { select: { name: true, package: { select: { npmPackageName: true } } } } },
      },
    },
  });
  const google = await googleCollections(session.user.id);
  const selectedGoogle = google.filter((collection) => uniqueCollections.includes(collection.id));
  if (collections.length + selectedGoogle.length !== uniqueCollections.length) {
    return NextResponse.json({ error: 'Collection not owned by this account' }, { status: 403 });
  }
  const available = new Set([
    ...selectedGoogle.flatMap((collection) => collection.tools.map((tool) => tool.id)),
    ...collections.flatMap(({ tools }) =>
      tools.map(({ tool }) => `${tool.package.npmPackageName}::${tool.name}`)
    ),
  ]);
  if (uniqueTools.some((toolId) => !available.has(toolId))) {
    return NextResponse.json({ error: 'Tool outside selected collections' }, { status: 403 });
  }
  await prisma.oAuthToolGrant.upsert({
    where: { userId_clientId: { userId: session.user.id, clientId } },
    create: {
      userId: session.user.id,
      clientId,
      collectionIds: uniqueCollections,
      toolIds: uniqueTools,
    },
    update: { collectionIds: uniqueCollections, toolIds: uniqueTools },
  });
  return NextResponse.json({ saved: true });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const parsed = z
    .object({ clientId: z.string().min(1).max(256) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid client' }, { status: 400 });
  const where = { userId: session.user.id, clientId: parsed.data.clientId };
  await prisma.$transaction([
    prisma.oAuthToolGrant.deleteMany({ where }),
    prisma.oauthAccessToken.deleteMany({ where }),
    prisma.oauthRefreshToken.deleteMany({ where }),
    prisma.oauthConsent.deleteMany({ where }),
  ]);
  return NextResponse.json({ revoked: true });
}
