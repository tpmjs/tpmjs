import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';

export const metadata = {
  title: 'How It Works | TPMJS',
  description: 'Learn how TPMJS automatically discovers, indexes, and serves AI tools from npm',
};

export default function HowItWorksPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 py-16">
        <Container size="lg" padding="lg">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">How TPMJS Works</h1>
            <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
              The complete journey from npm package to AI-powered tool execution
            </p>
          </div>

          {/* Overview */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">What is TPMJS?</h2>
            <div className="prose max-w-none text-foreground-secondary text-lg space-y-4">
              <p>
                TPMJS (Tool Package Manager for JavaScript) is a{' '}
                <span className="text-foreground font-semibold">
                  registry and execution platform
                </span>{' '}
                that automatically discovers, catalogs, and runs AI tools from the npm ecosystem.
              </p>
              <p>
                It acts as a bridge between{' '}
                <span className="text-foreground font-semibold">AI agents</span> (powered by
                frameworks like Vercel AI SDK, LangChain, and LlamaIndex) and{' '}
                <span className="text-foreground font-semibold">reusable tool packages</span>{' '}
                published to npm.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-8">
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
            <h2 className="text-3xl font-bold mb-6 text-foreground">For Tool Developers</h2>
            <div className="space-y-6">
              <p className="text-lg text-foreground-secondary">
                Publishing a tool to TPMJS is as simple as publishing to npm with a standardized
                metadata field.
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
  "keywords": ["tpmjs-tool"],
  "tpmjs": {
    "category": "text-analysis",
    "frameworks": ["vercel-ai"],
    "tools": [{
      "exportName": "analyzeSentiment",
      "description": "Analyze sentiment of text",
      "parameters": [{
        "name": "text",
        "type": "string",
        "description": "Text to analyze",
        "required": true
      }],
      "returns": {
        "type": "string",
        "description": "Sentiment score"
      }
    }]
  }
}`}
                />
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
            <h2 className="text-3xl font-bold mb-6 text-foreground">For AI Agents</h2>
            <div className="space-y-6">
              <p className="text-lg text-foreground-secondary">
                AI agents can search, discover, and execute tools through the TPMJS API.
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
                  code={`import { generateText } from 'ai';

const result = await generateText({
  model: openai('gpt-4'),
  prompt: 'Analyze the sentiment of: I love this product!',
  tools: {
    analyzeSentiment: {
      description: 'Analyze sentiment of text',
      parameters: z.object({
        text: z.string().describe('Text to analyze'),
      }),
      execute: async ({ text }) => {
        // Tool execution handled by TPMJS
        return await executeTpmjsTool('@yourname/awesome-tool', 'analyzeSentiment', { text });
      },
    },
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
            <h2 className="text-3xl font-bold mb-6 text-foreground">The Magic Behind the Scenes</h2>
            <div className="space-y-8">
              {/* 1. Discovery */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">
                  1. Automatic Discovery
                </h3>
                <p className="text-lg text-foreground-secondary mb-4">
                  TPMJS uses three parallel mechanisms to discover tools from npm:
                </p>
                <div className="grid md:grid-cols-3 gap-4">
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
                      Searches npm for &quot;tpmjs-tool&quot; keyword
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

              {/* 2. Validation */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">2. Validation</h3>
                <p className="text-lg text-foreground-secondary mb-4">
                  Every discovered package is validated against the TPMJS schema:
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
                    <span>Parameters follow type schema (string, number, boolean, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-1">✓</span>
                    <span>Environment variables properly documented</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-1">✓</span>
                    <span>Supports legacy single-tool and modern multi-tool formats</span>
                  </li>
                </ul>
              </div>

              {/* 3. Quality Scoring */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">3. Quality Scoring</h3>
                <p className="text-lg text-foreground-secondary mb-4">
                  Every tool receives a quality score (0.00 to 1.00) based on:
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
                  Every tool is tested to ensure it works correctly:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
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
                  Tools are stored in a PostgreSQL database with rich metadata:
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
            <h2 className="text-3xl font-bold mb-6 text-foreground">System Architecture</h2>
            <div className="p-8 border border-border rounded-lg bg-surface font-mono text-sm overflow-x-auto">
              <pre className="text-foreground-secondary whitespace-pre">
                {`┌─────────────────────────────────────────────────────────────────┐
│                         NPM Registry                            │
└────────────┬────────────────────────┬───────────────────────────┘
             │                        │
    ┌────────▼────────┐      ┌────────▼────────┐      ┌──────────────┐
    │ Changes Feed    │      │ Keyword Search  │      │ Manual Tools │
    │ Every 2 min     │      │ Every 15 min    │      │ As needed    │
    └────────┬────────┘      └────────┬────────┘      └──────┬───────┘
             │                        │                       │
             └────────────────────────┴───────────────────────┘
                                      │
                              ┌───────▼────────┐
                              │   Validation   │
                              │ Schema Check   │
                              └───────┬────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
            ┌───────▼────────┐              ┌──────────▼──────────┐
            │   PostgreSQL   │              │   Health Checks     │
            │   Database     │              │ Import + Execution  │
            └───────┬────────┘              └──────────┬──────────┘
                    │                                   │
                    └─────────────────┬─────────────────┘
                                      │
                              ┌───────▼────────┐
                              │ Metrics Sync   │
                              │ Quality Score  │
                              │ Every hour     │
                              └───────┬────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
            ┌───────▼────────┐              ┌──────────▼──────────┐
            │   Search API   │              │   Execution API     │
            │  /api/tools    │              │ /api/tools/execute  │
            └───────┬────────┘              └──────────┬──────────┘
                    │                                   │
                    └─────────────────┬─────────────────┘
                                      │
                              ┌───────▼────────┐
                              │  Frontend UI   │
                              │ Search, Detail │
                              │  Playground    │
                              └────────────────┘`}
              </pre>
            </div>
          </section>

          {/* Data Flow */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">From Publish to Execution</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 border border-border rounded-lg bg-surface">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  1
                </span>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Developer publishes to npm</h4>
                  <p className="text-sm text-foreground-secondary">
                    Package with{' '}
                    <code className="text-xs bg-surface px-1 py-0.5 rounded">tpmjs-tool</code>{' '}
                    keyword
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

          {/* CTA */}
          <section className="text-center py-12 border border-border rounded-lg bg-surface">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Get Started?</h2>
            <p className="text-lg text-foreground-secondary mb-8 max-w-2xl mx-auto">
              Whether you&apos;re building AI tools or integrating them into your agent, TPMJS makes
              it simple.
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
