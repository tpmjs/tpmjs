<p align="center">
  <a href="https://tpmjs.com">
    <h1 align="center">TPMJS</h1>
  </a>
</p>

<p align="center">
  <strong>The npm for AI tools — curated, scored, and sandboxed.</strong>
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

TPMJS is an open-source registry **and execution platform** for AI agent tools. It automatically discovers tools published to npm, scores each one for quality and health, runs it in an isolated hosted Deno sandbox, and serves curated collections to Claude Code, Cursor, ChatGPT, and any MCP client through a single URL.

The [Model Context Protocol](https://modelcontextprotocol.io) is the standard for connecting tools to agents, and the official MCP registry indexes where to find them — but it points at packages, it doesn't run, score, or curate them. TPMJS is the layer that does: **complementary to the official registry, not competing with it.** Give your agent real-world capabilities without installing untrusted code on your own machine.

## Key Concepts

- **Sandboxed execution** — Every tool runs in an isolated hosted Deno sandbox with timeouts and rate limits. Your agent never installs the package or runs its code locally.
- **Quality & health scoring** — Tools are auto-scored on schema validity, docs, downloads, and continuous health checks — the runtime verification a bare index skips.
- **Curated collections = one MCP URL** — Group the tools an agent actually needs and connect them to Claude Code, Cursor, or any MCP client with a single URL. On-demand discovery instead of a context window full of schemas.
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

tpmjs tool search "sentiment analysis"
tpmjs tool execute @tpmjs/tools-sentiment --input "I love this product"
tpmjs tool trending
```

### Connect via MCP

TPMJS collections are available as [Model Context Protocol](https://modelcontextprotocol.io) servers. Add one to Claude Desktop, Cursor, or any MCP-compatible client:

```json
{
  "mcpServers": {
    "tpmjs": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-remote", "https://tpmjs.com/api/mcp/<username>/<collection>/sse"]
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
- [pnpm](https://pnpm.io/) >= 8

### Setup

```bash
git clone https://github.com/tpmjs/tpmjs.git
cd tpmjs
pnpm install
```

### Development

```bash
# Start the dev server
pnpm dev --filter=@tpmjs/web

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
packages/
  cli/                 CLI (@tpmjs/cli)
  bridge/              MCP bridge
  mcp-client/          MCP client library
  ui/                  React component library
  types/               Shared TypeScript types
  utils/               Utility functions
  env/                 Environment schema loader
  db/                  Prisma database layer
  config/              Shared configs (Biome, ESLint, Tailwind, TypeScript)
  tools/official/      189 official tools
  test/                Vitest shared config
  mocks/               MSW mock server
```

### Quality Gates

Pre-commit hooks run format, lint, and type-check automatically. CI enforces:

- Linting (ESLint + Biome)
- Type checking (TypeScript strict mode)
- Tests (Vitest)
- Production build
- Architecture validation (no circular deps, module boundaries)
- Dead code detection

See [QUALITY-GATES.md](./QUALITY-GATES.md) for details.

### Releasing

```bash
pnpm changeset            # Create a changeset
pnpm changeset:version    # Version packages
pnpm changeset:publish    # Publish to npm
git push --follow-tags
```

## Community

- [GitHub Issues](https://github.com/tpmjs/tpmjs/issues) — Bug reports and feature requests
- [tpmjs.com](https://tpmjs.com) — Browse the registry

## License

[MIT](./LICENSE)
