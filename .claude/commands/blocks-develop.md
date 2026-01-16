---
description: Develop and validate TPMJS tools using the blocks CLI
---

Help the user develop new tools for the TPMJS registry using the blocks CLI. This workflow covers defining tools in blocks.yml, implementing them with AI SDK v6, validating with the blocks CLI, and publishing to npm.

## Development Workflow

### 1. Define Tool in blocks.yml

Add tool definition to `packages/tools/official/blocks.yml`:

```yaml
blocks:
  category.toolName:
    type: utility
    description: "Clear description for LLMs"
    path: "tool-directory-name"
    domain_rules:
      - id: rule_name
        description: "Implementation requirement"
    inputs:
      - name: paramName
        type: string
        description: "Parameter description"
    outputs:
      - name: result
        type: ResultType
        description: "Output description"
        measures: [working_implementation, valid_output_structure, proper_error_handling, ai_sdk_compliance]
```

### 2. Create Package Structure

```
packages/tools/official/tool-name/
├── package.json      # npm package with tpmjs field
├── tsconfig.json     # Extends @tpmjs/tsconfig
├── tsup.config.ts    # Build config
├── block.ts          # REQUIRED by validator
├── index.ts          # Re-export from src
└── src/index.ts      # Main implementation
```

### 3. Implement with AI SDK v6

```typescript
import { jsonSchema, tool } from 'ai';

export const myTool = tool({
  description: 'Description for LLMs',
  parameters: jsonSchema<InputType>({
    type: 'object',
    properties: { /* ... */ },
    required: ['field1'],
  }),
  async execute(input): Promise<OutputType> {
    // REAL implementation - no stubs
    return result;
  },
});

export default myTool;
```

### 4. Run Validation

```bash
cd packages/tools/official
pnpm blocks run tool-name          # Validate single tool
pnpm blocks run tool-name --force  # Force full validation
pnpm blocks run --all              # Validate all tools
```

### 5. Build and Publish

```bash
pnpm build
npm publish --access public

# Trigger sync to tpmjs.com
source apps/web/.env.local
curl -X POST https://tpmjs.com/api/sync/keyword -H "Authorization: Bearer $CRON_SECRET"
```

## Valid Categories

For `tpmjs.category` in package.json: `research`, `web`, `data`, `documentation`, `engineering`, `security`, `statistics`, `ops`, `agent`, `sandbox`, `utilities`, `html`, `compliance`

## Required Files

- **block.ts** at root: `export const block = { name: 'tool-name', tools: { myTool } };`
- **index.ts** at root: `export * from './src/index.js';`
- Both are required for the validator to find the tool

## Common Issues

- "invalid tpmjs field" during sync = Invalid category or missing tools array
- "Tool not found in exports" = Export name must match blocks.yml
- "Required file not found" = Need index.ts and block.ts at package root

When helping the user, read the full skill documentation at `.claude/skills/blocks-develop.md` for comprehensive details on entities, measures, and multi-tool packages.
