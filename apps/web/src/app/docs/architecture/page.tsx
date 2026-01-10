'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';

// Reusable box component for architecture diagrams
function ArchBox({
  children,
  className = '',
  variant = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'muted' | 'header';
}) {
  const variants = {
    default: 'border-border bg-surface',
    muted: 'border-border bg-surface-secondary/70',
    header:
      'border-border-strong bg-surface-secondary font-mono text-sm font-medium text-foreground',
  };

  return (
    <div className={`border rounded-lg px-3 py-2 ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}

// Small cell for grid items
function Cell({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <div
      className={`border rounded px-2 py-1.5 text-xs font-mono ${
        muted
          ? 'border-border/60 bg-surface-secondary/50 text-foreground-tertiary'
          : 'border-border bg-background text-foreground-secondary'
      }`}
    >
      {children}
    </div>
  );
}

// Section wrapper
function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-16">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">{title}</h2>
      {subtitle && <p className="text-foreground-secondary text-sm mb-6">{subtitle}</p>}
      {children}
    </section>
  );
}

export default function ArchitecturePage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 py-12">
        <Container size="lg" padding="lg">
          {/* Hero */}
          <div className="mb-12">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              TPMJS Architecture
            </h1>
            <p className="text-foreground-secondary text-lg max-w-3xl">
              A complete overview of the TPMJS platform - from tool discovery to sandboxed
              execution, collections, agents, and custom executors.
            </p>
          </div>

          {/* ===================== PLATFORM OVERVIEW ===================== */}
          <Section
            title="Platform Overview"
            subtitle="The complete TPMJS stack - tool registry, execution infrastructure, and user-facing products."
          >
            <div className="border border-border rounded-xl p-4 md:p-6 bg-surface/50">
              {/* Top Layer - User Products */}
              <ArchBox variant="header" className="mb-4 text-center">
                USER PRODUCTS
              </ArchBox>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Web App */}
                <div className="border border-border rounded-lg p-4 bg-background">
                  <div className="text-sm font-semibold text-foreground mb-3 text-center">
                    tpmjs.com
                  </div>
                  <div className="space-y-2">
                    <Cell>Dashboard</Cell>
                    <Cell>Tool Browser</Cell>
                    <Cell>Collection Editor</Cell>
                    <Cell>Agent Builder</Cell>
                    <Cell>Playground</Cell>
                  </div>
                </div>

                {/* SDK */}
                <div className="border border-border rounded-lg p-4 bg-background">
                  <div className="text-sm font-semibold text-foreground mb-3 text-center">
                    SDK Packages
                  </div>
                  <div className="space-y-2">
                    <Cell>@tpmjs/registry-search</Cell>
                    <Cell>@tpmjs/registry-execute</Cell>
                    <Cell>@tpmjs/types</Cell>
                    <Cell>@tpmjs/ui</Cell>
                  </div>
                </div>

                {/* MCP */}
                <div className="border border-border rounded-lg p-4 bg-background">
                  <div className="text-sm font-semibold text-foreground mb-3 text-center">
                    MCP Protocol
                  </div>
                  <div className="space-y-2">
                    <Cell>Claude Desktop</Cell>
                    <Cell>Cursor</Cell>
                    <Cell>Claude Code</Cell>
                    <Cell>Any MCP Client</Cell>
                  </div>
                </div>
              </div>

              {/* Middle Layer - API */}
              <ArchBox variant="header" className="mb-4 text-center">
                API LAYER (Next.js 16)
              </ArchBox>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                <Cell>/api/tools</Cell>
                <Cell>/api/tools/search</Cell>
                <Cell>/api/tools/execute</Cell>
                <Cell>/api/collections</Cell>
                <Cell>/api/agents</Cell>
                <Cell>/api/mcp/*</Cell>
                <Cell muted>/api/sync/*</Cell>
                <Cell muted>/api/health</Cell>
              </div>

              {/* Bottom Layer - Infrastructure */}
              <ArchBox variant="header" className="mb-4 text-center">
                INFRASTRUCTURE
              </ArchBox>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ArchBox variant="muted" className="p-3">
                  <div className="text-xs text-foreground-tertiary mb-2 font-mono uppercase">
                    Database
                  </div>
                  <div className="space-y-2">
                    <Cell>PostgreSQL (Neon)</Cell>
                    <Cell>Prisma ORM</Cell>
                  </div>
                </ArchBox>
                <ArchBox variant="muted" className="p-3">
                  <div className="text-xs text-foreground-tertiary mb-2 font-mono uppercase">
                    Execution
                  </div>
                  <div className="space-y-2">
                    <Cell>Vercel Sandbox</Cell>
                    <Cell>Custom Executors</Cell>
                  </div>
                </ArchBox>
                <ArchBox variant="muted" className="p-3">
                  <div className="text-xs text-foreground-tertiary mb-2 font-mono uppercase">
                    External
                  </div>
                  <div className="space-y-2">
                    <Cell>npm Registry</Cell>
                    <Cell>esm.sh CDN</Cell>
                  </div>
                </ArchBox>
              </div>
            </div>
          </Section>

          {/* ===================== TOOL EXECUTION FLOW ===================== */}
          <Section
            title="Tool Execution Pipeline"
            subtitle="How a tool call flows from SDK/MCP through the executor sandbox."
          >
            <div className="border border-border rounded-xl p-4 md:p-6 bg-surface/50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Request */}
                <ArchBox className="p-4">
                  <div className="font-semibold text-foreground mb-3 text-center">1. REQUEST</div>
                  <div className="space-y-2 text-xs">
                    <div className="border border-border rounded p-2 bg-background">
                      <span className="text-foreground-tertiary">SDK:</span>
                      <span className="text-foreground ml-2 font-medium">registryExecute()</span>
                    </div>
                    <div className="border border-border rounded p-2 bg-background">
                      <span className="text-foreground-tertiary">MCP:</span>
                      <span className="text-foreground ml-2 font-medium">tools/call</span>
                    </div>
                    <div className="border border-border rounded p-2 bg-background">
                      <span className="text-foreground-tertiary">Agent:</span>
                      <span className="text-foreground ml-2 font-medium">tool_call</span>
                    </div>
                  </div>
                </ArchBox>

                {/* Resolution */}
                <ArchBox className="p-4">
                  <div className="font-semibold text-foreground mb-3 text-center">2. RESOLVE</div>
                  <div className="space-y-2 text-xs">
                    <div className="border border-border rounded p-2 bg-background text-foreground-secondary">
                      Lookup tool by ID
                    </div>
                    <div className="border border-border rounded p-2 bg-background text-foreground-secondary">
                      Resolve executor config
                    </div>
                    <div className="border border-border rounded p-2 bg-background text-foreground-secondary">
                      Build import URL
                    </div>
                  </div>
                </ArchBox>

                {/* Executor */}
                <ArchBox className="p-4">
                  <div className="font-semibold text-foreground mb-3 text-center">3. EXECUTE</div>
                  <div className="space-y-2 text-xs">
                    <div className="border border-border rounded p-2 bg-background text-foreground-secondary">
                      npm install pkg
                    </div>
                    <div className="border border-border rounded p-2 bg-background text-foreground-secondary">
                      tool.execute(params)
                    </div>
                    <div className="border border-border rounded p-2 bg-background text-foreground-secondary">
                      Return result
                    </div>
                  </div>
                </ArchBox>

                {/* Response */}
                <ArchBox className="p-4">
                  <div className="font-semibold text-foreground mb-3 text-center">4. RESPONSE</div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="border border-border rounded p-2 bg-background text-foreground-secondary">
                      output: any
                    </div>
                    <div className="border border-border rounded p-2 bg-background text-foreground-secondary">
                      executionTimeMs
                    </div>
                    <div className="border border-border rounded p-2 bg-background text-foreground-secondary">
                      success: boolean
                    </div>
                  </div>
                </ArchBox>
              </div>
            </div>
          </Section>

          {/* ===================== EXECUTOR ARCHITECTURE ===================== */}
          <Section
            title="Executor System"
            subtitle="Sandboxed runtime environments for safe tool execution. Support for default and custom executors."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default Executor */}
              <div className="border border-border rounded-xl p-5 bg-surface/50">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="default">Default</Badge>
                  <span className="font-semibold text-foreground">Vercel Sandbox</span>
                </div>

                <ArchBox variant="muted" className="mb-4 p-3">
                  <div className="text-xs text-foreground-tertiary mb-2 font-mono uppercase">
                    Sandbox VM
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Cell>Node.js 22</Cell>
                    <Cell>2 vCPUs</Cell>
                    <Cell>2 min timeout</Cell>
                    <Cell>Isolated FS</Cell>
                  </div>
                </ArchBox>

                <div className="space-y-2 text-sm text-foreground-secondary">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">✓</span>
                    Network isolated
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">✓</span>
                    Per-request env injection
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">✓</span>
                    Automatic npm install
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">✓</span>
                    Cold start optimized
                  </div>
                </div>
              </div>

              {/* Custom Executor */}
              <div className="border border-border rounded-xl p-5 bg-surface/50">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">Custom</Badge>
                  <span className="font-semibold text-foreground">User-Deployed</span>
                </div>

                <ArchBox variant="muted" className="mb-4 p-3">
                  <div className="text-xs text-foreground-tertiary mb-2 font-mono uppercase">
                    User Infrastructure
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Cell>Vercel</Cell>
                    <Cell>Railway</Cell>
                    <Cell>AWS Lambda</Cell>
                    <Cell>Self-hosted</Cell>
                  </div>
                </ArchBox>

                <div className="space-y-2 text-sm text-foreground-secondary">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">★</span>
                    Custom dependencies pre-installed
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">★</span>
                    Your own API keys built-in
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">★</span>
                    Custom security policies
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">★</span>
                    One-click deploy templates
                  </div>
                </div>
              </div>
            </div>

            {/* Executor API Contract */}
            <div className="mt-6 border border-border rounded-xl p-5 bg-surface/50">
              <div className="text-xs text-foreground-tertiary mb-4 font-mono uppercase">
                Executor API Contract
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-foreground font-medium mb-2 font-mono">
                    POST /execute-tool
                  </div>
                  <div className="space-y-1 text-xs text-foreground-secondary font-mono pl-3">
                    <div>packageName: string</div>
                    <div>name: string</div>
                    <div>params: object</div>
                    <div>env?: object</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-foreground font-medium mb-2 font-mono">Response</div>
                  <div className="space-y-1 text-xs text-foreground-secondary font-mono pl-3">
                    <div>success: boolean</div>
                    <div>output?: any</div>
                    <div>error?: string</div>
                    <div>executionTimeMs: number</div>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* ===================== COLLECTIONS & AGENTS ===================== */}
          <Section
            title="Collections & Agents"
            subtitle="Higher-level abstractions built on top of the tool registry."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Collections */}
              <div className="border border-border rounded-xl p-5 bg-surface/50">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">Collection</Badge>
                </div>
                <p className="text-sm text-foreground-secondary mb-4">
                  Curated bundles of tools exposed via MCP protocol or API.
                </p>

                <ArchBox variant="muted" className="mb-4 p-3">
                  <div className="text-xs text-foreground-tertiary mb-2 font-mono uppercase">
                    Structure
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-foreground-tertiary">name</span>
                      <span className="text-foreground">&quot;Web Scraping Tools&quot;</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-tertiary">tools[]</span>
                      <span className="text-foreground">CollectionTool[]</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-tertiary">executorConfig</span>
                      <span className="text-foreground-secondary">?ExecutorConfig</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-tertiary">visibility</span>
                      <span className="text-foreground-tertiary">public | private</span>
                    </div>
                  </div>
                </ArchBox>

                <div className="space-y-2">
                  <Cell>/api/mcp/&#123;user&#125;/&#123;slug&#125;/http</Cell>
                  <Cell>/api/collections/&#123;id&#125;</Cell>
                  <Cell muted>Tool-level env overrides</Cell>
                </div>
              </div>

              {/* Agents */}
              <div className="border border-border rounded-xl p-5 bg-surface/50">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="default">Agent</Badge>
                </div>
                <p className="text-sm text-foreground-secondary mb-4">
                  AI-powered assistants with multi-turn conversations and tool access.
                </p>

                <ArchBox variant="muted" className="mb-4 p-3">
                  <div className="text-xs text-foreground-tertiary mb-2 font-mono uppercase">
                    Structure
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-foreground-tertiary">name</span>
                      <span className="text-foreground">&quot;Research Assistant&quot;</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-tertiary">systemPrompt</span>
                      <span className="text-foreground">string</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-tertiary">collections[]</span>
                      <span className="text-foreground">Collection[]</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-tertiary">model</span>
                      <span className="text-foreground-tertiary">gpt-4o | claude-3.5...</span>
                    </div>
                  </div>
                </ArchBox>

                <div className="space-y-2">
                  <Cell>/agents/&#123;id&#125;/chat</Cell>
                  <Cell>Streaming: SSE tool_call events</Cell>
                  <Cell muted>Persistent conversations</Cell>
                </div>
              </div>
            </div>

            {/* Hierarchy */}
            <div className="mt-6 border border-border rounded-xl p-5 bg-surface/50">
              <div className="text-xs text-foreground-tertiary mb-4 font-mono uppercase">
                Executor Config Hierarchy
              </div>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
                <ArchBox variant="muted" className="px-4 py-2">
                  <div className="text-xs text-foreground-tertiary">System Default</div>
                  <div className="text-sm text-foreground">Vercel Sandbox</div>
                </ArchBox>
                <span className="text-foreground-tertiary hidden md:block">→</span>
                <span className="text-foreground-tertiary md:hidden">↓</span>
                <ArchBox className="px-4 py-2">
                  <div className="text-xs text-foreground-tertiary">Collection Config</div>
                  <div className="text-sm text-foreground font-medium">executorConfig</div>
                </ArchBox>
                <span className="text-foreground-tertiary hidden md:block">→</span>
                <span className="text-foreground-tertiary md:hidden">↓</span>
                <ArchBox className="px-4 py-2">
                  <div className="text-xs text-foreground-tertiary">Agent Override</div>
                  <div className="text-sm text-foreground font-medium">agent.executorConfig</div>
                </ArchBox>
              </div>
              <p className="text-xs text-foreground-tertiary mt-4 text-center">
                Agent config overrides Collection config, which overrides System default.
              </p>
            </div>
          </Section>

          {/* ===================== DATA FLOW ===================== */}
          <Section
            title="Tool Discovery & Sync"
            subtitle="How tools are discovered from npm and kept in sync with the registry."
          >
            <div className="border border-border rounded-xl p-4 md:p-6 bg-surface/50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <ArchBox variant="muted" className="p-3">
                  <div className="text-xs text-foreground-tertiary mb-2 font-mono uppercase">
                    npm Registry
                  </div>
                  <div className="space-y-2">
                    <Cell>keyword: &quot;tpmjs&quot;</Cell>
                    <Cell>tpmjs field</Cell>
                    <Cell muted>package.json</Cell>
                  </div>
                </ArchBox>

                <ArchBox className="p-3">
                  <div className="text-xs text-foreground mb-2 font-mono uppercase">Sync Jobs</div>
                  <div className="space-y-2">
                    <Cell>Changes Feed (2min)</Cell>
                    <Cell>Keyword Search (15min)</Cell>
                    <Cell muted>Metrics Sync (1hr)</Cell>
                  </div>
                </ArchBox>

                <ArchBox className="p-3">
                  <div className="text-xs text-foreground mb-2 font-mono uppercase">Processing</div>
                  <div className="space-y-2">
                    <Cell>Validate tpmjs field</Cell>
                    <Cell>Extract inputSchema</Cell>
                    <Cell>Calculate quality score</Cell>
                  </div>
                </ArchBox>

                <ArchBox variant="muted" className="p-3">
                  <div className="text-xs text-foreground-tertiary mb-2 font-mono uppercase">
                    Database
                  </div>
                  <div className="space-y-2">
                    <Cell>Tool (metadata)</Cell>
                    <Cell>Package (npm info)</Cell>
                    <Cell>inputSchema (JSON)</Cell>
                  </div>
                </ArchBox>
              </div>
            </div>
          </Section>

          {/* ===================== TOOL SCHEMA ===================== */}
          <Section
            title="Tool Data Model"
            subtitle="Core entities and their relationships in the TPMJS database."
          >
            <div className="border border-border rounded-xl p-4 md:p-6 bg-surface/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Package */}
                <ArchBox variant="muted" className="p-4">
                  <div className="font-semibold text-foreground mb-3">Package</div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="text-foreground-secondary">
                      npmPackageName <span className="text-foreground-tertiary">PK</span>
                    </div>
                    <div className="text-foreground-tertiary">npmVersion</div>
                    <div className="text-foreground-tertiary">npmDownloadsLastMonth</div>
                    <div className="text-foreground-tertiary">repositoryUrl</div>
                    <div className="text-foreground-tertiary">author</div>
                  </div>
                </ArchBox>

                {/* Tool */}
                <ArchBox className="p-4">
                  <div className="font-semibold text-foreground mb-3">Tool</div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="text-foreground">
                      id <span className="text-foreground-tertiary">PK</span>
                    </div>
                    <div className="text-foreground">name</div>
                    <div className="text-foreground">description</div>
                    <div className="text-foreground">
                      inputSchema <span className="text-foreground-tertiary">JSON</span>
                    </div>
                    <div className="text-foreground">category</div>
                    <div className="text-foreground-secondary">qualityScore</div>
                    <div className="text-foreground-secondary">healthStatus</div>
                    <div className="text-foreground-tertiary">
                      packageId <span className="text-foreground-tertiary">FK</span>
                    </div>
                  </div>
                </ArchBox>

                {/* CollectionTool */}
                <ArchBox className="p-4">
                  <div className="font-semibold text-foreground mb-3">CollectionTool</div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="text-foreground">
                      collectionId <span className="text-foreground-tertiary">FK</span>
                    </div>
                    <div className="text-foreground">
                      toolId <span className="text-foreground-tertiary">FK</span>
                    </div>
                    <div className="text-foreground-secondary">displayName</div>
                    <div className="text-foreground-secondary">
                      envOverrides <span className="text-foreground-tertiary">JSON</span>
                    </div>
                    <div className="text-foreground-tertiary">position</div>
                  </div>
                </ArchBox>
              </div>

              {/* Relations */}
              <div className="mt-6 flex flex-wrap gap-3 justify-center text-xs text-foreground-tertiary">
                <div className="border border-border rounded px-3 py-1 bg-background">
                  Package 1:N Tool
                </div>
                <div className="border border-border rounded px-3 py-1 bg-background">
                  Collection N:M Tool
                </div>
                <div className="border border-border rounded px-3 py-1 bg-background">
                  Agent N:M Collection
                </div>
                <div className="border border-border rounded px-3 py-1 bg-background">
                  User 1:N Agent
                </div>
              </div>
            </div>
          </Section>

          {/* Links */}
          <section className="border border-border rounded-xl p-6 bg-surface/50">
            <h3 className="text-lg font-semibold text-foreground mb-4">Learn More</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/docs"
                className="border border-border rounded-lg p-4 bg-background hover:border-foreground/30 transition-colors"
              >
                <div className="text-foreground text-sm font-mono font-medium mb-1">
                  Documentation
                </div>
                <div className="text-xs text-foreground-tertiary">Full SDK and API reference</div>
              </Link>
              <Link
                href="/docs/executors"
                className="border border-border rounded-lg p-4 bg-background hover:border-foreground/30 transition-colors"
              >
                <div className="text-foreground text-sm font-mono font-medium mb-1">
                  Custom Executors
                </div>
                <div className="text-xs text-foreground-tertiary">
                  Deploy your own execution environment
                </div>
              </Link>
              <Link
                href="/docs/agents"
                className="border border-border rounded-lg p-4 bg-background hover:border-foreground/30 transition-colors"
              >
                <div className="text-foreground text-sm font-mono font-medium mb-1">Agent Docs</div>
                <div className="text-xs text-foreground-tertiary">
                  Build AI assistants with tools
                </div>
              </Link>
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}
