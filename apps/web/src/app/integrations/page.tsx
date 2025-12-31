import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';
import { EcosystemDiagram } from '~/components/EcosystemDiagram';

export const metadata = {
  title: 'The AI Infrastructure Stack | TPMJS',
  description:
    'A new paradigm for AI systems: three layers working together to create composable, evolvable AI infrastructure.',
  openGraph: {
    title: 'The AI Infrastructure Stack | TPMJS',
    description:
      'A new paradigm for AI systems: three layers working together to create composable, evolvable AI infrastructure.',
  },
};

export default function IntegrationsPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 py-16">
        <Container size="lg" padding="lg">
          {/* Hero - The Big Idea */}
          <div className="text-center mb-20">
            <p className="text-sm font-mono text-foreground-tertiary mb-4 tracking-widest uppercase">
              A New Paradigm
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
              The AI Infrastructure Stack
            </h1>
            <p className="text-xl text-foreground-secondary max-w-3xl mx-auto leading-relaxed">
              What if AI systems could be{' '}
              <span className="text-foreground font-semibold">composable</span>,{' '}
              <span className="text-foreground font-semibold">evolvable</span>, and{' '}
              <span className="text-foreground font-semibold">self-improving</span>? Three projects
              working together are making this possible.
            </p>
          </div>

          {/* The Problem */}
          <section className="mb-20">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-foreground">
                The Problem with AI Today
              </h2>
              <div className="prose max-w-none text-foreground-secondary space-y-4">
                <p className="text-lg">
                  Current AI agents are <strong className="text-foreground">monolithic</strong>.
                  They have a fixed set of tools baked in at build time. Adding a new capability
                  means redeploying the entire system. There&apos;s no feedback loop—the agent makes
                  mistakes and repeats them. There&apos;s no way to validate quality before
                  deployment.
                </p>
                <p className="text-lg">
                  This is like building a web app in 1995: everything in one file, no package
                  manager, no separation of concerns. We&apos;ve learned that complex systems need{' '}
                  <strong className="text-foreground">layers</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* The Insight - Three Layers */}
          <section className="mb-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">
              The Insight: Separation of Concerns
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
              {/* Semantic Layer */}
              <div className="relative p-8 border-2 border-amber-500/40 rounded-xl bg-amber-500/5">
                <div className="absolute -top-3 left-6 bg-background px-3 text-xs font-mono text-amber-500">
                  LAYER 3: SEMANTIC
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">BlocksAI</h3>
                    <p className="text-xs text-foreground-tertiary">Ensures correctness</p>
                  </div>
                </div>
                <p className="text-sm text-foreground-secondary mb-4">
                  The <strong className="text-foreground">TypeScript of AI</strong>. Validates that
                  code means what it should mean. Catches semantic drift before deployment.
                </p>
                <div className="text-xs text-foreground-tertiary space-y-1">
                  <p>→ Development-time validation</p>
                  <p>→ Domain rules as executable specs</p>
                  <p>→ AI learns from feedback loops</p>
                </div>
              </div>

              {/* Distribution Layer */}
              <div className="relative p-8 border-2 border-emerald-500/40 rounded-xl bg-emerald-500/5">
                <div className="absolute -top-3 left-6 bg-background px-3 text-xs font-mono text-emerald-500">
                  LAYER 2: DISTRIBUTION
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-2xl">🔧</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">TPMJS</h3>
                    <p className="text-xs text-foreground-tertiary">Delivers capabilities</p>
                  </div>
                </div>
                <p className="text-sm text-foreground-secondary mb-4">
                  The <strong className="text-foreground">npm of AI</strong>. Tools exist
                  independently, discovered at runtime based on need. The ecosystem grows without
                  central control.
                </p>
                <div className="text-xs text-foreground-tertiary space-y-1">
                  <p>→ Runtime discovery, not build-time</p>
                  <p>→ Sandboxed execution</p>
                  <p>→ Quality signals emerge from usage</p>
                </div>
              </div>

              {/* Orchestration Layer */}
              <div className="relative p-8 border-2 border-purple-500/40 rounded-xl bg-purple-500/5">
                <div className="absolute -top-3 left-6 bg-background px-3 text-xs font-mono text-purple-500">
                  LAYER 1: ORCHESTRATION
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <span className="text-2xl">🧠</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">HLLM</h3>
                    <p className="text-xs text-foreground-tertiary">Composes intelligence</p>
                  </div>
                </div>
                <p className="text-sm text-foreground-secondary mb-4">
                  The <strong className="text-foreground">Kubernetes of AI</strong>. Multiple agents
                  working together in different patterns—debate, consensus, decomposition.
                </p>
                <div className="text-xs text-foreground-tertiary space-y-1">
                  <p>→ 13 composition topologies</p>
                  <p>→ Agents use tools dynamically</p>
                  <p>→ Complex problems, simple agents</p>
                </div>
              </div>
            </div>

            {/* Comparison */}
            <div className="max-w-4xl mx-auto p-6 border border-border rounded-lg bg-surface">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="text-red-500">✗</span> Traditional Model
                  </h4>
                  <div className="font-mono text-sm text-foreground-tertiary leading-relaxed">
                    Monolithic Agent
                    <br />
                    &nbsp;&nbsp;→ Fixed tools (baked in)
                    <br />
                    &nbsp;&nbsp;→ No validation
                    <br />
                    &nbsp;&nbsp;→ No feedback loop
                    <br />
                    &nbsp;&nbsp;→ Hope for the best
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> New Paradigm
                  </h4>
                  <div className="font-mono text-sm text-foreground-tertiary leading-relaxed">
                    Layered Infrastructure
                    <br />
                    &nbsp;&nbsp;→ Dynamic tools (discovered)
                    <br />
                    &nbsp;&nbsp;→ Semantic validation
                    <br />
                    &nbsp;&nbsp;→ Continuous improvement
                    <br />
                    &nbsp;&nbsp;→ Quality emerges
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Diagram */}
          <section className="mb-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-center text-foreground">
              How the Layers Connect
            </h2>
            <p className="text-center text-foreground-secondary mb-8 max-w-2xl mx-auto">
              Each layer has a clear responsibility. Information flows between them, creating a
              system that&apos;s more than the sum of its parts.
            </p>
            <EcosystemDiagram />
          </section>

          {/* The Novel Ideas */}
          <section className="mb-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">
              What Makes This Different
            </h2>

            <div className="space-y-8 max-w-4xl mx-auto">
              {/* Idea 1 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <span className="text-blue-500 font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-2">
                    Tools as Independent Packages, Not Agent Plugins
                  </h3>
                  <p className="text-foreground-secondary">
                    In traditional systems, tools are tightly coupled to agents. Here, tools exist
                    independently in a registry—like npm packages. Any agent can discover and use
                    any tool. The tool ecosystem grows through network effects, not central
                    planning.
                  </p>
                </div>
              </div>

              {/* Idea 2 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <span className="text-blue-500 font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-2">
                    Development-Time Semantic Validation
                  </h3>
                  <p className="text-foreground-secondary">
                    Instead of hoping AI-generated code is correct, BlocksAI validates source code
                    against domain rules <em>before</em> deployment. If a template passes validation
                    once, you can trust its output forever. This is TypeScript-level confidence for
                    AI systems.
                  </p>
                </div>
              </div>

              {/* Idea 3 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <span className="text-blue-500 font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-2">
                    AI Learns from Validation Feedback
                  </h3>
                  <p className="text-foreground-secondary">
                    BlocksAI doesn&apos;t just reject bad code—it provides actionable feedback that
                    AI agents can learn from. Generate, validate, fix, repeat. The system improves
                    iteratively, not through one-shot generation.
                  </p>
                </div>
              </div>

              {/* Idea 4 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <span className="text-blue-500 font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-2">
                    Multi-Agent Composition, Not Bigger Models
                  </h3>
                  <p className="text-foreground-secondary">
                    Instead of building one massive agent, HLLM composes multiple smaller agents
                    into topologies. Debate topology pits agents against each other. Consensus
                    requires agreement. Decomposition breaks problems into pieces. Complex problems
                    emerge from simple agents.
                  </p>
                </div>
              </div>

              {/* Idea 5 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <span className="text-blue-500 font-bold">5</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-2">
                    Quality Emerges from Usage
                  </h3>
                  <p className="text-foreground-secondary">
                    Tools aren&apos;t manually curated—they self-register via npm keywords. TPMJS
                    monitors health (can it import? does it execute?), tracks downloads, calculates
                    quality scores. Good tools rise, broken tools surface. Market forces, not
                    gatekeeping.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* The Analogy */}
          <section className="mb-20">
            <div className="max-w-3xl mx-auto p-8 border border-border rounded-xl bg-surface">
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-foreground text-center">
                The Web Analogy
              </h2>
              <p className="text-foreground-secondary mb-6 text-center">
                The web didn&apos;t succeed because of one monolithic technology. It succeeded
                because of <strong className="text-foreground">separation of concerns</strong>:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Web Stack</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-20 font-mono text-foreground-tertiary">HTTP</span>
                      <span className="text-foreground-secondary">Transport layer</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-20 font-mono text-foreground-tertiary">HTML/CSS</span>
                      <span className="text-foreground-secondary">Content layer</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-20 font-mono text-foreground-tertiary">JavaScript</span>
                      <span className="text-foreground-secondary">Behavior layer</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-20 font-mono text-foreground-tertiary">npm</span>
                      <span className="text-foreground-secondary">Distribution layer</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-20 font-mono text-foreground-tertiary">TypeScript</span>
                      <span className="text-foreground-secondary">Type safety layer</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-3">AI Stack</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-20 font-mono text-purple-500">HLLM</span>
                      <span className="text-foreground-secondary">Orchestration layer</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-20 font-mono text-emerald-500">TPMJS</span>
                      <span className="text-foreground-secondary">Distribution layer</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-20 font-mono text-amber-500">BlocksAI</span>
                      <span className="text-foreground-secondary">Semantic safety layer</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-20 font-mono text-foreground-tertiary">AI SDK</span>
                      <span className="text-foreground-secondary">Tool interface layer</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-20 font-mono text-foreground-tertiary">LLMs</span>
                      <span className="text-foreground-secondary">Intelligence layer</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* What This Enables */}
          <section className="mb-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">
              What This Enables
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="font-bold text-foreground mb-3">Agents That Grow Smarter</h3>
                <p className="text-sm text-foreground-secondary">
                  As the TPMJS ecosystem grows, every agent connected to it gains new capabilities
                  automatically. No redeployment needed. The agent in production today can use a
                  tool published tomorrow.
                </p>
              </div>

              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="font-bold text-foreground mb-3">Self-Healing Systems</h3>
                <p className="text-sm text-foreground-secondary">
                  TPMJS monitors tool health continuously. When a tool breaks, it&apos;s marked
                  BROKEN and agents route around it. When it&apos;s fixed, it&apos;s marked HEALTHY
                  again. No manual intervention.
                </p>
              </div>

              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="font-bold text-foreground mb-3">Composable Intelligence</h3>
                <p className="text-sm text-foreground-secondary">
                  HLLM lets you compose small, focused agents into powerful topologies. A debate
                  between specialists beats a single generalist. Consensus provides reliability.
                  Decomposition handles complexity.
                </p>
              </div>

              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="font-bold text-foreground mb-3">Verified AI Output</h3>
                <p className="text-sm text-foreground-secondary">
                  BlocksAI validates that AI-generated code follows your domain rules. Not
                  &quot;probably correct&quot;—validated against explicit semantic constraints.
                  Trust, but verify.
                </p>
              </div>

              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="font-bold text-foreground mb-3">Open Ecosystem</h3>
                <p className="text-sm text-foreground-secondary">
                  Anyone can publish a tool to TPMJS. Just add a keyword to package.json. No
                  gatekeeping, no approval process. The ecosystem grows through network effects.
                </p>
              </div>

              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="font-bold text-foreground mb-3">Domain Alignment</h3>
                <p className="text-sm text-foreground-secondary">
                  BlocksAI captures domain semantics in machine-readable YAML. AI agents read this
                  before generating code. The result: consistent output across all generations.
                </p>
              </div>
            </div>
          </section>

          {/* The Vision */}
          <section className="mb-20">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
                The Vision
              </h2>
              <p className="text-lg text-foreground-secondary leading-relaxed mb-8">
                We&apos;re building the infrastructure for the next generation of AI systems. Not
                monolithic agents that do everything poorly, but{' '}
                <strong className="text-foreground">composable systems</strong> where specialized
                components work together. Not fixed capabilities, but{' '}
                <strong className="text-foreground">dynamic discovery</strong> from an ever-growing
                ecosystem. Not &quot;trust the AI,&quot; but{' '}
                <strong className="text-foreground">verify through semantic validation</strong>.
              </p>
              <p className="text-xl font-semibold text-foreground">
                Three layers. One stack. A new paradigm for AI infrastructure.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-12 border border-border rounded-lg bg-surface">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
              Start Building
            </h2>
            <p className="text-lg text-foreground-secondary mb-8 max-w-2xl mx-auto">
              Explore the tools, publish your own, or dive into the architecture.
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
              <Link href="/how-it-works">
                <Button size="lg" variant="outline">
                  How It Works
                </Button>
              </Link>
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}
