# @tpmjs/official-memory

Persistent, semantically-searchable memory tools for AI agents. Create and search memories across sessions using embedding-based semantic search.

## Installation

```bash
npm install @tpmjs/official-memory
```

## Setup

Set the `TPMJS_API_KEY` environment variable with a key that has `memory:read` and `memory:write` scopes.

Get a key at [tpmjs.com/dashboard/settings/tpmjs-api-keys](https://tpmjs.com/dashboard/settings/tpmjs-api-keys).

Optionally set `TPMJS_BASE_URL` (defaults to `https://tpmjs.com`).

## Usage

```typescript
import { createMemoryTool, searchMemoryTool } from '@tpmjs/official-memory';

// Store a memory
const memory = await createMemoryTool.execute({
  content: { decision: 'Use PostgreSQL', reason: 'Team expertise' },
  summary: 'Database decision: PostgreSQL chosen for team expertise',
  namespace: 'project-x',
  tags: ['architecture', 'database'],
});

// Search memories
const results = await searchMemoryTool.execute({
  query: 'What database did we choose?',
  namespace: 'project-x',
});
```

## Tools

### createMemoryTool

Store a persistent memory that can be retrieved later via semantic search.

#### Parameters

| Name      | Type     | Required | Description                                       |
|-----------|----------|----------|---------------------------------------------------|
| content   | object   | Yes      | Arbitrary JSON payload to store                   |
| summary   | string   | No       | Human-readable summary (max 500 chars)            |
| namespace | string   | No       | Grouping namespace (e.g., 'project-x', 'personal')|
| tags      | string[] | No       | Tags for categorization                           |
| expiresAt | string   | No       | ISO 8601 datetime for automatic expiration        |

#### Output

| Field            | Type        | Description                          |
|------------------|-------------|--------------------------------------|
| id               | string      | Unique memory ID                     |
| content          | object      | The stored JSON payload              |
| summary          | string      | Memory summary                       |
| namespace        | string/null | Grouping namespace                   |
| tags             | string[]    | Categorization tags                  |
| source           | string      | Creation source ('createMemoryTool') |
| sourceAgent      | string/null | Agent name                           |
| contentSizeBytes | number      | Size of content in bytes             |
| expiresAt        | string/null | Expiration datetime                  |
| createdAt        | string      | Creation timestamp                   |
| updatedAt        | string      | Last update timestamp                |

### searchMemoryTool

Search memories using natural language semantic search.

#### Parameters

| Name      | Type     | Required | Description                                  |
|-----------|----------|----------|----------------------------------------------|
| query     | string   | Yes      | Natural language search query                |
| namespace | string   | No       | Filter to a specific namespace               |
| tags      | string[] | No       | Filter to memories with any of these tags    |
| limit     | number   | No       | Max results (default: 10, max: 50)           |
| threshold | number   | No       | Min similarity threshold 0-1 (default: 0.7)  |

#### Output

| Field      | Type        | Description                  |
|------------|-------------|------------------------------|
| id         | string      | Memory ID                    |
| content    | object      | The stored JSON payload      |
| summary    | string      | Memory summary               |
| namespace  | string/null | Grouping namespace           |
| tags       | string[]    | Categorization tags          |
| similarity | number      | Cosine similarity score 0-1  |
| createdAt  | string      | Creation timestamp           |

## License

MIT
