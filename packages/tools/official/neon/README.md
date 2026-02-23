# @tpmjs/tools-neon

Neon serverless Postgres tools for AI agents. Manage projects, branches, databases, compute endpoints, and usage metrics.

## Installation

```bash
npm install @tpmjs/tools-neon
```

## Setup

Set the `NEON_API_KEY` environment variable. Get your key from https://console.neon.tech/app/settings/api-keys

## Usage

```typescript
import { listProjects, getConsumption } from '@tpmjs/tools-neon';

// List all projects
const projects = await listProjects.execute({});

// Get usage metrics
const usage = await getConsumption.execute({
  from: '2025-01-01T00:00:00Z',
  to: '2025-02-01T00:00:00Z',
  granularity: 'daily',
});
```

## Tools

| Name | Description |
|------|-------------|
| `listProjects` | List all Neon projects with optional search filtering |
| `getProject` | Get details of a specific Neon project by ID |
| `createProject` | Create a new project with default branch and database |
| `deleteProject` | Permanently delete a project and all resources |
| `listBranches` | List all branches in a project |
| `createBranch` | Create a branch (instant copy-on-write fork) |
| `deleteBranch` | Delete a branch |
| `listDatabases` | List databases on a branch |
| `createDatabase` | Create a database on a branch |
| `deleteDatabase` | Delete a database |
| `listEndpoints` | List compute endpoints and their status |
| `startEndpoint` | Start a suspended compute endpoint |
| `suspendEndpoint` | Suspend an endpoint to save costs |
| `getConnectionUri` | Get a PostgreSQL connection string |
| `listOperations` | List recent async operations |
| `getConsumption` | Get usage metrics (compute, storage, data) |

## License

MIT
