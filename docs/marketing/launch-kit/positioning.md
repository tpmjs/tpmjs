# TPMJS — Positioning

## One line
**TPMJS is the protocol-agnostic tool layer for AI agents: curate a tool collection once, and serve it as a CLI, an MCP server, a REST API, an SDK, and a Skill — all at once.**

## The problem
Giving an AI agent real capabilities is still a mess. Every tool ships its own way to be called — some as MCP servers, some as REST APIs, some as npm packages, some as shell commands. So teams pick a protocol, wire tools up one at a time, and rebuild the same integration when they switch from Claude Desktop to Cursor to their own backend. And there's no shared answer to "does this tool actually work, and is it safe to run?"

## The insight
There is no MCP-vs-CLI-vs-REST war to pick a side in. Each is simply better in a different place:

- **CLI** in Claude Code — fewest tokens, native to the shell.
- **MCP** in Cursor / Claude Desktop — structured tools, no shell.
- **REST** in your backend.
- **SDK** in your TypeScript app.
- **Skill** when the agent needs to *learn* the tools, not just call them.

So don't pick. **Write the tool once; we serve it on every surface.**

## What TPMJS is
A registry of AI-agent tools where you assemble **collections** — curated sets of tools — and hand any agent that exact collection the way it wants it: one MCP URL, one `tpm` command, one REST endpoint, one SDK import, or a Skill. On top of that:

- **Health-scoring** — every tool is import-checked and execution-checked; broken tools don't masquerade as live ones.
- **Sandboxed execution** — tools run in an isolated executor, not in your process. It doesn't "solve prompt injection," but it shrinks the blast radius.
- **Open source (MIT), self-hostable** — run the whole thing yourself; nothing is locked to our infrastructure.

## Who it's for
Developers building AI agents who want capable, trustworthy tools without hand-wiring a protocol for every host — and teams who want to curate an approved, health-scored tool set once and use it everywhere.

## Honest status
Early. The infrastructure is real and complete — 781 browsable tools across 237 npm packages, 36 public collections, ~96.5% tool health, five working surfaces — but adoption is just beginning. We're leading with the idea, the engineering, and the fact that it's fully open and self-hostable, not with traction we don't have yet. If you try it and it's rough somewhere, tell us — that's exactly the stage we're at.

## Objections & honest answers
- **"Isn't this just the MCP registry?"** No. MCP is one of five surfaces we serve, and it's one input we build on — not the whole product. The point is one curated collection, every protocol, plus curation/health/sandboxing.
- **"Why not just write my own tools?"** You still can — but you'd re-solve discovery, health-checking, sandboxed execution, and multi-surface serving each time. TPMJS is that layer, already built and open source.
- **"Do the tools actually work?"** ~96.5% pass import + execution health checks, and health is shown per tool. The rest are flagged, not hidden.
- **"Is my data safe?"** Tools run in an isolated executor, not your process; you self-host if you want full control. We don't claim to eliminate prompt-injection risk — we reduce the blast radius.
- **"Is this a company that'll disappear?"** It's MIT-licensed and self-hostable. If we vanish, your collections and the code keep working.

## The differentiator, in five words
**One collection. Every surface.**
