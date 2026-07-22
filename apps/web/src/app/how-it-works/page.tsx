import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';
import { ArchitectureDiagram } from '~/components/ArchitectureDiagram';

export const metadata = {
  title: 'How It Works | TPMJS',
  description: 'Learn how TPMJS automatically discovers, indexes, and serves AI tools from npm',
  openGraph: {
    title: 'How It Works | TPMJS',
    description: 'Learn how TPMJS automatically discovers, indexes, and serves AI tools from npm',
    images: [{ url: '/api/og/how-it-works', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image' as const,
    images: ['/api/og/how-it-works'],
  },
};

export default function HowItWorksPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 py-16">
        <Container size="lg" padding="lg">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              How TPMJS Works
            </h1>
            <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
              npm package to AI-ready tool in under 15 minutes. Here is the architecture.
            </p>
          </div>

          {/* Overview */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              What is TPMJS?
            </h2>
            <div className="prose max-w-none text-foreground-secondary text-lg space-y-4">
              <p>
                TPMJS is a{' '}
                <span className="text-foreground font-semibold">
                  registry and execution platform
                </span>{' '}
                for AI tools published to npm. It auto-discovers packages, extracts their schemas,
                scores quality, and serves them via MCP.
              </p>
              <p>
                AI agents built with Vercel AI SDK, LangChain, or any MCP client can search the
                registry and execute tools without manual integration.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-8">
                <div className="p-6 border border-border rounded-lg bg-surface">
                  <div className="text-2xl mb-2">🔍</div>
                  <h3 className="font-semibold mb-2 text-foreground">Automatic Discovery</h3>
                  <p className="text-sm text-foreground-secondary">
                    Tools appear on tpmjs.com within 2-15 minutes of publishing to npm
                  </p>
                </div>
                <div className="p-6 border border-border rounded-lg bg-surface">
                  <div className="text-2xl mb-2">📊</div>
                  <h3 className="font-semibold mb-2 text-foreground">Quality Scoring</h3>
                  <p className="text-sm text-foreground-secondary">
                    Automatic scoring based on documentation, downloads, and metadata completeness
                  </p>
                </div>
                <div className="p-6 border border-border rounded-lg bg-surface">
                  <div className="text-2xl mb-2">⚡</div>
                  <h3 className="font-semibold mb-2 text-foreground">Instant Execution</h3>
                  <p className="text-sm text-foreground-secondary">
                    AI agents can discover and execute tools through a unified API
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* For Developers */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              For Tool Developers
            </h2>
            <div className="space-y-6">
              <p className="text-lg text-foreground-secondary">
                Add one keyword and a metadata field to your package.json. Publish to npm. Done.
              </p>

              {/* Step 1 */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                    1
                  </span>
                  <h3 className="text-xl font-semibold text-foreground">
                    Add metadata to package.json
                  </h3>
                </div>
                <CodeBlock
                  language="json"
                  code={`{
  "name": "@yourname/awesome-tool",
  "version": "1.0.0",
  "keywords": ["tpmjs"],
  "tpmjs": {
    "category": "text-analysis",
    "frameworks": ["vercel-ai"],
    "tools": [{
      "name": "analyzeSentiment",
      "description": "Analyze sentiment of text and return positive/negative/neutral"
    }]
  }
}`}
                />
                <p className="text-sm text-foreground-secondary mt-4">
                  Parameters are automatically extracted from your tool code - no need to list them
                  manually!
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                    2
                  </span>
                  <h3 className="text-xl font-semibold text-foreground">Publish to npm</h3>
                </div>
                <CodeBlock language="bash" code="npm publish --access public" />
                <p className="text-sm text-foreground-secondary mt-4">
                  That&apos;s it! TPMJS will automatically discover your tool within 2-15 minutes.
                </p>
              </div>

              <div className="flex justify-center">
                <Link href="/publish">
                  <Button size="lg" variant="default">
                    View Publishing Guide
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* For AI Agents */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              For AI Agents
            </h2>
            <div className="space-y-6">
              <p className="text-lg text-foreground-secondary">
                Search, filter, and execute tools via API, SDK, CLI, or MCP.
              </p>

              {/* Search Tools */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Search & Filter</h3>
                <CodeBlock
                  language="bash"
                  code={`# Search tools by query
GET /api/tools?q=sentiment&category=text-analysis

# Filter by health status
GET /api/tools?importHealth=HEALTHY&executionHealth=HEALTHY

# Get official tools only
GET /api/tools?official=true`}
                />
              </div>

              {/* Execute Tools */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Execute Tools</h3>
                <CodeBlock
                  language="typescript"
                  code={`import { streamText } from 'ai';
import { analyzeSentiment } from '@yourname/awesome-tool';

const result = await streamText({
  model: openai('gpt-4'),
  prompt: 'Analyze the sentiment of: I love this product!',
  tools: {
    analyzeSentiment,  // Just import and use alongside your other tools
    // ... your other tools
  },
});`}
                />
              </div>

              {/* Playground */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Test in Playground</h3>
                <p className="text-foreground-secondary mb-4">
                  Try tools interactively before integrating them into your AI agent.
                </p>
                <Link href="/playground">
                  <Button variant="outline">Open Playground</Button>
                </Link>
              </div>
            </div>
          </section>

          {/* The Magic Behind the Scenes */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              The Pipeline
            </h2>
            <div className="space-y-8">
              {/* 1. Discovery */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">
                  1. Automatic Discovery
                </h3>
                <p className="text-lg text-foreground-secondary mb-4">
                  Three parallel mechanisms monitor npm for new tools:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold mb-2 text-foreground">Changes Feed</h4>
                    <p className="text-sm text-foreground-secondary">
                      Monitors npm&apos;s real-time changes stream
                    </p>
                    <div className="mt-2 text-xs text-foreground-tertiary">Every 2 minutes</div>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold mb-2 text-foreground">Keyword Search</h4>
                    <p className="text-sm text-foreground-secondary">
                      Searches npm for &quot;tpmjs&quot; keyword
                    </p>
                    <div className="mt-2 text-xs text-foreground-tertiary">Every 15 minutes</div>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold mb-2 text-foreground">Manual Curation</h4>
                    <p className="text-sm text-foreground-secondary">
                      Curated list of high-quality tools
                    </p>
                    <div className="mt-2 text-xs text-foreground-tertiary">Updated regularly</div>
                  </div>
                </div>
              </div>

              {/* 2. Validation & Schema Extraction */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">
                  2. Validation & Schema Extraction
                </h3>
                <p className="text-lg text-foreground-secondary mb-4">
                  Every package is validated and its schema extracted automatically:
                </p>
                <ul className="space-y-2 text-foreground-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-1">✓</span>
                    <span>Valid category from predefined list</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-1">✓</span>
                    <span>Description between 20-500 characters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-1">✓</span>
                    <span>
                      <strong className="text-foreground">inputSchema auto-extracted</strong> from
                      tool code via sandboxed executor
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-1">✓</span>
                    <span>Parameters derived from JSON Schema for display</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-1">✓</span>
                    <span>Fallback to author-provided parameters if extraction fails</span>
                  </li>
                </ul>
              </div>

              {/* 3. Quality Scoring */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">3. Quality Scoring</h3>
                <p className="text-lg text-foreground-secondary mb-4">
                  Every tool gets a score from 0.00 to 1.00:
                </p>
                <div className="p-6 border border-border rounded-lg bg-surface">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-foreground">Tier (Metadata Completeness)</span>
                      <span className="font-mono text-sm text-foreground-secondary">40-60%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-foreground">Downloads (Popularity)</span>
                      <span className="font-mono text-sm text-foreground-secondary">up to 20%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-foreground">GitHub Stars</span>
                      <span className="font-mono text-sm text-foreground-secondary">up to 10%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-foreground">AI-Friendly Metadata</span>
                      <span className="font-mono text-sm text-foreground-secondary">up to 10%</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-foreground-secondary">
                      Higher quality scores = better visibility in search results and featured
                      sections
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Health Checks */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">4. Health Checks</h3>
                <p className="text-lg text-foreground-secondary mb-4">
                  Every tool is tested automatically:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold mb-2 text-foreground">Import Health</h4>
                    <ul className="text-sm text-foreground-secondary space-y-1">
                      <li>• Can the package be imported?</li>
                      <li>• Does the export exist?</li>
                      <li>• Is it in AI SDK format?</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold mb-2 text-foreground">Execution Health</h4>
                    <ul className="text-sm text-foreground-secondary space-y-1">
                      <li>• Can test parameters be generated?</li>
                      <li>• Does the tool execute without errors?</li>
                      <li>• Does it return valid results?</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 5. Indexing */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">5. Indexing</h3>
                <p className="text-lg text-foreground-secondary mb-4">
                  Tools are stored in PostgreSQL with rich metadata:
                </p>
                <ul className="space-y-2 text-foreground-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span>
                      <strong className="text-foreground">Package-level:</strong> Version, README,
                      repository, category, downloads, stars
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span>
                      <strong className="text-foreground">Tool-level:</strong> Export name,
                      description, parameters, return type, AI guidance
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span>
                      <strong className="text-foreground">Metrics:</strong> Quality score, health
                      status, execution history
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Architecture Diagram */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              System Architecture
            </h2>
            <div className="p-8 border border-border rounded-lg bg-surface">
              <ArchitectureDiagram />
            </div>
          </section>

          {/* Data Flow */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              From Publish to Execution
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 border border-border rounded-lg bg-surface">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  1
                </span>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Developer publishes to npm</h4>
                  <p className="text-sm text-foreground-secondary">
                    Package with{' '}
                    <code className="text-xs bg-surface px-1 py-0.5 rounded">tpmjs</code> keyword
                  </p>
                </div>
                <span className="text-xs text-foreground-tertiary ml-auto">~1 second</span>
              </div>

              <div className="flex items-start gap-4 p-4 border border-border rounded-lg bg-surface">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  2
                </span>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">TPMJS discovers package</h4>
                  <p className="text-sm text-foreground-secondary">
                    Changes feed or keyword search picks it up
                  </p>
                </div>
                <span className="text-xs text-foreground-tertiary ml-auto">2-15 minutes</span>
              </div>

              <div className="flex items-start gap-4 p-4 border border-border rounded-lg bg-surface">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  3
                </span>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Validation & indexing</h4>
                  <p className="text-sm text-foreground-secondary">
                    Schema validation, database insertion, health checks
                  </p>
                </div>
                <span className="text-xs text-foreground-tertiary ml-auto">~5 seconds</span>
              </div>

              <div className="flex items-start gap-4 p-4 border border-border rounded-lg bg-surface">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  4
                </span>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Tool appears on tpmjs.com</h4>
                  <p className="text-sm text-foreground-secondary">
                    Searchable, browsable, and executable in playground
                  </p>
                </div>
                <span className="text-xs text-foreground-tertiary ml-auto">Instant</span>
              </div>

              <div className="flex items-start gap-4 p-4 border border-border rounded-lg bg-surface">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  5
                </span>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Quality score calculated</h4>
                  <p className="text-sm text-foreground-secondary">
                    Based on tier, downloads, stars, and metadata
                  </p>
                </div>
                <span className="text-xs text-foreground-tertiary ml-auto">Within 1 hour</span>
              </div>

              <div className="flex items-start gap-4 p-4 border border-border rounded-lg bg-surface">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  6
                </span>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    AI agents can discover & execute
                  </h4>
                  <p className="text-sm text-foreground-secondary">
                    Available via API for search and execution
                  </p>
                </div>
                <span className="text-xs text-foreground-tertiary ml-auto">Ongoing</span>
              </div>
            </div>
          </section>

          {/* Beta: Dynamic Tool Loading */}
          <section className="mb-16">
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="px-3 py-1 text-sm font-semibold bg-primary/10 text-primary rounded-full">
                🧪 Beta
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                Dynamic Tool Loading
              </h2>
            </div>

            <div className="space-y-6">
              <p className="text-lg text-foreground-secondary">
                The playground demonstrates tools that discover and load themselves dynamically
                based on conversation context.
              </p>

              {/* How It Works */}
              <div className="p-6 border border-border rounded-lg bg-surface space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    🔍 BM25 Search + Context Awareness
                  </h3>
                  <p className="text-foreground-secondary mb-4">
                    When you chat in the playground, your messages are analyzed using the{' '}
                    <strong className="text-foreground">BM25 ranking algorithm</strong> to find the
                    most relevant tools from the entire registry.
                  </p>
                  <CodeBlock
                    language="typescript"
                    code={`// The playground automatically searches for relevant tools
const relevantTools = await searchTpmjsTools({
  query: userMessage,
  limit: 5,
  recentMessages: lastThreeMessages  // Context matters!
});

// Tools are ranked by:
// - BM25 relevance score (keyword matching)
// - Quality score (documentation, downloads)
// - Download popularity (logarithmic boost)
// Result: The right tools, at the right time`}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    ⚡ Zero-Config Dynamic Loading
                  </h3>
                  <p className="text-foreground-secondary mb-4">
                    Found tools are loaded on-demand from esm.sh and executed in a sandboxed Deno
                    environment on Railway.
                  </p>
                  <CodeBlock
                    language="typescript"
                    code={`// Traditional approach: Static tool imports
import { weatherTool } from '@acme/weather';
import { searchTool } from '@acme/search';
// Problem: Must know tools ahead of time ❌

// TPMJS approach: Dynamic tool loading
import { streamText } from 'ai';
import { searchTpmjsToolsTool } from '@tpmjs/search-registry';

const result = await streamText({
  model: openai('gpt-4'),
  messages,
  tools: {
    // This meta-tool lets the AI discover its own tools!
    searchTpmjsTools: searchTpmjsToolsTool,
  },
});

// Agent decides: "I need weather data"
//   → Searches registry → Finds @acme/weather
//   → Loads from esm.sh → Executes in Deno sandbox ✅`}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    🏝️ Sandboxed Execution
                  </h3>
                  <p className="text-foreground-secondary mb-4">
                    All dynamically loaded tools execute in an isolated Deno runtime on Railway,
                    ensuring security and reliability.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div className="p-4 border border-border rounded bg-background">
                      <h4 className="font-semibold mb-2 text-foreground text-sm">
                        Network Imports
                      </h4>
                      <p className="text-xs text-foreground-secondary">
                        Deno loads packages directly from esm.sh with{' '}
                        <code className="text-xs">--experimental-network-imports</code>
                      </p>
                    </div>
                    <div className="p-4 border border-border rounded bg-background">
                      <h4 className="font-semibold mb-2 text-foreground text-sm">
                        Automatic Health Checks
                      </h4>
                      <p className="text-xs text-foreground-secondary">
                        Failed imports or executions trigger health status updates in the registry
                      </p>
                    </div>
                    <div className="p-4 border border-border rounded bg-background">
                      <h4 className="font-semibold mb-2 text-foreground text-sm">
                        Process-Level Caching
                      </h4>
                      <p className="text-xs text-foreground-secondary">
                        Tools are cached per conversation to avoid redundant network requests
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">🎯 Collections</h3>
                  <p className="text-foreground-secondary mb-4">
                    A collection is a curated tool bundle you hand to any agent as a single MCP URL.
                    Add one to Claude Code with a single command&mdash;no code required:
                  </p>
                  <CodeBlock
                    language="bash"
                    code={`# Add a collection to Claude Code as one MCP endpoint
claude mcp add --transport http tpmjs-web-scraping \\
  https://tpmjs.com/@ada/collections/web-scraping/mcp

# Private collection? Pass your TPMJS API key
claude mcp add --transport http tpmjs-web-scraping \\
  https://tpmjs.com/@ada/collections/web-scraping/mcp \\
  --header "Authorization: Bearer YOUR_TPMJS_API_KEY"`}
                  />
                  <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded">
                    <p className="text-sm text-foreground-secondary">
                      <strong className="text-foreground">Why collections?</strong> They bundle a
                      specialized tool set behind one URL, reachable on every surface&mdash;CLI,
                      MCP, REST, SDK, and Skill&mdash;so you can compose sub-agents without manually
                      curating tool lists.
                    </p>
                  </div>
                </div>
              </div>

              {/* Try It */}
              <div className="p-6 border-2 border-primary/20 rounded-lg bg-primary/5">
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  Try It in the Playground
                </h3>
                <p className="text-foreground-secondary mb-4">
                  Ask the playground agent to &ldquo;search for tools about X&rdquo; and watch it
                  discover, load, and execute tools dynamically!
                </p>
                <Link href="/playground">
                  <Button size="lg" variant="default">
                    Open Playground
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-12 border border-border rounded-lg bg-surface">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-foreground-secondary mb-8 max-w-2xl mx-auto">
              Publish a tool, integrate a tool, or try the playground.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/publish">
                <Button size="lg" variant="default">
                  Publish a Tool
                </Button>
              </Link>
              <Link href="/tool/tool-search">
                <Button size="lg" variant="outline">
                  Browse Tools
                </Button>
              </Link>
              <Link href="/playground">
                <Button size="lg" variant="outline">
                  Try Playground
                </Button>
              </Link>
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}
