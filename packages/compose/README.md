# @tpmjs/compose

Typed, chainable API for assembling [Vercel AI SDK](https://sdk.vercel.ai) tool sets.

[![npm](https://img.shields.io/npm/v/@tpmjs/compose.svg)](https://www.npmjs.com/package/@tpmjs/compose)
[![License](https://img.shields.io/github/license/tpmjs/tpmjs)](https://github.com/tpmjs/tpmjs/blob/main/LICENSE)

`@tpmjs/compose` is the **SDK surface** of [TPMJS](https://tpmjs.com) — the protocol-agnostic tool
layer for AI agents. One curated tool collection, served through every surface (CLI · MCP · REST · SDK ·
Skill). This package is the surface you reach for inside a TypeScript app: a small, immutable builder that
composes tools — your own, and ones loaded straight from the TPMJS registry — into a plain tool record you
pass directly to `generateText()` / `streamText()`. Full type inference at every step, no codegen.

## Installation

```bash
npm install @tpmjs/compose
# or
pnpm add @tpmjs/compose
```

`ai` (the Vercel AI SDK, **v6 or newer**) is a required peer dependency — install it alongside:

```bash
npm install ai
```

## Quick start

```typescript
import { generateText, type Tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { jsonSchema } from 'ai';
import { createToolSet } from '@tpmjs/compose';

const weatherTool: Tool<{ city: string }, { temp: number }> = {
  description: 'Get weather for a location',
  inputSchema: jsonSchema({
    type: 'object',
    properties: { city: { type: 'string' } },
    required: ['city'],
  }),
  execute: async ({ city }) => ({ temp: 72 }),
};

// Compose a tool set — fully typed, immutable at every step.
const tools = createToolSet()
  .use('weather', weatherTool)
  .use('search', searchTool)
  .build();

// Pass the result straight to the AI SDK.
const result = await generateText({
  model: openai('gpt-5.4'),
  tools,
  prompt: "What's the weather in Paris?",
});
```

`build()` returns an ordinary `Record<string, Tool>`, so the output is exactly what `generateText`,
`streamText`, and every other AI SDK entry point already expect — the builder just gets you there with
type safety and a fluent API.

## API

### `createToolSet(): ToolSetBuilder`

Create a new, empty builder. Equivalent to `new ToolSetBuilder()`.

### `class ToolSetBuilder<TTools>`

An **immutable** builder — every method returns a *new* builder, accumulating the tool-record type in the
`TTools` generic as you go, so the final `build()` is precisely typed without any code generation.

| Method / accessor | Signature | Description |
|---|---|---|
| `.use(name, definition)` | `(name: N, definition: D) => ToolSetBuilder<TTools & Record<N, D>>` | Add one named tool. Overwrites any existing tool with the same name. |
| `.useAll(tools)` | `(tools: R) => ToolSetBuilder<TTools & R>` | Merge in every tool from a record at once. Same-named tools are overwritten. |
| `.without(name)` | `(name: keyof TTools) => ToolSetBuilder<Omit<TTools, N>>` | Remove a tool by name. |
| `.build()` | `() => TTools` | Materialize the final tool record. Pass directly to `generateText()` / `streamText()`. |
| `.size` | `number` | How many tools are currently in the set. |
| `.names` | `string[]` | The names of all tools currently in the set. |

```typescript
import { createToolSet } from '@tpmjs/compose';

const base = createToolSet()
  .useAll({ weather: weatherTool, search: searchTool })
  .use('calc', calcTool);

base.size;   // 3
base.names;  // ['weather', 'search', 'calc']

// Immutable — `base` is untouched; a new builder is returned.
const trimmed = base.without('calc').build();
// trimmed: { weather: ..., search: ... }
```

### Types

```typescript
import type { AnyToolDefinition, ToolRecord } from '@tpmjs/compose';
```

- **`AnyToolDefinition`** — `Tool<any, any>`; any AI SDK v6 tool shape.
- **`ToolRecord`** — `Record<string, AnyToolDefinition>`; a named map of tools (what `.build()` produces).

### Registry adapter — `@tpmjs/compose/adapters/registry`

Load a tool straight from the TPMJS registry as a ready-to-use AI SDK tool definition, then compose it
like any other.

```typescript
import { createToolSet } from '@tpmjs/compose';
import { fromRegistry } from '@tpmjs/compose/adapters/registry';

const tools = createToolSet()
  .use('weather', await fromRegistry('@tpmjs/weather::getWeather'))
  .use('scrape', await fromRegistry('@firecrawl/ai-sdk::scrapeTool', {
    env: { FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY! },
  }))
  .build();
```

#### `fromRegistry(toolId, options?): Promise<Tool>`

- **`toolId`** — `string`, in the form `@scope/package::toolName` or `package::toolName` (package name and
  tool name separated by `::`). Throws if the format is invalid or the tool isn't found in the registry.
- **`options`** — optional:

  | Option | Type | Default | Description |
  |---|---|---|---|
  | `apiUrl` | `string` | `https://tpmjs.com` | TPMJS registry base URL (point at a self-hosted registry here). |
  | `executorUrl` | `string` | `${apiUrl}/api/tools/{id}/execute` | Override the tool executor endpoint. |
  | `env` | `Record<string, string>` | — | Environment variables (API keys, etc.) forwarded to the tool at execution time. |

`fromRegistry` resolves the tool's metadata and input schema from the registry and returns a `Tool` whose
`execute` calls the hosted TPMJS executor — so the tool runs in TPMJS's isolated sandbox, not in your
process. Any `env` you supply is passed through per execution.

## Links

- **Docs** — [tpmjs.com/docs/sdk](https://tpmjs.com/docs/sdk)
- **Website** — [tpmjs.com](https://tpmjs.com)
- **Repository** — [github.com/tpmjs/tpmjs](https://github.com/tpmjs/tpmjs)
- **Related packages**
  - [`@tpmjs/registry-search`](https://www.npmjs.com/package/@tpmjs/registry-search) — let an agent search the registry for tools at runtime
  - [`@tpmjs/registry-execute`](https://www.npmjs.com/package/@tpmjs/registry-execute) — execute any registry tool an agent discovers
  - [`@tpmjs/cli`](https://www.npmjs.com/package/@tpmjs/cli) — the `tpm` command-line interface

## License

MIT — see [CONTRIBUTING](https://github.com/tpmjs/tpmjs/blob/main/CONTRIBUTING.md) to get involved.
