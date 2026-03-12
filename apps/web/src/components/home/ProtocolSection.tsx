'use client';

import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useState } from 'react';

type Protocol = 'cli' | 'mcp' | 'rest' | 'sdk';

interface ProtocolInfo {
  id: Protocol;
  label: string;
  bestFor: string;
  why: string;
  example: string;
  tokens: string;
}

const protocols: ProtocolInfo[] = [
  {
    id: 'cli',
    label: 'CLI',
    bestFor: 'Claude Code, terminal agents',
    why: 'Fewest tokens. Claude Code is great at bash. stdout is native. No handshake, no protocol overhead.',
    example: `$ tpm collection add my-tools --search "firecrawl"

ℹ Found 3 tool(s):
  • scrapeTool (@anthropic/firecrawl-tools)
  • searchTool (@anthropic/firecrawl-tools)
  • crawlTool (@anthropic/firecrawl-tools)

✓ Added 3 tool(s) to my-tools`,
    tokens: '~50 tokens',
  },
  {
    id: 'mcp',
    label: 'MCP',
    bestFor: 'Claude Desktop, Cursor, Windsurf',
    why: 'Structured tool interface for editors without a shell. One URL, instant access. Open protocol.',
    example: `claude mcp add my-tools \\
  https://tpmjs.com/@you/collections/my-tools/mcp \\
  -t http`,
    tokens: '~200 tokens',
  },
  {
    id: 'rest',
    label: 'REST',
    bestFor: 'Web apps, backends, serverless',
    why: 'Standard HTTP. No special client needed. Works with any language, any framework, any provider.',
    example: `curl -X POST https://tpmjs.com/api/tools/execute \\
  -H "Authorization: Bearer $TPMJS_KEY" \\
  -d '{"tool":"firecrawl--scrape","input":{"url":"..."}}'`,
    tokens: 'N/A',
  },
  {
    id: 'sdk',
    label: 'SDK',
    bestFor: 'TypeScript apps, agent frameworks',
    why: 'Full type safety. Zod schemas. Works with Vercel AI SDK, LangChain, or any JS agent framework.',
    example: `import { registrySearchTool } from '@tpmjs/registry-search';
import { registryExecuteTool } from '@tpmjs/registry-execute';

const result = await generateText({
  tools: { registrySearch: registrySearchTool,
           registryExecute: registryExecuteTool },
  prompt: 'Find and run a web scraping tool',
});`,
    tokens: 'N/A',
  },
];

function ProtocolCard({
  protocol,
  isActive,
  onClick,
}: {
  protocol: ProtocolInfo;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 border transition-all duration-200 w-full ${
        isActive
          ? 'border-primary bg-primary/5'
          : 'border-border bg-surface hover:border-foreground-tertiary'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-lg font-semibold text-foreground lowercase">
          {protocol.label}
        </span>
        <span
          className={`font-mono text-xs ${isActive ? 'text-primary' : 'text-foreground-tertiary'}`}
        >
          {protocol.tokens}
        </span>
      </div>
      <p className="font-mono text-xs text-foreground-secondary">{protocol.bestFor}</p>
    </button>
  );
}

export function ProtocolSection() {
  const [active, setActive] = useState<Protocol>('cli');
  const activeProtocol = protocols.find((p) => p.id === active)!;

  return (
    <section className="py-20 bg-background border-t border-border">
      <Container size="xl" padding="lg">
        {/* Section Header */}
        <div className="text-center mb-6">
          <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
            the protocol debate
          </p>
          <h2 className="font-mono text-3xl md:text-4xl font-semibold mb-4 text-foreground lowercase">
            mcp vs cli vs rest is the wrong argument
          </h2>
        </div>

        {/* The Argument */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="border border-dashed border-border p-6 md:p-8 bg-surface">
            <div className="space-y-4 font-sans text-sm text-foreground-secondary leading-relaxed">
              <p>
                People on Twitter say MCP is dead. Others say MCP is the future. Some say just use
                REST. They&apos;re all right &mdash;{' '}
                <span className="text-foreground font-medium">in their context</span>.
              </p>
              <p>
                CLI is better in Claude Code &mdash; fewer tokens, native bash reasoning, no
                protocol overhead. MCP is better in Cursor and Claude Desktop &mdash; structured
                tools without a shell. REST is better in your backend. SDK is better in your
                TypeScript app.
              </p>
              <p className="text-foreground font-medium">
                The mistake is universalizing from one context. The real questions are discovery,
                trust, and quality &mdash; not which wire protocol carries the JSON.
              </p>
            </div>
          </div>
        </div>

        {/* The Solution */}
        <div className="text-center mb-10">
          <h3 className="font-mono text-xl md:text-2xl font-semibold text-foreground lowercase mb-3">
            write the tool once. we serve it everywhere.
          </h3>
          <p className="text-sm text-foreground-secondary max-w-xl mx-auto font-sans">
            A tool author publishes a Zod-schema&apos;d function to npm. TPMJS automatically makes
            it available via CLI, MCP, REST, and SDK. The consumer picks the right protocol for
            their context.
          </p>
        </div>

        {/* Protocol Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-6">
          {protocols.map((p) => (
            <ProtocolCard
              key={p.id}
              protocol={p}
              isActive={active === p.id}
              onClick={() => setActive(p.id)}
            />
          ))}
        </div>

        {/* Active Protocol Detail */}
        <fieldset className="border border-dashed border-border p-0 mb-12 overflow-hidden">
          <legend className="font-mono text-sm text-foreground-secondary px-3 ml-5 lowercase">
            {activeProtocol.label} &mdash; {activeProtocol.bestFor}
          </legend>

          {/* Why */}
          <div className="px-6 pt-5 pb-3">
            <p className="font-sans text-sm text-foreground-secondary">{activeProtocol.why}</p>
          </div>

          {/* Code Example */}
          <div className="border-t border-border">
            <div className="p-4 md:p-6 bg-background font-mono text-sm overflow-x-auto">
              <pre className="text-foreground whitespace-pre">{activeProtocol.example}</pre>
            </div>
          </div>
        </fieldset>

        {/* Key Insight */}
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 border border-dashed border-border bg-surface text-center">
              <div className="w-10 h-10 flex items-center justify-center mb-3 border border-dashed border-border bg-background mx-auto">
                <Icon icon="search" size="sm" className="text-primary" />
              </div>
              <h4 className="font-mono text-sm font-medium text-foreground mb-1 lowercase">
                discovery
              </h4>
              <p className="font-sans text-xs text-foreground-secondary">
                Quality-scored tools, BM25 search, curated collections. Find what works.
              </p>
            </div>
            <div className="p-5 border border-dashed border-border bg-surface text-center">
              <div className="w-10 h-10 flex items-center justify-center mb-3 border border-dashed border-border bg-background mx-auto">
                <Icon icon="checkCircle" size="sm" className="text-primary" />
              </div>
              <h4 className="font-mono text-sm font-medium text-foreground mb-1 lowercase">
                trust
              </h4>
              <p className="font-sans text-xs text-foreground-secondary">
                Health checks, schema validation, download metrics. Know it works.
              </p>
            </div>
            <div className="p-5 border border-dashed border-border bg-surface text-center">
              <div className="w-10 h-10 flex items-center justify-center mb-3 border border-dashed border-border bg-background mx-auto">
                <Icon icon="globe" size="sm" className="text-primary" />
              </div>
              <h4 className="font-mono text-sm font-medium text-foreground mb-1 lowercase">
                portability
              </h4>
              <p className="font-sans text-xs text-foreground-secondary">
                Same tool over CLI, MCP, REST, SDK. Bet on tools, not transport.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
