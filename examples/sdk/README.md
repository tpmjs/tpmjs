# SDK surface — `@tpmjs/compose`

Load real registry tools straight into a [Vercel AI SDK](https://sdk.vercel.ai) agent. This example
uses [`@tpmjs/compose`](https://www.npmjs.com/package/@tpmjs/compose): `fromRegistry` resolves a tool
by its `package::export` id, and `createToolSet` composes it (fully typed) into a plain tool record
you pass straight to `generateText`.

The tool runs in TPMJS's hosted sandbox — it is never installed into your process.

## Prerequisites

- Node.js 18+
- **A model provider API key.** This example calls an LLM, so it does *not* run with zero setup.
  It uses OpenAI by default (`OPENAI_API_KEY`) — swap the provider/model for any the AI SDK supports.

## Install

```bash
pnpm install
# or: npm install
```

Dependencies (see [`package.json`](./package.json)): `@tpmjs/compose`, `ai` (the AI SDK, peer dep
`>=6`), and `@ai-sdk/openai` as the provider. The package is `"private": true` and lives outside the
pnpm workspace, so it is never published.

## Run

```bash
OPENAI_API_KEY=sk-... pnpm start
```

## What it does

See [`index.ts`](./index.ts):

```ts
const base64Encode = await fromRegistry('@tpmjs/official-base64-encode::base64EncodeTool');
const tools = createToolSet().use('base64Encode', base64Encode).build();

const result = await generateText({
  model: openai('gpt-5.4'),
  tools,
  stopWhen: stepCountIs(5),
  prompt: 'Use the base64Encode tool to encode the text "Hello, TPMJS!" and tell me the result.',
});
console.log(result.text);
```

### Expected output

The model calls the `base64Encode` tool, which returns
`{ base64: "SGVsbG8sIFRQTUpTIQ==", byteLength: 13 }`, then answers in prose — something like:

```
The base64 encoding of "Hello, TPMJS!" is SGVsbG8sIFRQTUpTIQ== (13 bytes).
```

(Exact wording depends on the model.)

## Passing API keys to tools

Tools that need their own keys take them via `fromRegistry`'s `env` option, forwarded per execution:

```ts
const scrape = await fromRegistry('@firecrawl/ai-sdk::scrapeTool', {
  env: { FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY! },
});
```

## Notes

- Package README: [`packages/compose/README.md`](../../packages/compose/README.md) ·
  Docs: <https://tpmjs.com/docs/sdk>.
- Prefer letting the model discover tools at runtime? Use
  [`@tpmjs/registry-search`](../../packages/tools/registrySearch/README.md) +
  [`@tpmjs/registry-execute`](../../packages/tools/registryExecute/README.md) instead of pinning a
  tool with `fromRegistry`.
