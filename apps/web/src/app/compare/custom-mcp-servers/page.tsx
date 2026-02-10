import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';

export const metadata = {
  title: 'TPMJS vs Custom MCP Servers | Architecture Comparison',
  description:
    'Technical comparison of TPMJS registry architecture vs building custom MCP servers. Covers protocol handling, schema extraction, discovery, and execution.',
  openGraph: {
    title: 'TPMJS vs Custom MCP Servers',
    description:
      'Technical comparison: automated tool registry vs hand-built MCP server infrastructure.',
  },
};

const comparisonRows = [
  {
    capability: 'Protocol implementation',
    custom: 'You implement JSON-RPC 2.0 transport, message framing, error serialization',
    tpmjs: 'Built-in HTTP + SSE transports with standard JSON-RPC 2.0',
  },
  {
    capability: 'Schema definition',
    custom: 'Hand-write inputSchema per tool',
    tpmjs: 'Auto-extracted from tool exports during enrichment sync',
  },
  {
    capability: 'Input validation',
    custom: 'Implement per tool',
    tpmjs: 'Zod schemas generated from inputSchema, validated at execution',
  },
  {
    capability: 'Tool discovery',
    custom: 'Only available to your own codebase',
    tpmjs: 'BM25-scored search API with category filtering',
  },
  {
    capability: 'Quality signal',
    custom: 'None',
    tpmjs: 'Multi-factor score (0-1.0): tier + log(downloads) + log(stars) + metadata richness',
  },
  {
    capability: 'Health monitoring',
    custom: 'You build it',
    tpmjs: 'Automated health checks (import + execution) during enrichment phase',
  },
  {
    capability: 'Versioning',
    custom: 'Manage per server',
    tpmjs: 'npm semver — tools versioned independently',
  },
  {
    capability: 'Spec updates',
    custom: 'You migrate when MCP spec changes',
    tpmjs: 'Registry handles protocol updates centrally',
  },
];

export default function CompareCustomMCPPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 py-16">
        <Container size="lg" padding="lg">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link
              href="/compare"
              className="text-sm text-foreground-secondary hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Icon icon="arrowLeft" size="sm" />
              All comparisons
            </Link>
          </div>

          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              TPMJS vs Custom MCP Servers
            </h1>
            <p className="text-xl text-foreground-secondary max-w-2xl mx-auto mb-8">
              A custom MCP server gives you full control. TPMJS gives you a registry with automated
              schema extraction, quality scoring, and a pluggable executor — so you can focus on
              agent logic.
            </p>
            <Link href="/tool/tool-search">
              <Button size="lg">Browse the Registry</Button>
            </Link>
          </div>

          {/* What you're building */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              What a Custom MCP Server Requires
            </h2>
            <p className="text-foreground-secondary text-lg mb-6">
              Building an MCP server means implementing the full protocol stack yourself:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 border border-border rounded-xl">
                <h3 className="font-semibold text-foreground mb-2">Transport layer</h3>
                <p className="text-sm text-foreground-secondary">
                  HTTP and/or SSE endpoint, message framing, connection lifecycle, keep-alive
                  handling. Each transport has different buffering and error semantics.
                </p>
              </div>
              <div className="p-5 border border-border rounded-xl">
                <h3 className="font-semibold text-foreground mb-2">JSON-RPC 2.0 dispatch</h3>
                <p className="text-sm text-foreground-secondary">
                  Method routing for <code className="text-xs">initialize</code>,{' '}
                  <code className="text-xs">tools/list</code>,{' '}
                  <code className="text-xs">tools/call</code>, <code className="text-xs">ping</code>
                  . Error codes, request ID tracking, batch handling.
                </p>
              </div>
              <div className="p-5 border border-border rounded-xl">
                <h3 className="font-semibold text-foreground mb-2">Schema per tool</h3>
                <p className="text-sm text-foreground-secondary">
                  Each tool needs a hand-written <code className="text-xs">inputSchema</code> (JSON
                  Schema), description, and handler. Schemas must stay synchronized with the
                  implementation.
                </p>
              </div>
              <div className="p-5 border border-border rounded-xl">
                <h3 className="font-semibold text-foreground mb-2">Ops surface</h3>
                <p className="text-sm text-foreground-secondary">
                  Deployment, monitoring, auth, rate limiting, error handling, logging. Each server
                  is an independent service to maintain.
                </p>
              </div>
            </div>
          </section>

          {/* What TPMJS handles */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              What TPMJS Handles for You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 border border-primary/20 rounded-xl bg-primary/5">
                <h3 className="font-semibold text-foreground mb-2">Discovery Pipeline</h3>
                <p className="text-sm text-foreground-secondary">
                  Three-phase async pipeline: (1) npm changes feed monitors for{' '}
                  <code className="text-xs">tpmjs</code> keyword, (2) enrichment extracts JSON
                  schemas from tool exports and runs health checks, (3) metrics calculates quality
                  scores daily from downloads and GitHub stars.
                </p>
              </div>
              <div className="p-5 border border-primary/20 rounded-xl bg-primary/5">
                <h3 className="font-semibold text-foreground mb-2">MCP Serving</h3>
                <p className="text-sm text-foreground-secondary">
                  Collections are exposed as MCP endpoints at{' '}
                  <code className="text-xs">/api/mcp/[user]/[slug]/[transport]</code>. Both HTTP and
                  SSE transports, API key auth with scoped permissions, per-key rate limiting.
                </p>
              </div>
              <div className="p-5 border border-primary/20 rounded-xl bg-primary/5">
                <h3 className="font-semibold text-foreground mb-2">Pluggable Execution</h3>
                <p className="text-sm text-foreground-secondary">
                  Default executor runs on Railway. Or point to any HTTPS endpoint via custom
                  executor config. Contract: accepts package name + tool name + params + env,
                  returns output + execution time.
                </p>
              </div>
            </div>
          </section>

          {/* Comparison Table */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Side-by-Side
            </h2>
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface/50">
                    <th className="text-left p-4 font-semibold text-foreground">Capability</th>
                    <th className="text-left p-4 font-semibold text-foreground-secondary">
                      Custom MCP Server
                    </th>
                    <th className="text-left p-4 font-bold text-primary">TPMJS</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.capability} className="border-b border-border last:border-0">
                      <td className="p-4 font-medium text-foreground">{row.capability}</td>
                      <td className="p-4 text-foreground-secondary">{row.custom}</td>
                      <td className="p-4 text-primary font-medium">{row.tpmjs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Code: Before / After */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Code Comparison
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground-secondary">
                  Custom MCP server — you own the stack
                </h3>
                <CodeBlock
                  code={`// server.ts — transport + routing
import { Server } from '@modelcontextprotocol/sdk/server';

const server = new Server({
  name: 'my-tools',
  version: '1.0.0',
});

// Hand-write each tool schema
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'search_web',
    description: 'Search the web',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  }],
}));

// Hand-write each tool handler
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  switch (req.params.name) {
    case 'search_web':
      return { content: [{ type: 'text', text: '...' }] };
    // ... repeat for every tool
  }
});

// You handle transport, deployment, monitoring`}
                  language="typescript"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">
                  TPMJS — publish to npm, get MCP for free
                </h3>
                <CodeBlock
                  code={`// package.json — declare the tool
{
  "name": "@my-org/search-web",
  "keywords": ["tpmjs"],
  "tpmjs": {
    "category": "web",
    "tools": [{
      "name": "searchWeb",
      "description": "Search the web"
    }]
  }
}

// src/index.ts — export the tool
import { tool } from 'ai';
import { z } from 'zod';

export const searchWeb = tool({
  description: 'Search the web',
  parameters: z.object({
    query: z.string(),
    limit: z.number().optional(),
  }),
  execute: async ({ query, limit }) => {
    // Your implementation
  },
});

// npm publish
// Schema extracted automatically
// Available via MCP, CLI, and web search`}
                  language="typescript"
                />
              </div>
            </div>
          </section>

          {/* When custom makes sense */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border border-border rounded-xl">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  When a custom server makes sense
                </h3>
                <ul className="space-y-2 text-foreground-secondary text-sm">
                  <li className="flex items-start gap-2">
                    <Icon icon="check" size="sm" className="text-foreground-secondary mt-0.5" />
                    Tools that require long-lived state or WebSocket connections
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon icon="check" size="sm" className="text-foreground-secondary mt-0.5" />
                    Internal tools that should never be published externally
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon icon="check" size="sm" className="text-foreground-secondary mt-0.5" />
                    Custom transport requirements beyond HTTP/SSE
                  </li>
                </ul>
              </div>
              <div className="p-6 border border-primary/30 rounded-xl bg-primary/5">
                <h3 className="text-lg font-bold text-foreground mb-4">When TPMJS fits better</h3>
                <ul className="space-y-2 text-foreground-secondary text-sm">
                  {[
                    'Tools that can be stateless request/response',
                    'You want discovery — others should find and use your tools',
                    'You want quality scoring and health monitoring for free',
                    'You want to publish once and serve via MCP, CLI, and HTTP',
                    'You want to compose tools from multiple authors into collections',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Icon icon="check" size="sm" className="text-primary mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-12 px-8 border border-border rounded-2xl bg-surface/50">
            <h2 className="text-2xl font-bold mb-3 text-foreground">
              Publish a tool, get MCP serving for free.
            </h2>
            <p className="text-foreground-secondary mb-6">
              Add the <code className="text-sm">tpmjs</code> keyword to your package.json. Schema
              extraction, discovery, and MCP serving are handled automatically.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/docs/quickstart">
                <Button size="lg">Quick Start</Button>
              </Link>
              <Link href="/compare">
                <Button variant="outline" size="lg">
                  All Comparisons
                </Button>
              </Link>
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}
