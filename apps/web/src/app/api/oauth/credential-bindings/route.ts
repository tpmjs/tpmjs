import { prisma } from '@tpmjs/db';
import type { TpmjsEnv } from '@tpmjs/types/tpmjs';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const inputSchema = z.object({
  collectionId: z.string().min(1),
  packageName: z.string().min(1).max(214),
  envName: z.string().min(1).max(100),
  keyName: z.string().min(1).max(100),
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const [collections, keys] = await Promise.all([
    prisma.collection.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        credentialBindings: { select: { packageName: true, envName: true, keyName: true } },
        tools: {
          select: {
            tool: { select: { package: { select: { npmPackageName: true, env: true } } } },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.userApiKey.findMany({
      where: { userId: session.user.id },
      select: { keyName: true, keyHint: true },
    }),
  ]);
  return NextResponse.json({
    keys,
    collections: collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      bindings: collection.credentialBindings,
      packages: [
        ...new Map(
          collection.tools.map(({ tool }) => [
            tool.package.npmPackageName,
            {
              name: tool.package.npmPackageName,
              env: Array.isArray(tool.package.env)
                ? (tool.package.env as TpmjsEnv[]).map(({ name, description, required }) => ({
                    name,
                    description,
                    required,
                  }))
                : [],
            },
          ])
        ).values(),
      ],
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid binding' }, { status: 400 });
  const { collectionId, packageName, envName, keyName } = parsed.data;
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId: session.user.id },
    select: {
      tools: {
        select: { tool: { select: { package: { select: { npmPackageName: true, env: true } } } } },
      },
    },
  });
  if (!collection) return NextResponse.json({ error: 'Collection unavailable' }, { status: 404 });
  const packageInfo = collection.tools.find(
    ({ tool }) => tool.package.npmPackageName === packageName
  )?.tool.package;
  const declared =
    Array.isArray(packageInfo?.env) &&
    (packageInfo.env as TpmjsEnv[]).some((item) => item?.name === envName);
  if (!declared)
    return NextResponse.json(
      { error: 'Package does not declare this credential' },
      { status: 403 }
    );
  const key = await prisma.userApiKey.findUnique({
    where: { userId_keyName: { userId: session.user.id, keyName } },
    select: { id: true },
  });
  if (!key) return NextResponse.json({ error: 'Key unavailable' }, { status: 404 });
  await prisma.collectionCredentialBinding.upsert({
    where: { collectionId_packageName_envName: { collectionId, packageName, envName } },
    create: { userId: session.user.id, collectionId, packageName, envName, keyName },
    update: { keyName },
  });
  return NextResponse.json({ saved: true });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const parsed = inputSchema
    .omit({ keyName: true })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid binding' }, { status: 400 });
  await prisma.collectionCredentialBinding.deleteMany({
    where: { ...parsed.data, userId: session.user.id },
  });
  return NextResponse.json({ removed: true });
}
