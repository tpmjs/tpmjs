# @tpmjs/registry-execute

Execute tools from the TPMJS registry in any AI SDK agent. Tools run in a secure sandbox - no local installation required.

## Installation

```bash
npm install @tpmjs/registry-execute
# or
pnpm add @tpmjs/registry-execute
```

## Usage

```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { registrySearchTool } from '@tpmjs/registry-search';
import { registryExecuteTool } from '@tpmjs/registry-execute';

const result = streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: {
    registrySearch: registrySearchTool,
    registryExecute: registryExecuteTool,
  },
  system: `You have access to the TPMJS tool registry.
Use registrySearch to find tools, then registryExecute to run them.`,
  prompt: 'Search for web scraping tools and scrape https://example.com',
});

// The agent can now:
// 1. Search for tools: registrySearch({ query: "web scraping" })
// 2. Execute found tools: registryExecute({ toolId: "@firecrawl/ai-sdk::scrapeTool", params: { url: "..." } })
```

## Tool: registryExecuteTool

Execute a tool from the TPMJS registry by its toolId.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `toolId` | string | Yes | Tool identifier (format: `package::exportName`) |
| `params` | object | Yes | Parameters to pass to the tool |
| `env` | object | No | Environment variables (API keys) if required |

### Example

```typescript
// Execute a web search tool
const result = await registryExecuteTool.execute({
  toolId: '@exalabs/ai-sdk::webSearch',
  params: { query: 'latest AI news' },
  env: { EXA_API_KEY: 'your-api-key' },
});

// Result:
// {
//   toolId: '@exalabs/ai-sdk::webSearch',
//   executionTimeMs: 1234,
//   output: { results: [...] }
// }
```

### Returns

```json
{
  "toolId": "@exalabs/ai-sdk::webSearch",
  "executionTimeMs": 1234,
  "output": { ... }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TPMJS_API_URL` | `https://tpmjs.com` | Base URL for the registry API |
| `TPMJS_EXECUTOR_URL` | `https://executor.tpmjs.com` | URL for the sandbox executor |

### Self-Hosted Registry

To use your own TPMJS registry and executor:

```bash
export TPMJS_API_URL=https://registry.mycompany.com
export TPMJS_EXECUTOR_URL=https://executor.mycompany.com
```

## Security

- All tools run in a sandboxed Deno environment on Railway
- API keys are passed per-request, never stored
- Only registered tools can be executed (no arbitrary code)

## Related

- [@tpmjs/registry-search](https://www.npmjs.com/package/@tpmjs/registry-search) - Find tools to execute
- [TPMJS Registry](https://tpmjs.com) - Browse all available tools

## License

MIT
