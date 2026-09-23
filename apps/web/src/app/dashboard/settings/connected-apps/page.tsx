'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';
import { CredentialBindings } from './credential-bindings';
import { type GrantCollection, GrantEditor } from './grant-editor';

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
  const [collections, setCollections] = useState<GrantCollection[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [suggestedTool, setSuggestedTool] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const [response, catalogResponse] = await Promise.all([
        fetch('/api/oauth/tool-grants', { cache: 'no-store' }),
        fetch('/api/oauth/tool-catalog', { cache: 'no-store' }),
      ]);
      if (!response.ok || !catalogResponse.ok) throw new Error('Could not load connected apps');
      const data = (await response.json()) as { grants: Grant[] };
      const catalog = (await catalogResponse.json()) as { collections: GrantCollection[] };
      setGrants(data.grants);
      setCollections(catalog.collections);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load connected apps');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const params = new URLSearchParams(window.location.search);
    setEditing(params.get('client'));
    setSuggestedTool(params.get('tool'));
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
              href="/dashboard/settings/google"
            >
              Connect Google Drive & Gmail
            </Link>
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
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            ChatGPT and other MCP apps
          </p>
          <h2 className="mt-2 text-xl font-semibold">Take your tools with you</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
            Add this MCP server URL as a custom connector in ChatGPT. Sign in to TPMJS when
            prompted, then choose exactly which collections and tools it may search or run. Your
            provider keys stay in TPMJS.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
              https://tpmjs.com/api/mcp/connected/http
            </code>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText('https://tpmjs.com/api/mcp/connected/http');
                  setCopied(true);
                } catch {
                  setError('Could not copy the MCP URL');
                }
              }}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {copied ? 'Copied' : 'Copy MCP URL'}
            </button>
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
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(editing === grant.clientId ? null : grant.clientId)}
                    className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-background"
                    aria-expanded={editing === grant.clientId}
                  >
                    {editing === grant.clientId ? 'Close tools' : 'Change tools'}
                  </button>
                  <button
                    type="button"
                    disabled={busy === grant.clientId}
                    onClick={() => void revoke(grant.clientId)}
                    className="rounded-lg border border-error/30 px-3 py-2 text-sm font-medium text-error hover:bg-error/10 disabled:opacity-50"
                  >
                    {busy === grant.clientId ? 'Revoking…' : 'Revoke access'}
                  </button>
                </div>
                {editing === grant.clientId && (
                  <GrantEditor
                    clientId={grant.clientId}
                    initialCollections={grant.collectionIds}
                    initialTools={grant.toolIds}
                    suggestedToolId={suggestedTool}
                    collections={collections}
                    onSaved={async () => {
                      await load();
                      setEditing(null);
                    }}
                    onCancel={() => setEditing(null)}
                  />
                )}
              </section>
            ))}
          </div>
        )}
        <p className="text-xs leading-5 text-foreground-secondary">
          Changing tools updates the grant immediately. Revoking access removes the app’s active and
          refresh tokens; reconnect the app to change its OAuth scopes.
        </p>
        <CredentialBindings />
      </div>
    </DashboardLayout>
  );
}
