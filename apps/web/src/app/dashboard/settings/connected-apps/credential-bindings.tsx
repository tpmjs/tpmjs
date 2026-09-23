'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type Binding = { packageName: string; envName: string; keyName: string };
type Credential = { name: string; description: string; required: boolean };
type Collection = {
  id: string;
  name: string;
  bindings: Binding[];
  packages: { name: string; env: Credential[] }[];
};
type Key = { keyName: string; keyHint: string | null };

export function CredentialBindings() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [keys, setKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/oauth/credential-bindings', { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not load credential bindings');
      const data = (await response.json()) as { collections: Collection[]; keys: Key[] };
      setCollections(data.collections);
      setKeys(data.keys);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load credentials');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function change(
    collectionId: string,
    packageName: string,
    envName: string,
    keyName: string
  ) {
    const id = `${collectionId}:${packageName}:${envName}`;
    setBusy(id);
    setError('');
    try {
      const response = await fetch('/api/oauth/credential-bindings', {
        method: keyName ? 'POST' : 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          collectionId,
          packageName,
          envName,
          ...(keyName ? { keyName } : {}),
        }),
      });
      if (!response.ok) throw new Error('Could not save credential choice');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save credential choice');
    } finally {
      setBusy(null);
    }
  }

  const configurable = collections.filter((collection) =>
    collection.packages.some((item) => item.env.length)
  );
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Credential bindings
          </p>
          <h2 className="mt-2 text-xl font-semibold">Choose the key each collection can use</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
            A tool receives a vaulted key only after you bind it to that tool’s declared credential.
            Other keys stay out of the execution environment.
          </p>
        </div>
        <Link
          className="rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/40"
          href="/dashboard/settings/api-keys"
        >
          Key vault
        </Link>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-error">
          {error}
        </p>
      )}
      {loading ? (
        <p className="mt-5 text-sm text-foreground-secondary">Loading…</p>
      ) : configurable.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-foreground-secondary">
          No collections currently declare API credentials.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {configurable.map((collection) => (
            <div key={collection.id} className="rounded-xl border border-border p-4">
              <h3 className="font-medium">{collection.name}</h3>
              <div className="mt-3 space-y-4">
                {collection.packages
                  .filter((item) => item.env.length)
                  .map((item) => (
                    <div key={item.name}>
                      <p className="font-mono text-xs text-foreground-secondary">{item.name}</p>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        {item.env.map((credential) => {
                          const id = `${collection.id}:${item.name}:${credential.name}`;
                          const selected =
                            collection.bindings.find(
                              (binding) =>
                                binding.packageName === item.name &&
                                binding.envName === credential.name
                            )?.keyName ?? '';
                          return (
                            <label
                              key={credential.name}
                              className="block rounded-lg bg-background p-3"
                            >
                              <span className="block text-sm font-medium">{credential.name}</span>
                              <span className="mt-1 block text-xs text-foreground-secondary">
                                {credential.description}
                              </span>
                              <select
                                className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                                value={selected}
                                disabled={busy === id}
                                onChange={(event) =>
                                  void change(
                                    collection.id,
                                    item.name,
                                    credential.name,
                                    event.target.value
                                  )
                                }
                              >
                                <option value="">No vaulted key</option>
                                {keys.map((key) => (
                                  <option key={key.keyName} value={key.keyName}>
                                    {key.keyName}
                                    {key.keyHint ? ` ···${key.keyHint}` : ''}
                                  </option>
                                ))}
                              </select>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
