# @tpmjs/registry-search

Search the TPMJS tool registry from any AI SDK agent. Discover thousands of tools dynamically.

## Installation

```bash
npm install @tpmjs/registry-search
# or
pnpm add @tpmjs/registry-search
```

## Usage

```typescript
import { Agent } from 'ai';
import { registrySearchTool } from '@tpmjs/registry-search';
import { registryExecuteTool } from '@tpmjs/registry-execute';

const agent = new Agent({
  model: 'anthropic/claude-sonnet-4-20250514',
  tools: {
    registrySearch: registrySearchTool,
    registryExecute: registryExecuteTool,
  },
});

// The agent can now:
// 1. Search for tools: registrySearch({ query: "web scraping" })
// 2. Execute found tools: registryExecute({ toolId: "@firecrawl/ai-sdk::scrapeTool", params: { url: "..." } })
```

## Tool: registrySearchTool

Search the TPMJS registry to find AI SDK tools.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `query` | string | Yes | Search query (keywords, tool names, descriptions) |
| `category` | string | No | Filter by category |
| `limit` | number | No | Max results (1-20, default 5) |

### Categories

- `web-scraping`
- `data-processing`
- `file-operations`
- `communication`
- `database`
- `api-integration`
- `image-processing`
- `text-analysis`
- `automation`
- `ai-ml`
- `security`
- `monitoring`

### Returns

```json
{
  "query": "web scraping",
  "matchCount": 3,
  "tools": [
    {
      "toolId": "@firecrawl/ai-sdk::scrapeTool",
      "name": "scrapeTool",
      "package": "@firecrawl/ai-sdk",
      "description": "Scrape any website into clean markdown",
      "category": "web-scraping",
      "requiredEnvVars": ["FIRECRAWL_API_KEY"],
      "healthStatus": "HEALTHY",
      "qualityScore": 0.9
    }
  ]
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TPMJS_API_URL` | `https://tpmjs.com` | Base URL for the registry API |

### Self-Hosted Registry

To use your own TPMJS registry:

```bash
export TPMJS_API_URL=https://registry.mycompany.com
```

## Related

- [@tpmjs/registry-execute](https://www.npmjs.com/package/@tpmjs/registry-execute) - Execute tools found with this package
- [TPMJS Registry](https://tpmjs.com) - Browse all available tools

## License

MIT
