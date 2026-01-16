# TPMJS Tool Development with Blocks CLI

Use this skill when developing new tools for the TPMJS registry. This covers the full workflow from defining a tool in blocks.yml through implementation, validation, and publishing.

## Quick Start

```bash
# Navigate to official tools directory
cd packages/tools/official

# Run validation on a specific tool
pnpm blocks run <block-name>

# Run validation on all tools
pnpm blocks run --all

# Force full validation (ignore cache)
pnpm blocks run <block-name> --force
```

## Development Workflow

### 1. Define the Tool Block in blocks.yml

Add your tool definition to `packages/tools/official/blocks.yml` in the `blocks:` section:

```yaml
blocks:
  # Category.toolName format
  sandbox.myTool:
    type: utility
    description: "Clear, LLM-friendly description of what the tool does"
    path: "my-tool"  # Directory name under packages/tools/official/
    domain_rules:
      - id: rule_name
        description: "What this implementation must do"
    inputs:
      - name: inputName
        type: string
        description: "Description for LLMs"
      - name: optionalInput
        type: number
        optional: true
        description: "Optional parameter"
    outputs:
      - name: result
        type: MyResultType
        description: "What the tool returns"
        measures: [working_implementation, valid_output_structure, proper_error_handling, ai_sdk_compliance]
```

**Key Fields:**
- `type`: Usually `utility` for single-shot tools
- `path`: Directory name (kebab-case)
- `domain_rules`: Implementation requirements the validator checks
- `inputs/outputs`: Schema for validation
- `measures`: Quality constraints from the domain section

### 2. Create the Tool Package

Create the directory structure:

```
packages/tools/official/my-tool/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── block.ts           # Required by validator
├── index.ts           # Re-export from src
└── src/
    └── index.ts       # Main implementation
```

**package.json:**
```json
{
  "name": "@tpmjs/tools-my-tool",
  "version": "0.1.0",
  "description": "Short description for npm",
  "type": "module",
  "keywords": ["tpmjs", "category-name", "ai"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist .turbo"
  },
  "devDependencies": {
    "@tpmjs/tsconfig": "workspace:*",
    "tsup": "^8.5.1",
    "typescript": "^5.9.3"
  },
  "dependencies": {
    "ai": "6.0.23"
  },
  "publishConfig": {
    "access": "public"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/tpmjs/tpmjs.git",
    "directory": "packages/tools/official/my-tool"
  },
  "homepage": "https://tpmjs.com",
  "license": "MIT",
  "tpmjs": {
    "category": "sandbox",
    "frameworks": ["vercel-ai"],
    "tools": [
      {
        "name": "myTool",
        "description": "Clear description (20+ chars) of what this tool does."
      }
    ]
  }
}
```

**Valid categories for tpmjs.category:**
- `research`, `web`, `data`, `documentation`, `engineering`
- `security`, `statistics`, `ops`, `agent`, `sandbox`, `utilities`
- `html`, `compliance`

**tsconfig.json:**
```json
{
  "extends": "@tpmjs/tsconfig/react-library.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**tsup.config.ts:**
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
});
```

**block.ts (Required by validator):**
```typescript
import { myTool } from './src/index.js';

export const block = {
  name: 'my-tool',
  description: 'Short description',
  tools: { myTool },
};

export default block;
```

**index.ts (Root re-export):**
```typescript
export * from './src/index.js';
export { default } from './src/index.js';
```

### 3. Implement the Tool

**src/index.ts:**
```typescript
import { jsonSchema, tool } from 'ai';

// Define input/output types
interface MyToolInput {
  param1: string;
  param2?: number;
}

interface MyToolResult {
  data: string;
  metadata: {
    processedAt: string;
  };
}

// Export the tool using AI SDK v6 pattern
export const myTool = tool({
  description: 'Clear description for LLMs explaining what this tool does and when to use it.',
  parameters: jsonSchema<MyToolInput>({
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Description of param1',
      },
      param2: {
        type: 'number',
        description: 'Optional description of param2',
      },
    },
    required: ['param1'],
  }),
  async execute(input): Promise<MyToolResult> {
    // REAL implementation - no stubs, no TODOs
    const result = await doSomething(input.param1);

    return {
      data: result,
      metadata: {
        processedAt: new Date().toISOString(),
      },
    };
  },
});

// Default export for compatibility
export default myTool;
```

### 4. Run Validation

```bash
cd packages/tools/official

# Validate your tool
pnpm blocks run my-tool

# The validator runs 3 stages:
# 1. schema   - Validates inputs/outputs match blocks.yml
# 2. shape    - Verifies exports and structure
# 3. domain   - Checks domain rules are satisfied
```

**Common validation errors:**
- `Required file "index.ts" not found` - Need index.ts at package root
- `Required file "block.ts" not found` - Need block.ts at package root
- `Tool "myTool" not found in exports` - Export name must match blocks.yml
- `invalid tpmjs field` - Category must be valid, tools array required

### 5. Build and Publish

```bash
# Build the package
pnpm build

# Publish to npm
npm publish --access public

# Trigger sync to tpmjs.com
source apps/web/.env.local
curl -X POST https://tpmjs.com/api/sync/keyword \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Multi-Tool Packages

For packages with multiple tools (like unsandbox):

**blocks.yml:**
```yaml
blocks:
  sandbox.executeCodeAsync:
    type: utility
    path: "unsandbox"  # Same path for all tools in package
    # ...

  sandbox.getJob:
    type: utility
    path: "unsandbox"  # Same path
    # ...
```

**block.ts:**
```typescript
import { executeCodeAsync, getJob, listJobs } from './src/index.js';

export const block = {
  name: 'unsandbox',
  tools: { executeCodeAsync, getJob, listJobs },
};

export default block;
```

**package.json tpmjs field:**
```json
{
  "tpmjs": {
    "category": "sandbox",
    "frameworks": ["vercel-ai"],
    "tools": [
      { "name": "executeCodeAsync", "description": "..." },
      { "name": "getJob", "description": "..." },
      { "name": "listJobs", "description": "..." }
    ]
  }
}
```

## Philosophy (from blocks.yml)

- Every tool MUST be a working, production-ready implementation - no stubs, no TODOs
- Tools use AI SDK v6 `tool()` + `jsonSchema()` pattern exclusively
- Each tool does ONE thing exceptionally well (single-shot, one call in, one result out)
- Tools return structured, typed outputs that agents can reliably parse
- Error handling is explicit - throw meaningful errors, never silently fail
- Dependencies are minimal and production-stable

## Domain Entities

When defining outputs, reference existing entities from blocks.yml:

```yaml
# Example entities available:
url:           [href, domain, protocol, path, query, fragment]
webpage:       [url, title, html, text, metadata]
text_content:  [raw, sentences, paragraphs, wordCount]
claim:         [statement, confidence, needsCitation, category]
timeline:      [events, dateRange, gaps, eventCount]
```

Or define new entities in the `domain.entities` section if needed.

## Quality Measures

Reference these in your tool's `measures` array:

- `working_implementation` - No stubs, TODOs, or placeholders
- `valid_output_structure` - Returns correct typed object
- `proper_error_handling` - Throws descriptive errors
- `ai_sdk_compliance` - Uses tool() and jsonSchema()
- `npm_publishable` - Valid package.json with tpmjs field
- `readme_documentation` - Has README with examples

## Debugging Tips

```bash
# Force rebuild without cache
pnpm blocks run my-tool --force --no-cache

# See JSON output for debugging
pnpm blocks run my-tool --json

# Check if validator finds your package
ls packages/tools/official/my-tool/
# Must have: index.ts, block.ts at root level
```
