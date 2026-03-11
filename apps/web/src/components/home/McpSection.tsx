'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useState } from 'react';

interface McpSectionProps {
  toolCount: number;
}

const EXAMPLE_URL = 'https://tpmjs.com/@username/collections/my-tools/mcp';

type Provider = 'claude-code' | 'claude-desktop' | 'cursor' | 'windsurf' | 'any';

interface ProviderInfo {
  id: Provider;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

const providers: ProviderInfo[] = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    shortLabel: 'Claude Code',
    icon: '>_',
    description: 'cli / terminal',
  },
  {
    id: 'claude-desktop',
    label: 'Claude Desktop',
    shortLabel: 'Desktop',
    icon: 'C',
    description: 'desktop app',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    shortLabel: 'Cursor',
    icon: '{;}',
    description: 'ai code editor',
  },
  {
    id: 'windsurf',
    label: 'Windsurf',
    shortLabel: 'Windsurf',
    icon: 'W',
    description: 'agentic ide',
  },
  {
    id: 'any',
    label: 'Any MCP Client',
    shortLabel: 'Other',
    icon: '*',
    description: 'open protocol',
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="absolute top-3 right-3 p-1.5 text-foreground-tertiary hover:text-foreground transition-colors"
      aria-label="Copy to clipboard"
    >
      <Icon icon={copied ? 'check' : 'copy'} size="xs" />
    </button>
  );
}

function CodeBlock({ code, filename }: { code: string; filename?: string }) {
  return (
    <div className="relative">
      {filename && (
        <div className="px-4 py-2 border-b border-border bg-surface font-mono text-xs text-foreground-tertiary">
          {filename}
        </div>
      )}
      <div className="p-4 bg-background font-mono text-sm overflow-x-auto">
        <pre className="text-foreground whitespace-pre">{code}</pre>
      </div>
      <CopyButton text={code} />
    </div>
  );
}

function ProviderConfig({ provider }: { provider: Provider }) {
  switch (provider) {
    case 'claude-code':
      return (
        <div className="space-y-4">
          <div className="border border-border overflow-hidden">
            <div className="px-4 py-2 bg-surface border-b border-border">
              <p className="font-mono text-xs text-foreground-tertiary">
                one command — that&apos;s it
              </p>
            </div>
            <CodeBlock code={`claude mcp add my-tools \\\n  ${EXAMPLE_URL} \\\n  -t http`} />
          </div>
          <div className="flex items-start gap-3 p-3 bg-surface border border-dashed border-border">
            <span className="font-mono text-xs text-primary mt-0.5">tip</span>
            <p className="font-mono text-xs text-foreground-secondary">
              run{' '}
              <code className="px-1 py-0.5 bg-background border border-border text-foreground">
                /mcp
              </code>{' '}
              in Claude Code to verify the server is connected. run{' '}
              <code className="px-1 py-0.5 bg-background border border-border text-foreground">
                claude mcp list
              </code>{' '}
              to see all configured servers.
            </p>
          </div>
        </div>
      );

    case 'claude-desktop':
      return (
        <div className="space-y-4">
          <div className="border border-border overflow-hidden">
            <CodeBlock
              filename="claude_desktop_config.json"
              code={JSON.stringify(
                {
                  mcpServers: {
                    'my-tools': {
                      type: 'http',
                      url: EXAMPLE_URL,
                    },
                  },
                },
                null,
                2
              )}
            />
          </div>
          <div className="flex items-start gap-3 p-3 bg-surface border border-dashed border-border">
            <span className="font-mono text-xs text-primary mt-0.5">path</span>
            <div className="font-mono text-xs text-foreground-secondary space-y-1">
              <p>
                <span className="text-foreground-tertiary">macos:</span> ~/Library/Application
                Support/Claude/claude_desktop_config.json
              </p>
              <p>
                <span className="text-foreground-tertiary">windows:</span>{' '}
                %APPDATA%\Claude\claude_desktop_config.json
              </p>
            </div>
          </div>
        </div>
      );

    case 'cursor':
      return (
        <div className="space-y-4">
          <div className="border border-border overflow-hidden">
            <CodeBlock
              filename=".cursor/mcp.json"
              code={JSON.stringify(
                {
                  mcpServers: {
                    'my-tools': {
                      type: 'http',
                      url: EXAMPLE_URL,
                    },
                  },
                },
                null,
                2
              )}
            />
          </div>
          <div className="flex items-start gap-3 p-3 bg-surface border border-dashed border-border">
            <span className="font-mono text-xs text-primary mt-0.5">alt</span>
            <p className="font-mono text-xs text-foreground-secondary">
              or add via{' '}
              <code className="px-1 py-0.5 bg-background border border-border text-foreground">
                Settings &gt; Features &gt; MCP Servers &gt; + Add Server
              </code>
            </p>
          </div>
        </div>
      );

    case 'windsurf':
      return (
        <div className="space-y-4">
          <div className="border border-border overflow-hidden">
            <CodeBlock
              filename="~/.codeium/windsurf/mcp_config.json"
              code={JSON.stringify(
                {
                  mcpServers: {
                    'my-tools': {
                      type: 'http',
                      url: EXAMPLE_URL,
                    },
                  },
                },
                null,
                2
              )}
            />
          </div>
          <div className="flex items-start gap-3 p-3 bg-surface border border-dashed border-border">
            <span className="font-mono text-xs text-primary mt-0.5">alt</span>
            <p className="font-mono text-xs text-foreground-secondary">
              or add via{' '}
              <code className="px-1 py-0.5 bg-background border border-border text-foreground">
                Windsurf Settings &gt; Cascade &gt; MCP Servers &gt; Add Server
              </code>
            </p>
          </div>
        </div>
      );

    case 'any':
      return (
        <div className="space-y-4">
          <div className="border border-border overflow-hidden">
            <div className="px-4 py-2 bg-surface border-b border-border">
              <p className="font-mono text-xs text-foreground-tertiary">
                standard MCP HTTP transport
              </p>
            </div>
            <CodeBlock
              code={`POST ${EXAMPLE_URL}
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}`}
            />
          </div>
          <div className="flex items-start gap-3 p-3 bg-surface border border-dashed border-border">
            <span className="font-mono text-xs text-primary mt-0.5">note</span>
            <p className="font-mono text-xs text-foreground-secondary">
              any client that speaks the{' '}
              <a
                href="https://modelcontextprotocol.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Model Context Protocol
              </a>{' '}
              can connect. SSE transport is also available at{' '}
              <code className="px-1 py-0.5 bg-background border border-border text-foreground">
                /api/mcp/username/slug/sse
              </code>
            </p>
          </div>
        </div>
      );
  }
}

export function McpSection({ toolCount }: McpSectionProps) {
  const [activeProvider, setActiveProvider] = useState<Provider>('claude-code');
  const toolCountLabel = toolCount > 0 ? `${toolCount}+` : '100+';

  return (
    <section className="py-20 bg-surface border-y border-border">
      <Container size="xl" padding="lg">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
            model context protocol
          </p>
          <h2 className="font-mono text-3xl md:text-4xl font-semibold mb-4 text-foreground lowercase">
            works with every mcp client
          </h2>
          <p className="text-base text-foreground-secondary max-w-xl mx-auto font-sans">
            MCP is the open protocol that lets AI clients call external tools. Create a collection,
            get a URL, paste it into your editor. That's it.
          </p>
        </div>

        {/* How It Works - 3 Steps */}
        <fieldset className="border border-dashed border-border p-6 md:p-8 mb-12">
          <legend className="font-mono text-sm text-foreground-secondary px-3 lowercase">
            how it works
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 border border-dashed border-border bg-background flex items-center justify-center mb-4">
                <span className="font-mono text-lg text-primary">1</span>
              </div>
              <h3 className="font-mono text-sm font-medium text-foreground mb-2 lowercase">
                create a collection
              </h3>
              <p className="font-sans text-xs text-foreground-secondary">
                Pick tools from the registry and group them into a collection. Public or private.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 border border-dashed border-border bg-background flex items-center justify-center mb-4">
                <span className="font-mono text-lg text-primary">2</span>
              </div>
              <h3 className="font-mono text-sm font-medium text-foreground mb-2 lowercase">
                copy your mcp url
              </h3>
              <p className="font-sans text-xs text-foreground-secondary">
                Every collection gets a unique MCP endpoint URL.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 border border-dashed border-border bg-background flex items-center justify-center mb-4">
                <span className="font-mono text-lg text-primary">3</span>
              </div>
              <h3 className="font-mono text-sm font-medium text-foreground mb-2 lowercase">
                add to your ai client
              </h3>
              <p className="font-sans text-xs text-foreground-secondary">
                Paste the URL into your client&apos;s MCP config. Tools work immediately.
              </p>
            </div>
          </div>
        </fieldset>

        {/* Provider Tabs + Config */}
        <fieldset className="border border-dashed border-border p-0 mb-12 overflow-hidden">
          <legend className="font-mono text-sm text-foreground-secondary px-3 ml-5 lowercase">
            setup by client
          </legend>

          {/* Tab Bar */}
          <div className="flex border-b border-border overflow-x-auto">
            {providers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveProvider(p.id)}
                className={`flex-shrink-0 px-4 md:px-6 py-3 font-mono text-xs md:text-sm transition-colors border-b-2 ${
                  activeProvider === p.id
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-foreground-tertiary hover:text-foreground-secondary hover:bg-surface'
                }`}
              >
                <span className="hidden md:inline">{p.label}</span>
                <span className="md:hidden">{p.shortLabel}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">
            <ProviderConfig provider={activeProvider} />
          </div>
        </fieldset>

        {/* URL Format Reference */}
        <fieldset className="border border-dashed border-border p-6 md:p-8 max-w-2xl mx-auto mb-12">
          <legend className="font-mono text-sm text-foreground-secondary px-3 lowercase">
            url format
          </legend>
          <div className="font-mono text-sm text-foreground-secondary text-center mb-4">
            <code className="text-foreground">
              https://tpmjs.com/@<span className="text-primary">username</span>/collections/
              <span className="text-primary">slug</span>/mcp
            </code>
          </div>
          <div className="flex items-center justify-center gap-3 pt-4 border-t border-dashed border-border">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <p className="font-mono text-xs text-foreground-secondary">
              one url gives your ai access to{' '}
              <span className="text-primary font-medium">{toolCountLabel} tools</span>
            </p>
          </div>
        </fieldset>

        {/* Private Collections Note */}
        <div className="max-w-2xl mx-auto mb-12 p-4 border border-dashed border-border bg-surface">
          <div className="flex items-start gap-3">
            <Icon icon="key" size="sm" className="text-foreground-tertiary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-mono text-xs font-medium text-foreground mb-1 lowercase">
                private collections
              </p>
              <p className="font-sans text-xs text-foreground-secondary">
                Private collections require a TPMJS API key. Add an{' '}
                <code className="px-1 py-0.5 bg-background border border-border text-foreground">
                  Authorization: Bearer YOUR_KEY
                </code>{' '}
                header to your config. Generate keys in{' '}
                <Link
                  href="/dashboard/settings/tpmjs-api-keys"
                  className="text-primary hover:underline"
                >
                  Settings
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <Link href="/dashboard/collections">
              <Button size="lg" variant="default">
                Create a Collection
              </Button>
            </Link>
            <Link href="/docs/tutorials/mcp">
              <Button size="lg" variant="outline">
                Full MCP Tutorial
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
