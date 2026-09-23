import { prisma } from '@tpmjs/db';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { googleCollections } from '~/lib/google/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const [collections, google] = await Promise.all([
    prisma.collection.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        tools: {
          select: {
            tool: {
              select: {
                name: true,
                description: true,
                package: { select: { npmPackageName: true } },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    googleCollections(session.user.id),
  ]);
  return NextResponse.json(
    {
      collections: [
        ...collections.map((collection) => ({
          id: collection.id,
          name: collection.name,
          tools: collection.tools.map(({ tool }) => ({
            id: `${tool.package.npmPackageName}::${tool.name}`,
            name: tool.name,
            description: tool.description,
          })),
        })),
        ...google.map((collection) => ({
          id: collection.id,
          name: collection.name,
          tools: collection.tools.map((tool) => ({
            id: tool.id,
            name: tool.name,
            description: tool.description,
          })),
        })),
      ],
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
