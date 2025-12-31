import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';
import { EcosystemDiagram } from '~/components/EcosystemDiagram';

export const metadata = {
  title: 'Integrations | TPMJS',
  description:
    'How TPMJS integrates with HLLM multi-agent orchestration and BlocksAI domain-driven validation',
  openGraph: {
    title: 'Integrations | TPMJS',
    description:
      'How TPMJS integrates with HLLM multi-agent orchestration and BlocksAI domain-driven validation',
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
              Ecosystem Integrations
            </h1>
            <p className="text-xl text-foreground-secondary max-w-3xl mx-auto">
              TPMJS is part of a larger AI infrastructure ecosystem. See how it connects with HLLM
              for multi-agent orchestration and BlocksAI for domain-driven validation.
            </p>
          </div>

          {/* Ecosystem Diagram */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              The Complete Picture
            </h2>
            <EcosystemDiagram />
          </section>

          {/* Three Projects Overview */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Three Projects, One Vision
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* HLLM */}
              <div className="p-6 border-2 border-purple-500/30 rounded-xl bg-purple-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <span className="text-xl">🧠</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">HLLM</h3>
                    <p className="text-xs text-foreground-tertiary">Multi-Agent Orchestration</p>
                  </div>
                </div>
                <p className="text-sm text-foreground-secondary mb-4">
                  A playground for orchestrating multiple AI agents using 13 different topology
                  patterns. Agents can use TPMJS tools to extend their capabilities.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">→</span>
                    <span className="text-foreground-secondary">
                      13 topologies (debate, react, etc.)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">→</span>
                    <span className="text-foreground-secondary">100+ AI models via OpenRouter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">→</span>
                    <span className="text-foreground-secondary">Real-time D3 visualizations</span>
                  </div>
                </div>
              </div>

              {/* TPMJS */}
              <div className="p-6 border-2 border-emerald-500/30 rounded-xl bg-emerald-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-xl">🔧</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">TPMJS</h3>
                    <p className="text-xs text-foreground-tertiary">AI Tool Registry</p>
                  </div>
                </div>
                <p className="text-sm text-foreground-secondary mb-4">
                  The central registry for AI tools. Automatically discovers tools from npm,
                  validates them, and provides sandboxed execution.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">→</span>
                    <span className="text-foreground-secondary">106+ official tools</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">→</span>
                    <span className="text-foreground-secondary">Deno sandboxed execution</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">→</span>
                    <span className="text-foreground-secondary">Auto-discovery from npm</span>
                  </div>
                </div>
              </div>

              {/* BlocksAI */}
              <div className="p-6 border-2 border-amber-500/30 rounded-xl bg-amber-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <span className="text-xl">✅</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">BlocksAI</h3>
                    <p className="text-xs text-foreground-tertiary">Domain-Driven Validation</p>
                  </div>
                </div>
                <p className="text-sm text-foreground-secondary mb-4">
                  A validation framework that uses AI to ensure code follows domain semantics. TPMJS
                  tools are validated using BlocksAI patterns.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">→</span>
                    <span className="text-foreground-secondary">3-layer validation pipeline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">→</span>
                    <span className="text-foreground-secondary">AI-powered semantic checks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">→</span>
                    <span className="text-foreground-secondary">Domain rules in YAML</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* HLLM Integration Deep Dive */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center">
                <span>🧠</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                HLLM Integration
              </h2>
            </div>

            <div className="space-y-8">
              {/* Overview */}
              <div className="prose max-w-none text-foreground-secondary">
                <p className="text-lg">
                  HLLM (Hierarchical Language Learning Model) is a multi-agent orchestration
                  platform. It integrates with TPMJS to give agents access to the full tool
                  registry.
                </p>
              </div>

              {/* How it works */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  How HLLM Uses TPMJS Tools
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 font-bold text-sm">
                      1
                    </span>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Tool Discovery</h4>
                      <p className="text-sm text-foreground-secondary">
                        HLLM&apos;s Tool Browser fetches available tools from{' '}
                        <code className="text-xs bg-surface-secondary px-1 py-0.5 rounded">
                          /api/tpmjs/tools
                        </code>{' '}
                        proxy, which forwards to tpmjs.com
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 font-bold text-sm">
                      2
                    </span>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Agent Configuration</h4>
                      <p className="text-sm text-foreground-secondary">
                        Users attach tools to agents in the Agent Studio. Each agent can have
                        different tools based on its role.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 font-bold text-sm">
                      3
                    </span>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Tool Execution</h4>
                      <p className="text-sm text-foreground-secondary">
                        When an agent calls a tool, HLLM routes the request to{' '}
                        <code className="text-xs bg-surface-secondary px-1 py-0.5 rounded">
                          executor.tpmjs.com
                        </code>{' '}
                        for sandboxed execution
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 font-bold text-sm">
                      4
                    </span>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Environment Variables</h4>
                      <p className="text-sm text-foreground-secondary">
                        User API keys (e.g., FIRECRAWL_API_KEY) are encrypted and injected at
                        runtime. Keys never leave the server.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 13 Topologies */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  13 Orchestration Topologies
                </h3>
                <p className="text-foreground-secondary mb-4">
                  HLLM supports various multi-agent coordination patterns. Each topology can use
                  TPMJS tools:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: 'single', desc: 'One agent' },
                    { name: 'sequential', desc: 'Chain of agents' },
                    { name: 'parallel', desc: 'Concurrent workers' },
                    { name: 'map-reduce', desc: 'Split & aggregate' },
                    { name: 'scatter', desc: 'Fan-out only' },
                    { name: 'debate', desc: 'Pro vs Con vs Judge' },
                    { name: 'reflection', desc: 'Generator + Critic' },
                    { name: 'consensus', desc: 'Multi-voter agreement' },
                    { name: 'brainstorm', desc: 'Idea generation' },
                    { name: 'decomposition', desc: 'Task breakdown' },
                    { name: 'rhetorical-triangle', desc: 'Ethos/Pathos/Logos' },
                    { name: 'tree-of-thoughts', desc: 'Beam search' },
                    { name: 'react', desc: 'Reason + Act loop' },
                  ].map((topology) => (
                    <div
                      key={topology.name}
                      className="p-3 border border-border rounded bg-background"
                    >
                      <div className="font-mono text-xs text-purple-500">{topology.name}</div>
                      <div className="text-xs text-foreground-tertiary mt-1">{topology.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Example */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  HLLM Tool Execution Code
                </h3>
                <CodeBlock
                  language="typescript"
                  code={`// HLLM's executeTpmjsTool function (simplified)
async function executeTpmjsTool(
  toolId: string,      // "packageName::exportName" or database ID
  params: Record<string, unknown>,
  env: Record<string, string>
) {
  // Fetch tool metadata from TPMJS registry
  const toolMeta = await fetch(\`https://tpmjs.com/api/tools/\${toolId}\`);

  // Execute in TPMJS sandbox
  const response = await fetch('https://executor.tpmjs.com/execute-tool', {
    method: 'POST',
    body: JSON.stringify({
      packageName: toolMeta.npmPackageName,
      name: toolMeta.exportName,
      version: toolMeta.version,
      params,
      env,  // User's encrypted API keys injected here
    }),
  });

  // Parse SSE stream for results
  return parseExecutionStream(response);
}`}
                />
              </div>
            </div>
          </section>

          {/* BlocksAI Integration Deep Dive */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded bg-amber-500/20 flex items-center justify-center">
                <span>✅</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                BlocksAI Validation
              </h2>
            </div>

            <div className="space-y-8">
              {/* Overview */}
              <div className="prose max-w-none text-foreground-secondary">
                <p className="text-lg">
                  BlocksAI provides domain-driven validation for code. TPMJS tools are validated
                  using BlocksAI&apos;s 3-layer pipeline to ensure quality and consistency.
                </p>
              </div>

              {/* 3-Layer Pipeline */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  3-Layer Validation Pipeline
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 border border-amber-500/20 rounded-lg bg-amber-500/5">
                    <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/20 text-amber-600 font-bold">
                      1
                    </span>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Schema Validation</h4>
                      <p className="text-sm text-foreground-secondary">
                        Validates blocks.yml structure using Zod schemas. Ensures all required
                        fields are present with correct types.
                      </p>
                      <div className="mt-2 text-xs font-mono text-foreground-tertiary">
                        Validator: schema.io
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 border border-amber-500/20 rounded-lg bg-amber-500/5">
                    <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/20 text-amber-600 font-bold">
                      2
                    </span>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Shape Validation</h4>
                      <p className="text-sm text-foreground-secondary">
                        Validates TypeScript file structure. Checks that files exist, have exports,
                        and follow expected patterns.
                      </p>
                      <div className="mt-2 text-xs font-mono text-foreground-tertiary">
                        Validator: shape.exports.ts
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 border border-amber-500/20 rounded-lg bg-amber-500/5">
                    <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/20 text-amber-600 font-bold">
                      3
                    </span>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Domain Validation</h4>
                      <p className="text-sm text-foreground-secondary">
                        AI-powered semantic analysis using GPT-4 or Claude. Checks that code aligns
                        with domain rules and expresses intent clearly.
                      </p>
                      <div className="mt-2 text-xs font-mono text-foreground-tertiary">
                        Validator: domain.validation
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* blocks.yml Example */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  TPMJS blocks.yml Configuration
                </h3>
                <p className="text-foreground-secondary mb-4">
                  TPMJS tools are defined in blocks.yml with domain rules for validation:
                </p>
                <CodeBlock
                  language="yaml"
                  code={`# packages/tools/official/blocks.yml
name: "TPMJS Official Tools"
root: "."

philosophy:
  - "Tools must be small, focused, and composable"
  - "Clear interfaces with typed inputs/outputs"
  - "Documentation must be comprehensive"

domain:
  entities:
    ai_tool:
      fields: [name, description, inputSchema, execute]

blocks:
  domain_rules:
    - id: must_export
      description: "Must export a valid AI SDK tool"
    - id: uses_pattern
      description: "Must use tool() + jsonSchema() pattern"
    - id: has_description
      description: "Tool must have clear description"

  webFetchTool:
    description: "Fetch content from a URL"
    path: "web-fetch/src/index.ts"
    domain_rules:
      - type: "must_export"
        export: "webFetchTool"
      - type: "uses_pattern"
        pattern: "tool\\\\s*\\\\("
    inputs:
      - name: url
        type: string
        description: "URL to fetch"
    outputs:
      - name: content
        type: string
        description: "Fetched content"`}
                />
              </div>

              {/* CLI Usage */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Running Validation</h3>
                <CodeBlock
                  language="bash"
                  code={`# Validate all TPMJS tools
npx blocks run --all

# Output:
# ✓ webFetchTool       [schema ✓] [shape ✓] [domain ✓]
# ✓ jsonPathQueryTool  [schema ✓] [shape ✓] [domain ✓]
# ✓ regexExtractTool   [schema ✓] [shape ✓] [domain ✓]
# ...
#
# Summary: 106 blocks passed, 0 failed`}
                />
              </div>
            </div>
          </section>

          {/* Shared Technologies */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Shared Technologies
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* AI SDK */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center">
                    <span className="text-xl">⚡</span>
                  </div>
                  <h3 className="font-bold text-foreground">Vercel AI SDK v6</h3>
                </div>
                <p className="text-sm text-foreground-secondary mb-4">
                  The foundation for all tool definitions. Both HLLM and TPMJS use the same pattern:
                </p>
                <CodeBlock
                  language="typescript"
                  code={`import { tool, jsonSchema } from 'ai';

export const myTool = tool({
  description: '...',
  inputSchema: jsonSchema<{
    param: string;
  }>({
    type: 'object',
    properties: {...},
  }),
  execute: async ({ param }) => {
    // Tool logic
  },
});`}
                />
              </div>

              {/* D3.js */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center">
                    <span className="text-xl">📊</span>
                  </div>
                  <h3 className="font-bold text-foreground">D3.js Visualizations</h3>
                </div>
                <p className="text-sm text-foreground-secondary mb-4">
                  Both projects use D3 for interactive diagrams:
                </p>
                <ul className="space-y-2 text-sm text-foreground-secondary">
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">HLLM:</span>
                    <span>TopologyGraph, ExecutionTimeline</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">TPMJS:</span>
                    <span>ArchitectureDiagram, SDKFlowDiagram</span>
                  </li>
                </ul>
                <p className="text-xs text-foreground-tertiary mt-4">
                  Real-time animations, hover tooltips, theme-aware colors
                </p>
              </div>

              {/* Prisma */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center">
                    <span className="text-xl">🗄️</span>
                  </div>
                  <h3 className="font-bold text-foreground">Prisma + PostgreSQL</h3>
                </div>
                <p className="text-sm text-foreground-secondary mb-4">Shared database patterns:</p>
                <ul className="space-y-2 text-sm text-foreground-secondary">
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">HLLM:</span>
                    <span>Sessions, traces, prompts, user prefs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">TPMJS:</span>
                    <span>Tools, packages, health checks, metrics</span>
                  </li>
                </ul>
                <p className="text-xs text-foreground-tertiary mt-4">
                  Both hosted on Neon with connection pooling
                </p>
              </div>
            </div>
          </section>

          {/* Integration APIs */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Integration APIs
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Endpoint</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Project</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-3 px-4 font-mono text-xs text-emerald-500">/api/tools</td>
                    <td className="py-3 px-4 text-foreground-secondary">TPMJS</td>
                    <td className="py-3 px-4 text-foreground-secondary">
                      Search and list tools with filters
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-xs text-emerald-500">
                      /api/tools/execute
                    </td>
                    <td className="py-3 px-4 text-foreground-secondary">TPMJS</td>
                    <td className="py-3 px-4 text-foreground-secondary">
                      Execute tools with SSE streaming
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-xs text-purple-500">
                      /api/tpmjs/tools
                    </td>
                    <td className="py-3 px-4 text-foreground-secondary">HLLM</td>
                    <td className="py-3 px-4 text-foreground-secondary">
                      Proxy to TPMJS registry (avoids CORS)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-xs text-purple-500">
                      /api/tpmjs/execute
                    </td>
                    <td className="py-3 px-4 text-foreground-secondary">HLLM</td>
                    <td className="py-3 px-4 text-foreground-secondary">
                      Execute with user&apos;s encrypted env vars
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-xs text-purple-500">
                      /api/user/tpmjs-env
                    </td>
                    <td className="py-3 px-4 text-foreground-secondary">HLLM</td>
                    <td className="py-3 px-4 text-foreground-secondary">
                      Store/retrieve encrypted API keys
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-xs text-amber-500">npx blocks run</td>
                    <td className="py-3 px-4 text-foreground-secondary">BlocksAI</td>
                    <td className="py-3 px-4 text-foreground-secondary">
                      Validate tools against domain rules
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Data Flow */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Complete Data Flow
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 border border-border rounded-lg bg-surface">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 font-bold">
                  1
                </span>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    Tool Development & Validation
                  </h4>
                  <p className="text-sm text-foreground-secondary">
                    Developer creates tool using AI SDK pattern →{' '}
                    <code className="text-xs bg-surface-secondary px-1 py-0.5 rounded">
                      npx blocks run
                    </code>{' '}
                    validates against domain rules → Tool published to npm
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-border rounded-lg bg-surface">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 font-bold">
                  2
                </span>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Registry Discovery</h4>
                  <p className="text-sm text-foreground-secondary">
                    TPMJS changes feed detects new package → Schema extraction & health checks →
                    Tool indexed with quality score → Available via API
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-border rounded-lg bg-surface">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 font-bold">
                  3
                </span>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Agent Configuration</h4>
                  <p className="text-sm text-foreground-secondary">
                    HLLM user browses Tool Browser → Selects tools for agent → Configures topology →
                    Saves agent configuration
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-border rounded-lg bg-surface">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 font-bold">
                  4
                </span>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Execution</h4>
                  <p className="text-sm text-foreground-secondary">
                    Agent decides to use tool → HLLM calls TPMJS executor → Tool runs in Deno
                    sandbox → Result streamed back → Agent continues reasoning
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-12 border border-border rounded-lg bg-surface">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
              Explore the Ecosystem
            </h2>
            <p className="text-lg text-foreground-secondary mb-8 max-w-2xl mx-auto">
              Dive deeper into each project or start building with TPMJS tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/tool/tool-search">
                <Button size="lg" variant="default">
                  Browse Tools
                </Button>
              </Link>
              <Link href="/sdk">
                <Button size="lg" variant="outline">
                  View SDK Docs
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
