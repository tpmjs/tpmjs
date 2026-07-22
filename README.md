<p align="center">
  <a href="https://tpmjs.com">
    <h1 align="center">TPMJS</h1>
  </a>
</p>

<p align="center">
  <strong>One tool collection. Every surface — CLI, MCP, REST, SDK & Skill.</strong>
</p>

<p align="center">
  <a href="https://github.com/tpmjs/tpmjs/actions/workflows/ci.yml"><img src="https://github.com/tpmjs/tpmjs/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@tpmjs/cli"><img src="https://img.shields.io/npm/v/@tpmjs/cli.svg" alt="npm version"></a>
  <a href="https://github.com/tpmjs/tpmjs/blob/main/LICENSE"><img src="https://img.shields.io/github/license/tpmjs/tpmjs" alt="License"></a>
  <a href="https://www.npmjs.com/package/@tpmjs/cli"><img src="https://img.shields.io/npm/dm/@tpmjs/cli.svg" alt="Downloads"></a>
</p>

<p align="center">
  <a href="https://tpmjs.com">Website</a> &middot;
  <a href="https://tpmjs.com/docs">Docs</a> &middot;
  <a href="https://tpmjs.com/docs/quickstart">Quick Start</a> &middot;
  <a href="https://github.com/tpmjs/tpmjs/issues">Issues</a>
</p>

---

TPMJS is the **tool layer for AI agents**. It automatically discovers tools published to npm, scores each one for quality and health, and runs it in an isolated hosted Deno sandbox — then serves your curated collection through **every surface an agent might want**: a CLI command, an MCP server, a REST API, a typed SDK, or a loadable skill.

We don't think there's a fight to win between MCP, CLI, and REST. They're each better in a different context — CLI in Claude Code, MCP in Cursor and Claude Desktop, REST in your backend, the SDK in your TypeScript app, a Skill when the agent needs to *learn* the tools. So you write (or curate) the tool once, and TPMJS gives you **all of them from one source of truth.** The [Model Context Protocol](https://modelcontextprotocol.io) and the official MCP registry are one input we build on — not the whole story.

## Key Concepts

- **One collection, every protocol** — The same curated set is a CLI command, an MCP server URL, a REST endpoint, a typed SDK import, and a loadable skill. Pick the surface your agent works best with, or use them all — no lock-in to a single transport.
- **Sandboxed execution** — Every tool runs in an isolated hosted Deno sandbox with timeouts and rate limits. Your agent never installs the package or runs its code locally.
- **Quality & health scoring** — Tools are auto-scored on schema validity, docs, downloads, and continuous health checks — the runtime verification a bare index skips.
- **Curated collections** — Group the tools an agent actually needs; it's instantly live on all five surfaces. On-demand discovery instead of a context window full of schemas up front.
- **npm-native publishing** — Any npm package with the `tpmjs` keyword is auto-indexed within minutes. No server to host, no OAuth, no uptime to run.
- **Agent platform** — Build, share, and fork AI agents with custom prompts and dynamic tool access.

## Getting Started

### Publish a Tool

Add the `tpmjs` keyword to your `package.json` and publish to npm. Your tool appears on [tpmjs.com](https://tpmjs.com) within 15 minutes.

```json
{
  "name": "my-tool",
  "keywords": ["tpmjs"],
  "tpmjs": {
    "category": "data"
  }
}
```

Or scaffold a new tool:

```bash
npx @tpmjs/create-basic-tools
```

See [HOW_TO_PUBLISH_A_TOOL.md](./HOW_TO_PUBLISH_A_TOOL.md) for the full publishing guide.

### Use the CLI

```bash
npm install -g @tpmjs/cli

tpm tool search "csv parser"
tpm tool execute '@tpmjs/tools-csv-parse::csvParseTool' --input '{"csv":"name,role\nAda,engineer"}'
tpm tool trending
```

### Connect via MCP

TPMJS collections are available as [Model Context Protocol](https://modelcontextprotocol.io) servers. Add one to Claude Desktop, Cursor, or any MCP-compatible client:

```json
{
  "mcpServers": {
    "tpmjs": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://tpmjs.com/api/mcp/<username>/<collection>/sse"]
    }
  }
}
```

### Use in Your Agent

```bash
npm install @tpmjs/registry-search @tpmjs/registry-execute
```

```typescript
import { registrySearchTool } from '@tpmjs/registry-search';
import { registryExecuteTool } from '@tpmjs/registry-execute';

const tools = [registrySearchTool, registryExecuteTool];
```

## Features

- **Tool Registry** — Search 800+ official and community tools by category, quality, and popularity (indexed live from npm).
- **One-Keyword Publishing** — Add `"tpmjs"` to your `package.json` keywords to go live in minutes.
- **Quality Scoring** — Automated scoring based on documentation, downloads, and execution health.
- **Secure Sandboxing** — Isolated execution environment protects your system from untrusted code.
- **MCP Support** — Full Model Context Protocol implementation for seamless agent integration.
- **Collections & Scenarios** — Group tools into bundles and validate them with AI-generated test cases.
- **Agent SDK** — Let agents discover and execute tools at runtime based on conversation context.

## Packages

| Package | Description |
|---------|-------------|
| [`@tpmjs/cli`](https://www.npmjs.com/package/@tpmjs/cli) | Command-line interface |
| [`@tpmjs/registry-search`](https://www.npmjs.com/package/@tpmjs/registry-search) | Search the tool registry from your agent |
| [`@tpmjs/registry-execute`](https://www.npmjs.com/package/@tpmjs/registry-execute) | Execute registry tools from your agent |
| [`@tpmjs/bridge`](https://www.npmjs.com/package/@tpmjs/bridge) | Connect local MCP servers to TPMJS |
| [`@tpmjs/mcp-client`](https://www.npmjs.com/package/@tpmjs/mcp-client) | MCP client library |
| [`@tpmjs/types`](https://www.npmjs.com/package/@tpmjs/types) | Shared TypeScript types and Zod schemas |
| [`@tpmjs/ui`](https://www.npmjs.com/package/@tpmjs/ui) | React component library |
| [`@tpmjs/utils`](https://www.npmjs.com/package/@tpmjs/utils) | Utility functions |
| [`@tpmjs/env`](https://www.npmjs.com/package/@tpmjs/env) | Environment variable validation |

## Contributing

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) >= 10
- Docker with Compose v2, or Podman Compose

### Setup

```bash
git clone https://github.com/tpmjs/tpmjs.git
cd tpmjs
pnpm install
pnpm dev:setup
```

`dev:setup` provisions an isolated PostgreSQL 17 database, applies every
checked-in migration, creates a local environment with generated secrets, and
seeds an offline starter registry. It is idempotent and preserves both existing
environment files and database data.

### Development

```bash
# Start the web app
pnpm --filter=@tpmjs/web dev

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format

# Type check
pnpm type-check
```

### Project Structure

```
apps/
  web/                 Next.js web application (tpmjs.com)
  playground/          AI chat playground (Next.js + AI SDK)
  tutorial/            Interactive tutorial site (Next.js)
  railway-executor/    Deno dynamic tool executor (the default sandbox)
  omega-mac/           Native macOS chat app (SwiftUI)
packages/
  cli/                 CLI (@tpmjs/cli)
  bridge/              MCP bridge
  mcp-client/          MCP client library
  npm-client/          npm registry API client (search, changes feed, stats)
  package-executor/    Client for the remote sandbox executor
  ui/                  React component library
  types/               Shared TypeScript types
  utils/               Utility functions
  env/                 Environment schema loader
  db/                  Prisma database layer
  config/              Shared configs (Biome, ESLint, Tailwind, TypeScript)
  tools/official/      195+ official tool packages
  test/                Vitest shared config
  mocks/               MSW mock server
```

### Quality Gates

Pre-commit hooks run format, lint, and type-check automatically. The hook runner
is pinned because its formatter must safely restage changes while those checks
run in parallel. CI enforces:

- Linting (ESLint + Biome)
- Type checking (TypeScript strict mode)
- Tests (Vitest)
- Production build
- Architecture validation (no circular deps, module boundaries)
- Dead code detection

### Releasing

```bash
pnpm changeset            # Create a changeset
pnpm changeset:version    # Version packages
pnpm changeset:publish    # Publish to npm
git push --follow-tags
```

## Examples

See [`examples/`](./examples) for one small, runnable example per surface — the same real registry tool served through **CLI · REST · SDK · MCP · Skill**.

## Community

- [Examples](./examples) — one runnable example per surface
- [GitHub Issues](https://github.com/tpmjs/tpmjs/issues) — Bug reports and feature requests
- [Discord](https://discord.gg/KuJRBCn89c) — Chat and get help
- [tpmjs.com](https://tpmjs.com) — Browse the registry

## License

[MIT](./LICENSE)
