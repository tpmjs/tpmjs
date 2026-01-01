import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';
import { EcosystemDiagram } from '~/components/EcosystemDiagram';

export const metadata = {
  title: 'Integrations | TPMJS',
  description:
    'Platforms that integrate with TPMJS. See how HLLM brings 100+ tools to multi-agent topologies at runtime.',
  openGraph: {
    title: 'Integrations | TPMJS',
    description:
      'Platforms that integrate with TPMJS. See how HLLM brings 100+ tools to multi-agent topologies at runtime.',
  },
};

export default function IntegrationsPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 py-16">
        <Container size="lg" padding="lg">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              Integrations
            </h1>
            <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
              Platforms that connect to the TPMJS registry to bring tools to their users.
            </p>
          </div>

          {/* Integrations List */}
          <section className="mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* HLLM Integration */}
              <a
                href="https://hllm.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-6 border-2 border-purple-500/30 rounded-xl bg-purple-500/5 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <span className="text-2xl">🧠</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground group-hover:text-purple-500 transition-colors">
                      HLLM
                    </h3>
                    <p className="text-xs text-foreground-tertiary">hllm.dev</p>
                  </div>
                </div>
                <p className="text-sm text-foreground-secondary mb-4">
                  Multi-agent orchestration platform. Users can browse and add any TPMJS tool to
                  their agents, then execute them during topology runs.
                </p>
                <div className="text-xs text-foreground-tertiary space-y-1">
                  <p>→ Tool Browser with search & categories</p>
                  <p>→ One-click add to any agent</p>
                  <p>→ Secure API key management</p>
                  <p>→ Runtime execution via TPMJS</p>
                </div>
              </a>

              {/* Coming Soon Placeholder */}
              <div className="p-6 border border-dashed border-border rounded-xl bg-surface/50 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center mb-4">
                  <span className="text-2xl text-foreground-tertiary">+</span>
                </div>
                <p className="text-sm text-foreground-tertiary mb-2">Your platform here?</p>
                <p className="text-xs text-foreground-tertiary">
                  Integrate with TPMJS to give your users access to 100+ tools.
                </p>
              </div>
            </div>
          </section>

          {/* Case Study Header */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm font-mono text-foreground-tertiary uppercase tracking-widest">
                Case Study
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </section>

          {/* BlocksAI Case Study */}
          <section className="mb-16">
            <div className="p-8 border border-amber-500/30 rounded-xl bg-amber-500/5">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <span className="text-3xl">✅</span>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    Building 100+ Tools with BlocksAI
                  </h2>
                  <p className="text-foreground-secondary">
                    How we used domain-driven validation to ship quality at scale
                  </p>
                </div>
              </div>

              <div className="prose max-w-none text-foreground-secondary space-y-4 mb-8">
                <p>
                  When we set out to build the official TPMJS tool collection, we faced a challenge:
                  how do you maintain quality across 100+ tools? Different categories (web scraping,
                  data transformation, statistics, security) have different requirements. Manual
                  review doesn&apos;t scale.
                </p>
                <p>
                  <strong className="text-foreground">BlocksAI</strong> gave us the answer: define
                  domain rules once, validate automatically. We created a 3,200+ line{' '}
                  <code className="text-xs bg-surface-secondary px-1 py-0.5 rounded">
                    blocks.yml
                  </code>{' '}
                  that captures everything a TPMJS tool should be.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-background rounded-lg text-center">
                  <div className="text-2xl font-bold text-amber-500">106</div>
                  <div className="text-xs text-foreground-tertiary">Tools Built</div>
                </div>
                <div className="p-4 bg-background rounded-lg text-center">
                  <div className="text-2xl font-bold text-amber-500">9</div>
                  <div className="text-xs text-foreground-tertiary">Philosophy Principles</div>
                </div>
                <div className="p-4 bg-background rounded-lg text-center">
                  <div className="text-2xl font-bold text-amber-500">25+</div>
                  <div className="text-xs text-foreground-tertiary">Domain Rules</div>
                </div>
                <div className="p-4 bg-background rounded-lg text-center">
                  <div className="text-2xl font-bold text-amber-500">11</div>
                  <div className="text-xs text-foreground-tertiary">Categories</div>
                </div>
              </div>

              {/* Philosophy Principles */}
              <div className="mb-8">
                <h3 className="font-semibold text-foreground mb-4">The 9 Principles</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="p-3 bg-background rounded-lg">
                    <span className="text-amber-500 font-mono text-xs">01</span>
                    <p className="text-foreground-secondary mt-1">
                      Production-ready only. No stubs, no TODOs.
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <span className="text-amber-500 font-mono text-xs">02</span>
                    <p className="text-foreground-secondary mt-1">
                      AI SDK v6 pattern. tool() + jsonSchema() exclusively.
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <span className="text-amber-500 font-mono text-xs">03</span>
                    <p className="text-foreground-secondary mt-1">
                      Single responsibility. One thing, exceptionally well.
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <span className="text-amber-500 font-mono text-xs">04</span>
                    <p className="text-foreground-secondary mt-1">
                      Structured outputs. Typed, parseable by agents.
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <span className="text-amber-500 font-mono text-xs">05</span>
                    <p className="text-foreground-secondary mt-1">
                      Explicit errors. Never silently fail.
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <span className="text-amber-500 font-mono text-xs">06</span>
                    <p className="text-foreground-secondary mt-1">
                      Async boundaries. Proper error handling.
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <span className="text-amber-500 font-mono text-xs">07</span>
                    <p className="text-foreground-secondary mt-1">
                      Stable dependencies. No alpha packages.
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <span className="text-amber-500 font-mono text-xs">08</span>
                    <p className="text-foreground-secondary mt-1">
                      Deterministic. Same input, same output.
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <span className="text-amber-500 font-mono text-xs">09</span>
                    <p className="text-foreground-secondary mt-1">
                      Single-shot. No streaming, no orchestration.
                    </p>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="mb-8">
                <h3 className="font-semibold text-foreground mb-4">Tools by Category</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Research', count: 5, color: 'bg-blue-500/10 text-blue-500' },
                    { name: 'Web', count: 10, color: 'bg-green-500/10 text-green-500' },
                    { name: 'Data', count: 15, color: 'bg-cyan-500/10 text-cyan-500' },
                    { name: 'Documents', count: 12, color: 'bg-purple-500/10 text-purple-500' },
                    { name: 'Engineering', count: 12, color: 'bg-orange-500/10 text-orange-500' },
                    { name: 'Security', count: 7, color: 'bg-red-500/10 text-red-500' },
                    { name: 'Statistics', count: 9, color: 'bg-pink-500/10 text-pink-500' },
                    { name: 'Operations', count: 7, color: 'bg-yellow-500/10 text-yellow-600' },
                    { name: 'Agents', count: 15, color: 'bg-violet-500/10 text-violet-500' },
                    { name: 'Utilities', count: 8, color: 'bg-gray-500/10 text-gray-500' },
                    { name: 'HTML', count: 3, color: 'bg-emerald-500/10 text-emerald-500' },
                  ].map((cat) => (
                    <span
                      key={cat.name}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${cat.color}`}
                    >
                      {cat.name} ({cat.count})
                    </span>
                  ))}
                </div>
              </div>

              {/* The Result */}
              <div className="p-4 bg-background rounded-lg border border-amber-500/20">
                <h3 className="font-semibold text-foreground mb-2">The Result</h3>
                <p className="text-sm text-foreground-secondary">
                  Every tool follows the same patterns. Every tool has proper error handling. Every
                  tool works with the AI SDK. When HLLM users browse the registry, they can trust
                  that any tool they add will work reliably in their agent workflows.
                </p>
              </div>
            </div>
          </section>

          {/* Ecosystem Diagram */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center text-foreground">
              How It All Connects
            </h2>
            <p className="text-center text-foreground-secondary mb-8 max-w-2xl mx-auto">
              BlocksAI validates tool quality at development time. TPMJS publishes them to the
              registry. HLLM users discover and execute them at runtime.
            </p>
            <EcosystemDiagram />
          </section>

          {/* HLLM Deep Dive */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-foreground">
              Using TPMJS Tools in HLLM
            </h2>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <span className="text-purple-500 font-bold">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">Browse the Tool Registry</h3>
                  <p className="text-sm text-foreground-secondary mb-3">
                    In the Agent Studio, click &quot;Add from TPM.js Registry&quot; to open the Tool
                    Browser. Search by name or filter by category. See descriptions, parameters, and
                    quality scores.
                  </p>
                  <div className="p-3 bg-surface rounded-lg text-xs text-foreground-tertiary">
                    1000+ tools available • Search & filter • Category tags
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <span className="text-purple-500 font-bold">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">Add to Your Agent</h3>
                  <p className="text-sm text-foreground-secondary mb-3">
                    Click any tool to add it to your agent. HLLM automatically fetches the full
                    schema from TPMJS—parameter types, descriptions, everything the agent needs to
                    use it correctly.
                  </p>
                  <div className="p-3 bg-surface rounded-lg text-xs text-foreground-tertiary">
                    One-click add • Full schema sync • Works with any topology
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <span className="text-purple-500 font-bold">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">
                    Configure API Keys (if needed)
                  </h3>
                  <p className="text-sm text-foreground-secondary mb-3">
                    Some tools need API keys (Firecrawl, etc.). Add them once in your HLLM
                    profile—they&apos;re encrypted and automatically injected when tools execute.
                    Your keys never leave the server.
                  </p>
                  <div className="p-3 bg-surface rounded-lg text-xs text-foreground-tertiary">
                    Encrypted storage • Auto-injection • Per-user isolation
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <span className="text-purple-500 font-bold">4</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">Execute During Runs</h3>
                  <p className="text-sm text-foreground-secondary mb-3">
                    When your agent decides to use a tool, HLLM routes the call to the TPMJS
                    executor. The tool runs in a Deno sandbox with your parameters and API keys.
                    Results stream back to your agent.
                  </p>
                  <div className="p-3 bg-surface rounded-lg text-xs text-foreground-tertiary">
                    Sandboxed execution • SSE streaming • Execution metrics
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-12 border border-border rounded-lg bg-surface">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-foreground">
              Explore the Tools
            </h2>
            <p className="text-lg text-foreground-secondary mb-8 max-w-2xl mx-auto">
              Browse the 100+ official tools, or publish your own to the registry.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/tool/tool-search">
                <Button size="lg" variant="default">
                  Browse Tools
                </Button>
              </Link>
              <Link href="/publish">
                <Button size="lg" variant="outline">
                  Publish a Tool
                </Button>
              </Link>
              <a href="https://hllm.dev" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline">
                  Try HLLM →
                </Button>
              </a>
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}
