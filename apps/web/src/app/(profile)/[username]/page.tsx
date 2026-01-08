'use client';

import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

interface PublicAgent {
  id: string;
  uid: string;
  name: string;
  description: string | null;
  likeCount: number;
  toolCount: number;
}

interface PublicCollection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  toolCount: number;
  likeCount: number;
}

interface UserProfile {
  id: string;
  username: string;
  name: string;
  image: string | null;
  agents: PublicAgent[];
  collections: PublicCollection[];
}

export default function UserProfilePage(): React.ReactElement {
  const params = useParams();
  // Handle both /username and /@username patterns
  const rawUsername = params.username as string;
  const username = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch(`/api/public/users/${username}`);
      if (response.status === 404) {
        setError('not_found');
        return;
      }
      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
      } else {
        setError(data.error?.message || 'Failed to load profile');
      }
    } catch {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (error === 'not_found') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Icon icon="loader" className="w-8 h-8 animate-spin text-foreground-secondary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        ) : profile ? (
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
                      href={`/${username}/agents/${agent.uid}`}
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
                      href={`/${username}/collections/${collection.slug}`}
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
        ) : null}
      </main>
    </div>
  );
}
