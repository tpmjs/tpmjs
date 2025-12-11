import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';

export const metadata = {
  title: 'SDK - Registry Tools | TPMJS',
  description:
    'Add two tools to your AI agent and instantly access thousands of tools from the TPMJS registry',
};

export default function SDKPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 py-16">
        <Container size="lg" padding="lg">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="px-3 py-1 text-sm font-semibold bg-primary/10 text-primary rounded-full">
                New
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Give Your Agent Access to Every Tool
            </h1>
            <p className="text-xl text-foreground-secondary max-w-3xl mx-auto">
              Add two tools to your AI SDK agent and instantly access thousands of tools from the
              TPMJS registry. No configuration, no manual imports—just dynamic tool discovery and
              execution.
            </p>
          </div>

          {/* Quick Start */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Quick Start</h2>
            <div className="space-y-6">
              {/* Install */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                    1
                  </span>
                  <h3 className="text-xl font-semibold text-foreground">Install the packages</h3>
                </div>
                <CodeBlock
                  language="bash"
                  code={`npm install @tpmjs/registrySearch @tpmjs/registryExecute
# or
pnpm add @tpmjs/registrySearch @tpmjs/registryExecute`}
                />
              </div>

              {/* Add to agent */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                    2
                  </span>
                  <h3 className="text-xl font-semibold text-foreground">Add to your agent</h3>
                </div>
                <CodeBlock
                  language="typescript"
                  code={`import { Agent } from 'ai';
import { registrySearchTool } from '@tpmjs/registrySearch';
import { registryExecuteTool } from '@tpmjs/registryExecute';

const agent = new Agent({
  model: 'anthropic/claude-sonnet-4-20250514',
  instructions: \`You have access to thousands of tools via the TPMJS registry.
Use registrySearch to find tools, then registryExecute to run them.\`,
  tools: {
    // Your existing tools
    weather: weatherTool,
    database: databaseTool,

    // TPMJS registry access
    registrySearch: registrySearchTool,
    registryExecute: registryExecuteTool,
  },
});`}
                />
              </div>

              {/* That's it */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                    3
                  </span>
                  <h3 className="text-xl font-semibold text-foreground">That&apos;s it!</h3>
                </div>
                <p className="text-foreground-secondary mb-4">
                  Your agent can now discover and execute any tool from the registry. Here&apos;s
                  what happens when a user asks for something:
                </p>
                <div className="p-4 bg-background rounded border border-border font-mono text-sm">
                  <div className="text-foreground-secondary">
                    <span className="text-primary">User:</span> &quot;Search the web for AI news and
                    summarize it&quot;
                  </div>
                  <div className="mt-3 text-foreground-secondary">
                    <span className="text-primary">Agent:</span>
                  </div>
                  <div className="ml-4 mt-1 space-y-1 text-foreground-tertiary">
                    <div>
                      1. Calls <code className="text-primary">registrySearch</code>
                      {`({ query: "web search" })`}
                    </div>
                    <div>
                      2. Finds <code className="text-foreground">@exalabs/ai-sdk::webSearch</code>
                    </div>
                    <div>
                      3. Calls <code className="text-primary">registryExecute</code>
                      {`({ toolId: "@exalabs/ai-sdk::webSearch", params: {...} })`}
                    </div>
                    <div>4. Returns results to user</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">How It Works</h2>
            <div className="p-8 border border-border rounded-lg bg-surface font-mono text-sm overflow-x-auto">
              <pre className="text-foreground-secondary whitespace-pre">
                {`┌─────────────────────────────────────────────────────────────────┐
│                      Your AI Agent                               │
│  ┌─────────────┐  ┌────────────────┐  ┌─────────────────────┐   │
│  │ Your Tools  │  │ registrySearch │  │   registryExecute   │   │
│  └─────────────┘  └───────┬────────┘  └──────────┬──────────┘   │
└───────────────────────────┼──────────────────────┼──────────────┘
                            │                      │
                            ▼                      ▼
                  ┌─────────────────┐   ┌─────────────────────────┐
                  │  TPMJS Registry │   │   Sandbox Executor      │
                  │  tpmjs.com/api  │   │  executor.tpmjs.com     │
                  └─────────────────┘   └─────────────────────────┘
                            │                      │
                            ▼                      ▼
                  ┌─────────────────┐   ┌─────────────────────────┐
                  │  Tool Metadata  │   │   Secure Deno Runtime   │
                  │  1000+ tools    │   │   Isolated execution    │
                  └─────────────────┘   └─────────────────────────┘`}
              </pre>
            </div>
          </section>

          {/* registrySearchTool */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">registrySearchTool</h2>
            <p className="text-lg text-foreground-secondary mb-6">
              Search the TPMJS registry to find tools for any task. Returns metadata including the{' '}
              <code className="text-primary">toolId</code> needed for execution.
            </p>

            <div className="space-y-6">
              {/* Parameters */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Parameters</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 text-foreground">Name</th>
                        <th className="text-left py-2 pr-4 text-foreground">Type</th>
                        <th className="text-left py-2 pr-4 text-foreground">Required</th>
                        <th className="text-left py-2 text-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-foreground-secondary">
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-primary">query</td>
                        <td className="py-2 pr-4">string</td>
                        <td className="py-2 pr-4">Yes</td>
                        <td className="py-2">Search query (keywords, tool names, descriptions)</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-primary">category</td>
                        <td className="py-2 pr-4">string</td>
                        <td className="py-2 pr-4">No</td>
                        <td className="py-2">Filter by category</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-primary">limit</td>
                        <td className="py-2 pr-4">number</td>
                        <td className="py-2 pr-4">No</td>
                        <td className="py-2">Max results (1-20, default 5)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Categories */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    'web-scraping',
                    'data-processing',
                    'file-operations',
                    'communication',
                    'database',
                    'api-integration',
                    'image-processing',
                    'text-analysis',
                    'automation',
                    'ai-ml',
                    'security',
                    'monitoring',
                  ].map((category) => (
                    <span
                      key={category}
                      className="px-3 py-1 text-sm bg-background border border-border rounded-full text-foreground-secondary"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              {/* Return Value */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Return Value</h3>
                <CodeBlock
                  language="json"
                  code={`{
  "query": "web scraping",
  "matchCount": 3,
  "tools": [
    {
      "toolId": "@firecrawl/ai-sdk::scrapeTool",
      "name": "scrapeTool",
      "package": "@firecrawl/ai-sdk",
      "description": "Scrape any website into clean markdown",
      "category": "web-scraping",
      "requiredEnvVars": ["FIRECRAWL_API_KEY"],
      "healthStatus": "HEALTHY",
      "qualityScore": 0.9
    }
  ]
}`}
                />
              </div>
            </div>
          </section>

          {/* registryExecuteTool */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">registryExecuteTool</h2>
            <p className="text-lg text-foreground-secondary mb-6">
              Execute any tool from the registry by its <code className="text-primary">toolId</code>
              . Tools run in a secure sandbox—no local installation required.
            </p>

            <div className="space-y-6">
              {/* Parameters */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Parameters</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 text-foreground">Name</th>
                        <th className="text-left py-2 pr-4 text-foreground">Type</th>
                        <th className="text-left py-2 pr-4 text-foreground">Required</th>
                        <th className="text-left py-2 text-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-foreground-secondary">
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-primary">toolId</td>
                        <td className="py-2 pr-4">string</td>
                        <td className="py-2 pr-4">Yes</td>
                        <td className="py-2">
                          Tool identifier (format: <code>package::exportName</code>)
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-primary">params</td>
                        <td className="py-2 pr-4">object</td>
                        <td className="py-2 pr-4">Yes</td>
                        <td className="py-2">Parameters to pass to the tool</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-primary">env</td>
                        <td className="py-2 pr-4">object</td>
                        <td className="py-2 pr-4">No</td>
                        <td className="py-2">Environment variables (API keys)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Example */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Example</h3>
                <CodeBlock
                  language="typescript"
                  code={`// Execute a web search tool
const result = await registryExecuteTool.execute({
  toolId: '@exalabs/ai-sdk::webSearch',
  params: { query: 'latest AI news' },
  env: { EXA_API_KEY: 'your-api-key' },
});

// Result:
// {
//   toolId: '@exalabs/ai-sdk::webSearch',
//   executionTimeMs: 1234,
//   output: { results: [...] }
// }`}
                />
              </div>

              {/* Return Value */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Return Value</h3>
                <CodeBlock
                  language="json"
                  code={`{
  "toolId": "@exalabs/ai-sdk::webSearch",
  "executionTimeMs": 1234,
  "output": { ... }
}`}
                />
              </div>
            </div>
          </section>

          {/* Environment Variables */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Environment Variables</h2>
            <p className="text-lg text-foreground-secondary mb-6">
              Both packages support self-hosted registries via environment variables. This is useful
              for enterprise deployments or running your own tool registry.
            </p>

            <div className="p-6 border border-border rounded-lg bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 text-foreground">Variable</th>
                      <th className="text-left py-2 pr-4 text-foreground">Default</th>
                      <th className="text-left py-2 text-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground-secondary">
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4 font-mono text-primary">TPMJS_API_URL</td>
                      <td className="py-2 pr-4 font-mono">https://tpmjs.com</td>
                      <td className="py-2">Base URL for the registry API</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-primary">TPMJS_EXECUTOR_URL</td>
                      <td className="py-2 pr-4 font-mono">https://executor.tpmjs.com</td>
                      <td className="py-2">URL for the sandbox executor</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-2 text-foreground">Self-Hosted Example</h4>
                <CodeBlock
                  language="bash"
                  code={`# Use your own TPMJS registry
export TPMJS_API_URL=https://registry.mycompany.com
export TPMJS_EXECUTOR_URL=https://executor.mycompany.com`}
                />
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Security</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="text-2xl mb-2">🏝️</div>
                <h3 className="font-semibold mb-2 text-foreground">Sandboxed Execution</h3>
                <p className="text-sm text-foreground-secondary">
                  All tools run in an isolated Deno runtime on Railway. They cannot access your
                  local filesystem or environment.
                </p>
              </div>
              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="text-2xl mb-2">🔐</div>
                <h3 className="font-semibold mb-2 text-foreground">API Key Isolation</h3>
                <p className="text-sm text-foreground-secondary">
                  API keys are passed per-request and never stored. Each execution is stateless and
                  isolated.
                </p>
              </div>
              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="text-2xl mb-2">✅</div>
                <h3 className="font-semibold mb-2 text-foreground">Registry-Only Execution</h3>
                <p className="text-sm text-foreground-secondary">
                  Only tools registered in TPMJS can be executed. No arbitrary code execution is
                  possible.
                </p>
              </div>
              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="text-2xl mb-2">🏥</div>
                <h3 className="font-semibold mb-2 text-foreground">Health Monitoring</h3>
                <p className="text-sm text-foreground-secondary">
                  Every tool is continuously health-checked. Broken tools are flagged and filtered
                  from search results.
                </p>
              </div>
            </div>
          </section>

          {/* Vision & Future */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">The Vision</h2>
            <div className="prose max-w-none text-foreground-secondary text-lg space-y-4 mb-8">
              <p>
                We&apos;re building the{' '}
                <span className="text-foreground font-semibold">npm for AI tools</span>. Just as npm
                revolutionized JavaScript package sharing, TPMJS aims to create a universal
                ecosystem where AI agents can discover, share, and execute tools seamlessly.
              </p>
              <p>
                The <code className="text-primary">registrySearch</code> and{' '}
                <code className="text-primary">registryExecute</code> tools are just the beginning.
                Here&apos;s what&apos;s coming:
              </p>
            </div>

            <div className="space-y-6">
              {/* Collections */}
              <div className="p-6 border-2 border-primary/20 rounded-lg bg-primary/5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 text-sm font-semibold bg-primary/20 text-primary rounded-full">
                    Coming Soon
                  </span>
                  <h3 className="text-xl font-semibold text-foreground">Collections</h3>
                </div>
                <p className="text-foreground-secondary mb-4">
                  Pre-configured tool bundles for specific domains. Think of them as &ldquo;skill
                  packs&rdquo; for your AI agent.
                </p>
                <CodeBlock
                  language="typescript"
                  code={`// Future API concept
const tools = await tpmjs.loadCollection('web-scraping');
// Includes: scrapeTool, crawlTool, extractTool, searchTool...

const tools = await tpmjs.loadCollection('data-analysis');
// Includes: csvParser, jsonTransform, statistics, plotting...

// Or create your own private collections
const tools = await tpmjs.loadCollection('my-company/internal-tools');`}
                />
              </div>

              {/* API Keys */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 text-sm font-semibold bg-foreground-tertiary/20 text-foreground-secondary rounded-full">
                    Planned
                  </span>
                  <h3 className="text-xl font-semibold text-foreground">
                    API Keys & Rate Limiting
                  </h3>
                </div>
                <p className="text-foreground-secondary">
                  Personal API keys for authentication, usage tracking, and rate limiting.
                  Enterprise features for teams including usage analytics and billing.
                </p>
              </div>

              {/* Tool Versioning */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 text-sm font-semibold bg-foreground-tertiary/20 text-foreground-secondary rounded-full">
                    Planned
                  </span>
                  <h3 className="text-xl font-semibold text-foreground">Tool Versioning</h3>
                </div>
                <p className="text-foreground-secondary">
                  Pin specific tool versions in your agent configuration. Automatic compatibility
                  checking and migration guides when tools update.
                </p>
              </div>

              {/* Private Registries */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 text-sm font-semibold bg-foreground-tertiary/20 text-foreground-secondary rounded-full">
                    Planned
                  </span>
                  <h3 className="text-xl font-semibold text-foreground">Private Registries</h3>
                </div>
                <p className="text-foreground-secondary">
                  Run your own TPMJS instance for internal tools. Connect multiple registries
                  (public + private) in a single agent. Enterprise SSO and access controls.
                </p>
              </div>

              {/* Streaming */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 text-sm font-semibold bg-foreground-tertiary/20 text-foreground-secondary rounded-full">
                    Planned
                  </span>
                  <h3 className="text-xl font-semibold text-foreground">Streaming Execution</h3>
                </div>
                <p className="text-foreground-secondary">
                  Stream tool outputs for long-running operations. Real-time progress updates and
                  partial results for better UX.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-12 border border-border rounded-lg bg-surface">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Get Started?</h2>
            <p className="text-lg text-foreground-secondary mb-8 max-w-2xl mx-auto">
              Give your AI agent access to thousands of tools in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="https://www.npmjs.com/package/@tpmjs/registrySearch"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="default">
                  View on npm
                </Button>
              </a>
              <Link href="/playground">
                <Button size="lg" variant="outline">
                  Try in Playground
                </Button>
              </Link>
              <Link href="/tool/tool-search">
                <Button size="lg" variant="outline">
                  Browse Tools
                </Button>
              </Link>
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}
