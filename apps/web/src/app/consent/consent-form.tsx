'use client';

import { useState } from 'react';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  tools: { id: string; name: string; description: string | null }[];
}

export function ConsentForm({
  clientId,
  oauthQuery,
  clientName,
  clientDomain,
  scopes,
  collections,
  previous,
}: {
  clientId: string;
  oauthQuery: string;
  clientName: string;
  clientDomain: string | null;
  scopes: string[];
  collections: Collection[];
  previous: { collectionIds: string[]; toolIds: string[] } | null;
}) {
  const [selectedCollections, setSelectedCollections] = useState(
    () => new Set(previous?.collectionIds ?? [])
  );
  const [selectedTools, setSelectedTools] = useState(() => new Set(previous?.toolIds ?? []));
  const [execute, setExecute] = useState(scopes.includes('mcp:execute'));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  function toggleCollection(collection: Collection) {
    const next = new Set(selectedCollections);
    const tools = new Set(selectedTools);
    if (next.has(collection.id)) {
      next.delete(collection.id);
      for (const tool of collection.tools) tools.delete(tool.id);
    } else {
      next.add(collection.id);
      for (const tool of collection.tools) {
        // Sending mail requires an explicit tool-level choice, even when its account is selected.
        if (tool.name !== 'gmail_send') tools.add(tool.id);
      }
    }
    setSelectedCollections(next);
    setSelectedTools(tools);
  }

  async function complete(accept: boolean) {
    setBusy(true);
    setError('');
    try {
      if (accept) {
        const granted = await fetch('/api/oauth/tool-grants', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            clientId,
            collectionIds: [...selectedCollections],
            toolIds: [...selectedTools],
          }),
        });
        if (!granted.ok) throw new Error('Could not save your tool choices');
      }
      const allowedScopes = scopes.filter((scope) => scope !== 'mcp:execute' || execute);
      const response = await fetch('/api/auth/oauth2/consent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          accept,
          oauth_query: oauthQuery,
          ...(accept ? { scope: allowedScopes.join(' ') } : {}),
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.url) throw new Error('Authorization could not be completed');
      window.location.assign(body.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authorization failed');
      setBusy(false);
    }
  }

  const toolCount = selectedTools.size;
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:py-20">
      <div className="rounded-2xl border border-border bg-background-secondary p-6 shadow-xl sm:p-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          TPMJS · authorization
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Choose what {clientName} can use
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground-secondary">
          Your API keys stay in TPMJS. This application receives a renewable, revocable grant for
          the tools you choose.
        </p>
        {clientDomain && (
          <p className="mt-2 font-mono text-xs text-foreground-secondary">
            Application: {clientDomain}
          </p>
        )}

        <div className="mt-8 rounded-xl border border-border bg-background p-4">
          <h2 className="text-sm font-semibold">Permission</h2>
          <p className="mt-1 text-xs text-foreground-secondary">Search the selected tool catalog</p>
          {scopes.includes('mcp:execute') && (
            <div className="mt-4 flex items-start gap-3 border-t border-border pt-4">
              <input
                id="mcp-execute-scope"
                aria-label="Run selected tools"
                type="checkbox"
                checked={execute}
                onChange={(event) => setExecute(event.target.checked)}
                className="mt-1"
              />
              <span>
                <strong className="block text-sm">Run selected tools</strong>
                <span className="text-xs text-foreground-secondary">
                  Tool calls can act on external services using your stored keys.
                </span>
              </span>
            </div>
          )}
        </div>

        <div className="mt-7 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Collections</h2>
            <p className="mt-1 text-xs text-foreground-secondary">
              {selectedCollections.size} collections · {toolCount} tools selected
            </p>
          </div>
        </div>
        <div className="mt-3 max-h-[22rem] space-y-2 overflow-y-auto pr-1">
          {collections.map((collection) => (
            <section key={collection.id} className="rounded-xl border border-border bg-background">
              <div className="flex items-center gap-3 p-3">
                <input
                  aria-label={`Allow ${collection.name}`}
                  type="checkbox"
                  checked={selectedCollections.has(collection.id)}
                  onChange={() => toggleCollection(collection)}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{collection.name}</p>
                  <p className="text-xs text-foreground-secondary">
                    {collection.tools.length} tools
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded px-2 py-1 text-xs text-accent hover:bg-background-secondary"
                  onClick={() => setOpen(open === collection.id ? null : collection.id)}
                  aria-expanded={open === collection.id}
                >
                  Tools
                </button>
              </div>
              {open === collection.id && (
                <div className="max-h-56 space-y-2 overflow-y-auto border-t border-border p-3 pl-9">
                  {collection.tools.map((tool) => (
                    <label key={tool.id} className="flex items-start gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedTools.has(tool.id)}
                        disabled={!selectedCollections.has(collection.id)}
                        onChange={(event) => {
                          const next = new Set(selectedTools);
                          if (event.target.checked) next.add(tool.id);
                          else next.delete(tool.id);
                          setSelectedTools(next);
                        }}
                      />
                      <span>
                        <span className="font-medium">{tool.name}</span>
                        {tool.description && (
                          <span className="block text-foreground-secondary">
                            {tool.description}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </section>
          ))}
          {collections.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-5 text-sm text-foreground-secondary">
              Create a collection in TPMJS to make tools available.
            </p>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-5 text-sm text-error">
            {error}
          </p>
        )}
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => complete(true)}
            className="flex-1 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Authorizing…' : 'Authorize access'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => complete(false)}
            className="rounded-lg border border-border px-4 py-3 text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
        <p className="mt-5 text-xs leading-5 text-foreground-secondary">
          You can change this grant later in TPMJS. Removing a collection or key there immediately
          removes access to it.
        </p>
      </div>
    </main>
  );
}
