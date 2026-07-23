import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';

export const metadata = {
  title: 'Compare TPMJS | How TPMJS Compares to Alternatives',
  description:
    'Technical comparison of TPMJS against custom MCP servers, LangChain, Composio, and manual function calling for AI tool integration.',
  openGraph: {
    title: 'Compare TPMJS | How TPMJS Compares to Alternatives',
    description:
      'Technical comparison of TPMJS against custom MCP servers, LangChain, Composio, and manual function calling.',
  },
};

const comparisons = [
  {
    href: '/compare/custom-mcp-servers',
    title: 'TPMJS vs Custom MCP Servers',
    description:
      'TPMJS provides a three-phase sync pipeline, automated schema extraction, and a pluggable executor interface — so you ship agents instead of server infrastructure.',
    badge: 'Infrastructure',
    highlights: [
      'Auto-discovered tools from npm exports',
      'JSON-RPC 2.0 with HTTP + SSE transports',
      'Quality scoring with BM25 search',
    ],
  },
  {
    href: '/compare/langchain',
    title: 'TPMJS vs LangChain Tools',
    description:
      'TPMJS tools are standalone npm packages with Zod-validated schemas. No framework runtime, no transitive dependency tree, no vendor-specific adapters.',
    badge: 'Framework',
    highlights: [
      'AI SDK 6 tool() format',
      'Works with any MCP client natively',
      'Independent versioning per tool',
    ],
  },
  {
    href: '/compare/composio',
    title: 'TPMJS vs Composio',
    description:
      'TPMJS tools are npm packages that run in your process. No API intermediary, no usage billing, no data routing through third-party servers.',
    badge: 'Platform',
    highlights: [
      'Tools execute locally in your runtime',
      'Open MCP protocol, not proprietary API',
      'Self-hostable with custom executors',
    ],
  },
  {
    href: '/compare/manual-function-calling',
    title: 'TPMJS vs Manual Function Calling',
    description:
      'TPMJS auto-extracts inputSchema from tool exports at enrichment time, generates Zod validation, and exposes tools via a universal MCP interface — no per-provider schema writing.',
    badge: 'DIY',
    highlights: [
      'Schemas auto-extracted from exports',
      'Zod validation built into every tool',
      'One interface for all LLM providers',
    ],
  },
];

const overviewTable = [
  {
    dimension: 'Distribution',
    tpmjs: 'npm packages',
    langchain: 'Framework-bundled',
    mcp: 'Self-hosted servers',
    composio: 'Hosted SaaS API',
    manual: 'Inline code',
  },
  {
    dimension: 'Protocol',
    tpmjs: 'MCP (JSON-RPC 2.0)',
    langchain: 'LangChain adapters',
    mcp: 'MCP (custom impl)',
    composio: 'Proprietary REST',
    manual: 'Vendor-specific',
  },
  {
    dimension: 'Schema format',
    tpmjs: 'Zod + JSON Schema (auto)',
    langchain: 'LangChain tool class',
    mcp: 'JSON Schema (manual)',
    composio: 'Composio SDK types',
    manual: 'JSON Schema (manual)',
  },
  {
    dimension: 'Execution',
    tpmjs: 'Local or pluggable executor',
    langchain: 'LangChain runtime',
    mcp: 'Your server process',
    composio: 'Composio cloud',
    manual: 'Your process',
  },
  {
    dimension: 'Discovery',
    tpmjs: 'BM25 search + categories',
    langchain: 'Docs / source',
    mcp: 'None',
    composio: 'Composio catalog',
    manual: 'None',
  },
  {
    dimension: 'Quality signal',
    tpmjs: 'Scored (0-1.0)',
    langchain: 'None',
    mcp: 'None',
    composio: 'None',
    manual: 'None',
  },
];

export default function ComparePage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 py-16">
        <Container size="lg" padding="lg">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              How TPMJS Compares
            </h1>
            <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
              TPMJS is an npm-native registry with automated tool discovery, schema extraction, and
              MCP serving. Here{"'"}s how the architecture differs from the alternatives.
            </p>
          </div>

          {/* Comparison Cards */}
          <section className="mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {comparisons.map((comp) => (
                <Link
                  key={comp.href}
                  href={comp.href}
                  className="group block p-6 border border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all bg-surface/50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {comp.title}
                    </h2>
                    <Badge variant="secondary" size="sm">
                      {comp.badge}
                    </Badge>
                  </div>
                  <p className="text-foreground-secondary text-sm mb-4">{comp.description}</p>
                  <ul className="space-y-1.5">
                    {comp.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-sm text-foreground">
                        <Icon icon="check" size="sm" className="text-primary flex-shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                    Read full comparison
                    <Icon icon="arrowRight" size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Architecture Overview Table */}
          <section className="mb-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-foreground text-center">
              Architecture at a Glance
            </h2>
            <p className="text-foreground-secondary text-center mb-6 max-w-xl mx-auto">
              How each approach handles distribution, protocol, schema management, execution, and
              discovery.
            </p>
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface/50">
                    <th className="text-left p-4 font-semibold text-foreground-secondary" />
                    <th className="text-left p-4 font-bold text-primary">TPMJS</th>
                    <th className="text-left p-4 font-semibold text-foreground-secondary">
                      LangChain
                    </th>
                    <th className="text-left p-4 font-semibold text-foreground-secondary">
                      Custom MCP
                    </th>
                    <th className="text-left p-4 font-semibold text-foreground-secondary">
                      Composio
                    </th>
                    <th className="text-left p-4 font-semibold text-foreground-secondary">
                      Manual
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {overviewTable.map((row) => (
                    <tr key={row.dimension} className="border-b border-border last:border-0">
                      <td className="p-4 font-medium text-foreground">{row.dimension}</td>
                      <td className="p-4 text-primary font-medium">{row.tpmjs}</td>
                      <td className="p-4 text-foreground-secondary">{row.langchain}</td>
                      <td className="p-4 text-foreground-secondary">{row.mcp}</td>
                      <td className="p-4 text-foreground-secondary">{row.composio}</td>
                      <td className="p-4 text-foreground-secondary">{row.manual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Technical Details */}
          <section className="mb-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground text-center">
              How TPMJS Works Under the Hood
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 border border-border rounded-xl">
                <h3 className="text-lg font-bold text-foreground mb-2">Discovery Pipeline</h3>
                <p className="text-foreground-secondary text-sm">
                  A three-phase async pipeline monitors the npm changes feed, extracts JSON schemas
                  from tool exports, and calculates quality scores using npm downloads and GitHub
                  stars on a logarithmic scale.
                </p>
              </div>
              <div className="p-6 border border-border rounded-xl">
                <h3 className="text-lg font-bold text-foreground mb-2">MCP Protocol</h3>
                <p className="text-foreground-secondary text-sm">
                  Collections are served as JSON-RPC 2.0 endpoints with HTTP and SSE transports.
                  Supports <code className="text-xs">tools/list</code>,{' '}
                  <code className="text-xs">tools/call</code>, and{' '}
                  <code className="text-xs">initialize</code> methods with API key authentication
                  and per-key rate limiting.
                </p>
              </div>
              <div className="p-6 border border-border rounded-xl">
                <h3 className="text-lg font-bold text-foreground mb-2">Pluggable Executors</h3>
                <p className="text-foreground-secondary text-sm">
                  Tools execute via a default Railway-hosted executor or any custom HTTPS endpoint.
                  The executor contract accepts a package name, tool name, params, and env vars —
                  and returns output with execution time.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-12 px-8 border border-border rounded-2xl bg-surface/50">
            <h2 className="text-2xl font-bold mb-3 text-foreground">Ready to try TPMJS?</h2>
            <p className="text-foreground-secondary mb-6 max-w-lg mx-auto">
              Browse the registry, install a tool, and integrate it into your agent in minutes.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/tool/tool-search">
                <Button size="lg">Browse Tools</Button>
              </Link>
              <Link href="/docs/quickstart">
                <Button variant="outline" size="lg">
                  Quick Start Guide
                </Button>
              </Link>
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}
