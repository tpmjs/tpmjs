# Manual Tools Registry

## Overview

This system allows TPMJS to include high-quality tools that don't follow the standard `tpmjs` field specification in their package.json. These tools are manually curated and synced to the database.

## Why Manual Tools?

Some excellent tools (like Vercel's code execution, Exa search, Firecrawl, etc.) don't include the `tpmjs` field in their package.json. Rather than wait for these package maintainers to adopt the spec, we manually curate metadata for these tools.

## Architecture

### Files

1. **`manual-tools.ts`** - The registry of manually curated tools
2. **`sync-manual-tools.ts`** - Script to sync manual tools to database
3. **`MANUAL_TOOLS.md`** - This documentation

### How It Works

1. **Manual Tool Registry** (`manual-tools.ts`)
   - Exports a `manualTools` array with metadata for each tool
   - Each entry includes npm package name, export name, category, description, parameters, etc.
   - Follows the same schema as the standard `tpmjs` field

2. **Sync Script** (`sync-manual-tools.ts`)
   - Fetches latest package metadata from npm
   - Combines npm metadata with manual metadata
   - Upserts Package + Tool records to database
   - Marks tools with `discoveryMethod: 'manual'`

3. **Database Storage**
   - Manual tools stored in same `packages` and `tools` tables as auto-discovered tools
   - No special handling needed in API or frontend
   - `discoveryMethod: 'manual'` field distinguishes them

## Adding a New Manual Tool

### Step 1: Add to Registry

Edit `manual-tools.ts` and add a new entry:

```typescript
{
  npmPackageName: 'example-package',
  category: 'search',
  frameworks: ['vercel-ai'],
  exportName: 'exampleTool',
  description: 'A clear, concise description of what this tool does',

  // Optional but recommended for 'rich' tier
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: 'The search query',
      required: true,
    },
  ],

  returns: {
    type: 'array',
    description: 'Array of search results',
  },

  aiAgent: {
    useCase: 'Use when you need to search for X',
    limitations: 'Rate limits apply',
    examples: [
      'Search for current news',
      'Find specific information',
    ],
  },

  // Environment variables
  env: [
    {
      name: 'EXAMPLE_API_KEY',
      description: 'API key for the service',
      required: true,
    },
  ],

  // Additional metadata
  tags: ['search', 'web'],
  docsUrl: 'https://example.com/docs',
  apiKeyUrl: 'https://example.com/api-keys',
  websiteUrl: 'https://example.com',
}
```

### Step 2: Run Sync Script

```bash
# From repository root
pnpm tsx sync-manual-tools.ts
```

This will:
1. Fetch the package from npm
2. Create/update Package record
3. Create/update Tool record(s)
4. Set `discoveryMethod: 'manual'`

### Step 3: Verify

Check that the tool appears on tpmjs.com:

```bash
# Start dev server
pnpm dev --filter=@tpmjs/web

# Visit http://localhost:3000/tool/tool-search
# Search for your package name
```

## Multi-Tool Packages

If a package exports multiple tools, add multiple entries with the same `npmPackageName` but different `exportName`:

```typescript
{
  npmPackageName: 'firecrawl-aisdk',
  exportName: 'scrapeTool',
  description: 'Scrape websites...',
  // ...
},
{
  npmPackageName: 'firecrawl-aisdk',
  exportName: 'searchTool',
  description: 'Search the web...',
  // ...
},
{
  npmPackageName: 'firecrawl-aisdk',
  exportName: 'crawlTool',
  description: 'Crawl entire websites...',
  // ...
},
```

## Tier Calculation

Tools are automatically assigned a tier:

- **Rich tier**: Has `parameters` OR `returns` OR `aiAgent` fields
- **Minimal tier**: Only has basic metadata

Rich tier tools get 4x quality score multiplier, so add detailed metadata when possible.

## Maintenance

### Updating Manual Tools

1. Edit the entry in `manual-tools.ts`
2. Run `pnpm tsx sync-manual-tools.ts`
3. The upsert will update existing records

### Removing Manual Tools

1. Remove the entry from `manual-tools.ts`
2. Manually delete from database OR wait for metrics sync to mark as stale

### Version Updates

The sync script automatically fetches the latest version from npm unless you specify `npmVersion` in the manual tool entry.

## Production Deployment

### Option 1: Manual Sync on Deploy

Add to your deployment workflow:

```yaml
# .github/workflows/deploy.yml
- name: Sync manual tools
  run: pnpm tsx sync-manual-tools.ts
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Option 2: Scheduled Sync

Create a cron job or GitHub Action to sync periodically:

```yaml
# .github/workflows/sync-manual.yml
name: Sync Manual Tools

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:      # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm tsx sync-manual-tools.ts
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Option 3: API Endpoint

Create a sync endpoint (similar to keyword/changes sync):

```typescript
// apps/web/src/app/api/sync/manual/route.ts
import { manualTools } from '@/manual-tools';
// ... sync logic

export async function POST(request: Request) {
  // Verify CRON_SECRET
  // Run manual sync
  // Return results
}
```

## Currently Included Manual Tools

As of this documentation:

- **ai-sdk-tool-code-execution** - Vercel Sandbox code execution
- **@exalabs/ai-sdk** - Exa web search
- **@parallel-web/ai-sdk-tools** - Parallel search and extraction (2 tools)
- **ctx-zip** - MCP + Vercel Sandbox integration
- **@perplexity-ai/ai-sdk** - Perplexity search
- **@tavily/ai-sdk** - Tavily web research
- **firecrawl-aisdk** - Firecrawl scraping, search, crawling (3 tools)
- **bedrock-agentcore** - AWS Bedrock code interpreter and browser (2 tools)
- **@superagent-ai/ai-sdk** - Superagent security tools (3 tools)
- **@valyu/ai-sdk** - Valyu domain-specific search tools (8 tools)

**Total: 24 manually curated tools across 10 packages**

## FAQ

### Why not just ask package maintainers to add the tpmjs field?

We should! But:
1. Some packages are from large companies (Vercel, AWS, etc.) with slow adoption cycles
2. We want these tools available on TPMJS now
3. Manual curation lets us provide better metadata than package authors might

### Will manual tools be replaced by auto-discovered ones?

Yes! If a package adds a proper `tpmjs` field, the auto-discovery sync will update it with `discoveryMethod: 'keyword'` or `'changes-feed'`. Manual entries can then be removed from `manual-tools.ts`.

### Can I mix manual and auto-discovered tools from the same package?

Yes. If a package has some tools in the `tpmjs` field but is missing others, you can manually add the missing ones. The sync scripts will coexist peacefully.

### How do I know if a tool is manually curated?

Check the `discoveryMethod` field in the database:
- `'manual'` = Manually curated
- `'keyword'` = Auto-discovered via keyword search
- `'changes-feed'` = Auto-discovered via npm changes feed

## Best Practices

1. **Complete Metadata** - Provide as much metadata as possible for rich tier
2. **Accurate Descriptions** - Tool descriptions should be clear and specific
3. **AI-Friendly** - Write `aiAgent.useCase` as guidance for LLMs
4. **Keep Updated** - Periodically check if packages have added native `tpmjs` support
5. **Link to Docs** - Always include `docsUrl` when available
6. **API Key URLs** - Include `apiKeyUrl` for tools requiring authentication

## Contributing

To contribute new manual tools:

1. Fork the repository
2. Add your tool to `manual-tools.ts`
3. Test with `pnpm tsx sync-manual-tools.ts`
4. Open a pull request with:
   - Why this tool should be included
   - Link to the npm package
   - Screenshot of it working in TPMJS

## Related Documentation

- [HOW_TO_PUBLISH_A_TOOL.md](./HOW_TO_PUBLISH_A_TOOL.md) - Standard tpmjs field spec
- [CLAUDE.md](./CLAUDE.md) - General project documentation
- [packages/types/src/tpmjs.ts](./packages/types/src/tpmjs.ts) - TypeScript schema definitions
