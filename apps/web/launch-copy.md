# TPMJS Launch Copy

## Product Hunt

### Tagline (60 chars max)
The npm registry for AI tools — discover, test, run.

### Short description
TPMJS automatically discovers AI tools from npm, extracts their schemas, scores their quality, and serves them to any MCP-compatible AI client. One registry for every agent.

### Longer description
AI agents are only useful if they can access the right tools. But right now, finding tools is a scavenger hunt across GitHub repos and blog posts. You have no idea if something actually works until you wire it up manually. And every AI client needs its own config.

TPMJS fixes this. It continuously scans npm for packages tagged as AI tools, extracts their input/output schemas, runs health checks, and computes quality scores. Every tool gets an MCP endpoint that works with Claude Code, Cursor, Windsurf, and any MCP client — paste one URL and your agent has access.

You can group tools into collections, test them with auto-generated scenarios, build custom agents with any LLM, and publish your own tools with a single npm keyword. It's the missing infrastructure layer between "someone published a tool" and "my AI agent can actually use it."

### Maker's first comment
Hey everyone — I'm Ajax. I built TPMJS because I kept hitting the same wall: I'd want my AI agent to do something (scrape a page, send a Slack message, query a database) and I'd spend more time finding and configuring the tool than actually using it.

TPMJS watches npm for AI tool packages, validates them, and makes them instantly available through MCP. You can browse the registry, group tools into collections, and connect them to your editor with one URL.

It's open and free to use. The registry currently has thousands of tools auto-synced from npm, with quality scores and health monitoring. Would love feedback on what's useful and what's missing.

---

## Hacker News

### Show HN title options
1. Show HN: TPMJS – npm registry for AI tools with auto-discovery and MCP serving
2. Show HN: TPMJS – A tool registry that scans npm and serves AI tools via MCP
3. Show HN: TPMJS – Discover, validate, and run AI agent tools from one registry

### Launch post text
TPMJS is a registry and execution layer for AI tools. It scans npm for packages tagged as AI tools, extracts their schemas, validates them, computes quality scores, and serves them through MCP (Model Context Protocol) endpoints.

The core problem: AI agents need external tools (web scrapers, API wrappers, code runners, etc.), but there's no good way to discover what exists, know if it works, or connect it to your client. Every tool needs manual config for every editor.

What TPMJS does:
- Auto-discovers AI tool packages from npm within minutes of publication
- Extracts input/output schemas and runs health checks
- Scores quality based on docs, tests, maintenance, and reliability
- Serves tools via MCP endpoints that work with Claude Code, Cursor, Windsurf, etc.
- Lets you group tools into collections — one URL per collection
- Auto-generates test scenarios to validate tool behavior

The registry has thousands of tools. You can browse at tpmjs.com, create collections, build custom agents, or publish your own tools with one npm keyword.

Built with Next.js, Prisma, PostgreSQL. MCP server is standards-compliant HTTP transport.

### Likely skeptical questions and answers

**Q: Why not just use npm directly? What does this actually add?**
A: npm gives you a tarball. TPMJS gives you a callable tool. We extract the AI tool schema from the package, validate it actually works via health checks, score its quality, and serve it through an MCP endpoint your AI client can use immediately. npm is the source; TPMJS is the runtime layer on top.

**Q: MCP is so new and changing fast. Aren't you building on sand?**
A: MCP is backed by Anthropic and adopted by every major AI editor (Claude, Cursor, Windsurf). The protocol itself is simple — it's JSON-RPC over HTTP. Even if MCP evolves, the hard part we solve (discovery, validation, quality scoring, schema extraction) is protocol-agnostic. We'd just add another transport.

**Q: How do you handle security? Running arbitrary npm packages sounds terrifying.**
A: Every tool execution happens in an isolated sandbox with rate limiting and timeouts. Credentials are encrypted at rest. We don't run tools with access to your filesystem or network by default — the sandbox is its own environment. You can also point tools at your own executor if you want full control.

**Q: What stops this from being filled with low-quality or abandoned tools?**
A: Quality scoring. Every tool gets scored on documentation completeness, schema validity, health check pass rate, maintenance activity, and download trends. The registry surfaces high-quality tools and lets you filter by score. Broken tools get flagged automatically by continuous health monitoring.

**Q: Why wouldn't I just build my own MCP server with the tools I need?**
A: You absolutely can, and many people should for production workloads. TPMJS is useful when you don't know what tools exist yet, want to prototype quickly, or want to share curated tool sets with a team. It's the discovery and validation layer — once you know exactly what you need, you can always self-host.
