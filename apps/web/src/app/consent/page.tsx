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
  searchParams: Promise<{ client_id?: string; scope?: string }>;
}) {
  const params = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    const query = new URLSearchParams();
    if (params.client_id) query.set('client_id', params.client_id);
    if (params.scope) query.set('scope', params.scope);
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/consent?${query}`)}`);
  }
  const client = params.client_id
    ? await prisma.oauthClient.findUnique({
        where: { clientId: params.client_id },
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
  const requestedScopes = new Set((params.scope ?? '').split(/\s+/).filter(Boolean));
  return (
    <ConsentForm
      clientId={client.clientId}
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
