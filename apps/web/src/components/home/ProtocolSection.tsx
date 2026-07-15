'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useState } from 'react';

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex-shrink-0 p-1.5 text-foreground-tertiary hover:text-foreground transition-colors"
      aria-label="Copy to clipboard"
    >
      <Icon icon={copied ? 'check' : 'copy'} size="xs" />
    </Button>
  );
}

const claudeCodePrompts = [
  {
    label: 'discover & add',
    text: 'Use the tpm CLI to search for firecrawl tools on the TPMJS registry and add them to my web-scraping collection. Run `tpm tool search firecrawl --json` first to see what\'s available, then `tpm collection add web-scraping --search "firecrawl"` to add them.',
  },
  {
    label: 'list & explore',
    text: 'Run `tpm collection list --json` to show all my TPMJS collections, then pick the one with the most tools and run `tpm collection info <slug>` to show me what tools are in it.',
  },
  {
    label: 'build a collection from scratch',
    text: 'Use the tpm CLI to create a new TPMJS collection called "data-tools" with `tpm collection create`, then search for data extraction and CSV tools with `tpm tool search` and add the top 5 results to it with `tpm collection add`.',
  },
  {
    label: 'search & execute',
    text: 'Use `tpm tool search "weather"` to find weather tools on TPMJS, pick the best one, then run it with `tpm tool execute <package>/<tool> --input \'{"city":"London"}\'` to get the current weather.',
  },
];

type Protocol = 'cli' | 'mcp' | 'rest' | 'sdk' | 'skill';

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
    bestFor: 'Claude Desktop, Cursor, Windsurf, ChatGPT, VS Code',
    why: 'Structured tool interface for clients without a shell. One URL, instant access. Open protocol, now stewarded under the Linux Foundation.',
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
  {
    id: 'skill',
    label: 'Skill',
    bestFor: 'Claude Skills, agent playbooks',
    why: 'More than a tool list — a loadable capability. The collection ships proven usage guidance, distilled from real question patterns, alongside its tools. The agent learns how to use them, not just that they exist.',
    example: `curl https://tpmjs.com/@you/collections/my-tools/skills \\
  -d '{"question":"scrape a page and summarize it"}'

# → markdown guidance + the exact tools to call,
#   getting sharper every time someone asks.`,
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
                TypeScript app. A Skill is better when the agent needs to <em>learn</em> the tools,
                not just call them.
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
            it available via CLI, MCP, REST, SDK, and Skill. The consumer picks the right surface
            for their context &mdash; or reaches for all of them.
          </p>
        </div>

        {/* Protocol Selector */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 mb-6">
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

        {/* Try it in Claude Code */}
        <fieldset className="border border-dashed border-border p-0 mb-12 overflow-hidden max-w-3xl mx-auto">
          <legend className="font-mono text-sm text-foreground-secondary px-3 ml-5 lowercase">
            try it in claude code
          </legend>
          <div className="px-6 pt-5 pb-3">
            <p className="font-sans text-sm text-foreground-secondary mb-1">
              Install the CLI, then paste any of these prompts into Claude Code. It has everything
              Claude needs to run the commands.
            </p>
          </div>
          <div className="px-6 pb-2">
            <div className="relative flex items-center bg-surface border border-border rounded px-4 py-2.5 font-mono text-sm mb-3">
              <span className="text-primary font-bold mr-3 select-none">$</span>
              <code className="text-foreground select-all">npm install -g @tpmjs/cli</code>
              <CopyBtn text="npm install -g @tpmjs/cli" />
            </div>
          </div>
          <div className="border-t border-border">
            {claudeCodePrompts.map((prompt, i) => (
              <div
                key={prompt.label}
                className={`px-6 py-4 ${i < claudeCodePrompts.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-foreground-tertiary mb-1.5">
                      {prompt.label}
                    </p>
                    <p className="font-sans text-sm text-foreground leading-relaxed">
                      {prompt.text}
                    </p>
                  </div>
                  <CopyBtn text={prompt.text} />
                </div>
              </div>
            ))}
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
                Same tool over CLI, MCP, REST, SDK, Skill. Bet on tools, not transport.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
