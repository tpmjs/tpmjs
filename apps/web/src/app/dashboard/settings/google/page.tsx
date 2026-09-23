'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

interface Tool {
  name: string;
  description: string;
  scope: string;
}
interface Connection {
  id: string;
  email: string;
  scopes: string[];
  updatedAt: string;
}

export default function GoogleSettingsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [selected, setSelected] = useState<string[]>([
    'drive_search',
    'drive_read',
    'gmail_search',
    'gmail_read',
  ]);
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/google/connections', { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not load Google accounts');
      const body = (await response.json()) as {
        connections: Connection[];
        tools: Tool[];
        configured: boolean;
      };
      setConnections(body.connections);
      setTools(body.tools);
      setConfigured(body.configured);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load Google accounts');
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function disconnect(id: string) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/google/connections', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error('Could not disconnect Google account');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not disconnect Google account');
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardLayout
      title="Google Workspace"
      subtitle="Connect Drive and Gmail to the tools you share with Bode or ChatGPT."
      showBackButton
      backUrl="/dashboard/settings/connected-apps"
    >
      <div className="mx-auto max-w-3xl space-y-5">
        <section className="rounded-2xl border border-border bg-surface p-6">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Your account · your scope
          </p>
          <h2 className="mt-2 text-xl font-semibold">Choose Google access</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-secondary">
            Link a Google account here, then choose which tools each connected app may use. Sending
            mail is a separate permission. TPMJS stores the renewable credential encrypted.
          </p>
          <div className="mt-5 space-y-2">
            {tools.map((tool) => (
              <label
                key={tool.name}
                className="flex gap-3 rounded-lg border border-border bg-background p-3"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.includes(tool.name)}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, tool.name]
                        : current.filter((name) => name !== tool.name)
                    )
                  }
                />
                <span>
                  <strong className="block text-sm">{tool.name.replaceAll('_', ' ')}</strong>
                  <span className="text-xs text-foreground-secondary">{tool.description}</span>
                </span>
              </label>
            ))}
          </div>
          <a
            href={`/api/google/start?${new URLSearchParams(selected.map((scope) => ['scope', scope])).toString()}`}
            aria-disabled={!configured || selected.length === 0}
            className={`mt-5 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white ${!configured || !selected.length ? 'pointer-events-none opacity-50' : ''}`}
          >
            Connect Google account
          </a>
          {!configured && (
            <p className="mt-3 text-sm text-foreground-secondary">
              Google OAuth setup is pending for TPMJS. An administrator must add the Google client
              credentials.
            </p>
          )}
        </section>
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error"
          >
            {error}
          </p>
        )}
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">Linked accounts</h2>
          {connections.length ? (
            <div className="mt-4 space-y-3">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-4"
                >
                  <div>
                    <strong className="text-sm">{connection.email}</strong>
                    <p className="mt-1 text-xs text-foreground-secondary">
                      {tools
                        .filter((tool) => connection.scopes.includes(tool.scope))
                        .map((tool) => tool.name.replaceAll('_', ' '))
                        .join(' · ') || 'No tools authorized'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => disconnect(connection.id)}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-error/50 disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-foreground-secondary">No Google account linked yet.</p>
          )}
          <p className="mt-4 text-xs text-foreground-secondary">
            After linking,{' '}
            <Link href="/dashboard/settings/connected-apps" className="text-primary underline">
              review connected app grants
            </Link>
            . A new app must explicitly receive the Google tools before it can use them.
          </p>
        </section>
      </div>
    </DashboardLayout>
  );
}
