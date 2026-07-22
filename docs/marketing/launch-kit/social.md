# Social copy

All copy uses only real, verified facts. No traction claims.

## One-line elevator pitch
> TPMJS: curate a collection of AI-agent tools once, and use it as a CLI, an MCP server, a REST API, an SDK, or a Skill. Open source, health-scored, sandboxed.

## Launch thread (X / Twitter)

**1/**
Tools for AI agents ship in a dozen incompatible ways — MCP servers, REST, npm, shell commands. So you pick a protocol and wire them up one by one.

TPMJS says: don't pick. Curate a collection once, use it on every surface. 🧵

**2/**
There's no MCP-vs-CLI-vs-REST war to win. Each is just better somewhere:
• CLI in Claude Code (fewest tokens)
• MCP in Cursor/Claude Desktop
• REST in your backend
• SDK in your TS app
• Skill when the agent must *learn* the tools

Write the tool once. We serve all five.

**3/**
Add a real collection to Claude Code with one command — no signup:

```
claude mcp add --transport http tpmjs-claude-code-tools \
  https://tpmjs.com/@ajax/collections/claude-code-tools/mcp
```

Same collection is also a REST endpoint, a `tpm` CLI, an SDK import, and a Skill.

**4/**
Every tool is import- and execution-health-checked (~96.5% healthy across 781 tools), so broken tools don't masquerade as live ones. Tools run in an isolated sandbox — not in your process.

**5/**
It's MIT open source and self-hostable. Postgres + a Next.js app + a sandbox executor. If we disappear, your collections and the code keep working.
→ github.com/tpmjs/tpmjs

**6/**
Honest status: it's early. The engine is real and complete; adoption is just starting. I'd rather show you the idea and the code than fake momentum. Tools, feedback, and PRs welcome. → tpmjs.com

## Reddit (r/LocalLLaMA / r/programming) — short post

**Title:** TPMJS — an open-source registry that serves the same AI-tool collection as CLI, MCP, REST, SDK, and Skill

I kept re-wiring the same agent tools for each host (Claude Code wants a CLI, Cursor wants MCP, my backend wants REST). So I built TPMJS: you curate a **collection** of tools once, and it's served on every surface at the same time — one MCP URL, a `tpm` CLI, a REST endpoint, a TS SDK, and a Skill.

Tools are import/execution health-checked (~96.5% of 781 healthy) and run in a sandboxed executor. It's MIT and self-hostable.

Try it with no signup — add a real collection to Claude Code:
```
claude mcp add --transport http tpmjs-claude-code-tools https://tpmjs.com/@ajax/collections/claude-code-tools/mcp
```
It's early and I'd love blunt feedback. Code: github.com/tpmjs/tpmjs · Site: tpmjs.com

## LinkedIn (1 paragraph)
Most AI-agent tools ship in one protocol, so teams re-integrate the same capabilities for every host. TPMJS is an open-source layer that flips this: curate a tool collection once and serve it as a CLI, MCP server, REST API, SDK, and Skill simultaneously — with per-tool health scoring and sandboxed execution. MIT-licensed and self-hostable. It's early, and we're sharing it to get real feedback from people building agents. github.com/tpmjs/tpmjs
