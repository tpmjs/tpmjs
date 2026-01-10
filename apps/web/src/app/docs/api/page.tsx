'use client';

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
      { id: 'overview', label: 'Overview' },
      { id: 'quick-start', label: 'Quick Start' },
      { id: 'authentication', label: 'Authentication' },
    ],
  },
  {
    title: 'Public Endpoints',
    items: [
      { id: 'tools', label: 'Tools' },
      { id: 'search', label: 'Search' },
      { id: 'collections', label: 'Collections' },
      { id: 'agents', label: 'Agents' },
      { id: 'stats', label: 'Stats' },
    ],
  },
  {
    title: 'MCP Protocol',
    items: [
      { id: 'mcp-overview', label: 'Overview' },
      { id: 'mcp-initialize', label: 'Initialize' },
      { id: 'mcp-tools-list', label: 'Tools List' },
      { id: 'mcp-tools-call', label: 'Tools Call' },
    ],
  },
  {
    title: 'Execution',
    items: [
      { id: 'execute-tool', label: 'Execute Tool' },
      { id: 'streaming', label: 'Streaming' },
    ],
  },
  {
    title: 'Response Format',
    items: [
      { id: 'success', label: 'Success Response' },
      { id: 'errors', label: 'Error Handling' },
      { id: 'pagination', label: 'Pagination' },
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

function EndpointCard({
  method,
  path,
  description,
  children,
}: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  children?: React.ReactNode;
}) {
  const methodColors = {
    GET: 'bg-green-500/10 text-green-500 border-green-500/30',
    POST: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    PUT: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    DELETE: 'bg-red-500/10 text-red-500 border-red-500/30',
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden mb-6">
      <div className="bg-surface p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <span
            className={`px-2 py-1 text-xs font-mono font-bold rounded border ${methodColors[method]}`}
          >
            {method}
          </span>
          <code className="text-sm font-mono text-foreground">{path}</code>
        </div>
        <p className="text-sm text-foreground-secondary">{description}</p>
      </div>
      {children && <div className="p-4 bg-background">{children}</div>}
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

export default function APIDocsPage(): React.ReactElement {
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      setMobileNavOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Mobile Navigation Toggle */}
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <span className="text-lg">{mobileNavOpen ? '✕' : '☰'}</span>
            <span>API Documentation</span>
          </button>
          {mobileNavOpen && (
            <div className="absolute left-0 right-0 top-full bg-background border-b border-border shadow-lg max-h-[70vh] overflow-y-auto px-4 py-4">
              <SidebarNav activeSection={activeSection} onSectionClick={scrollToSection} />
            </div>
          )}
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-border bg-surface/50">
          <div className="sticky top-0 h-screen overflow-y-auto py-8 px-4">
            <div className="mb-6">
              <Link
                href="/docs"
                className="text-foreground-secondary hover:text-foreground text-sm"
              >
                ← Back to Docs
              </Link>
              <h2 className="text-lg font-bold text-foreground mt-4">API Reference</h2>
              <p className="text-sm text-foreground-tertiary">REST & MCP</p>
            </div>
            <SidebarNav activeSection={activeSection} onSectionClick={scrollToSection} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            {/* Hero */}
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">API</Badge>
                <Badge variant="outline">v1.0</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                TPMJS API Reference
              </h1>
              <p className="text-xl text-foreground-secondary mb-6">
                REST API and MCP protocol for accessing tools, collections, and agents.
              </p>
              <div className="p-4 border border-border rounded-lg bg-surface">
                <p className="text-sm text-foreground-secondary">
                  <strong className="text-foreground">Base URL:</strong>{' '}
                  <code className="text-primary">https://tpmjs.com/api</code>
                </p>
              </div>
            </div>

            {/* ==================== GETTING STARTED ==================== */}
            <DocSection id="overview" title="Overview">
              <p className="text-foreground-secondary mb-6">
                The TPMJS API provides programmatic access to the tool registry, collections, and
                agents. There are two ways to interact with the API:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-5 border border-border rounded-lg bg-surface">
                  <h3 className="font-semibold text-foreground mb-2">REST API</h3>
                  <p className="text-sm text-foreground-secondary">
                    Standard REST endpoints for listing tools, searching, and executing. No
                    authentication required for public endpoints.
                  </p>
                </div>
                <div className="p-5 border border-border rounded-lg bg-surface">
                  <h3 className="font-semibold text-foreground mb-2">MCP Protocol</h3>
                  <p className="text-sm text-foreground-secondary">
                    JSON-RPC 2.0 over HTTP for AI clients like Claude Desktop, Cursor, and others
                    that support Model Context Protocol.
                  </p>
                </div>
              </div>
            </DocSection>

            <DocSection id="quick-start" title="Quick Start">
              <p className="text-foreground-secondary mb-6">
                Try these examples to get started immediately. All public endpoints work without
                authentication.
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">1. List Tools</h3>
                  <CodeBlock
                    language="bash"
                    code={`curl "https://tpmjs.com/api/tools?limit=5" | jq`}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">2. Search Tools</h3>
                  <CodeBlock
                    language="bash"
                    code={`curl "https://tpmjs.com/api/tools/search?q=web+scraping&limit=3" | jq`}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    3. Get Tool Details
                  </h3>
                  <CodeBlock
                    language="bash"
                    code={`curl "https://tpmjs.com/api/tools/@tpmjs/hello/helloWorldTool" | jq`}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    4. MCP Tools List (Collection)
                  </h3>
                  <CodeBlock
                    language="bash"
                    code={`curl -X POST "https://tpmjs.com/api/mcp/ajax/ajax-collection-tbc/http" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}' | jq`}
                  />
                </div>
              </div>
            </DocSection>

            <DocSection id="authentication" title="Authentication">
              <p className="text-foreground-secondary mb-6">
                Most public endpoints don&apos;t require authentication. Private endpoints (creating
                collections, managing agents) require a session cookie from signing in.
              </p>

              <div className="space-y-4">
                <div className="p-4 border border-green-500/30 rounded-lg bg-green-500/5">
                  <h3 className="font-semibold text-foreground mb-2">Public (No Auth)</h3>
                  <ul className="text-sm text-foreground-secondary list-disc list-inside space-y-1">
                    <li>GET /api/tools - List and search tools</li>
                    <li>GET /api/public/collections - List public collections</li>
                    <li>GET /api/public/agents - List public agents</li>
                    <li>POST /api/mcp/[user]/[slug]/http - MCP protocol for public collections</li>
                    <li>GET /api/stats - Platform statistics</li>
                  </ul>
                </div>

                <div className="p-4 border border-yellow-500/30 rounded-lg bg-yellow-500/5">
                  <h3 className="font-semibold text-foreground mb-2">Authenticated</h3>
                  <ul className="text-sm text-foreground-secondary list-disc list-inside space-y-1">
                    <li>POST /api/collections - Create collection</li>
                    <li>POST /api/agents - Create agent</li>
                    <li>PUT /api/collections/[id] - Update collection</li>
                    <li>DELETE /api/agents/[id] - Delete agent</li>
                  </ul>
                </div>
              </div>
            </DocSection>

            {/* ==================== PUBLIC ENDPOINTS ==================== */}
            <DocSection id="tools" title="Tools">
              <EndpointCard
                method="GET"
                path="/api/tools"
                description="List all tools with optional filtering and pagination."
              >
                <ParamTable
                  params={[
                    { name: 'q', type: 'string', required: false, description: 'Search query' },
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
                      description: 'Official tools only',
                    },
                    {
                      name: 'limit',
                      type: 'number',
                      required: false,
                      description: 'Results per page (default: 20, max: 50)',
                    },
                    {
                      name: 'offset',
                      type: 'number',
                      required: false,
                      description: 'Pagination offset',
                    },
                  ]}
                />
                <div className="mt-4">
                  <CodeBlock
                    language="bash"
                    code='curl "https://tpmjs.com/api/tools?category=web-scraping&limit=10"'
                  />
                </div>
              </EndpointCard>

              <EndpointCard
                method="GET"
                path="/api/tools/[package]/[toolName]"
                description="Get detailed information about a specific tool."
              >
                <CodeBlock
                  language="bash"
                  code='curl "https://tpmjs.com/api/tools/@tpmjs/hello/helloWorldTool"'
                />
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Response</h4>
                  <CodeBlock
                    language="json"
                    code={`{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "helloWorldTool",
    "description": "Returns a simple greeting",
    "package": {
      "npmPackageName": "@tpmjs/hello",
      "npmVersion": "1.0.0"
    },
    "inputSchema": {
      "type": "object",
      "properties": {}
    },
    "healthStatus": "HEALTHY",
    "qualityScore": 0.85
  }
}`}
                  />
                </div>
              </EndpointCard>
            </DocSection>

            <DocSection id="search" title="Search">
              <EndpointCard
                method="GET"
                path="/api/tools/search"
                description="BM25-ranked semantic search optimized for AI tool discovery."
              >
                <ParamTable
                  params={[
                    { name: 'q', type: 'string', required: true, description: 'Search query' },
                    {
                      name: 'limit',
                      type: 'number',
                      required: false,
                      description: 'Max results (default: 5, max: 20)',
                    },
                  ]}
                />
                <div className="mt-4">
                  <CodeBlock
                    language="bash"
                    code='curl "https://tpmjs.com/api/tools/search?q=convert+pdf+to+markdown&limit=5"'
                  />
                </div>
              </EndpointCard>
            </DocSection>

            <DocSection id="collections" title="Collections">
              <EndpointCard
                method="GET"
                path="/api/public/collections"
                description="List all public collections with tools and creator info."
              >
                <CodeBlock language="bash" code='curl "https://tpmjs.com/api/public/collections"' />
              </EndpointCard>

              <EndpointCard
                method="GET"
                path="/api/public/collections/[id]"
                description="Get a specific public collection with its tools."
              >
                <CodeBlock
                  language="bash"
                  code='curl "https://tpmjs.com/api/public/collections/clx123..."'
                />
              </EndpointCard>

              <EndpointCard
                method="GET"
                path="/api/public/users/[username]/collections/[slug]"
                description="Get a collection by username and slug (human-readable URL)."
              >
                <CodeBlock
                  language="bash"
                  code='curl "https://tpmjs.com/api/public/users/ajax/collections/web-tools"'
                />
              </EndpointCard>
            </DocSection>

            <DocSection id="agents" title="Agents">
              <EndpointCard
                method="GET"
                path="/api/public/agents"
                description="List all public agents with their configurations."
              >
                <CodeBlock language="bash" code='curl "https://tpmjs.com/api/public/agents"' />
              </EndpointCard>

              <EndpointCard
                method="GET"
                path="/api/public/users/[username]/agents/[uid]"
                description="Get an agent by username and unique identifier."
              >
                <CodeBlock
                  language="bash"
                  code='curl "https://tpmjs.com/api/public/users/lisa/agents/alpha"'
                />
              </EndpointCard>
            </DocSection>

            <DocSection id="stats" title="Stats">
              <EndpointCard
                method="GET"
                path="/api/stats"
                description="Get platform-wide statistics including tool counts and categories."
              >
                <CodeBlock language="bash" code='curl "https://tpmjs.com/api/stats"' />
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Response</h4>
                  <CodeBlock
                    language="json"
                    code={`{
  "success": true,
  "data": {
    "totalTools": 150,
    "totalPackages": 45,
    "totalExecutions": 12500,
    "categories": {
      "web-scraping": 25,
      "text-analysis": 18,
      "code-generation": 15
    }
  }
}`}
                  />
                </div>
              </EndpointCard>
            </DocSection>

            {/* ==================== MCP PROTOCOL ==================== */}
            <DocSection id="mcp-overview" title="MCP Overview">
              <p className="text-foreground-secondary mb-6">
                TPMJS implements the Model Context Protocol (MCP) for AI clients. Each public
                collection exposes an MCP endpoint that can be connected to Claude Desktop, Cursor,
                or any MCP-compatible client.
              </p>

              <div className="p-4 border border-border rounded-lg bg-surface mb-6">
                <h3 className="font-semibold text-foreground mb-2">Endpoint Format</h3>
                <code className="text-primary">
                  POST https://tpmjs.com/api/mcp/[username]/[collection-slug]/http
                </code>
              </div>

              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <h4 className="font-semibold text-foreground mb-2">Request Headers</h4>
                  <code className="text-sm text-foreground-secondary block">
                    Content-Type: application/json
                  </code>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <h4 className="font-semibold text-foreground mb-2">Protocol</h4>
                  <p className="text-sm text-foreground-secondary">
                    JSON-RPC 2.0 with MCP methods: <code className="text-primary">initialize</code>,{' '}
                    <code className="text-primary">tools/list</code>,{' '}
                    <code className="text-primary">tools/call</code>
                  </p>
                </div>
              </div>
            </DocSection>

            <DocSection id="mcp-initialize" title="MCP Initialize">
              <EndpointCard
                method="POST"
                path="/api/mcp/[username]/[slug]/http"
                description="Initialize an MCP session and get server capabilities."
              >
                <h4 className="text-sm font-semibold text-foreground mb-2">Request</h4>
                <CodeBlock
                  language="json"
                  code={`{
  "jsonrpc": "2.0",
  "method": "initialize",
  "id": 1
}`}
                />
                <h4 className="text-sm font-semibold text-foreground mb-2 mt-4">Response</h4>
                <CodeBlock
                  language="json"
                  code={`{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "serverInfo": {
      "name": "TPMJS: My Collection",
      "version": "1.0.0"
    },
    "capabilities": {
      "tools": {}
    }
  }
}`}
                />
              </EndpointCard>
            </DocSection>

            <DocSection id="mcp-tools-list" title="MCP Tools List">
              <EndpointCard
                method="POST"
                path="/api/mcp/[username]/[slug]/http"
                description="List all tools available in the collection with their schemas."
              >
                <h4 className="text-sm font-semibold text-foreground mb-2">Request</h4>
                <CodeBlock
                  language="json"
                  code={`{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 2
}`}
                />
                <h4 className="text-sm font-semibold text-foreground mb-2 mt-4">Response</h4>
                <CodeBlock
                  language="json"
                  code={`{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "tpmjs-tools-toc-generate--tocGenerateTool",
        "description": "Generate a table of contents from markdown",
        "inputSchema": {
          "type": "object",
          "required": ["markdown"],
          "properties": {
            "markdown": { "type": "string" }
          }
        }
      }
    ]
  }
}`}
                />
              </EndpointCard>
            </DocSection>

            <DocSection id="mcp-tools-call" title="MCP Tools Call">
              <EndpointCard
                method="POST"
                path="/api/mcp/[username]/[slug]/http"
                description="Execute a tool from the collection with the provided arguments."
              >
                <h4 className="text-sm font-semibold text-foreground mb-2">Request</h4>
                <CodeBlock
                  language="json"
                  code={`{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "tpmjs-tools-toc-generate--tocGenerateTool",
    "arguments": {
      "markdown": "# Heading 1\\n## Heading 2\\n### Heading 3"
    }
  },
  "id": 3
}`}
                />
                <h4 className="text-sm font-semibold text-foreground mb-2 mt-4">Response</h4>
                <CodeBlock
                  language="json"
                  code={`{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\\"toc\\": \\"- [Heading 1](#heading-1)\\\\n  - [Heading 2](#heading-2)\\"}"
      }
    ]
  }
}`}
                />
              </EndpointCard>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Full cURL Example</h3>
                <CodeBlock
                  language="bash"
                  code={`curl -X POST "https://tpmjs.com/api/mcp/ajax/ajax-collection-tbc/http" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "tpmjs-tools-changelog-entry--changelogEntryTool",
      "arguments": {
        "version": "1.0.0",
        "changes": [
          {"type": "Added", "description": "New feature"}
        ]
      }
    },
    "id": 1
  }'`}
                />
              </div>
            </DocSection>

            {/* ==================== EXECUTION ==================== */}
            <DocSection id="execute-tool" title="Execute Tool">
              <EndpointCard
                method="POST"
                path="/api/tools/execute/[package]/[toolName]"
                description="Execute a tool with an AI agent and stream the response."
              >
                <ParamTable
                  params={[
                    {
                      name: 'prompt',
                      type: 'string',
                      required: true,
                      description: 'Natural language prompt (max 2000 chars)',
                    },
                    {
                      name: 'parameters',
                      type: 'object',
                      required: false,
                      description: 'Direct tool parameters',
                    },
                  ]}
                />
                <div className="mt-4">
                  <CodeBlock
                    language="bash"
                    code={`curl -X POST "https://tpmjs.com/api/tools/execute/@tpmjs/hello/helloWorldTool" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Say hello to the world"}'`}
                  />
                </div>
              </EndpointCard>
            </DocSection>

            <DocSection id="streaming" title="Streaming Responses">
              <p className="text-foreground-secondary mb-6">
                The execute endpoint returns Server-Sent Events (SSE) for real-time streaming.
              </p>

              <div className="space-y-4 mb-6">
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <code className="text-primary font-mono">event: chunk</code>
                  <p className="text-sm text-foreground-secondary mt-1">
                    Streaming text from the AI agent
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <code className="text-primary font-mono">event: tokens</code>
                  <p className="text-sm text-foreground-secondary mt-1">Token usage updates</p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <code className="text-primary font-mono">event: complete</code>
                  <p className="text-sm text-foreground-secondary mt-1">
                    Final result with output and timing
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <code className="text-primary font-mono">event: error</code>
                  <p className="text-sm text-foreground-secondary mt-1">Error if execution fails</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-4">JavaScript Example</h3>
              <CodeBlock
                language="typescript"
                code={`const response = await fetch(
  'https://tpmjs.com/api/tools/execute/@tpmjs/hello/helloWorldTool',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Say hello' }),
  }
);

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  for (const line of chunk.split('\\n')) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(data);
    }
  }
}`}
              />
            </DocSection>

            {/* ==================== RESPONSE FORMAT ==================== */}
            <DocSection id="success" title="Success Response">
              <p className="text-foreground-secondary mb-6">
                All API endpoints return a consistent JSON response format.
              </p>
              <CodeBlock
                language="json"
                code={`{
  "success": true,
  "data": { ... },
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "meta": {
    "version": "1.0.0",
    "timestamp": "2026-01-10T12:00:00.000Z",
    "requestId": "abc123..."
  }
}`}
              />
            </DocSection>

            <DocSection id="errors" title="Error Handling">
              <p className="text-foreground-secondary mb-6">
                Errors include a code and message for debugging.
              </p>
              <CodeBlock
                language="json"
                code={`{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Tool not found"
  },
  "meta": {
    "version": "1.0.0",
    "timestamp": "2026-01-10T12:00:00.000Z"
  }
}`}
              />
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">HTTP Status Codes</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="success">200</Badge>
                    <span className="text-foreground-secondary">Success</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="warning">400</Badge>
                    <span className="text-foreground-secondary">
                      Bad request / validation error
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="warning">401</Badge>
                    <span className="text-foreground-secondary">Authentication required</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="error">404</Badge>
                    <span className="text-foreground-secondary">Resource not found</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="error">429</Badge>
                    <span className="text-foreground-secondary">Rate limit exceeded</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="error">500</Badge>
                    <span className="text-foreground-secondary">Internal server error</span>
                  </div>
                </div>
              </div>
            </DocSection>

            <DocSection id="pagination" title="Pagination">
              <p className="text-foreground-secondary mb-6">
                List endpoints support limit/offset pagination.
              </p>
              <ParamTable
                params={[
                  {
                    name: 'limit',
                    type: 'number',
                    required: false,
                    description: 'Items per page (default varies by endpoint)',
                  },
                  {
                    name: 'offset',
                    type: 'number',
                    required: false,
                    description: 'Number of items to skip',
                  },
                ]}
              />
              <div className="mt-4">
                <CodeBlock
                  language="bash"
                  code={`# Page 1: First 20 items
curl "https://tpmjs.com/api/tools?limit=20&offset=0"

# Page 2: Next 20 items
curl "https://tpmjs.com/api/tools?limit=20&offset=20"`}
                />
              </div>
            </DocSection>

            {/* CTA */}
            <section className="text-center py-12 border border-border rounded-lg bg-surface mt-12">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Need More Help?</h2>
              <p className="text-foreground-secondary mb-6 max-w-xl mx-auto">
                Check out the full documentation or try the interactive playground.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/docs">
                  <Button variant="default">Full Documentation</Button>
                </Link>
                <a href="https://playground.tpmjs.com" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">Try Playground</Button>
                </a>
                <a href="https://github.com/tpmjs/tpmjs" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">GitHub</Button>
                </a>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
