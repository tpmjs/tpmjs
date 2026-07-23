# TPMJS Launch Copy

## Product Hunt

### Tagline (60 chars max)
npm registry for AI tools. Auto-discovered. MCP-ready.

### Short description (260 chars max)
TPMJS scans npm for AI tool packages, extracts schemas, runs health checks, scores quality, and serves them via MCP. One URL gives Claude Code, Cursor, or Windsurf access to your tools. Open source, free to use.

### Longer description
AI agents need tools — web scrapers, API wrappers, code runners, data transformers. But finding what exists is a scavenger hunt. You can't tell if something works until you wire it up. And every AI client needs its own config.

TPMJS is a registry and execution layer that fixes this. It continuously scans npm for packages tagged as AI tools, extracts their input/output schemas, runs health checks, and computes quality scores. Every tool gets an MCP endpoint that works with Claude Code, Cursor, Windsurf, and any MCP client — one URL, instant access.

What you can do:
- Browse thousands of auto-discovered tools with quality scores and health status
- Group tools into collections — each collection gets a single MCP URL
- Test collections with auto-generated scenarios
- Build custom agents with any LLM and curated tool sets
- Publish your own tools with one npm keyword
- Use via SDK, CLI, or REST API

The whole platform is open source (MIT), free to use, and built with Next.js, PostgreSQL, and Deno sandboxes.

### Maker's first comment
Hey — I'm Ajax. I built TPMJS because I kept hitting the same problem: I'd want my AI agent to do something practical (scrape a page, call an API, process some data) and I'd spend more time finding and configuring the tool than using it.

The core idea: npm is already where JavaScript developers publish packages. If you tag your package with the right keyword, TPMJS picks it up within minutes, extracts the schema, validates it, and makes it available through MCP endpoints that work with Claude Code, Cursor, Windsurf, and anything else that speaks the protocol.

The registry currently indexes thousands of tools from npm, with continuous health monitoring and quality scoring. You can browse tools, create collections, build agents, or publish your own.

It's completely open source and free. The code is at github.com/tpmjs/tpmjs. I'd genuinely appreciate feedback on what's useful and what needs work.

---

## Hacker News

### Show HN title options
1. Show HN: TPMJS -- npm registry for AI tools with auto-discovery and MCP endpoints
2. Show HN: TPMJS -- A package registry that turns npm packages into AI agent tools
3. Show HN: TPMJS -- Open-source tool registry that auto-discovers AI tools from npm
4. Show HN: TPMJS -- One MCP URL gives your AI agent access to tools from npm
5. Show HN: TPMJS -- Auto-discovery registry for AI agent tools, served via MCP

### Launch post text
TPMJS is an open-source registry and execution layer for AI agent tools. It scans npm for packages tagged as AI tools, extracts their schemas, validates them, scores quality, and serves them through MCP (Model Context Protocol) endpoints.

The problem it solves: AI agents need external tools (web scrapers, API wrappers, code runners), but discovering what exists is scattered, you can't tell if a tool works without wiring it up, and every AI client (Claude Code, Cursor, Windsurf) needs its own config file.

How it works:
- Publish an npm package with `"keywords": ["tpmjs"]` — TPMJS picks it up within minutes
- Schemas are auto-extracted from the package (Zod, JSON Schema)
- Health checks run continuously; quality scores computed from docs, tests, downloads, reliability
- Every tool collection gets an MCP endpoint URL — paste it into your client config and you're done
- Tools execute in isolated Deno sandboxes with timeouts and rate limiting

The registry has ~200 packages (thousands of individual tool functions). You can browse, search, create collections, build agents, or publish your own tools.

Tech: Next.js 16, PostgreSQL/Prisma, and a self-hosted Deno executor, deployed as rootless Podman services. Full source at https://github.com/tpmjs/tpmjs (MIT).

Site: https://tpmjs.com

### Likely skeptical questions and answers

**Q: Why not just use npm directly? What does TPMJS actually add?**
npm gives you a tarball. TPMJS gives you a callable tool. We extract the AI tool schema, validate it works via health checks, score quality, and serve it through an MCP endpoint your AI client uses directly. npm is the source of packages; TPMJS is the runtime layer that makes them usable as agent tools without manual wiring.

**Q: MCP is new and evolving. Aren't you building on sand?**
MCP is backed by Anthropic and already adopted by Claude Code, Claude Desktop, Cursor, and Windsurf. The protocol is simple JSON-RPC over HTTP. But even if MCP changes, the hard problems TPMJS solves — discovery, schema extraction, validation, quality scoring — are protocol-agnostic. Adding another transport is straightforward.

**Q: Running arbitrary npm packages sounds like a security nightmare.**
Tool execution happens in isolated Deno sandboxes with rate limiting, timeouts, and no filesystem/network access by default. Credentials are encrypted at rest. You can also point tools at your own executor server if you want full control over the execution environment.

**Q: What stops the registry from filling up with junk?**
Quality scoring. Every tool is scored on schema validity, documentation completeness, health check pass rate, maintenance activity, and npm download trends. The registry surfaces high-quality tools first. Broken tools are flagged automatically by continuous health monitoring. You can filter and sort by quality score.

**Q: Why wouldn't I just build my own MCP server with the specific tools I need?**
You absolutely should for production workloads where you know exactly what you need. TPMJS is useful for discovery (what tools exist?), prototyping (get something working in seconds), and sharing (give your team a curated tool set via one URL). Once you've found the right tools, self-hosting is always an option.

**Q: How is this different from Composio / LangChain tools?**
Composio is a managed API service — your tool calls go through their servers. TPMJS is an open-source registry built on npm packages that you can self-host. LangChain tools are framework-specific; TPMJS tools work with any MCP client or via the SDK with any framework. The key difference is TPMJS is built on the npm ecosystem, not a proprietary catalog.

**Q: What's the business model? How do you plan to sustain this?**
It's free and open source. No plans to paywall the registry or tooling. The project is sustainable as infrastructure — like how npm itself or similar registries operate. If there's ever a paid tier, it would be for enterprise features (private registries, SLAs), not the core platform.

**Q: Does auto-discovering from npm mean you're indexing every package ever?**
No. Only packages with the `tpmjs` keyword in their package.json are indexed. It's opt-in by the package author. We also run validation — packages without valid tool schemas are flagged and deprioritized.
