'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';
import { CredentialBindings } from './credential-bindings';

interface Grant {
  clientId: string;
  collectionIds: string[];
  toolIds: string[];
  updatedAt: string;
  client: { name: string | null; uri: string | null; disabled: boolean | null };
}

function domain(uri: string | null): string | null {
  if (!uri) return null;
  try {
    return new URL(uri).hostname;
  } catch {
    return null;
  }
}

export default function ConnectedAppsPage() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/oauth/tool-grants', { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not load connected apps');
      const data = (await response.json()) as { grants: Grant[] };
      setGrants(data.grants);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load connected apps');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function revoke(clientId: string) {
    setBusy(clientId);
    setError('');
    try {
      const response = await fetch('/api/oauth/tool-grants', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      if (!response.ok) throw new Error('Could not revoke this app');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not revoke this app');
    } finally {
      setBusy(null);
    }
  }

  return (
    <DashboardLayout
      title="Connected apps"
      subtitle="Control which applications can search and run tools with your TPMJS account."
      showBackButton
      backUrl="/dashboard"
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-surface p-6">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Your tool boundary
          </p>
          <h2 className="mt-2 text-xl font-semibold">Your keys stay here</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
            Connected applications receive OAuth grants. TPMJS checks each token and your current
            collection choices before running a tool, and passes only that tool’s declared
            credentials.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link
              className="rounded-lg border border-border bg-surface px-3 py-2 hover:border-primary/40"
              href="/dashboard/settings/api-keys"
            >
              Manage provider keys
            </Link>
            <Link
              className="rounded-lg border border-border bg-surface px-3 py-2 hover:border-primary/40"
              href="/dashboard/collections"
            >
              Manage collections
            </Link>
          </div>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error"
          >
            {error}
          </p>
        )}
        {loading ? (
          <p className="text-sm text-foreground-secondary">Loading connections…</p>
        ) : grants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <h2 className="font-semibold">No apps connected</h2>
            <p className="mt-2 text-sm text-foreground-secondary">
              When you authorize Bode, ChatGPT, or another app, its grant will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {grants.map((grant) => (
              <section
                key={grant.clientId}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{grant.client.name || 'Application'}</p>
                    <p className="mt-1 font-mono text-xs text-foreground-secondary">
                      {domain(grant.client.uri) || grant.clientId}
                    </p>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-foreground-secondary">
                    {grant.client.disabled ? 'Disabled' : 'Active'}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-background p-3">
                    <strong className="block text-xl">{grant.collectionIds.length}</strong>
                    <span className="text-xs text-foreground-secondary">collections</span>
                  </div>
                  <div className="rounded-lg bg-background p-3">
                    <strong className="block text-xl">{grant.toolIds.length}</strong>
                    <span className="text-xs text-foreground-secondary">tools</span>
                  </div>
                  <div className="rounded-lg bg-background p-3">
                    <strong className="block text-sm">
                      {new Date(grant.updatedAt).toLocaleDateString()}
                    </strong>
                    <span className="text-xs text-foreground-secondary">last changed</span>
                  </div>
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    disabled={busy === grant.clientId}
                    onClick={() => void revoke(grant.clientId)}
                    className="rounded-lg border border-error/30 px-3 py-2 text-sm font-medium text-error hover:bg-error/10 disabled:opacity-50"
                  >
                    {busy === grant.clientId ? 'Revoking…' : 'Revoke access'}
                  </button>
                </div>
              </section>
            ))}
          </div>
        )}
        <p className="text-xs leading-5 text-foreground-secondary">
          Revoking a grant removes its active and refresh tokens. To change its collections or
          scope, reconnect the application and choose a new grant.
        </p>
        <CredentialBindings />
      </div>
    </DashboardLayout>
  );
}
