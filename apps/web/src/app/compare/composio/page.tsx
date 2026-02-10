import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';

export const metadata = {
  title: 'TPMJS vs Composio | Open Registry vs Hosted Platform',
  description:
    'Technical comparison of TPMJS (npm-based, self-hostable, open protocol) vs Composio (hosted SaaS, proprietary SDK, usage-billed).',
  openGraph: {
    title: 'TPMJS vs Composio',
    description:
      'Open registry on npm vs closed SaaS platform. Compare architecture, data flow, and extensibility.',
  },
};

const comparisonRows = [
  {
    capability: 'Architecture',
    composio: 'Hosted SaaS — API calls to Composio cloud',
    tpmjs: 'npm packages — tools run in your process',
  },
  {
    capability: 'Protocol',
    composio: 'Proprietary REST API',
    tpmjs: 'MCP (JSON-RPC 2.0) — open standard',
  },
  {
    capability: 'Data flow',
    composio: 'Prompts + credentials route through Composio servers',
    tpmjs: 'Tools execute locally, data stays in your runtime',
  },
  {
    capability: 'Pricing',
    composio: 'Usage-based tiers',
    tpmjs: 'Free — tools are open-source npm packages',
  },
  {
    capability: 'Offline / air-gapped',
    composio: 'No (requires API connectivity)',
    tpmjs: 'Yes (packages installed locally via npm)',
  },
  {
    capability: 'Self-hosting',
    composio: 'No',
    tpmjs: 'Yes — custom executor endpoint or run tools directly',
  },
  {
    capability: 'Publishing tools',
    composio: 'Composio controls the catalog',
    tpmjs: 'npm publish — anyone can contribute',
  },
  {
    capability: 'Tool count',
    composio: '~150 managed integrations',
    tpmjs: 'Any npm package with the tpmjs keyword',
  },
  {
    capability: 'Extensibility',
    composio: 'Request integrations from Composio',
    tpmjs: 'Build and publish your own — available in minutes',
  },
  {
    capability: 'Executor control',
    composio: 'Composio-managed',
    tpmjs: 'Default Railway executor or any custom HTTPS endpoint',
  },
];

export default function CompareComposioPage(): React.ReactElement {
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
              TPMJS vs Composio
            </h1>
            <p className="text-xl text-foreground-secondary max-w-2xl mx-auto mb-8">
              Composio is a hosted SaaS that routes tool calls through its cloud. TPMJS tools are
              npm packages that execute in your own runtime — no intermediary, no usage billing, no
              data leaving your infrastructure.
            </p>
            <Link href="/tool/tool-search">
              <Button size="lg">Browse the Open Registry</Button>
            </Link>
          </div>

          {/* Architecture Difference */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Architecture Comparison
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="p-6 border border-border rounded-xl bg-surface/30">
                <h3 className="text-lg font-semibold text-foreground mb-4">Composio data flow</h3>
                <div className="space-y-2 text-sm text-foreground-secondary font-mono">
                  <div className="p-2 bg-background rounded border border-border">
                    Your Agent → Composio SDK
                  </div>
                  <div className="text-center text-foreground-tertiary">↓</div>
                  <div className="p-2 bg-background rounded border border-border">
                    Composio Cloud (processes your data)
                  </div>
                  <div className="text-center text-foreground-tertiary">↓</div>
                  <div className="p-2 bg-background rounded border border-border">
                    Third-party API (GitHub, Slack, etc.)
                  </div>
                  <div className="text-center text-foreground-tertiary">↓</div>
                  <div className="p-2 bg-background rounded border border-border">
                    Response back through Composio → Your Agent
                  </div>
                </div>
              </div>
              <div className="p-6 border border-primary/20 rounded-xl bg-primary/5">
                <h3 className="text-lg font-semibold text-primary mb-4">TPMJS data flow</h3>
                <div className="space-y-2 text-sm text-foreground-secondary font-mono">
                  <div className="p-2 bg-background rounded border border-primary/20">
                    Your Agent → npm package (in your process)
                  </div>
                  <div className="text-center text-foreground-tertiary">↓</div>
                  <div className="p-2 bg-background rounded border border-primary/20">
                    Third-party API (direct, no intermediary)
                  </div>
                  <div className="text-center text-foreground-tertiary">↓</div>
                  <div className="p-2 bg-background rounded border border-primary/20">
                    Response directly to your agent
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Code comparison */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Integration Code
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground-secondary">
                  Composio — SaaS dependency
                </h3>
                <CodeBlock
                  code={`import { Composio } from 'composio-sdk';

const client = new Composio({ apiKey: 'sk-...' });
const tools = await client.getTools(['github']);

// Every invocation:
// 1. Sends data to Composio cloud
// 2. Composio calls GitHub API
// 3. Response proxied back
// 4. Billed per usage tier`}
                  language="typescript"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">
                  TPMJS — npm package, local execution
                </h3>
                <CodeBlock
                  code={`import { githubTools } from '@my-org/github-tools';

// Tool runs in your process:
// 1. Direct API call to GitHub
// 2. No intermediary
// 3. Credentials stay local
// 4. Free, no usage billing

// Or serve via MCP:
// tpmjs.com/api/mcp/user/collection/sse

// Or use the CLI:
// tpmjs tool execute @my-org/github-tools`}
                  language="typescript"
                />
              </div>
            </div>
          </section>

          {/* Comparison Table */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Feature Comparison
            </h2>
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface/50">
                    <th className="text-left p-4 font-semibold text-foreground">Capability</th>
                    <th className="text-left p-4 font-semibold text-foreground-secondary">
                      Composio
                    </th>
                    <th className="text-left p-4 font-bold text-primary">TPMJS</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.capability} className="border-b border-border last:border-0">
                      <td className="p-4 font-medium text-foreground">{row.capability}</td>
                      <td className="p-4 text-foreground-secondary">{row.composio}</td>
                      <td className="p-4 text-primary font-medium">{row.tpmjs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Custom Executors */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Self-Hosting with Custom Executors
            </h2>
            <p className="text-foreground-secondary text-lg mb-6">
              TPMJS supports a pluggable executor interface. The default executor runs on Railway,
              but you can point to any HTTPS endpoint that implements the executor contract:
            </p>
            <CodeBlock
              code={`// Executor request contract
POST /execute
{
  "packageName": "@my-org/search-web",
  "name": "searchWeb",
  "version": "1.2.0",
  "params": { "query": "AI tools" },
  "env": { "API_KEY": "..." }
}

// Executor response contract
{
  "success": true,
  "output": { "results": [...] },
  "executionTimeMs": 342
}`}
              language="typescript"
            />
            <p className="text-foreground-secondary text-sm mt-4">
              This means you can run tools on your own infrastructure — your VPC, your compliance
              boundary, your hardware. Composio does not offer this.
            </p>
          </section>

          {/* When to use what */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border border-border rounded-xl">
                <h3 className="text-lg font-bold text-foreground mb-4">When Composio fits</h3>
                <ul className="space-y-2 text-foreground-secondary text-sm">
                  <li className="flex items-start gap-2">
                    <Icon icon="check" size="sm" className="text-foreground-secondary mt-0.5" />
                    You want managed OAuth flows for third-party integrations
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon icon="check" size="sm" className="text-foreground-secondary mt-0.5" />
                    You prefer a fully hosted solution with no infra to manage
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon icon="check" size="sm" className="text-foreground-secondary mt-0.5" />
                    You{"'"}re comfortable with usage-based billing and data routing
                  </li>
                </ul>
              </div>
              <div className="p-6 border border-primary/30 rounded-xl bg-primary/5">
                <h3 className="text-lg font-bold text-foreground mb-4">When TPMJS fits better</h3>
                <ul className="space-y-2 text-foreground-secondary text-sm">
                  {[
                    'You need data to stay on your infrastructure',
                    'You want to publish your own tools for the community',
                    'You need offline or air-gapped operation',
                    'You want open-protocol MCP support, not a proprietary SDK',
                    'You want to avoid usage-based billing',
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
              Open protocol. Local execution. Your data.
            </h2>
            <p className="text-foreground-secondary mb-6">
              TPMJS tools are npm packages. Install them, run them in your process, serve them via
              MCP.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/tool/tool-search">
                <Button size="lg">Browse Tools</Button>
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
