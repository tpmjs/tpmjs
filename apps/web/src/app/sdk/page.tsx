import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';
import { SDKFlowDiagram } from '~/components/SDKFlowDiagram';

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
            <p className="text-xl text-foreground-secondary max-w-3xl mx-auto mb-8">
              Add two tools to your AI SDK agent and instantly access thousands of tools from the
              TPMJS registry. No configuration, no manual imports—just dynamic tool discovery and
              execution.
            </p>
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <a
                href="https://www.npmjs.com/package/@tpmjs/registry-search"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
                </svg>
                @tpmjs/registry-search
              </a>
              <a
                href="https://www.npmjs.com/package/@tpmjs/registry-execute"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
                </svg>
                @tpmjs/registry-execute
              </a>
              <a
                href="https://github.com/tpmjs/tpmjs/tree/main/packages/tools"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-foreground/10 text-foreground rounded-md hover:bg-foreground/20 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
            </div>
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
                <div className="space-y-3">
                  <CodeBlock
                    language="bash"
                    code="npm install @tpmjs/registry-search @tpmjs/registry-execute"
                  />
                  <CodeBlock
                    language="bash"
                    code="pnpm add @tpmjs/registry-search @tpmjs/registry-execute"
                  />
                </div>
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
                  code={`import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { registrySearchTool } from '@tpmjs/registry-search';
import { registryExecuteTool } from '@tpmjs/registry-execute';

const result = streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: {
    // Your existing tools
    weather: weatherTool,
    database: databaseTool,

    // TPMJS registry access
    registrySearch: registrySearchTool,
    registryExecute: registryExecuteTool,
  },
  system: \`You have access to thousands of tools via the TPMJS registry.
Use registrySearch to find tools, then registryExecute to run them.\`,
  prompt: 'Search for web scraping tools and scrape https://example.com',
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
            <SDKFlowDiagram />
          </section>

          {/* registrySearchTool */}
          <section className="mb-16">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className="text-3xl font-bold text-foreground">registrySearchTool</h2>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.npmjs.com/package/@tpmjs/registry-search"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
                  </svg>
                  npm
                </a>
                <a
                  href="https://github.com/tpmjs/tpmjs/tree/main/packages/tools/registrySearch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-foreground/10 text-foreground rounded-md hover:bg-foreground/20 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Source
                </a>
              </div>
            </div>
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className="text-3xl font-bold text-foreground">registryExecuteTool</h2>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.npmjs.com/package/@tpmjs/registry-execute"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
                  </svg>
                  npm
                </a>
                <a
                  href="https://github.com/tpmjs/tpmjs/tree/main/packages/tools/registryExecute"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-foreground/10 text-foreground rounded-md hover:bg-foreground/20 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Source
                </a>
              </div>
            </div>
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
                          Tool identifier (format: <code>package::name</code>)
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

          {/* Passing API Keys */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Passing API Keys</h2>
            <p className="text-lg text-foreground-secondary mb-6">
              Many tools require API keys (e.g., Firecrawl, Exa). The recommended approach is to
              wrap <code className="text-primary">registryExecuteTool</code> with your
              pre-configured keys.
            </p>

            <div className="space-y-6">
              {/* Wrapper */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Create a Wrapper (Recommended)
                </h3>
                <CodeBlock
                  language="typescript"
                  code={`import { tool } from 'ai';
import { registryExecuteTool } from '@tpmjs/registry-execute';

// Pre-configure your API keys
const API_KEYS: Record<string, string> = {
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY!,
  EXA_API_KEY: process.env.EXA_API_KEY!,
};

// Create a wrapped version that auto-injects keys
export const registryExecute = tool({
  description: registryExecuteTool.description,
  parameters: registryExecuteTool.parameters,
  execute: async ({ toolId, params }) => {
    return registryExecuteTool.execute({ toolId, params, env: API_KEYS });
  },
});`}
                />
              </div>

              {/* Usage */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Use the Wrapped Tool</h3>
                <CodeBlock
                  language="typescript"
                  code={`import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { registrySearchTool } from '@tpmjs/registry-search';
import { registryExecute } from './tools';  // Your wrapped version

const result = streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: {
    registrySearch: registrySearchTool,
    registryExecute,  // Keys are auto-injected
  },
  system: \`You have access to the TPMJS tool registry.
Use registrySearch to find tools, then registryExecute to run them.\`,
  prompt: 'Scrape https://example.com and summarize the content',
});`}
                />
              </div>

              {/* How it works */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-4 text-foreground">How It Works</h3>
                <ol className="list-decimal list-inside space-y-2 text-foreground-secondary">
                  <li>
                    <code className="text-primary">registrySearch</code> returns{' '}
                    <code className="text-primary">requiredEnvVars</code> for each tool (e.g.,{' '}
                    <code>[&quot;FIRECRAWL_API_KEY&quot;]</code>)
                  </li>
                  <li>Your wrapper automatically passes all configured keys to the executor</li>
                  <li>
                    The executor injects matching keys as environment variables in the sandbox
                  </li>
                  <li>Tools without required keys work with or without the wrapper</li>
                </ol>
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
                changed how developers share JavaScript packages, TPMJS aims to do the same for AI
                agent tools—a universal ecosystem where agents discover and use tools on-demand.
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <a href="https://playground.tpmjs.com" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="default">
                  Try in Playground
                </Button>
              </a>
              <Link href="/tool/tool-search">
                <Button size="lg" variant="outline">
                  Browse Tools
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 justify-center items-center text-sm">
              <a
                href="https://www.npmjs.com/package/@tpmjs/registry-search"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 font-medium bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
                </svg>
                @tpmjs/registry-search
              </a>
              <a
                href="https://www.npmjs.com/package/@tpmjs/registry-execute"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 font-medium bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
                </svg>
                @tpmjs/registry-execute
              </a>
              <a
                href="https://github.com/tpmjs/tpmjs/tree/main/packages/tools"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 font-medium bg-foreground/10 text-foreground rounded-md hover:bg-foreground/20 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View on GitHub
              </a>
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}
