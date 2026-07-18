import { prisma } from '@tpmjs/db';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppHeader } from '~/components/AppHeader';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ username: string }>;
};

/**
 * Public user profile page — a server component so an unknown username (and
 * any garbage URL that falls through to this catch-all route) returns a real
 * HTTP 404, not a 200 with a client-rendered not-found shell.
 */
export default async function UserProfilePage({ params }: PageProps): Promise<React.ReactElement> {
  const { username: rawUsername } = await params;
  const decoded = decodeURIComponent(rawUsername);
  // Handle both /username and /@username patterns
  const username = decoded.startsWith('@') ? decoded.slice(1) : decoded;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      agents: {
        where: { isPublic: true },
        select: {
          id: true,
          uid: true,
          name: true,
          description: true,
          likeCount: true,
          _count: { select: { tools: true } },
        },
        orderBy: { likeCount: 'desc' },
        take: 20,
      },
      collections: {
        where: { isPublic: true },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          likeCount: true,
          _count: { select: { tools: true } },
        },
        orderBy: { likeCount: 'desc' },
        take: 20,
      },
    },
  });

  if (!user?.username) {
    notFound();
  }

  const profile = {
    username: user.username,
    name: user.name,
    image: user.image,
    agents: user.agents.map((a) => ({
      id: a.id,
      uid: a.uid,
      name: a.name,
      description: a.description,
      likeCount: a.likeCount,
      toolCount: a._count.tools,
    })),
    collections: user.collections.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      likeCount: c.likeCount,
      toolCount: c._count.tools,
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* User Header */}
          <div className="flex items-center gap-4">
            {profile.image ? (
              <img src={profile.image} alt={profile.name} className="w-20 h-20 rounded-full" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-foreground-secondary/20 flex items-center justify-center">
                <Icon icon="user" className="w-10 h-10 text-foreground-secondary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
              <p className="text-foreground-secondary">@{profile.username}</p>
            </div>
          </div>

          {/* Public Agents */}
          {profile.agents.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Public Agents</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {profile.agents.map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/${profile.username}/agents/${agent.uid}`}
                    className="block p-4 bg-surface border border-border rounded-lg hover:border-foreground-secondary transition-colors"
                  >
                    <h3 className="font-medium text-foreground">{agent.name}</h3>
                    {agent.description && (
                      <p className="text-sm text-foreground-secondary mt-1 line-clamp-2">
                        {agent.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-foreground-tertiary">
                      <span className="flex items-center gap-1">
                        <Icon icon="heart" className="w-3.5 h-3.5" />
                        {agent.likeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon icon="puzzle" className="w-3.5 h-3.5" />
                        {agent.toolCount} tools
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Public Collections */}
          {profile.collections.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Public Collections</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {profile.collections.map((collection) => (
                  <Link
                    key={collection.id}
                    href={`/${profile.username}/collections/${collection.slug}`}
                    className="block p-4 bg-surface border border-border rounded-lg hover:border-foreground-secondary transition-colors"
                  >
                    <h3 className="font-medium text-foreground">{collection.name}</h3>
                    {collection.description && (
                      <p className="text-sm text-foreground-secondary mt-1 line-clamp-2">
                        {collection.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-foreground-tertiary">
                      <span className="flex items-center gap-1">
                        <Icon icon="heart" className="w-3.5 h-3.5" />
                        {collection.likeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon icon="puzzle" className="w-3.5 h-3.5" />
                        {collection.toolCount} tools
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {profile.agents.length === 0 && profile.collections.length === 0 && (
            <div className="text-center py-12">
              <Icon icon="box" className="w-12 h-12 mx-auto text-foreground-secondary mb-4" />
              <p className="text-foreground-secondary">
                {profile.name} hasn&apos;t shared any public agents or collections yet.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
