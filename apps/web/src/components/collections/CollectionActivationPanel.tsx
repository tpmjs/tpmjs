'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useId } from 'react';
import { CopyButton } from '~/components/CopyButton';
import { trackCollectionMcpCopy } from '~/lib/analytics';
import {
  buildClaudeCodeCollectionCommand,
  buildClaudeDesktopCollectionConfig,
  buildCollectionMcpUrl,
} from '~/lib/collection-mcp';

interface CollectionActivationPanelProps {
  collectionId: string;
  name: string;
  username: string;
  slug: string;
  toolCount: number;
  showCollectionLink?: boolean;
}

const ACTIVATION_STEPS = [
  ['1', 'Copy the command'],
  ['2', 'Paste it in your terminal'],
  ['3', 'Run /mcp in Claude Code'],
] as const;

export function CollectionActivationPanel({
  collectionId,
  name,
  username,
  slug,
  toolCount,
  showCollectionLink = false,
}: CollectionActivationPanelProps): React.ReactElement {
  const titleId = useId();
  const target = { username, slug };
  const endpoint = buildCollectionMcpUrl(target);
  const command = buildClaudeCodeCollectionCommand(target);
  const desktopConfig = buildClaudeDesktopCollectionConfig(target);

  return (
    <section aria-labelledby={titleId} className="border-2 border-foreground bg-background">
      <div className="flex flex-col gap-5 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between sm:p-7">
        <div className="max-w-2xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="success" size="sm">
              Public MCP
            </Badge>
            <span className="font-mono text-xs text-foreground-secondary">
              {toolCount} {toolCount === 1 ? 'tool' : 'tools'}
            </span>
          </div>
          <h3 id={titleId} className="text-xl font-semibold text-foreground sm:text-2xl">
            Connect {name}
          </h3>
          <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-foreground-secondary sm:text-base">
            No TPMJS account or token is needed to connect this public collection. Paste one
            command, then confirm the server in Claude Code.
          </p>
        </div>

        {showCollectionLink && (
          <Link
            href={`/${encodeURIComponent(username.replace(/^@+/, ''))}/collections/${encodeURIComponent(slug)}`}
            className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View collection
          </Link>
        )}
      </div>

      <div className="p-5 sm:p-7">
        <ol className="mb-6 flex flex-col gap-3 text-sm text-foreground-secondary sm:flex-row sm:gap-6">
          {ACTIVATION_STEPS.map(([number, label]) => (
            <li key={number} className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-foreground font-mono text-xs font-semibold text-foreground">
                {number}
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ol>

        <div className="border border-foreground bg-foreground p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-background/75 sm:hidden">HTTP MCP</span>
            <span className="hidden font-mono text-xs text-background/75 sm:inline">
              Claude Code · HTTP
            </span>
            <CopyButton
              text={command}
              label="Copy command"
              size="md"
              successMessage="Claude Code command copied"
              className="text-background hover:bg-background/10 hover:text-background"
              onCopy={() => trackCollectionMcpCopy(collectionId, 'claude_code')}
            />
          </div>
          <pre className="overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed text-background sm:text-sm">
            <span aria-hidden="true" className="select-none text-primary">
              ${' '}
            </span>
            {command}
          </pre>
        </div>

        <div className="mt-4 flex items-start gap-2.5 text-sm text-foreground-secondary">
          <Icon icon="check" size="sm" className="mt-0.5 shrink-0 text-success" />
          <p>
            The connection and tool list are public. A tool that calls a third-party service may
            still ask for credentials from that provider.
          </p>
        </div>

        <details className="group mt-5 border-t border-border pt-4">
          <summary className="cursor-pointer list-none text-sm font-medium text-foreground marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="inline-flex items-center gap-2">
              <Icon
                icon="chevronRight"
                size="xs"
                className="transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none"
              />
              Other MCP clients and raw endpoint
            </span>
          </summary>

          <div className="mt-4 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-foreground-secondary">HTTP endpoint</p>
                <CopyButton
                  text={endpoint}
                  label="Copy URL"
                  size="xs"
                  onCopy={() => trackCollectionMcpCopy(collectionId, 'http_url')}
                />
              </div>
              <pre className="overflow-x-auto border border-border bg-surface-2 p-3 font-mono text-xs text-foreground-secondary">
                {endpoint}
              </pre>
            </div>

            <CodeBlock
              language="json"
              code={desktopConfig}
              onCopy={() => trackCollectionMcpCopy(collectionId, 'claude_config')}
            />

            <p className="text-xs text-foreground-tertiary">
              Need another client? The same HTTP endpoint works with any current MCP client.{' '}
              <Link href="/docs/sharing" className="text-primary hover:underline">
                Read the connection guide
              </Link>
              .
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}
