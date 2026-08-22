# How to Publish a TPMJS Tool

This guide shows you how to create and publish an AI tool that will be automatically discovered and listed on tpmjs.com.

## Quick Start

1. Create a new NPM package
2. Add `"tpmjs"` to the `keywords` array in package.json
3. Export your tool(s) using the Vercel AI SDK `tool()` helper
4. Add a `tpmjs` field with a `category`
5. Publish to NPM
6. Your tool will automatically appear on tpmjs.com within a few minutes

## Step-by-Step Guide

### 1. Create Your NPM Package

Create a standard NPM package with your tool implementation:

```bash
mkdir my-awesome-tool
cd my-awesome-tool
npm init -y
```

### 2. Add the Required Keyword

In your `package.json`, add `"tpmjs"` to the keywords array:

```json
{
  "name": "@yourname/my-awesome-tool",
  "version": "1.0.0",
  "keywords": ["tpmjs", "ai", "other-keywords"],
  ...
}
```

**Important:** The `"tpmjs"` keyword is REQUIRED for automatic discovery!

### 3. Add TPMJS Metadata (Multi-Tool Format)

Add a `tpmjs` field to your `package.json`. The current format is the **multi-tool format** (`TpmjsMultiToolSchema` in `packages/types/src/tpmjs.ts`): package-level metadata plus an optional `tools` array. One package can publish one tool or many.

#### Minimal (category only)

The only required field is `category`:

```json
{
  "tpmjs": {
    "category": "data"
  }
}
```

If you don't list `tools`, TPMJS **auto-discovers** them: after publish, the registry loads your package in the executor, lists its exports, identifies the AI-SDK-shaped tools, and extracts each tool's description and parameters from its `inputSchema`.

#### Recommended (explicit tools + frameworks)

Declare your tools explicitly to control exactly what gets listed:

```json
{
  "tpmjs": {
    "category": "data",
    "frameworks": ["vercel-ai"],
    "tools": [
      {
        "name": "csvParseTool",
        "description": "Parse CSV text into array of objects with automatic header detection"
      }
    ]
  }
}
```

- `tools[].name` (required) — the **export name** of the tool from your package
- `tools[].description` (optional, 20–500 chars) — auto-extracted from the tool's `description` if omitted

#### What NOT to hand-author

The legacy per-tool `parameters`, `returns`, and `aiAgent` fields are **@deprecated** — they are now auto-extracted from the tool itself at runtime (parameters come from your `inputSchema`). You no longer need to duplicate your schema in package.json; the deprecated fields are only kept as a fallback if auto-extraction fails. See the [legacy format appendix](#appendix-legacy-single-tool-format-deprecated) if you maintain an older package.

### 4. Implement Your Tool

Tools are authored with the Vercel AI SDK's `tool()` helper: a `description`, an `inputSchema` (this is what TPMJS extracts your parameters from), and an `execute` function. Here's the real implementation from `@tpmjs/tools-csv-parse` (`packages/tools/official/csv-parse/src/index.ts`), abridged:

```typescript
// src/index.ts
import { jsonSchema, tool } from 'ai';
import Papa from 'papaparse';

export interface CsvParseResult {
  rows: Record<string, string | number | boolean | null>[];
  headers: string[];
  rowCount: number;
  metadata: {
    parsedAt: string;
    hasErrors: boolean;
    errorCount: number;
  };
}

type CsvParseInput = {
  csv: string;
  hasHeaders?: boolean;
};

export const csvParseTool = tool({
  description:
    'Parse CSV text into an array of objects. Automatically detects headers and infers data types. Returns parsed rows, headers, and metadata.',
  inputSchema: jsonSchema<CsvParseInput>({
    type: 'object',
    properties: {
      csv: {
        type: 'string',
        description: 'The CSV text to parse',
      },
      hasHeaders: {
        type: 'boolean',
        description: 'Whether the first row contains headers (default: true)',
        default: true,
      },
    },
    required: ['csv'],
    additionalProperties: false,
  }),
  async execute({ csv, hasHeaders = true }): Promise<CsvParseResult> {
    const parseResult = Papa.parse(csv, {
      header: hasHeaders,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
    // ... build and return CsvParseResult
  },
});

export default csvParseTool;
```

The export name (`csvParseTool`) is what goes in `tpmjs.tools[].name`. Export multiple tools from one package to publish a multi-tool package.

### 5. Build and Publish

Build your package and publish to NPM:

```bash
# Build your package
npm run build

# Publish to NPM
npm publish --access public
```

### 6. Verification

Your tool will be automatically discovered through:

1. **Changes Feed** - Monitors NPM publishes in near real-time (sync runs every 2 minutes)
2. **Keyword Search** - A full NPM search for `"tpmjs"` runs every 6 hours as a backstop

After publishing, your tool should appear on https://tpmjs.com within a few minutes.

You can verify by searching the public API (no API key needed):
```bash
curl "https://tpmjs.com/api/tools?q=yourpackagename"
```

## Real Example: @tpmjs/tools-csv-parse

Here's the `package.json` from the published official tool (`packages/tools/official/csv-parse/package.json`), abridged:

```json
{
  "name": "@tpmjs/tools-csv-parse",
  "version": "0.2.0",
  "description": "Parse CSV text into array of objects using papaparse",
  "type": "module",
  "keywords": ["tpmjs", "data", "csv", "parse"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsdown --logLevel warn",
    "dev": "tsdown --watch",
    "type-check": "tsc --checkers 1 --noEmit --incremental --tsBuildInfoFile tsconfig.tsbuildinfo"
  },
  "publishConfig": {
    "access": "public"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/tpmjs/tpmjs.git",
    "directory": "packages/tools/official/csv-parse"
  },
  "homepage": "https://tpmjs.com",
  "license": "MIT",
  "tpmjs": {
    "category": "data",
    "frameworks": ["vercel-ai"],
    "tools": [
      {
        "name": "csvParseTool",
        "description": "Parse CSV text into array of objects with automatic header detection"
      }
    ]
  },
  "dependencies": {
    "ai": "6.0.49",
    "papaparse": "^5.5.3"
  }
}
```

## Field Reference

All fields validated by `TpmjsMultiToolSchema` in `packages/types/src/tpmjs.ts`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category` | string | ✅ | One of the valid categories (see below) |
| `tools` | array | — | Tool definitions; omit to use auto-discovery |
| `tools[].name` | string | ✅ (per tool) | The export name of the tool from the package |
| `tools[].description` | string | — | 20–500 chars; auto-extracted from the tool if omitted |
| `env` | array | — | Environment variables the tools need |
| `frameworks` | array | — | Any of: `vercel-ai`, `langchain`, `llamaindex`, `haystack`, `semantic-kernel` |

### Categories

The `category` field is validated with `z.enum` against `TPMJS_CATEGORIES` in `packages/types/src/tpmjs.ts` — **that file is the source of truth**; any other value fails validation. The current list, grouped as in the source:

**Core categories:**
`research`, `web`, `data`, `documentation`, `engineering`, `security`, `statistics`, `ops`, `agent`, `sandbox`, `utilities`, `html`, `compliance`

**Legacy categories** (kept for backward compatibility):
`web-scraping`, `data-processing`, `file-operations`, `communication`, `database`, `api-integration`, `image-processing`, `text-analysis`, `automation`, `ai-ml`, `monitoring`

**Business categories:**
`finance`, `legal`, `hr`, `marketing`, `cx`, `edu`, `sales`

**Aliases:**
`doc`, `text`

Prefer a core or business category for new packages.

### Environment Variables

If your tool requires environment variables:

```json
"env": [
  {
    "name": "OPENAI_API_KEY",
    "description": "API key for OpenAI services",
    "required": true
  },
  {
    "name": "API_ENDPOINT",
    "description": "Custom API endpoint URL",
    "required": false,
    "default": "https://api.example.com"
  }
]
```

## Health checks run your tool

After every sync TPMJS imports each declared tool **and calls `execute()` once** with generated placeholder parameters (required params only: strings become `"test"`, enums use their first value, numbers `1`) and **no environment variables**. A typed error thrown by your tool counts as healthy (it proves the tool is callable); only load failures mark it broken.

Consequences for authors:

- Tools that need credentials should fail fast when the env var is missing (as the examples above do) — that is what keeps the health check side-effect free.
- A tool that can perform a side effect **without** a credential will be executed for real. Declare a safe configuration per tool in `tpmjs.tools[].healthCheck`: `{ "skipExecution": true }` to import-only, or `{ "testParams": { ... }, "cleanup": [ ... ] }` for a known-safe call (string values may use `{{timestamp}}`).

## Tools run in a shared process — never cache across calls

The executor keeps one instance of your module per package version and serves every caller from it (any user, any collection). Anything you store at module scope — a memoised API response, a resolved account id, a client built from `process.env` at import time — is visible to the next caller, who may not be the same person. Read credentials from `process.env` **inside** `execute()` on every call and keep per-call state inside the call. The executor restores injected env vars after each execution and serializes executions, but it cannot un-share your module's variables.

## Quality Score

Your tool's quality score is computed by `calculateQualityScore` in `apps/web/src/app/api/sync/metrics/route.ts`:

- **Tier base score**: `rich` = 0.6, `minimal` = 0.4. A package is `rich` when it declares `env` or `frameworks` (or a tool carries the legacy `parameters`/`returns`/`aiAgent` fields); otherwise it's `minimal`.
- **Downloads**: `min(0.2, log10(downloads + 1) / 15)` — logarithmic, max 0.2
- **GitHub stars**: `min(0.1, log10(stars + 1) / 10)` — logarithmic, max 0.1
- **Tool metadata richness** (max 0.1): +0.04 if the tool has parameters, +0.03 for a return type, +0.03 for AI-agent guidance — auto-extracted metadata counts
- **Total**: capped at 1.0, rounded to 2 decimal places

Higher scores = better visibility on tpmjs.com!

## Tips for Success

1. **Use descriptive names** - Make your package name clear and searchable
2. **Declare `frameworks` and `env`** - This puts you in the `rich` tier (0.6 base score vs 0.4)
3. **Write a good `inputSchema`** - Parameter descriptions are auto-extracted from it and shown to AI agents
4. **Good documentation** - Add documentation URL to package.json homepage or repository fields
5. **Active maintenance** - Regular updates boost download counts

## Testing Locally

Before publishing, you can validate your `tpmjs` field using the validation schema (`validateTpmjsField` in `packages/types/src/tpmjs.ts`):

```bash
# In the tpmjs monorepo
pnpm --filter=@tpmjs/types test
```

Or manually check the structure matches the examples above.

## Troubleshooting

**Tool not appearing after a few minutes?**
- Check that you added `"tpmjs"` to keywords
- Verify your `tpmjs` field has a valid `category` (see the list above — an invalid category fails validation)
- Check the NPM package is public: `npm view yourpackage`

**Tool showing as "minimal" tier?**
- Declare `frameworks` and/or `env` in your `tpmjs` field — that's what promotes a multi-tool package to `rich`

**Auto-discovery found the wrong exports?**
- Declare your tools explicitly in `tpmjs.tools` with the exact export names — explicit definitions override auto-discovery

**Want to force a sync?**
You can manually trigger a sync (requires CRON_SECRET, not a user API key):
```bash
curl -X POST "https://tpmjs.com/api/sync/keyword" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Appendix: Legacy Single-Tool Format (Deprecated)

Older packages use a single-tool format with top-level `description`, `parameters`, `returns`, and `aiAgent` fields:

```json
{
  "tpmjs": {
    "category": "text-analysis",
    "description": "Analyzes sentiment in text and returns a score",
    "parameters": [
      {
        "name": "text",
        "type": "string",
        "description": "The text to analyze",
        "required": true
      }
    ],
    "returns": {
      "type": "SentimentResult",
      "description": "Object containing score (-1 to 1) and label"
    },
    "aiAgent": {
      "useCase": "Use this tool when users need to analyze sentiment in text."
    }
  }
}
```

This format still validates (`TpmjsLegacyMinimalSchema` / `TpmjsLegacyRichSchema` in `packages/types/src/tpmjs.ts`) and is **auto-migrated** on sync into the multi-tool format as a single tool named `default`. But `parameters`, `returns`, and `aiAgent` are all `@deprecated` — the registry auto-extracts them from the tool itself — so new packages should use the multi-tool format above.

## Support

Questions or issues?
- File an issue: https://github.com/tpmjs/tpmjs/issues
- Check the API docs: https://tpmjs.com/docs/api
- Generate an API key: https://tpmjs.com/dashboard/settings/tpmjs-api-keys
