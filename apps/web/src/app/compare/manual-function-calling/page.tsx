import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';

export const metadata = {
  title: 'TPMJS vs Manual Function Calling | Auto Schema Extraction',
  description:
    'Technical comparison of TPMJS auto-extracted tool schemas vs hand-written function calling definitions. Covers Zod validation, cross-provider support, and discovery.',
  openGraph: {
    title: 'TPMJS vs Manual Function Calling',
    description:
      'Auto-extracted Zod schemas vs hand-written JSON Schema per provider. Technical comparison.',
  },
};

const comparisonRows = [
  {
    capability: 'Schema authoring',
    manual: 'Hand-write JSON Schema per provider format',
    tpmjs: 'Zod schema in code — auto-extracted to JSON Schema during sync',
  },
  {
    capability: 'Input validation',
    manual: 'Implement per tool (LLMs send malformed data)',
    tpmjs: 'Zod .parse() built into every tool — validated before execute()',
  },
  {
    capability: 'Cross-provider support',
    manual: 'Different schema format per vendor (OpenAI vs Anthropic vs Google)',
    tpmjs: 'MCP protocol — one interface for all providers',
  },
  {
    capability: 'Schema-code sync',
    manual: 'Manual — schemas drift from implementation',
    tpmjs: 'Schema is the code — Zod object is the source of truth',
  },
  {
    capability: 'Discovery',
    manual: 'None — tools live in your codebase',
    tpmjs: 'BM25-scored search + 44 categories + quality scoring',
  },
  {
    capability: 'Reuse across projects',
    manual: 'Copy-paste or internal packages',
    tpmjs: 'npm install — published to the public registry',
  },
  {
    capability: 'Health monitoring',
    manual: 'You build it',
    tpmjs: 'Automated import + execution health checks during enrichment',
  },
  {
    capability: 'Time to add a tool',
    manual: '1-4 hours (schema + validation + handler + tests)',
    tpmjs: 'npm install + 1 import',
  },
  {
    capability: 'Error handling',
    manual: 'Per tool, per provider',
    tpmjs: 'Standardized executor contract with executionTimeMs tracking',
  },
];

export default function CompareManualPage(): React.ReactElement {
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
              TPMJS vs Manual Function Calling
            </h1>
            <p className="text-xl text-foreground-secondary max-w-2xl mx-auto mb-8">
              Manual function calling means writing JSON schemas, validation, and handlers per tool
              per provider. TPMJS auto-extracts schemas from Zod definitions and serves them via a
              universal MCP interface.
            </p>
            <Link href="/docs/quickstart">
              <Button size="lg">Get Started</Button>
            </Link>
          </div>

          {/* The problem */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              The Per-Provider Schema Problem
            </h2>
            <p className="text-foreground-secondary text-lg mb-6">
              Each LLM provider expects tool schemas in a different format. A single tool requires
              separate definitions for each provider:
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground-secondary">
                  OpenAI format
                </h3>
                <CodeBlock
                  code={`{
  "type": "function",
  "function": {
    "name": "search_web",
    "description": "Search the web",
    "parameters": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Search query"
        },
        "limit": {
          "type": "number",
          "description": "Max results"
        }
      },
      "required": ["query"]
    }
  }
}`}
                  language="json"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground-secondary">
                  Anthropic format
                </h3>
                <CodeBlock
                  code={`{
  "name": "search_web",
  "description": "Search the web",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search query"
      },
      "limit": {
        "type": "number",
        "description": "Max results"
      }
    },
    "required": ["query"]
  }
}`}
                  language="json"
                />
              </div>
            </div>
            <p className="text-foreground-secondary text-lg mt-6">
              Two providers, one tool — already two schema definitions to maintain. Add the handler
              function, validation logic, error handling, and tests, and each tool costs 1-4 hours.
              Multiply by ten tools and three providers: 30 schema definitions, 30 validation
              functions, and a maintenance surface that grows linearly.
            </p>
          </section>

          {/* How TPMJS solves it */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              How TPMJS Eliminates Schema Boilerplate
            </h2>
            <p className="text-foreground-secondary text-lg mb-6">
              TPMJS tools define their schema once using Zod — the same Zod object used for runtime
              validation is also the schema definition. The TPMJS enrichment pipeline auto-extracts
              the JSON Schema from the Zod definition, so there{"'"}s no separate schema to write or
              maintain:
            </p>
            <CodeBlock
              code={`// This is the entire tool definition.
// Zod schema = input validation = JSON Schema = MCP inputSchema

import { tool } from 'ai';
import { z } from 'zod';

export const searchWeb = tool({
  description: 'Search the web and return results',
  parameters: z.object({
    query: z.string().describe('Search query'),
    limit: z.number().optional().describe('Max results'),
  }),
  execute: async ({ query, limit = 10 }) => {
    // Implementation — no separate schema, no per-provider format
    const results = await fetch(\`https://api.example.com/search?q=\${query}&limit=\${limit}\`);
    return results.json();
  },
});

// What happens automatically:
// 1. npm publish → TPMJS changes feed picks up the package
// 2. Enrichment sync extracts inputSchema from Zod via the executor
// 3. Quality score calculated: tier + log(downloads) + log(stars) + metadata
// 4. Available via MCP, CLI, web search, and AI SDK`}
              language="typescript"
            />
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
                      Manual Function Calling
                    </th>
                    <th className="text-left p-4 font-bold text-primary">TPMJS</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.capability} className="border-b border-border last:border-0">
                      <td className="p-4 font-medium text-foreground">{row.capability}</td>
                      <td className="p-4 text-foreground-secondary">{row.manual}</td>
                      <td className="p-4 text-primary font-medium">{row.tpmjs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Scale comparison */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              At Scale
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border border-border rounded-xl">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  Manual: 5 tools, 2 providers
                </h3>
                <ul className="space-y-1.5 text-foreground-secondary text-sm">
                  <li>10 JSON Schema definitions</li>
                  <li>10 validation functions</li>
                  <li>5 handler implementations</li>
                  <li>5 test suites</li>
                  <li className="text-foreground font-medium pt-1">
                    ~2,000 lines of boilerplate that must stay in sync
                  </li>
                </ul>
              </div>
              <div className="p-6 border border-primary/30 rounded-xl bg-primary/5">
                <h3 className="text-lg font-bold text-foreground mb-4">TPMJS: 5 tools</h3>
                <ul className="space-y-1.5 text-foreground-secondary text-sm">
                  <li>0 separate schema definitions (Zod is the schema)</li>
                  <li>0 validation functions (Zod .parse() is validation)</li>
                  <li>5 npm install commands</li>
                  <li>5 import statements</li>
                  <li className="text-primary font-medium pt-1">
                    Works with every provider via MCP — no per-provider code
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Quality scoring detail */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Built-In Quality Signals
            </h2>
            <p className="text-foreground-secondary text-lg mb-6">
              With manual function calling, there{"'"}s no way to know if a tool implementation is
              reliable. TPMJS provides automated quality scoring:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: 'Tier score',
                  detail: '0.4 (minimal) or 0.6 (rich metadata)',
                },
                {
                  label: 'Downloads',
                  detail: 'log₁₀(downloads + 1) / 15, max 0.2',
                },
                {
                  label: 'Stars',
                  detail: 'log₁₀(stars + 1) / 10, max 0.1',
                },
                {
                  label: 'Metadata',
                  detail: '+0.04 params, +0.03 returns, +0.03 aiAgent',
                },
              ].map((item) => (
                <div key={item.label} className="p-4 border border-border rounded-xl">
                  <h4 className="font-semibold text-foreground text-sm mb-1">{item.label}</h4>
                  <p className="text-xs text-foreground-secondary font-mono">{item.detail}</p>
                </div>
              ))}
            </div>
            <p className="text-foreground-secondary text-sm mt-4">
              Scores range from 0.00 to 1.00 and are recalculated daily. This lets agents prioritize
              higher-quality tools automatically.
            </p>
          </section>

          {/* CTA */}
          <section className="text-center py-12 px-8 border border-border rounded-2xl bg-surface/50">
            <h2 className="text-2xl font-bold mb-3 text-foreground">
              One schema. Every provider. Zero boilerplate.
            </h2>
            <p className="text-foreground-secondary mb-6">
              Define your tool with Zod, publish to npm. TPMJS handles the rest.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/docs/quickstart">
                <Button size="lg">Get Started</Button>
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
