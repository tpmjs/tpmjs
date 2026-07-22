'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Tabs } from '@tpmjs/ui/Tabs/Tabs';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { trackEvent, trackInstallCommandCopy } from '~/lib/analytics';
import {
  buildToolSurfaces,
  type ToolSurfaceDefinition,
  type ToolSurfaceId,
} from '~/lib/tool-surfaces';

interface ToolSurfaceSwitcherProps {
  packageName: string;
  toolName: string;
  analyticsToolId: string;
}

function isToolSurfaceId(id: string, surfaces: ToolSurfaceDefinition[]): id is ToolSurfaceId {
  return surfaces.some((surface) => surface.id === id);
}

export function ToolSurfaceSwitcher({
  packageName,
  toolName,
  analyticsToolId,
}: ToolSurfaceSwitcherProps): React.ReactElement {
  const surfaces = useMemo(
    () => buildToolSurfaces({ packageName, toolName }),
    [packageName, toolName]
  );
  const [activeId, setActiveId] = useState<ToolSurfaceId>('cli');
  const activeSurface = surfaces.find((surface) => surface.id === activeId) ?? surfaces[0];
  if (!activeSurface) throw new Error('Tool surface contract is empty');

  const selectSurface = (id: string): void => {
    if (!isToolSurfaceId(id, surfaces)) return;
    setActiveId(id);
    trackEvent('install_surface', { surface: id, tool: analyticsToolId });
  };

  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">
          One tool · five surfaces
        </p>
        <CardTitle>Use this tool</CardTitle>
        <CardDescription>
          Choose where your agent runs. Every example targets the same canonical registry tool.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs
          tabs={surfaces.map(({ id, label }) => ({ id, label }))}
          activeTab={activeSurface.id}
          onTabChange={selectSurface}
          aria-label="Tool access surface"
          size="sm"
        />

        <section
          id={`tabpanel-${activeSurface.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeSurface.id}`}
          className="space-y-4 rounded-sm border border-border-subtle bg-background-secondary/30 p-4"
        >
          <div className="space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-wider text-foreground-tertiary">
              Best for · {activeSurface.bestFor}
            </p>
            <p className="text-sm text-foreground-secondary">{activeSurface.description}</p>
          </div>

          {activeSurface.snippets.map((snippet) => (
            <div key={snippet.label} className="space-y-2">
              <p className="font-mono text-xs text-foreground-tertiary">{snippet.label}</p>
              <CodeBlock
                code={snippet.code}
                language={snippet.language}
                showCopy={true}
                onCopy={() =>
                  trackInstallCommandCopy(analyticsToolId, activeSurface.id, snippet.label)
                }
              />
            </div>
          ))}

          {activeSurface.id === 'skill' && (
            <Link
              href="/collections"
              className="inline-flex font-mono text-xs text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Browse collections →
            </Link>
          )}

          {activeSurface.note && (
            <p className="text-xs leading-relaxed text-foreground-tertiary">{activeSurface.note}</p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
