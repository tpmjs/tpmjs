'use client';

import { TPMJS_CATEGORIES } from '@tpmjs/types/tpmjs';
import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

const NAV_SECTIONS = [
  {
    title: 'Getting Started',
    items: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'quickstart', label: 'Quick Start' },
      { id: 'core-concepts', label: 'Core Concepts' },
    ],
  },
  {
    title: 'SDK Reference',
    items: [
      { id: 'installation', label: 'Installation' },
      { id: 'registry-search', label: 'registrySearchTool' },
      { id: 'registry-execute', label: 'registryExecuteTool' },
      { id: 'passing-api-keys', label: 'Passing API Keys' },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { id: 'api-overview', label: 'Overview' },
      { id: 'api-tools', label: 'GET /api/tools' },
      { id: 'api-tools-search', label: 'GET /api/tools/search' },
      { id: 'api-tool-detail', label: 'GET /api/tools/[id]' },
      { id: 'api-execute', label: 'POST /api/tools/execute' },
    ],
  },
  {
    title: 'Publishing Tools',
    items: [
      { id: 'publish-overview', label: 'Overview' },
      { id: 'tpmjs-spec', label: 'TPMJS Specification' },
      { id: 'metadata-tiers', label: 'Metadata Tiers' },
      { id: 'quality-score', label: 'Quality Score' },
    ],
  },
  {
    title: 'Advanced',
    items: [
      { id: 'override-execute', label: 'Override Execute' },
      { id: 'custom-wrappers', label: 'Custom Wrappers' },
      { id: 'self-hosting', label: 'Self-Hosting' },
      { id: 'security', label: 'Security' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { id: 'faq', label: 'FAQ' },
      { id: 'troubleshooting', label: 'Troubleshooting' },
      { id: 'changelog', label: 'Changelog' },
    ],
  },
];

function SidebarNav({
  activeSection,
  onSectionClick,
}: {
  activeSection: string;
  onSectionClick: (id: string) => void;
}) {
  return (
    <nav className="space-y-6">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary mb-2">
            {section.title}
          </h3>
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSectionClick(item.id)}
                  className={`block w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                    activeSection === item.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground-secondary hover:text-foreground hover:bg-surface-elevated'
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 mb-16">
      <h2 className="text-2xl font-bold mb-6 text-foreground pb-3 border-b border-border">
        {title}
      </h2>
      {children}
    </section>
  );
}

function DocSubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function ParamTable({
  params,
}: {
  params: { name: string; type: string; required: boolean; description: string }[];
}) {
  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="text-left py-3 px-4 text-foreground font-medium">Parameter</th>
            <th className="text-left py-3 px-4 text-foreground font-medium">Type</th>
            <th className="text-left py-3 px-4 text-foreground font-medium">Required</th>
            <th className="text-left py-3 px-4 text-foreground font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((param, i) => (
            <tr
              key={param.name}
              className={i !== params.length - 1 ? 'border-b border-border' : ''}
            >
              <td className="py-3 px-4 font-mono text-primary">{param.name}</td>
              <td className="py-3 px-4 font-mono text-foreground-secondary">{param.type}</td>
              <td className="py-3 px-4">
                {param.required ? (
                  <Badge variant="default" size="sm">
                    Yes
                  </Badge>
                ) : (
                  <span className="text-foreground-tertiary">No</span>
                )}
              </td>
              <td className="py-3 px-4 text-foreground-secondary">{param.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5 border border-border rounded-lg bg-surface">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div>
          <h4 className="font-semibold text-foreground mb-1">{title}</h4>
          <p className="text-sm text-foreground-secondary">{children}</p>
        </div>
      </div>
    </div>
  );
}

export default function DocsPage(): React.ReactElement {
  const [activeSection, setActiveSection] = useState('introduction');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -66%' }
    );

    NAV_SECTIONS.forEach((section) => {
      section.items.forEach((item) => {
        const element = document.getElementById(item.id);
        if (element) observer.observe(element);
      });
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-border bg-surface/50">
          <div className="sticky top-0 h-screen overflow-y-auto py-8 px-4">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-foreground">Documentation</h2>
              <p className="text-sm text-foreground-tertiary">v1.0.0</p>
            </div>
            <SidebarNav activeSection={activeSection} onSectionClick={scrollToSection} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto px-6 py-12">
            {/* Hero */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold mb-4 text-foreground">TPMJS Documentation</h1>
              <p className="text-xl text-foreground-secondary mb-6">
                The complete guide to using TPMJS - the registry for AI tools.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://www.npmjs.com/package/@tpmjs/registry-search"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="default" size="sm">
                    Get Started
                  </Button>
                </a>
                <a href="https://github.com/tpmjs/tpmjs" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    View on GitHub
                  </Button>
                </a>
                <a href="https://playground.tpmjs.com" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    Try Playground
                  </Button>
                </a>
              </div>
            </div>

            {/* ==================== GETTING STARTED ==================== */}
            <DocSection id="introduction" title="Introduction">
              <p className="text-foreground-secondary mb-6">
                TPMJS (Tool Package Manager for JavaScript) is a registry and execution platform for
                AI tools. It enables AI agents to dynamically discover, load, and execute tools from
                npm packages at runtime.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <InfoCard icon="🔍" title="Discover">
                  Search thousands of AI tools from the npm ecosystem
                </InfoCard>
                <InfoCard icon="⚡" title="Execute">
                  Run any tool in a secure sandbox - no installation needed
                </InfoCard>
                <InfoCard icon="📦" title="Publish">
                  Share your tools with the AI community via npm
                </InfoCard>
              </div>
              <p className="text-foreground-secondary">
                TPMJS works with{' '}
                <a
                  href="https://sdk.vercel.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Vercel AI SDK
                </a>
                , LangChain, LlamaIndex, and any framework that supports the AI SDK tool format.
              </p>
            </DocSection>

            <DocSection id="quickstart" title="Quick Start">
              <p className="text-foreground-secondary mb-6">
                Get up and running with TPMJS in under 2 minutes.
              </p>
              <DocSubSection title="1. Install the SDK packages">
                <CodeBlock
                  language="bash"
                  code="npm install @tpmjs/registry-search @tpmjs/registry-execute"
                />
              </DocSubSection>
              <DocSubSection title="2. Add to your agent">
                <CodeBlock
                  language="typescript"
                  code={`import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { registrySearchTool } from '@tpmjs/registry-search';
import { registryExecuteTool } from '@tpmjs/registry-execute';

const result = await streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: {
    registrySearch: registrySearchTool,
    registryExecute: registryExecuteTool,
  },
  system: \`You have access to thousands of tools via the TPMJS registry.
Use registrySearch to find tools, then registryExecute to run them.\`,
  prompt: 'Search for web scraping tools and scrape example.com',
});`}
                />
              </DocSubSection>
              <DocSubSection title="3. That's it!">
                <p className="text-foreground-secondary">
                  Your agent can now discover and execute any tool from the TPMJS registry. The
                  agent will automatically search for relevant tools and execute them as needed.
                </p>
              </DocSubSection>
            </DocSection>

            <DocSection id="core-concepts" title="Core Concepts">
              <div className="space-y-6">
                <DocSubSection title="Tool Discovery">
                  <p className="text-foreground-secondary mb-4">
                    TPMJS automatically discovers tools from npm packages that have the{' '}
                    <code className="text-primary bg-surface px-1.5 py-0.5 rounded">
                      tpmjs-tool
                    </code>{' '}
                    keyword. Tools are indexed every 2-15 minutes.
                  </p>
                </DocSubSection>
                <DocSubSection title="Sandboxed Execution">
                  <p className="text-foreground-secondary mb-4">
                    All tools run in an isolated Deno runtime on Railway. They cannot access your
                    local filesystem or environment. API keys are passed per-request and never
                    stored.
                  </p>
                </DocSubSection>
                <DocSubSection title="Quality Scoring">
                  <p className="text-foreground-secondary mb-4">
                    Every tool receives a quality score (0.00-1.00) based on metadata completeness,
                    npm downloads, and GitHub stars. Higher scores mean better visibility in search
                    results.
                  </p>
                </DocSubSection>
                <DocSubSection title="Health Monitoring">
                  <p className="text-foreground-secondary">
                    Tools are continuously health-checked to ensure they can be imported and
                    executed. Broken tools are flagged and can be filtered from search results.
                  </p>
                </DocSubSection>
              </div>
            </DocSection>

            {/* ==================== SDK REFERENCE ==================== */}
            <DocSection id="installation" title="Installation">
              <p className="text-foreground-secondary mb-6">
                Install the TPMJS SDK packages to give your AI agent access to the tool registry.
              </p>
              <div className="space-y-4">
                <CodeBlock
                  language="bash"
                  code="npm install @tpmjs/registry-search @tpmjs/registry-execute"
                />
                <CodeBlock
                  language="bash"
                  code="pnpm add @tpmjs/registry-search @tpmjs/registry-execute"
                />
                <CodeBlock
                  language="bash"
                  code="yarn add @tpmjs/registry-search @tpmjs/registry-execute"
                />
              </div>
              <div className="mt-6 p-4 border border-border rounded-lg bg-surface">
                <p className="text-sm text-foreground-secondary">
                  <strong className="text-foreground">Peer Dependencies:</strong> Both packages
                  require <code className="text-primary">ai</code> and{' '}
                  <code className="text-primary">zod</code> as peer dependencies. Make sure you have
                  them installed.
                </p>
              </div>
            </DocSection>

            <DocSection id="registry-search" title="registrySearchTool">
              <p className="text-foreground-secondary mb-6">
                Search the TPMJS registry to find tools for any task. Returns metadata including the{' '}
                <code className="text-primary">toolId</code> needed for execution.
              </p>
              <DocSubSection title="Import">
                <CodeBlock
                  language="typescript"
                  code={`import { registrySearchTool } from '@tpmjs/registry-search';`}
                />
              </DocSubSection>
              <DocSubSection title="Parameters">
                <ParamTable
                  params={[
                    {
                      name: 'query',
                      type: 'string',
                      required: true,
                      description: 'Search query (keywords, tool names, descriptions)',
                    },
                    {
                      name: 'category',
                      type: 'string',
                      required: false,
                      description: 'Filter by category',
                    },
                    {
                      name: 'limit',
                      type: 'number',
                      required: false,
                      description: 'Max results (1-20, default 5)',
                    },
                  ]}
                />
              </DocSubSection>
              <DocSubSection title="Return Value">
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
              </DocSubSection>
              <DocSubSection title="Available Categories">
                <div className="flex flex-wrap gap-2">
                  {TPMJS_CATEGORIES.map((cat) => (
                    <Badge key={cat} variant="secondary" size="sm">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </DocSubSection>
            </DocSection>

            <DocSection id="registry-execute" title="registryExecuteTool">
              <p className="text-foreground-secondary mb-6">
                Execute any tool from the registry by its{' '}
                <code className="text-primary">toolId</code>. Tools run in a secure sandbox—no local
                installation required.
              </p>
              <DocSubSection title="Import">
                <CodeBlock
                  language="typescript"
                  code={`import { registryExecuteTool } from '@tpmjs/registry-execute';`}
                />
              </DocSubSection>
              <DocSubSection title="Parameters">
                <ParamTable
                  params={[
                    {
                      name: 'toolId',
                      type: 'string',
                      required: true,
                      description: 'Tool identifier (format: package::name)',
                    },
                    {
                      name: 'params',
                      type: 'object',
                      required: true,
                      description: 'Parameters to pass to the tool',
                    },
                    {
                      name: 'env',
                      type: 'object',
                      required: false,
                      description: 'Environment variables (API keys)',
                    },
                  ]}
                />
              </DocSubSection>
              <DocSubSection title="Example">
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
              </DocSubSection>
            </DocSection>

            <DocSection id="passing-api-keys" title="Passing API Keys">
              <p className="text-foreground-secondary mb-6">
                Many tools require API keys (e.g., Firecrawl, Exa). The recommended approach is to
                wrap <code className="text-primary">registryExecuteTool</code> with your
                pre-configured keys.
              </p>
              <DocSubSection title="Create a Wrapper">
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
              </DocSubSection>
              <DocSubSection title="Use the Wrapped Tool">
                <CodeBlock
                  language="typescript"
                  code={`import { streamText } from 'ai';
import { registrySearchTool } from '@tpmjs/registry-search';
import { registryExecute } from './tools';  // Your wrapped version

const result = streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: {
    registrySearch: registrySearchTool,
    registryExecute,  // Keys are auto-injected
  },
  prompt: 'Scrape https://example.com and summarize the content',
});`}
                />
              </DocSubSection>
            </DocSection>

            {/* ==================== API REFERENCE ==================== */}
            <DocSection id="api-overview" title="API Overview">
              <p className="text-foreground-secondary mb-6">
                The TPMJS API is a REST API that provides access to the tool registry. All endpoints
                return JSON and are publicly accessible without authentication.
              </p>
              <div className="p-4 border border-border rounded-lg bg-surface">
                <p className="text-sm text-foreground-secondary">
                  <strong className="text-foreground">Base URL:</strong>{' '}
                  <code className="text-primary">https://tpmjs.com/api</code>
                </p>
              </div>
            </DocSection>

            <DocSection id="api-tools" title="GET /api/tools">
              <p className="text-foreground-secondary mb-6">
                List all tools with optional filtering and pagination.
              </p>
              <DocSubSection title="Query Parameters">
                <ParamTable
                  params={[
                    {
                      name: 'q',
                      type: 'string',
                      required: false,
                      description: 'Search query',
                    },
                    {
                      name: 'category',
                      type: 'string',
                      required: false,
                      description: 'Filter by category',
                    },
                    {
                      name: 'official',
                      type: 'boolean',
                      required: false,
                      description: 'Filter to official tools only',
                    },
                    {
                      name: 'limit',
                      type: 'number',
                      required: false,
                      description: 'Max results (default 20, max 50)',
                    },
                    {
                      name: 'offset',
                      type: 'number',
                      required: false,
                      description: 'Pagination offset',
                    },
                  ]}
                />
              </DocSubSection>
              <DocSubSection title="Example Request">
                <CodeBlock
                  language="bash"
                  code="curl https://tpmjs.com/api/tools?q=web+scraping&limit=5"
                />
              </DocSubSection>
            </DocSection>

            <DocSection id="api-tools-search" title="GET /api/tools/search">
              <p className="text-foreground-secondary mb-6">
                BM25-ranked search optimized for AI agent tool discovery.
              </p>
              <DocSubSection title="Query Parameters">
                <ParamTable
                  params={[
                    {
                      name: 'q',
                      type: 'string',
                      required: true,
                      description: 'Search query',
                    },
                    {
                      name: 'limit',
                      type: 'number',
                      required: false,
                      description: 'Max results (default 5, max 20)',
                    },
                  ]}
                />
              </DocSubSection>
            </DocSection>

            <DocSection id="api-tool-detail" title="GET /api/tools/[id]">
              <p className="text-foreground-secondary mb-6">
                Get detailed information about a specific tool.
              </p>
              <DocSubSection title="Path Parameters">
                <ParamTable
                  params={[
                    {
                      name: 'id',
                      type: 'string',
                      required: true,
                      description: 'Tool ID (npm package name)',
                    },
                  ]}
                />
              </DocSubSection>
              <DocSubSection title="Example Request">
                <CodeBlock language="bash" code="curl https://tpmjs.com/api/tools/@tpmjs/hello" />
              </DocSubSection>
            </DocSection>

            <DocSection id="api-execute" title="POST /api/tools/execute/[...slug]">
              <p className="text-foreground-secondary mb-6">
                Execute a tool with an AI agent and receive streaming results via Server-Sent Events
                (SSE). This endpoint allows you to run any TPMJS tool remotely without installing
                it.
              </p>
              <DocSubSection title="URL Formats">
                <div className="space-y-2 text-foreground-secondary text-sm mb-4">
                  <p>
                    <strong className="text-foreground">By tool ID:</strong>{' '}
                    <code className="text-primary">/api/tools/execute/clx123abc</code>
                  </p>
                  <p>
                    <strong className="text-foreground">By package and export:</strong>{' '}
                    <code className="text-primary">
                      /api/tools/execute/@tpmjs/hello/helloWorldTool
                    </code>
                  </p>
                </div>
              </DocSubSection>
              <DocSubSection title="Request Body">
                <ParamTable
                  params={[
                    {
                      name: 'prompt',
                      type: 'string',
                      required: true,
                      description: 'Natural language prompt for the AI agent (max 2000 chars)',
                    },
                    {
                      name: 'parameters',
                      type: 'object',
                      required: false,
                      description: 'Optional tool parameters to pass directly',
                    },
                  ]}
                />
              </DocSubSection>
              <DocSubSection title="SSE Events">
                <div className="space-y-4">
                  <div className="p-3 border border-border rounded-lg bg-surface">
                    <code className="text-primary font-mono">chunk</code>
                    <p className="text-sm text-foreground-secondary mt-1">
                      Streaming text chunks from the AI agent response
                    </p>
                  </div>
                  <div className="p-3 border border-border rounded-lg bg-surface">
                    <code className="text-primary font-mono">tokens</code>
                    <p className="text-sm text-foreground-secondary mt-1">
                      Token usage updates during execution
                    </p>
                  </div>
                  <div className="p-3 border border-border rounded-lg bg-surface">
                    <code className="text-primary font-mono">complete</code>
                    <p className="text-sm text-foreground-secondary mt-1">
                      Final result with output, token breakdown, and execution time
                    </p>
                  </div>
                  <div className="p-3 border border-border rounded-lg bg-surface">
                    <code className="text-primary font-mono">error</code>
                    <p className="text-sm text-foreground-secondary mt-1">
                      Error message if execution fails
                    </p>
                  </div>
                </div>
              </DocSubSection>
              <DocSubSection title="Example Request">
                <CodeBlock
                  language="bash"
                  code={`curl -X POST https://tpmjs.com/api/tools/execute/@tpmjs/hello/helloWorldTool \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Say hello to the world"}'`}
                />
              </DocSubSection>
              <DocSubSection title="JavaScript Example">
                <CodeBlock
                  language="typescript"
                  code={`const response = await fetch(
  'https://tpmjs.com/api/tools/execute/@tpmjs/hello/helloWorldTool',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Say hello to the world' }),
  }
);

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\\n');

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      const event = line.slice(7);
      console.log('Event:', event);
    }
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log('Data:', data);
    }
  }
}`}
                />
              </DocSubSection>
              <DocSubSection title="Rate Limiting">
                <InfoCard icon="clock" title="Rate Limits">
                  The execute endpoint is rate limited to 10 requests per minute per IP address.
                  Rate limit headers are included in the response:
                  <code className="block mt-2 text-sm">X-RateLimit-Limit: 10</code>
                  <code className="block text-sm">X-RateLimit-Remaining: 9</code>
                </InfoCard>
              </DocSubSection>
            </DocSection>

            {/* ==================== PUBLISHING TOOLS ==================== */}
            <DocSection id="publish-overview" title="Publishing Overview">
              <p className="text-foreground-secondary mb-6">
                Publishing a tool to TPMJS is as simple as publishing to npm with standardized
                metadata.
              </p>
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                {[
                  { step: '1', label: 'Add tpmjs-tool keyword' },
                  { step: '2', label: 'Add tpmjs field' },
                  { step: '3', label: 'Publish to npm' },
                  { step: '4', label: 'Live in 15 minutes!' },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="p-4 border border-border rounded-lg bg-surface text-center"
                  >
                    <div className="text-2xl font-bold text-primary mb-2">{item.step}</div>
                    <p className="text-sm text-foreground-secondary">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <Link href="/publish">
                  <Button variant="default">View Publishing Guide</Button>
                </Link>
                <a
                  href="https://github.com/tpmjs/tpmjs/tree/main/packages/tools/create-basic-tools"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline">Use Generator CLI</Button>
                </a>
              </div>
            </DocSection>

            <DocSection id="tpmjs-spec" title="TPMJS Specification">
              <p className="text-foreground-secondary mb-6">
                The <code className="text-primary">tpmjs</code> field in package.json describes your
                tool. TPMJS automatically extracts parameter schemas from your tool code, so you
                only need to provide basic metadata.
              </p>
              <div className="p-4 border border-primary/30 rounded-lg bg-primary/5 mb-6">
                <p className="text-sm text-foreground-secondary">
                  <strong className="text-foreground">✨ Auto Schema Extraction:</strong> Parameters
                  are automatically extracted from your tool&apos;s Zod inputSchema - no need to
                  document them manually!
                </p>
              </div>
              <CodeBlock
                language="json"
                code={`{
  "name": "@yourname/my-tool",
  "version": "1.0.0",
  "keywords": ["tpmjs-tool"],
  "tpmjs": {
    "category": "text-analysis",
    "frameworks": ["vercel-ai"],
    "tools": [
      {
        "name": "myTool",
        "description": "What your tool does (20-500 chars)"
      }
    ]
  }
}`}
              />
              <div className="mt-6 p-4 border border-primary/30 rounded-lg bg-primary/5">
                <p className="text-sm text-foreground-secondary">
                  <strong className="text-foreground">🔍 Auto-Discovery:</strong> The{' '}
                  <code className="text-primary">tools</code> array is optional! If you omit it,
                  TPMJS will automatically discover all exported tools from your package. Each
                  export that has a <code className="text-primary">description</code> and{' '}
                  <code className="text-primary">execute</code> property is treated as a valid tool.
                </p>
              </div>
              <div className="mt-6">
                <Link href="/spec">
                  <Button variant="outline">View Full Specification</Button>
                </Link>
              </div>
            </DocSection>

            <DocSection id="metadata-tiers" title="Metadata Fields">
              <p className="text-foreground-secondary mb-6">
                TPMJS auto-extracts parameter schemas and can auto-discover your tools, simplifying
                what you need to provide.
              </p>
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default">Required</Badge>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    <code className="text-primary">category</code> - The only truly required field!
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="success">Optional</Badge>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    <code className="text-primary">tools</code> (auto-discovered if omitted),{' '}
                    <code className="text-primary">env</code> (API keys),{' '}
                    <code className="text-primary">frameworks</code> (compatibility)
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Auto-extracted</Badge>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    <code className="text-primary">description</code>,{' '}
                    <code className="text-primary">parameters</code> - extracted from your tool code
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="warning">Auto-discovered</Badge>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    If you omit <code className="text-primary">tools</code>, TPMJS scans your
                    package exports and registers any export with{' '}
                    <code className="text-primary">description</code> +{' '}
                    <code className="text-primary">execute</code> properties as a tool.
                  </p>
                </div>
              </div>
            </DocSection>

            <DocSection id="quality-score" title="Quality Score">
              <p className="text-foreground-secondary mb-6">
                Every tool receives a quality score (0.00-1.00) that affects search ranking.
              </p>
              <CodeBlock
                language="typescript"
                code={`function calculateQualityScore(params: {
  tier: 'minimal' | 'basic' | 'rich';
  downloads: number;
  githubStars: number;
}): number {
  const tierScore = tier === 'rich' ? 0.6 : tier === 'basic' ? 0.4 : 0.2;
  const downloadsScore = Math.min(0.3, Math.log10(downloads + 1) / 10);
  const starsScore = Math.min(0.1, Math.log10(githubStars + 1) / 10);

  return Math.min(1.0, tierScore + downloadsScore + starsScore);
}`}
              />
            </DocSection>

            {/* ==================== ADVANCED ==================== */}
            <DocSection id="override-execute" title="Override Execute">
              <p className="text-foreground-secondary mb-6">
                When you import a tool from npm, you can override its{' '}
                <code className="text-primary">execute</code> function before passing it to your AI
                agent.
              </p>
              <DocSubSection title="Simple Override">
                <CodeBlock
                  language="typescript"
                  code={`import { someTool } from '@tpmjs/some-tool';

const myTool = {
  ...someTool,
  execute: async (args, options) => {
    console.log('Custom execution with args:', args);
    // Your completely custom implementation
    return { result: 'my custom result' };
  },
};`}
                />
              </DocSubSection>
              <DocSubSection title="Wrap with Logging">
                <CodeBlock
                  language="typescript"
                  code={`const wrappedTool = {
  ...someTool,
  execute: async (args, options) => {
    console.log(\`[\${new Date().toISOString()}] Calling tool with:\`, args);
    const start = Date.now();
    const result = await someTool.execute(args, options);
    console.log(\`[\${Date.now() - start}ms] Tool returned:\`, result);
    return result;
  },
};`}
                />
              </DocSubSection>
            </DocSection>

            <DocSection id="custom-wrappers" title="Custom Wrappers">
              <p className="text-foreground-secondary mb-6">
                Create reusable wrapper functions for common patterns like caching, retries, and
                rate limiting.
              </p>
              <DocSubSection title="Wrapper Factory">
                <CodeBlock
                  language="typescript"
                  code={`function wrapTool<T, R>(
  tool: { description: string; parameters: any; execute: (args: T, opts: any) => Promise<R> },
  options: {
    before?: (args: T) => T | Promise<T>;
    after?: (result: R) => R | Promise<R>;
    timeout?: number;
    retries?: number;
  } = {}
) {
  return {
    ...tool,
    execute: async (args: T, execOptions: any): Promise<R> => {
      let processedArgs = options.before ? await options.before(args) : args;

      let lastError: Error | undefined;
      const maxAttempts = (options.retries ?? 0) + 1;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          let result = await tool.execute(processedArgs, execOptions);
          if (options.after) result = await options.after(result);
          return result;
        } catch (error) {
          lastError = error as Error;
          if (attempt < maxAttempts) {
            await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 100));
          }
        }
      }
      throw lastError;
    },
  };
}`}
                />
              </DocSubSection>
            </DocSection>

            <DocSection id="self-hosting" title="Self-Hosting">
              <p className="text-foreground-secondary mb-6">
                Both SDK packages support self-hosted registries via environment variables.
              </p>
              <ParamTable
                params={[
                  {
                    name: 'TPMJS_API_URL',
                    type: 'string',
                    required: false,
                    description: 'Base URL for registry API (default: https://tpmjs.com)',
                  },
                  {
                    name: 'TPMJS_EXECUTOR_URL',
                    type: 'string',
                    required: false,
                    description: 'URL for sandbox executor (default: https://executor.tpmjs.com)',
                  },
                ]}
              />
              <div className="mt-4">
                <CodeBlock
                  language="bash"
                  code={`# Use your own TPMJS registry
export TPMJS_API_URL=https://registry.mycompany.com
export TPMJS_EXECUTOR_URL=https://executor.mycompany.com`}
                />
              </div>
            </DocSection>

            <DocSection id="security" title="Security">
              <p className="text-foreground-secondary mb-6">
                TPMJS is designed with security in mind.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <InfoCard icon="🏝️" title="Sandboxed Execution">
                  All tools run in an isolated Deno runtime. They cannot access your local
                  filesystem or environment.
                </InfoCard>
                <InfoCard icon="🔐" title="API Key Isolation">
                  API keys are passed per-request and never stored. Each execution is stateless and
                  isolated.
                </InfoCard>
                <InfoCard icon="✅" title="Registry-Only Execution">
                  Only tools registered in TPMJS can be executed. No arbitrary code execution is
                  possible.
                </InfoCard>
                <InfoCard icon="🏥" title="Health Monitoring">
                  Every tool is continuously health-checked. Broken tools are flagged and filtered
                  from search results.
                </InfoCard>
              </div>
            </DocSection>

            {/* ==================== RESOURCES ==================== */}
            <DocSection id="faq" title="FAQ">
              <div className="space-y-6">
                {[
                  {
                    q: 'How long does it take for my tool to appear?',
                    a: 'Tools are discovered within 2-15 minutes of publishing to npm. Make sure you have the "tpmjs-tool" keyword in your package.json.',
                  },
                  {
                    q: 'What is auto-discovery?',
                    a: 'If you omit the "tools" array from your tpmjs field, TPMJS will automatically scan your package exports and register any export that looks like an AI SDK tool (has description and execute properties). You can override this by explicitly listing tools.',
                  },
                  {
                    q: 'How does schema extraction work?',
                    a: "TPMJS automatically loads your tool in a sandbox and extracts the inputSchema from your Zod definition. You don't need to manually document parameters.",
                  },
                  {
                    q: 'Is TPMJS free to use?',
                    a: 'Yes! TPMJS is free for public tools. We may introduce paid tiers for private registries and enterprise features in the future.',
                  },
                  {
                    q: 'Can I use TPMJS with any AI framework?',
                    a: 'TPMJS works with any framework that supports the AI SDK tool format, including Vercel AI SDK, LangChain, and LlamaIndex.',
                  },
                  {
                    q: 'How are tools executed?',
                    a: 'Tools are dynamically loaded from esm.sh and executed in a sandboxed Deno runtime on Railway. No local installation is required.',
                  },
                ].map((item) => (
                  <div key={item.q} className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold text-foreground mb-2">{item.q}</h4>
                    <p className="text-sm text-foreground-secondary">{item.a}</p>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection id="troubleshooting" title="Troubleshooting">
              <div className="space-y-6">
                <DocSubSection title="Tool not appearing in registry">
                  <ul className="list-disc list-inside space-y-2 text-foreground-secondary">
                    <li>
                      Ensure you have{' '}
                      <code className="text-primary bg-surface px-1 rounded">tpmjs-tool</code> in
                      your keywords
                    </li>
                    <li>
                      Verify your <code className="text-primary">tpmjs</code> field is valid JSON
                    </li>
                    <li>Wait 15 minutes after publishing</li>
                    <li>Check the validation errors in the npm package page</li>
                  </ul>
                </DocSubSection>
                <DocSubSection title="Execution failing">
                  <ul className="list-disc list-inside space-y-2 text-foreground-secondary">
                    <li>Check that required environment variables are passed</li>
                    <li>Verify the toolId format is correct (package::name)</li>
                    <li>Check the tool&apos;s health status on tpmjs.com</li>
                  </ul>
                </DocSubSection>
              </div>
            </DocSection>

            <DocSection id="changelog" title="Changelog">
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default">v1.0.0</Badge>
                    <span className="text-sm text-foreground-tertiary">December 2024</span>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    Initial release with registrySearchTool and registryExecuteTool
                  </p>
                </div>
              </div>
            </DocSection>

            {/* CTA */}
            <section className="text-center py-12 border border-border rounded-lg bg-surface">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Ready to Get Started?</h2>
              <p className="text-foreground-secondary mb-6 max-w-xl mx-auto">
                Give your AI agent access to thousands of tools in minutes.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <a href="https://playground.tpmjs.com" target="_blank" rel="noopener noreferrer">
                  <Button variant="default" size="lg">
                    Try Playground
                  </Button>
                </a>
                <Link href="/tool/tool-search">
                  <Button variant="outline" size="lg">
                    Browse Tools
                  </Button>
                </Link>
                <Link href="/publish">
                  <Button variant="outline" size="lg">
                    Publish a Tool
                  </Button>
                </Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
