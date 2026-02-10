# Market Sizing & TAM Analysis Prompt

You are a McKinsey-level market analyst. I need a Total Addressable Market (TAM) analysis for **TPMJS — The Tool Package Manager for AI Agents**.

Please provide:

- **Top-down approach**: Start from global market → narrow to my segment
- **Bottom-up approach**: Calculate from unit economics × potential customers
- **TAM, SAM, SOM breakdown** with dollar figures
- **Growth rate projections** for the next 5 years (CAGR)
- **Key assumptions** behind each estimate
- **Comparison to 3 analyst reports** or market research firms

Format as an investor-ready market sizing slide with clear methodology.

---

## Context: Product Description

**Product:** TPMJS (tpmjs.com) — "The NPM for AI Tools"

TPMJS is an npm-native registry and platform for discovering, sharing, and integrating AI agent tools. It bridges the gap between npm packages and AI agent frameworks by automatically discovering tools published with the `tpmjs` keyword and exposing them through a unified, quality-scored marketplace served over the Model Context Protocol (MCP).

### How It Works

1. **Zero-Friction Publishing**: Developers add one keyword (`tpmjs`) to their npm package.json and publish — tools auto-appear on tpmjs.com within 15 minutes
2. **Automatic Schema Extraction**: TPMJS auto-extracts parameter schemas from Zod exports; no manual documentation needed
3. **Quality Scoring**: Algorithmic scoring (0–1.0) based on documentation completeness, npm downloads, and GitHub stars
4. **Universal Integration**: Works with Claude, GPT, LangChain, Vercel AI SDK, and any MCP-compatible client
5. **Open Protocol**: Built on Model Context Protocol (JSON-RPC 2.0), not proprietary

### Core Technical Architecture

- **Registry**: Syncs npm's changes feed in real-time, auto-discovers packages with `tpmjs` keyword
- **MCP Server**: Collections served as Model Context Protocol endpoints (JSON-RPC 2.0 with HTTP and SSE transports)
- **Pluggable Executors**: Tools execute via Railway-hosted executor, custom HTTPS endpoints, or local process
- **SDK**: Node.js packages (`@tpmjs/registry-search`, `@tpmjs/registry-execute`) for programmatic access
- **CLI**: `@tpmjs/cli` for terminal discovery and execution
- **AI Collections**: Group tools into reusable sets with environment variable management
- **Skills System**: Emergent knowledge graphs from user questions (RAG + embeddings)
- **Memory System**: Persistent semantic memory for AI agents

### Key Features & Differentiators

| Dimension | TPMJS | LangChain | Custom MCP | Composio | Manual |
|---|---|---|---|---|---|
| Distribution | npm packages | Framework-bundled | Self-hosted servers | SaaS API | Inline code |
| Protocol | MCP (JSON-RPC 2.0) | Framework adapters | MCP custom impl | Proprietary REST | Vendor-specific |
| Schema Format | Zod + JSON (auto) | LangChain tool class | JSON Schema (manual) | Composio SDK | JSON (manual) |
| Execution | Local or pluggable | LangChain runtime | Your server | Composio cloud | Your process |
| Discovery | BM25 search + categories | None/Docs | None | Composio catalog | None |
| Quality Signal | Scored (0–1.0) | None | None | None | None |

**Competitive Moat:**
1. Auto-discovery (npm native — hard to replicate)
2. Schema extraction (no manual work)
3. Quality scoring (algorithmic edge)
4. Open protocol (no vendor lock-in)
5. Local-first execution (tools run in your process, not a SaaS intermediary)

---

## Context: Target Customer

### Primary
- **AI Agent Builders**: Developers creating LLM-powered agents with Claude, GPT-4, or open-source models
- **Enterprise AI Teams**: Companies building internal tool ecosystems for AI agents
- **Framework Maintainers**: LangChain, Vercel AI SDK, and similar framework teams
- **AI IDE Users**: Cursor, Windsurf, Claude Code developers

### Secondary
- **Tool Publishers**: npm package maintainers wanting AI-agent discoverability
- **Systems Integrators**: Building agent workflows for business processes
- **Researchers**: Academic AI/ML projects needing standardized tooling

### Personas
- AI engineers and staff engineers at startups/enterprises
- Full-stack developers building agentic applications
- DevOps/SRE teams setting up agent infrastructure
- Product teams building B2B SaaS with AI components

---

## Context: Business Model

**Freemium with Tiers:**
- **FREE** (default)
- **PRO**
- **ENTERPRISE**

**Revenue Mechanisms:**
- API Key Management with per-user rate limiting
- Usage Tracking (per-request token usage, cost estimation)
- API Quota System (daily scenario run limits, tier-based rate limits)
- Premium scenarios (complex use cases)
- Managed executors (hosted vs. self-hosted)
- Team/org collaboration features
- Enterprise support and SLA

---

## Context: Geography

**Global** — deployed on Vercel (edge computing, global CDN), database on Neon PostgreSQL. No geographic restrictions. Effective market is anywhere with npm access and LLM API access (primarily US, EU, and APAC tech hubs).

---

## Context: Current Traction

- 189+ official tools in the registry
- Beta-stage with active development on skills/memory systems
- CLI, SDK, and MCP bridge all shipped
- Positioned in the AI engineer community

---

## Market Segments to Consider

1. **AI/ML Developer Tools Market** (broader category)
2. **AI Agent Infrastructure / Orchestration** (direct category)
3. **API Management & Integration Platforms** (adjacent)
4. **Developer Experience / DevTools** (adjacent)
5. **Model Context Protocol (MCP) Ecosystem** (emerging niche)
6. **LLM Tooling & Function Calling** (emerging niche)

## Key Trends to Factor In

- Explosive growth of AI coding assistants (Cursor, GitHub Copilot, Claude Code)
- MCP adoption by Anthropic, OpenAI, and IDE vendors
- Shift from monolithic AI apps to composable agent architectures
- Enterprise adoption of AI agents for business process automation
- Vercel AI SDK and LangChain ecosystem growth
- npm ecosystem (2.1M+ packages, 30B+ monthly downloads)
