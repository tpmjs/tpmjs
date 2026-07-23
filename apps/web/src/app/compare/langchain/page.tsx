import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';

export const metadata = {
  title: 'TPMJS vs LangChain Tools | Framework-Free AI Tools',
  description:
    'Technical comparison of TPMJS tool packages vs LangChain built-in tools. Covers dependency trees, portability, schema formats, and runtime coupling.',
  openGraph: {
    title: 'TPMJS vs LangChain Tools',
    description:
      'Framework-free AI tools on npm vs framework-bundled tools. Technical comparison of architecture and tradeoffs.',
  },
};

const comparisonRows = [
  {
    capability: 'Runtime dependency',
    langchain: 'LangChain core + tool-specific packages',
    tpmjs: 'Standalone npm package (tool only)',
  },
  {
    capability: 'Schema format',
    langchain: 'LangChain StructuredTool class + Zod',
    tpmjs: 'AI SDK tool() + Zod (framework-independent)',
  },
  {
    capability: 'MCP support',
    langchain: 'Requires @langchain/mcp adapter',
    tpmjs: 'Native — collections served as MCP endpoints',
  },
  {
    capability: 'Works with Cursor / Windsurf',
    langchain: 'No (no MCP without adapter)',
    tpmjs: 'Yes — native MCP with HTTP + SSE transports',
  },
  {
    capability: 'Package size (per tool)',
    langchain: 'Framework + transitive deps',
    tpmjs: 'Tool code + ai + zod',
  },
  {
    capability: 'Publishing a tool',
    langchain: 'PR to langchain repo or @langchain/* scope',
    tpmjs: 'npm publish with tpmjs keyword',
  },
  {
    capability: 'Versioning',
    langchain: 'Tied to @langchain/* release cadence',
    tpmjs: 'Independent semver per tool package',
  },
  {
    capability: 'Discovery',
    langchain: 'Documentation / GitHub search',
    tpmjs: 'BM25-scored search API + web UI + CLI',
  },
  {
    capability: 'Quality metrics',
    langchain: 'None (no scoring system)',
    tpmjs: 'Quality score: tier + log(downloads) + log(stars) + metadata',
  },
  {
    capability: 'Framework migration',
    langchain: 'Rewrite tool integrations',
    tpmjs: 'Tools are unchanged — swap orchestration layer only',
  },
];

export default function CompareLangChainPage(): React.ReactElement {
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
              TPMJS vs LangChain Tools
            </h1>
            <p className="text-xl text-foreground-secondary max-w-2xl mx-auto mb-8">
              LangChain bundles tools inside a framework runtime. TPMJS tools are standalone npm
              packages — same Zod schemas, no framework coupling, native MCP serving.
            </p>
            <Link href="/tool/tool-search">
              <Button size="lg">Explore the Registry</Button>
            </Link>
          </div>

          {/* Core difference */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              The Architectural Difference
            </h2>
            <p className="text-foreground-secondary text-lg mb-6">
              LangChain tools are classes that extend{' '}
              <code className="text-sm">StructuredTool</code> or{' '}
              <code className="text-sm">DynamicTool</code>. They require the LangChain runtime to
              instantiate and call. TPMJS tools use AI SDK <code className="text-sm">tool()</code>{' '}
              function — a thin wrapper around a Zod schema and an execute function with no
              framework runtime.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground-secondary">
                  LangChain tool
                </h3>
                <CodeBlock
                  code={`import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

class SearchTool extends StructuredTool {
  name = 'search';
  description = 'Search the web';
  schema = z.object({
    query: z.string(),
  });

  async _call({ query }) {
    // implementation
  }
}

// Requires LangChain agent to invoke:
import { AgentExecutor } from 'langchain/agents';
const tools = [new SearchTool()];
const agent = AgentExecutor.fromAgentAndTools({
  agent, tools
});`}
                  language="typescript"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">TPMJS tool</h3>
                <CodeBlock
                  code={`import { tool } from 'ai';
import { z } from 'zod';

export const search = tool({
  description: 'Search the web',
  parameters: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    // implementation
  },
});

// Works with any framework:
// - AI SDK: generateText({ tools: { search } })
// - Direct MCP: tpmjs.com/api/mcp/user/col/sse
// - CLI: tpmjs tool execute @my/pkg
// - Any MCP client: Claude, Cursor, Windsurf`}
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
                      LangChain Tools
                    </th>
                    <th className="text-left p-4 font-bold text-primary">TPMJS</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.capability} className="border-b border-border last:border-0">
                      <td className="p-4 font-medium text-foreground">{row.capability}</td>
                      <td className="p-4 text-foreground-secondary">{row.langchain}</td>
                      <td className="p-4 text-primary font-medium">{row.tpmjs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* MCP + Framework portability */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              MCP and Framework Portability
            </h2>
            <p className="text-foreground-secondary text-lg mb-6">
              LangChain tools are coupled to the LangChain agent runtime. Using them with MCP
              requires the <code className="text-sm">@langchain/mcp</code> adapter — which still
              runs LangChain under the hood. TPMJS tools are exposed as native MCP endpoints:
            </p>
            <CodeBlock
              code={`// claude_desktop_config.json — no adapter needed
{
  "mcpServers": {
    "my-tools": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-remote",
        "https://tpmjs.com/api/mcp/username/my-collection/sse"]
    }
  }
}

// Works in Claude Desktop, Cursor, Windsurf, or any MCP client
// No LangChain, no adapter, no additional runtime`}
              language="json"
            />
          </section>

          {/* When to use what */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border border-border rounded-xl">
                <h3 className="text-lg font-bold text-foreground mb-4">When LangChain tools fit</h3>
                <ul className="space-y-2 text-foreground-secondary text-sm">
                  <li className="flex items-start gap-2">
                    <Icon icon="check" size="sm" className="text-foreground-secondary mt-0.5" />
                    Your entire stack is LangChain (LangSmith, LangServe, LangGraph)
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon icon="check" size="sm" className="text-foreground-secondary mt-0.5" />
                    You need LangChain-specific integrations (callbacks, tracing)
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon icon="check" size="sm" className="text-foreground-secondary mt-0.5" />
                    You{"'"}re prototyping and want batteries-included
                  </li>
                </ul>
              </div>
              <div className="p-6 border border-primary/30 rounded-xl bg-primary/5">
                <h3 className="text-lg font-bold text-foreground mb-4">When TPMJS fits better</h3>
                <ul className="space-y-2 text-foreground-secondary text-sm">
                  {[
                    'You want tools that work across frameworks (AI SDK, LangChain, custom)',
                    'You need native MCP support for Claude, Cursor, or Windsurf',
                    'You want independent versioning and minimal dependency footprint',
                    'You want to publish tools for the community via npm',
                    'You want quality scoring and searchable discovery',
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
              Tools should be portable, not framework-locked.
            </h2>
            <p className="text-foreground-secondary mb-6">
              Publish a tool once, use it everywhere — MCP, CLI, AI SDK, or HTTP.
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
