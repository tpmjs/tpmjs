# TPMJS Examples

**One collection, every surface.** A single curated tool collection on [TPMJS](https://tpmjs.com)
is served through five surfaces at once — **CLI · REST · SDK · MCP · Skill** — with no per‑surface
glue code. This gallery has one small, copy‑pasteable example per surface. Each runs the *same* real
registry tool (`@tpmjs/official-base64-encode::base64EncodeTool`, a key‑free public tool) so you can
see the surfaces line up.

> These examples live outside the pnpm workspace on purpose — they are never published and never
> affect CI. Any `package.json` here is marked `"private": true`.

## The gallery

| Surface | Example | What it shows | Runs with zero setup? |
|---|---|---|---|
| **CLI** | [`cli/`](./cli) | Discover + run tools with the published `tpm` command line | ✅ public tool, no key |
| **REST** | [`rest/`](./rest) | `curl` / `fetch` the `POST /api/registry/execute` endpoint | ✅ public tool, no key |
| **SDK** | [`sdk/`](./sdk) | Compose registry tools into a Vercel AI SDK tool set with `@tpmjs/compose` | ⚠️ needs a model API key |
| **MCP** | [`mcp/`](./mcp) | Add a collection (or the whole registry) to Claude as one MCP URL | ✅ config only |
| **Skill** | [`skill/`](./skill) | Ask a collection's living **RealSkills** endpoint for usage guidance | ✅ public collection, no key |

## The tool used throughout

- **toolId:** `@tpmjs/official-base64-encode::base64EncodeTool`
- **package:** [`@tpmjs/official-base64-encode`](https://www.npmjs.com/package/@tpmjs/official-base64-encode) (npm)
- **params:** `{ data: string, encoding?: "utf8" | "binary" | "hex" }`
- **returns:** `{ base64: string, byteLength: number }`

It requires **no API key**, so the CLI, REST, and MCP examples are fully runnable as‑is. The SDK
example calls an LLM, so it needs *your* model provider key (see its README).

## Learn more

- Docs: <https://tpmjs.com/docs>
- SDK: <https://tpmjs.com/docs/sdk> · CLI: <https://tpmjs.com/docs/cli> · Skills: <https://tpmjs.com/docs/skills>
- Registry: <https://tpmjs.com>
