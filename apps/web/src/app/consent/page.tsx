import { prisma } from '@tpmjs/db';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '~/lib/auth';
import { ConsentForm } from './consent-form';

export const dynamic = 'force-dynamic';

function domain(uri: string | null): string | null {
  if (!uri) return null;
  try {
    return new URL(uri).hostname;
  } catch {
    return null;
  }
}

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const signedQuery = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) signedQuery.append(name, item);
    } else if (value !== undefined) {
      signedQuery.set(name, value);
    }
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/consent?${signedQuery}`)}`);
  }
  const clientId = signedQuery.get('client_id');
  const client = clientId
    ? await prisma.oauthClient.findUnique({
        where: { clientId },
        select: { clientId: true, name: true, uri: true, disabled: true },
      })
    : null;
  if (!client || client.disabled) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">Application unavailable</h1>
        <p className="mt-3 text-foreground-secondary">
          The authorization request could not be verified.
        </p>
      </main>
    );
  }
  const [collections, previous] = await Promise.all([
    prisma.collection.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        description: true,
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
    prisma.oAuthToolGrant.findUnique({
      where: { userId_clientId: { userId: session.user.id, clientId: client.clientId } },
      select: { collectionIds: true, toolIds: true },
    }),
  ]);
  const requestedScopes = new Set((signedQuery.get('scope') ?? '').split(/\s+/).filter(Boolean));
  return (
    <ConsentForm
      clientId={client.clientId}
      oauthQuery={signedQuery.toString()}
      clientName={client.name || 'An application'}
      clientDomain={domain(client.uri)}
      scopes={[...requestedScopes]}
      collections={collections.map((collection) => ({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        tools: collection.tools.map(({ tool }) => ({
          id: `${tool.package.npmPackageName}::${tool.name}`,
          name: tool.name,
          description: tool.description,
        })),
      }))}
      previous={previous}
    />
  );
}
