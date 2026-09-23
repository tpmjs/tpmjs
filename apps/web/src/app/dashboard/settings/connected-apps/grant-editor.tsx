'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Checkbox } from '@tpmjs/ui/Checkbox/Checkbox';
import { useState } from 'react';

export interface GrantCollection {
  id: string;
  name: string;
  tools: { id: string; name: string; description: string | null }[];
}

export function GrantEditor({
  clientId,
  initialCollections,
  initialTools,
  suggestedToolId,
  collections,
  onSaved,
  onCancel,
}: {
  clientId: string;
  initialCollections: string[];
  initialTools: string[];
  suggestedToolId: string | null;
  collections: GrantCollection[];
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) {
  const [selectedCollections, setSelectedCollections] = useState(() => new Set(initialCollections));
  const [selectedTools, setSelectedTools] = useState(() => new Set(initialTools));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function toggleCollection(collection: GrantCollection) {
    const nextCollections = new Set(selectedCollections);
    const nextTools = new Set(selectedTools);
    if (nextCollections.has(collection.id)) {
      nextCollections.delete(collection.id);
      for (const tool of collection.tools) nextTools.delete(tool.id);
    } else {
      nextCollections.add(collection.id);
      for (const tool of collection.tools) {
        if (tool.name !== 'gmail_send') nextTools.add(tool.id);
      }
    }
    setSelectedCollections(nextCollections);
    setSelectedTools(nextTools);
  }

  async function save() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/oauth/tool-grants', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clientId,
          collectionIds: [...selectedCollections],
          toolIds: [...selectedTools],
        }),
      });
      if (!response.ok) throw new Error('Could not save tool access');
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save tool access');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 border-t border-border pt-5">
      <p className="text-sm font-semibold">Tools this app may use</p>
      <p className="mt-1 text-xs text-foreground-secondary">
        Changes take effect immediately. Sending Gmail is always a separate choice.
      </p>
      <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
        {collections.map((collection) => (
          <section
            key={collection.id}
            className={`rounded-lg border p-3 ${collection.tools.some((tool) => tool.id === suggestedToolId) ? 'border-primary' : 'border-border'}`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                aria-label={`Allow ${collection.name}`}
                checked={selectedCollections.has(collection.id)}
                onChange={() => toggleCollection(collection)}
              />
              {collection.name}
              {collection.tools.some((tool) => tool.id === suggestedToolId) && (
                <span className="ml-auto text-xs font-normal text-primary">Requested tool</span>
              )}
            </div>
            {selectedCollections.has(collection.id) && (
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                {collection.tools.map((tool) => (
                  <div
                    key={tool.id}
                    className={`flex items-start gap-2 text-xs ${tool.id === suggestedToolId ? 'font-semibold text-primary' : ''}`}
                  >
                    <Checkbox
                      aria-label={`Allow ${tool.name}`}
                      checked={selectedTools.has(tool.id)}
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
                        <span className="block text-foreground-secondary">{tool.description}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
        {collections.length === 0 && (
          <p className="text-sm text-foreground-secondary">
            Connect an account or create a collection to add tools.
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-error">
          {error}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button size="sm" onClick={() => void save()} disabled={busy}>
          {busy ? 'Saving…' : 'Save access'}
        </Button>
      </div>
    </div>
  );
}
