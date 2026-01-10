'use client';

import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';

// Chip-style box component
function ChipBox({
  children,
  className = '',
  variant = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'highlight' | 'muted' | 'header';
}) {
  const variants = {
    default: 'border-lime-500/40 bg-lime-500/5 text-lime-300',
    accent: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
    highlight: 'border-lime-400 bg-lime-500/20 text-lime-200',
    muted: 'border-zinc-600 bg-zinc-800/50 text-zinc-400',
    header: 'border-lime-500/60 bg-lime-500/15 text-lime-200 font-mono',
  };

  return (
    <div
      className={`border rounded px-3 py-2 text-center text-xs ${variants[variant]} ${className}`}
    >
      {children}
    </div>
  );
}

// Grid cell for repeated units
function GridCell({
  label,
  variant = 'default',
}: {
  label: string;
  variant?: 'default' | 'accent' | 'muted';
}) {
  const variants = {
    default: 'border-lime-600/30 bg-lime-600/10 text-lime-400',
    accent: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    muted: 'border-zinc-700 bg-zinc-800/30 text-zinc-500',
  };

  return (
    <div className={`border rounded px-2 py-1 text-[10px] font-mono ${variants[variant]}`}>
      {label}
    </div>
  );
}

// Main architecture diagram section
function ArchitectureSection({
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
      <h2 className="text-xl font-bold text-lime-300 mb-2 font-mono">{title}</h2>
      {subtitle && <p className="text-zinc-400 text-sm mb-6">{subtitle}</p>}
      {children}
    </section>
  );
}

export default function ArchitecturePage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-zinc-950">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="mb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4 font-mono">
            TPMJS Architecture
          </h1>
          <p className="text-zinc-400 text-lg max-w-3xl">
            A complete overview of the TPMJS platform - from tool discovery to sandboxed execution,
            collections, agents, and custom executors.
          </p>
        </div>

        {/* ===================== FULL PLATFORM OVERVIEW ===================== */}
        <ArchitectureSection
          title="Platform Overview"
          subtitle="The complete TPMJS stack - tool registry, execution infrastructure, and user-facing products."
        >
          <div className="border border-lime-500/30 rounded-lg p-6 bg-zinc-900/50">
            {/* Top Layer - User Products */}
            <ChipBox variant="header" className="mb-4">
              USER PRODUCTS
            </ChipBox>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Web App */}
              <div className="border border-lime-500/20 rounded-lg p-4 bg-zinc-900">
                <ChipBox variant="highlight" className="mb-3">
                  tpmjs.com
                </ChipBox>
                <div className="space-y-2">
                  <GridCell label="Dashboard" />
                  <GridCell label="Tool Browser" />
                  <GridCell label="Collection Editor" />
                  <GridCell label="Agent Builder" />
                  <GridCell label="Playground" />
                </div>
              </div>

              {/* SDK */}
              <div className="border border-lime-500/20 rounded-lg p-4 bg-zinc-900">
                <ChipBox variant="highlight" className="mb-3">
                  SDK Packages
                </ChipBox>
                <div className="space-y-2">
                  <GridCell label="@tpmjs/registry-search" variant="accent" />
                  <GridCell label="@tpmjs/registry-execute" variant="accent" />
                  <GridCell label="@tpmjs/types" />
                  <GridCell label="@tpmjs/ui" />
                </div>
              </div>

              {/* MCP */}
              <div className="border border-lime-500/20 rounded-lg p-4 bg-zinc-900">
                <ChipBox variant="highlight" className="mb-3">
                  MCP Protocol
                </ChipBox>
                <div className="space-y-2">
                  <GridCell label="Claude Desktop" variant="accent" />
                  <GridCell label="Cursor" variant="accent" />
                  <GridCell label="Claude Code" variant="accent" />
                  <GridCell label="Any MCP Client" />
                </div>
              </div>
            </div>

            {/* Middle Layer - API */}
            <ChipBox variant="header" className="mb-4">
              API LAYER (Next.js 16)
            </ChipBox>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <GridCell label="/api/tools" />
              <GridCell label="/api/tools/search" />
              <GridCell label="/api/tools/execute" />
              <GridCell label="/api/collections" />
              <GridCell label="/api/agents" />
              <GridCell label="/api/mcp/*" variant="accent" />
              <GridCell label="/api/sync/*" variant="muted" />
              <GridCell label="/api/health" variant="muted" />
            </div>

            {/* Bottom Layer - Infrastructure */}
            <ChipBox variant="header" className="mb-4">
              INFRASTRUCTURE
            </ChipBox>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-zinc-700 rounded-lg p-3 bg-zinc-800/50">
                <div className="text-xs text-zinc-500 mb-2 font-mono">DATABASE</div>
                <div className="space-y-2">
                  <GridCell label="PostgreSQL (Neon)" />
                  <GridCell label="Prisma ORM" variant="muted" />
                </div>
              </div>
              <div className="border border-zinc-700 rounded-lg p-3 bg-zinc-800/50">
                <div className="text-xs text-zinc-500 mb-2 font-mono">EXECUTION</div>
                <div className="space-y-2">
                  <GridCell label="Vercel Sandbox" variant="accent" />
                  <GridCell label="Custom Executors" variant="accent" />
                </div>
              </div>
              <div className="border border-zinc-700 rounded-lg p-3 bg-zinc-800/50">
                <div className="text-xs text-zinc-500 mb-2 font-mono">EXTERNAL</div>
                <div className="space-y-2">
                  <GridCell label="npm Registry" />
                  <GridCell label="esm.sh CDN" variant="muted" />
                </div>
              </div>
            </div>
          </div>
        </ArchitectureSection>

        {/* ===================== TOOL EXECUTION FLOW ===================== */}
        <ArchitectureSection
          title="Tool Execution Pipeline"
          subtitle="How a tool call flows from SDK/MCP through the executor sandbox."
        >
          <div className="border border-lime-500/30 rounded-lg p-6 bg-zinc-900/50">
            {/* Flow diagram */}
            <div className="flex flex-col md:flex-row items-stretch gap-4">
              {/* Request */}
              <div className="flex-1 border border-yellow-500/30 rounded-lg p-4 bg-zinc-900">
                <ChipBox variant="accent" className="mb-3">
                  1. REQUEST
                </ChipBox>
                <div className="space-y-2 text-xs">
                  <div className="border border-zinc-700 rounded p-2 bg-zinc-800/50">
                    <span className="text-zinc-500">SDK:</span>
                    <span className="text-lime-400 ml-2">registryExecute()</span>
                  </div>
                  <div className="border border-zinc-700 rounded p-2 bg-zinc-800/50">
                    <span className="text-zinc-500">MCP:</span>
                    <span className="text-lime-400 ml-2">tools/call</span>
                  </div>
                  <div className="border border-zinc-700 rounded p-2 bg-zinc-800/50">
                    <span className="text-zinc-500">Agent:</span>
                    <span className="text-lime-400 ml-2">tool_call</span>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center text-lime-500 text-2xl">→</div>
              <div className="md:hidden flex justify-center text-lime-500 text-2xl">↓</div>

              {/* Resolution */}
              <div className="flex-1 border border-lime-500/30 rounded-lg p-4 bg-zinc-900">
                <ChipBox variant="default" className="mb-3">
                  2. RESOLVE
                </ChipBox>
                <div className="space-y-2 text-xs">
                  <div className="border border-zinc-700 rounded p-2 bg-zinc-800/50">
                    <span className="text-zinc-400">Lookup tool by ID</span>
                  </div>
                  <div className="border border-zinc-700 rounded p-2 bg-zinc-800/50">
                    <span className="text-zinc-400">Resolve executor config</span>
                  </div>
                  <div className="border border-zinc-700 rounded p-2 bg-zinc-800/50">
                    <span className="text-zinc-400">Build import URL</span>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center text-lime-500 text-2xl">→</div>
              <div className="md:hidden flex justify-center text-lime-500 text-2xl">↓</div>

              {/* Executor */}
              <div className="flex-1 border border-lime-400/50 rounded-lg p-4 bg-lime-500/5">
                <ChipBox variant="highlight" className="mb-3">
                  3. EXECUTE
                </ChipBox>
                <div className="space-y-2 text-xs">
                  <div className="border border-lime-500/30 rounded p-2 bg-zinc-900/50">
                    <span className="text-lime-300">npm install pkg</span>
                  </div>
                  <div className="border border-lime-500/30 rounded p-2 bg-zinc-900/50">
                    <span className="text-lime-300">tool.execute(params)</span>
                  </div>
                  <div className="border border-lime-500/30 rounded p-2 bg-zinc-900/50">
                    <span className="text-lime-300">Return result</span>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center text-lime-500 text-2xl">→</div>
              <div className="md:hidden flex justify-center text-lime-500 text-2xl">↓</div>

              {/* Response */}
              <div className="flex-1 border border-yellow-500/30 rounded-lg p-4 bg-zinc-900">
                <ChipBox variant="accent" className="mb-3">
                  4. RESPONSE
                </ChipBox>
                <div className="space-y-2 text-xs">
                  <div className="border border-zinc-700 rounded p-2 bg-zinc-800/50">
                    <span className="text-yellow-400">output: any</span>
                  </div>
                  <div className="border border-zinc-700 rounded p-2 bg-zinc-800/50">
                    <span className="text-yellow-400">executionTimeMs</span>
                  </div>
                  <div className="border border-zinc-700 rounded p-2 bg-zinc-800/50">
                    <span className="text-yellow-400">success: boolean</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ArchitectureSection>

        {/* ===================== EXECUTOR ARCHITECTURE ===================== */}
        <ArchitectureSection
          title="Executor System"
          subtitle="Sandboxed runtime environments for safe tool execution. Support for default and custom executors."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Default Executor */}
            <div className="border border-lime-500/30 rounded-lg p-5 bg-zinc-900/50">
              <ChipBox variant="header" className="mb-4">
                DEFAULT EXECUTOR (Vercel Sandbox)
              </ChipBox>

              <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-800/30 mb-4">
                <div className="text-xs text-zinc-500 mb-3 font-mono">SANDBOX VM</div>
                <div className="grid grid-cols-2 gap-2">
                  <GridCell label="Node.js 22" />
                  <GridCell label="2 vCPUs" />
                  <GridCell label="2 min timeout" />
                  <GridCell label="Isolated FS" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lime-500">✓</span>
                  <span className="text-xs text-zinc-400">Network isolated</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lime-500">✓</span>
                  <span className="text-xs text-zinc-400">Per-request env injection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lime-500">✓</span>
                  <span className="text-xs text-zinc-400">Automatic npm install</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lime-500">✓</span>
                  <span className="text-xs text-zinc-400">Cold start optimized</span>
                </div>
              </div>
            </div>

            {/* Custom Executor */}
            <div className="border border-yellow-500/30 rounded-lg p-5 bg-zinc-900/50">
              <ChipBox variant="accent" className="mb-4">
                CUSTOM EXECUTOR (User-Deployed)
              </ChipBox>

              <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-800/30 mb-4">
                <div className="text-xs text-zinc-500 mb-3 font-mono">USER INFRASTRUCTURE</div>
                <div className="grid grid-cols-2 gap-2">
                  <GridCell label="Vercel" variant="accent" />
                  <GridCell label="Railway" variant="accent" />
                  <GridCell label="AWS Lambda" variant="accent" />
                  <GridCell label="Self-hosted" variant="accent" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">★</span>
                  <span className="text-xs text-zinc-400">Custom dependencies pre-installed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">★</span>
                  <span className="text-xs text-zinc-400">Your own API keys built-in</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">★</span>
                  <span className="text-xs text-zinc-400">Custom security policies</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">★</span>
                  <span className="text-xs text-zinc-400">One-click deploy templates</span>
                </div>
              </div>
            </div>
          </div>

          {/* Executor API Contract */}
          <div className="mt-6 border border-zinc-700 rounded-lg p-5 bg-zinc-800/30">
            <div className="text-xs text-zinc-500 mb-3 font-mono">EXECUTOR API CONTRACT</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-lime-400 mb-2 font-mono">POST /execute-tool</div>
                <div className="space-y-1 text-xs text-zinc-400 font-mono">
                  <div className="pl-3">packageName: string</div>
                  <div className="pl-3">name: string</div>
                  <div className="pl-3">params: object</div>
                  <div className="pl-3">env?: object</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-yellow-400 mb-2 font-mono">Response</div>
                <div className="space-y-1 text-xs text-zinc-400 font-mono">
                  <div className="pl-3">success: boolean</div>
                  <div className="pl-3">output?: any</div>
                  <div className="pl-3">error?: string</div>
                  <div className="pl-3">executionTimeMs: number</div>
                </div>
              </div>
            </div>
          </div>
        </ArchitectureSection>

        {/* ===================== COLLECTIONS & AGENTS ===================== */}
        <ArchitectureSection
          title="Collections & Agents"
          subtitle="Higher-level abstractions built on top of the tool registry."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Collections */}
            <div className="border border-lime-500/30 rounded-lg p-5 bg-zinc-900/50">
              <ChipBox variant="header" className="mb-4">
                COLLECTION
              </ChipBox>

              <p className="text-xs text-zinc-400 mb-4">
                Curated bundles of tools exposed via MCP protocol or API.
              </p>

              <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-800/30 mb-4">
                <div className="text-xs text-zinc-500 mb-3 font-mono">COLLECTION STRUCTURE</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">name</span>
                    <span className="text-lime-400">&quot;Web Scraping Tools&quot;</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">tools[]</span>
                    <span className="text-lime-400">CollectionTool[]</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">executorConfig</span>
                    <span className="text-yellow-400">?ExecutorConfig</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">visibility</span>
                    <span className="text-zinc-500">public | private</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <GridCell label="MCP Endpoint: /api/mcp/{user}/{slug}/http" variant="accent" />
                <GridCell label="REST API: /api/collections/{id}" />
                <GridCell label="Tool-level env overrides" variant="muted" />
              </div>
            </div>

            {/* Agents */}
            <div className="border border-yellow-500/30 rounded-lg p-5 bg-zinc-900/50">
              <ChipBox variant="accent" className="mb-4">
                AGENT
              </ChipBox>

              <p className="text-xs text-zinc-400 mb-4">
                AI-powered assistants with multi-turn conversations and tool access.
              </p>

              <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-800/30 mb-4">
                <div className="text-xs text-zinc-500 mb-3 font-mono">AGENT STRUCTURE</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">name</span>
                    <span className="text-yellow-400">&quot;Research Assistant&quot;</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">systemPrompt</span>
                    <span className="text-yellow-400">string</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">collections[]</span>
                    <span className="text-lime-400">Collection[]</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">model</span>
                    <span className="text-zinc-500">gpt-4o | claude-3.5-sonnet | ...</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <GridCell label="Chat UI: /agents/{id}/chat" variant="accent" />
                <GridCell label="Streaming: SSE tool_call events" variant="accent" />
                <GridCell label="Persistent conversations" variant="muted" />
              </div>
            </div>
          </div>

          {/* Hierarchy */}
          <div className="mt-6 border border-zinc-700 rounded-lg p-5 bg-zinc-800/30">
            <div className="text-xs text-zinc-500 mb-4 font-mono">EXECUTOR CONFIG HIERARCHY</div>
            <div className="flex flex-col md:flex-row items-center gap-4 text-center">
              <div className="border border-zinc-600 rounded px-4 py-2 bg-zinc-900">
                <div className="text-xs text-zinc-500">System Default</div>
                <div className="text-lime-400 text-sm">Vercel Sandbox</div>
              </div>
              <div className="text-lime-500">→</div>
              <div className="border border-lime-500/30 rounded px-4 py-2 bg-zinc-900">
                <div className="text-xs text-zinc-500">Collection Config</div>
                <div className="text-lime-400 text-sm">executorConfig</div>
              </div>
              <div className="text-lime-500">→</div>
              <div className="border border-yellow-500/30 rounded px-4 py-2 bg-zinc-900">
                <div className="text-xs text-zinc-500">Agent Override</div>
                <div className="text-yellow-400 text-sm">agent.executorConfig</div>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-4 text-center">
              Agent config overrides Collection config, which overrides System default.
            </p>
          </div>
        </ArchitectureSection>

        {/* ===================== DATA FLOW ===================== */}
        <ArchitectureSection
          title="Tool Discovery & Sync"
          subtitle="How tools are discovered from npm and kept in sync with the registry."
        >
          <div className="border border-lime-500/30 rounded-lg p-6 bg-zinc-900/50">
            {/* Sync Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-800/30">
                <div className="text-xs text-zinc-500 mb-2 font-mono">npm REGISTRY</div>
                <div className="space-y-2">
                  <GridCell label='keyword: "tpmjs"' />
                  <GridCell label="tpmjs field" />
                  <GridCell label="package.json" variant="muted" />
                </div>
              </div>

              <div className="border border-lime-500/30 rounded-lg p-4 bg-zinc-900">
                <div className="text-xs text-lime-400 mb-2 font-mono">SYNC JOBS</div>
                <div className="space-y-2">
                  <GridCell label="Changes Feed (2min)" variant="accent" />
                  <GridCell label="Keyword Search (15min)" />
                  <GridCell label="Metrics Sync (1hr)" variant="muted" />
                </div>
              </div>

              <div className="border border-lime-500/30 rounded-lg p-4 bg-zinc-900">
                <div className="text-xs text-lime-400 mb-2 font-mono">PROCESSING</div>
                <div className="space-y-2">
                  <GridCell label="Validate tpmjs field" />
                  <GridCell label="Extract inputSchema" variant="accent" />
                  <GridCell label="Calculate quality score" />
                </div>
              </div>

              <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-800/30">
                <div className="text-xs text-zinc-500 mb-2 font-mono">DATABASE</div>
                <div className="space-y-2">
                  <GridCell label="Tool (metadata)" />
                  <GridCell label="Package (npm info)" />
                  <GridCell label="inputSchema (JSON)" variant="accent" />
                </div>
              </div>
            </div>
          </div>
        </ArchitectureSection>

        {/* ===================== TOOL SCHEMA ===================== */}
        <ArchitectureSection
          title="Tool Data Model"
          subtitle="Core entities and their relationships in the TPMJS database."
        >
          <div className="border border-lime-500/30 rounded-lg p-6 bg-zinc-900/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Package */}
              <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-800/30">
                <ChipBox variant="muted" className="mb-3">
                  Package
                </ChipBox>
                <div className="space-y-1 text-xs font-mono">
                  <div className="text-zinc-400">
                    npmPackageName <span className="text-lime-500">PK</span>
                  </div>
                  <div className="text-zinc-500">npmVersion</div>
                  <div className="text-zinc-500">npmDownloadsLastMonth</div>
                  <div className="text-zinc-500">repositoryUrl</div>
                  <div className="text-zinc-500">author</div>
                </div>
              </div>

              {/* Tool */}
              <div className="border border-lime-500/40 rounded-lg p-4 bg-lime-500/5">
                <ChipBox variant="highlight" className="mb-3">
                  Tool
                </ChipBox>
                <div className="space-y-1 text-xs font-mono">
                  <div className="text-lime-300">
                    id <span className="text-lime-500">PK</span>
                  </div>
                  <div className="text-lime-300">name</div>
                  <div className="text-lime-300">description</div>
                  <div className="text-yellow-400">
                    inputSchema <span className="text-zinc-500">JSON</span>
                  </div>
                  <div className="text-lime-300">category</div>
                  <div className="text-zinc-400">qualityScore</div>
                  <div className="text-zinc-400">healthStatus</div>
                  <div className="text-zinc-500">
                    packageId <span className="text-yellow-500">FK</span>
                  </div>
                </div>
              </div>

              {/* CollectionTool */}
              <div className="border border-yellow-500/30 rounded-lg p-4 bg-yellow-500/5">
                <ChipBox variant="accent" className="mb-3">
                  CollectionTool
                </ChipBox>
                <div className="space-y-1 text-xs font-mono">
                  <div className="text-yellow-300">
                    collectionId <span className="text-yellow-500">FK</span>
                  </div>
                  <div className="text-yellow-300">
                    toolId <span className="text-yellow-500">FK</span>
                  </div>
                  <div className="text-zinc-400">displayName</div>
                  <div className="text-zinc-400">
                    envOverrides <span className="text-zinc-500">JSON</span>
                  </div>
                  <div className="text-zinc-500">position</div>
                </div>
              </div>
            </div>

            {/* Relations */}
            <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs text-zinc-500">
              <div className="border border-zinc-700 rounded px-3 py-1 bg-zinc-800/50">
                Package 1:N Tool
              </div>
              <div className="border border-zinc-700 rounded px-3 py-1 bg-zinc-800/50">
                Collection N:M Tool
              </div>
              <div className="border border-zinc-700 rounded px-3 py-1 bg-zinc-800/50">
                Agent N:M Collection
              </div>
              <div className="border border-zinc-700 rounded px-3 py-1 bg-zinc-800/50">
                User 1:N Agent
              </div>
            </div>
          </div>
        </ArchitectureSection>

        {/* Links */}
        <section className="border border-zinc-700 rounded-lg p-6 bg-zinc-800/30">
          <h3 className="text-lg font-bold text-zinc-200 mb-4">Learn More</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/docs"
              className="border border-zinc-600 rounded-lg p-4 bg-zinc-900 hover:border-lime-500/50 transition-colors"
            >
              <div className="text-lime-400 text-sm font-mono mb-1">Documentation</div>
              <div className="text-xs text-zinc-500">Full SDK and API reference</div>
            </Link>
            <Link
              href="/docs/executors"
              className="border border-zinc-600 rounded-lg p-4 bg-zinc-900 hover:border-lime-500/50 transition-colors"
            >
              <div className="text-lime-400 text-sm font-mono mb-1">Custom Executors</div>
              <div className="text-xs text-zinc-500">Deploy your own execution environment</div>
            </Link>
            <Link
              href="/docs/agents"
              className="border border-zinc-600 rounded-lg p-4 bg-zinc-900 hover:border-lime-500/50 transition-colors"
            >
              <div className="text-lime-400 text-sm font-mono mb-1">Agent Docs</div>
              <div className="text-xs text-zinc-500">Build AI assistants with tools</div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
