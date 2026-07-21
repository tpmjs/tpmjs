# @tpmjs/types

Shared TypeScript types and [Zod](https://zod.dev) schemas for [TPMJS](https://tpmjs.com) — the protocol-agnostic tool layer for AI agents.

<p>
  <a href="https://www.npmjs.com/package/@tpmjs/types"><img src="https://img.shields.io/npm/v/@tpmjs/types.svg" alt="npm version"></a>
  <a href="https://github.com/tpmjs/tpmjs/blob/main/LICENSE"><img src="https://img.shields.io/github/license/tpmjs/tpmjs" alt="License"></a>
</p>

The single source of truth for the shapes that flow across TPMJS — tools, collections, agents, users, the registry, and the tool executor contract. Every type is a Zod schema, so the same definition gives you a compile-time TypeScript type *and* a runtime validator. If you're building against the TPMJS API, writing a custom tool executor, or contributing to the platform, import your types and validators from here instead of hand-rolling them.

## Installation

```bash
npm install @tpmjs/types zod
# or
pnpm add @tpmjs/types zod
```

`zod` (v4) is a peer of the schemas you import. Types are published as ESM with per-domain subpaths — there is no root barrel; import from the module you need.

## Usage

### Validate a package's `tpmjs` config

The `tpmjs` module owns the config authors put in their `package.json`, plus the canonical category list and a validator that accepts both the new multi-tool format and legacy single-tool formats.

```typescript
import {
  validateTpmjsField,
  TPMJS_CATEGORIES,
  type TpmjsMultiTool,
} from '@tpmjs/types/tpmjs';

const result = validateTpmjsField({
  category: 'web',
  tools: [{ name: 'scrapeTool' }],
});

if (result.valid) {
  console.log(result.tier); // 'minimal' | 'rich'
  console.log(result.needsAutoDiscovery); // true when tools should be discovered from exports
} else {
  console.error(result.errors?.issues);
}

TPMJS_CATEGORIES.includes('research'); // true
```

### Validate the executor contract

The `executor` module defines the request/response contract every tool executor must implement. Use the Zod schemas to validate payloads at the boundary.

```typescript
import {
  ExecuteToolRequestSchema,
  type ExecuteToolResponse,
} from '@tpmjs/types/executor';

const request = ExecuteToolRequestSchema.parse({
  packageName: '@tpmjs/hello',
  name: 'helloWorld',
  params: { name: 'world' },
});

const response: ExecuteToolResponse = {
  success: true,
  output: 'hello world',
  executionTimeMs: 42,
};
```

TPMJS-owned executors also validate failures with
`TypedExecuteToolResponseSchema`. `error` is operator-facing prose; decisions
must use the stable metadata fields:

```typescript
const failure = {
  success: false,
  error: 'Export not found in package',
  errorStage: 'load',
  errorCode: 'TOOL_NOT_FOUND',
  retryable: false,
  executionTimeMs: 19,
};
```

Never classify failures by parsing or matching the `error` string.

### Parse API responses

Domain schemas cover the objects the API returns — collections, agents, users, and so on.

```typescript
import { CreateCollectionSchema } from '@tpmjs/types/collection';
import { AIProviderSchema } from '@tpmjs/types/agent';

const input = CreateCollectionSchema.parse({
  name: 'My Tools',
  description: 'A curated set',
  isPublic: true,
});

AIProviderSchema.parse('ANTHROPIC'); // 'OPENAI' | 'ANTHROPIC' | 'GOOGLE' | 'GROQ' | 'MISTRAL'
```

## Exports

Each subpath exports the Zod schemas, inferred TypeScript types, and (where relevant) constants and helpers for one domain.

| Subpath | Highlights |
|---------|------------|
| `@tpmjs/types/tpmjs` | `TPMJS_CATEGORIES`, `validateTpmjsField()`, `TpmjsMultiToolSchema`, `TpmjsToolDefinitionSchema`, `ToolHealthCheckConfigSchema`, `isTpmjsMinimal`/`isTpmjsRich`, `ValidationResult` |
| `@tpmjs/types/executor` | `ExecuteToolRequest`/`Response`, their Zod schemas, `ExecutorConfigSchema` (discriminated union), sandbox session types |
| `@tpmjs/types/collection` | `CreateCollectionSchema`, `UpdateCollectionSchema`, `CollectionWithToolsSchema`, `UseCaseSchema`, `COLLECTION_LIMITS` |
| `@tpmjs/types/agent` | `CreateAgentSchema`, `AgentSchema`, `ToolPermissionsSchema`, `AIProviderSchema`, `PROVIDER_MODELS`, `AGENT_LIMITS` |
| `@tpmjs/types/user` | `UsernameSchema`, `UserProfileSchema`, `RESERVED_USERNAMES`, `suggestUsername()`, `isValidUsername()` |
| `@tpmjs/types/tool` | `ToolSchema`, `ToolParameterSchema` and their inferred types |
| `@tpmjs/types/registry` | `RegistrySearchOptionsSchema`, `RegistrySearchResultSchema` |

Every schema has a matching inferred type — e.g. `CollectionSchema` → `type Collection`, `CreateAgentSchema` → `type CreateAgentInput`.

## Links

- [TPMJS](https://tpmjs.com) — browse the registry
- [Docs](https://tpmjs.com/docs)
- [Repository](https://github.com/tpmjs/tpmjs) — package at `packages/types`

## License

MIT
