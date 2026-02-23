# @tpmjs/tools-railway

Railway API tools for AI agents. Manage projects, services, deployments, variables, and logs via Railway's GraphQL API.

## Installation

```bash
npm install @tpmjs/tools-railway
```

## Setup

Set the `RAILWAY_TOKEN` environment variable. Get your token from [Railway Account Tokens](https://railway.com/account/tokens).

```bash
export RAILWAY_TOKEN=your-token-here
```

## Usage

```typescript
import { listProjects, getDeployment, getBuildLogs } from '@tpmjs/tools-railway';

// List all projects
const projects = await listProjects.execute({});

// Get deployment details
const deployment = await getDeployment.execute({ id: 'deployment-id' });

// Get build logs
const logs = await getBuildLogs.execute({ deploymentId: 'deployment-id', limit: 50 });
```

## Tools

### Projects

| Tool | Description |
|------|-------------|
| `listProjects` | List all projects in your account or workspace |
| `getProject` | Get project details with services and environments |

### Services

| Tool | Description |
|------|-------------|
| `getService` | Get service details by ID |
| `getServiceInstance` | Get service config for a specific environment |

### Deployments

| Tool | Description |
|------|-------------|
| `listDeployments` | List deployments for a service/environment |
| `getDeployment` | Get deployment details by ID |
| `redeployService` | Trigger a redeploy |
| `restartDeployment` | Restart a running deployment |

### Logs

| Tool | Description |
|------|-------------|
| `getBuildLogs` | Get build logs for a deployment |
| `getDeploymentLogs` | Get runtime logs for a deployment |

### Variables

| Tool | Description |
|------|-------------|
| `getVariables` | Get environment variables for a service |
| `upsertVariable` | Create or update an environment variable |
| `deleteVariable` | Delete an environment variable |

## License

MIT
