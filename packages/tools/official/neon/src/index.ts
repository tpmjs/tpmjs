/**
 * @tpmjs/tools-neon — Neon Serverless Postgres Tools for AI Agents
 *
 * Manage Neon projects, branches, databases, compute endpoints,
 * and usage metrics via the Neon API.
 *
 * @requires NEON_API_KEY environment variable
 */

import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://console.neon.tech/api/v2';

// ─── Client Infrastructure ──────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.NEON_API_KEY;
  if (!key) {
    throw new Error(
      'NEON_API_KEY environment variable is required. Get your key from https://console.neon.tech/app/settings/api-keys'
    );
  }
  return key;
}

async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const key = getApiKey();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const options: RequestInit = { method, headers };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  if (!response.ok) {
    await handleApiError(response);
  }

  const text = await response.text();
  if (!text) return {} as T;

  return JSON.parse(text) as T;
}

async function handleApiError(response: Response): Promise<never> {
  let errorMessage: string;
  try {
    const errorData = (await response.json()) as { message?: string; code?: string };
    errorMessage = errorData.message || `HTTP ${response.status}`;
  } catch {
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }

  switch (response.status) {
    case 400:
      throw new Error(`Bad request: ${errorMessage}`);
    case 401:
      throw new Error('Authentication failed: Invalid Neon API key. Check NEON_API_KEY.');
    case 403:
      throw new Error(`Access forbidden: ${errorMessage}`);
    case 404:
      throw new Error(`Not found: ${errorMessage}`);
    case 409:
      throw new Error(`Conflict: ${errorMessage}`);
    case 422:
      throw new Error(`Validation error: ${errorMessage}`);
    case 429:
      throw new Error(`Rate limit exceeded: ${errorMessage}`);
    default:
      throw new Error(`Neon API error (${response.status}): ${errorMessage}`);
  }
}

function buildQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (entries.length === 0) return '';
  return (
    '?' +
    entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
  );
}

// ─── Projects ───────────────────────────────────────────────────────────────

export interface ListProjectsInput {
  search?: string;
  limit?: number;
  orgId?: string;
}

export const listProjects = tool({
  description:
    'List all Neon projects. Supports search by name and pagination. Returns project IDs, names, regions, and Postgres versions.',
  inputSchema: jsonSchema<ListProjectsInput>({
    type: 'object',
    properties: {
      search: {
        type: 'string',
        description: 'Search by project name or ID (partial match).',
      },
      limit: {
        type: 'number',
        description: 'Number of projects to return (max 400, default 10).',
      },
      orgId: {
        type: 'string',
        description: 'Filter by organization ID.',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: ListProjectsInput) {
    const params: Record<string, unknown> = {};
    if (input.search) params.search = input.search;
    if (input.limit) params.limit = input.limit;
    if (input.orgId) params.org_id = input.orgId;

    const qs = buildQueryString(params);
    return apiRequest<{ projects: unknown[]; pagination: unknown }>('GET', `/projects${qs}`);
  },
});

export interface GetProjectInput {
  projectId: string;
}

export const getProject = tool({
  description:
    'Get detailed information about a Neon project by ID. Returns configuration, region, Postgres version, settings, and quota details.',
  inputSchema: jsonSchema<GetProjectInput>({
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Neon project ID (e.g., "aged-rain-12345678").',
      },
    },
    required: ['projectId'],
    additionalProperties: false,
  }),
  async execute(input: GetProjectInput) {
    return apiRequest<{ project: Record<string, unknown> }>('GET', `/projects/${input.projectId}`);
  },
});

export interface CreateProjectInput {
  name?: string;
  regionId?: string;
  pgVersion?: number;
  databaseName?: string;
  roleName?: string;
}

export const createProject = tool({
  description:
    'Create a new Neon project with a default branch, database, and compute endpoint. Returns the project details and connection URI.',
  inputSchema: jsonSchema<CreateProjectInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Project name (1-256 chars). Auto-generated if omitted.',
      },
      regionId: {
        type: 'string',
        description:
          'Deployment region (e.g., "aws-us-east-2", "aws-eu-central-1"). Defaults to aws-us-east-2.',
      },
      pgVersion: {
        type: 'number',
        description: 'PostgreSQL major version (14-17). Defaults to latest.',
      },
      databaseName: {
        type: 'string',
        description: 'Default database name. Defaults to "neondb".',
      },
      roleName: {
        type: 'string',
        description: 'Default role name. Defaults to "neondb_owner".',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: CreateProjectInput) {
    const body: Record<string, unknown> = {
      project: {
        ...(input.name && { name: input.name }),
        ...(input.regionId && { region_id: input.regionId }),
        ...(input.pgVersion && { pg_version: input.pgVersion }),
        branch: {
          ...(input.databaseName && { database_name: input.databaseName }),
          ...(input.roleName && { role_name: input.roleName }),
        },
      },
    };

    return apiRequest<{
      project: Record<string, unknown>;
      connection_uris: unknown[];
      branch: Record<string, unknown>;
      endpoints: unknown[];
      databases: unknown[];
      roles: unknown[];
    }>('POST', '/projects', body);
  },
});

export interface DeleteProjectInput {
  projectId: string;
}

export const deleteProject = tool({
  description:
    'Permanently delete a Neon project and ALL its branches, databases, endpoints, and roles. This cannot be undone.',
  inputSchema: jsonSchema<DeleteProjectInput>({
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Neon project ID to delete.',
      },
    },
    required: ['projectId'],
    additionalProperties: false,
  }),
  async execute(input: DeleteProjectInput) {
    return apiRequest<{ project: Record<string, unknown> }>(
      'DELETE',
      `/projects/${input.projectId}`
    );
  },
});

// ─── Branches ───────────────────────────────────────────────────────────────

export interface ListBranchesInput {
  projectId: string;
}

export const listBranches = tool({
  description:
    'List all branches in a Neon project. Neon uses git-like branching for databases — each branch is an independent copy-on-write fork of the data.',
  inputSchema: jsonSchema<ListBranchesInput>({
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Neon project ID.',
      },
    },
    required: ['projectId'],
    additionalProperties: false,
  }),
  async execute(input: ListBranchesInput) {
    return apiRequest<{ branches: unknown[] }>('GET', `/projects/${input.projectId}/branches`);
  },
});

export interface CreateBranchInput {
  projectId: string;
  name?: string;
  parentBranchId?: string;
  createEndpoint?: boolean;
}

export const createBranch = tool({
  description:
    'Create a new branch in a Neon project. Branches are instant copy-on-write forks of the database — useful for dev/test environments, previews, or migrations.',
  inputSchema: jsonSchema<CreateBranchInput>({
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Neon project ID.',
      },
      name: {
        type: 'string',
        description: 'Branch name. Auto-generated if omitted.',
      },
      parentBranchId: {
        type: 'string',
        description: 'Parent branch ID to fork from. Defaults to the default branch.',
      },
      createEndpoint: {
        type: 'boolean',
        description: 'Create a read-write compute endpoint for the branch. Defaults to true.',
      },
    },
    required: ['projectId'],
    additionalProperties: false,
  }),
  async execute(input: CreateBranchInput) {
    const body: Record<string, unknown> = {
      branch: {
        ...(input.name && { name: input.name }),
        ...(input.parentBranchId && { parent_id: input.parentBranchId }),
      },
    };

    if (input.createEndpoint !== false) {
      body.endpoints = [{ type: 'read_write' }];
    }

    return apiRequest<{
      branch: Record<string, unknown>;
      endpoints: unknown[];
      operations: unknown[];
    }>('POST', `/projects/${input.projectId}/branches`, body);
  },
});

export interface DeleteBranchInput {
  projectId: string;
  branchId: string;
}

export const deleteBranch = tool({
  description:
    'Delete a branch from a Neon project. Cannot delete the default branch or a branch with child branches. Existing connections will be dropped.',
  inputSchema: jsonSchema<DeleteBranchInput>({
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Neon project ID.',
      },
      branchId: {
        type: 'string',
        description: 'Branch ID to delete (e.g., "br-abc123").',
      },
    },
    required: ['projectId', 'branchId'],
    additionalProperties: false,
  }),
  async execute(input: DeleteBranchInput) {
    return apiRequest<{ branch: Record<string, unknown>; operations: unknown[] }>(
      'DELETE',
      `/projects/${input.projectId}/branches/${input.branchId}`
    );
  },
});

// ─── Databases ──────────────────────────────────────────────────────────────

export interface ListDatabasesInput {
  projectId: string;
  branchId: string;
}

export const listDatabases = tool({
  description:
    'List all databases on a specific branch. Returns database names and their owner roles.',
  inputSchema: jsonSchema<ListDatabasesInput>({
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Neon project ID.',
      },
      branchId: {
        type: 'string',
        description: 'Branch ID (e.g., "br-abc123").',
      },
    },
    required: ['projectId', 'branchId'],
    additionalProperties: false,
  }),
  async execute(input: ListDatabasesInput) {
    return apiRequest<{ databases: unknown[] }>(
      'GET',
      `/projects/${input.projectId}/branches/${input.branchId}/databases`
    );
  },
});

export interface CreateDatabaseInput {
  projectId: string;
  branchId: string;
  name: string;
  ownerName: string;
}

export const createDatabase = tool({
  description: 'Create a new database on a branch. Requires specifying the owner role.',
  inputSchema: jsonSchema<CreateDatabaseInput>({
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Neon project ID.',
      },
      branchId: {
        type: 'string',
        description: 'Branch ID (e.g., "br-abc123").',
      },
      name: {
        type: 'string',
        description: 'Database name to create.',
      },
      ownerName: {
        type: 'string',
        description: 'Role that will own the database (e.g., "neondb_owner").',
      },
    },
    required: ['projectId', 'branchId', 'name', 'ownerName'],
    additionalProperties: false,
  }),
  async execute(input: CreateDatabaseInput) {
    return apiRequest<{ database: Record<string, unknown>; operations: unknown[] }>(
      'POST',
      `/projects/${input.projectId}/branches/${input.branchId}/databases`,
      { database: { name: input.name, owner_name: input.ownerName } }
    );
  },
});

export interface DeleteDatabaseInput {
  projectId: string;
  branchId: string;
  databaseName: string;
}

export const deleteDatabase = tool({
  description:
    'Delete a database from a branch. This permanently removes the database and its data.',
  inputSchema: jsonSchema<DeleteDatabaseInput>({
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Neon project ID.',
      },
      branchId: {
        type: 'string',
        description: 'Branch ID (e.g., "br-abc123").',
      },
      databaseName: {
        type: 'string',
        description: 'Name of the database to delete.',
      },
    },
    required: ['projectId', 'branchId', 'databaseName'],
    additionalProperties: false,
  }),
  async execute(input: DeleteDatabaseInput) {
    return apiRequest<{ database: Record<string, unknown>; operations: unknown[] }>(
      'DELETE',
      `/projects/${input.projectId}/branches/${input.branchId}/databases/${input.databaseName}`
    );
  },
});

// ─── Endpoints (Compute) ────────────────────────────────────────────────────

export interface ListEndpointsInput {
  projectId: string;
}

export const listEndpoints = tool({
  description:
    'List compute endpoints for a Neon project. Endpoints are the serverless compute instances that run Postgres. Shows status (active/idle), autoscaling config, and connection details.',
  inputSchema: jsonSchema<ListEndpointsInput>({
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Neon project ID.',
      },
    },
    required: ['projectId'],
    additionalProperties: false,
  }),
  async execute(input: ListEndpointsInput) {
    return apiRequest<{ endpoints: unknown[] }>('GET', `/projects/${input.projectId}/endpoints`);
  },
});

export interface StartEndpointInput {
  projectId: string;
  endpointId: string;
}

export const startEndpoint = tool({
  description:
    'Start a suspended compute endpoint. The endpoint will become active and ready to accept connections. This is idempotent — starting an already-active endpoint is a no-op.',
  inputSchema: jsonSchema<StartEndpointInput>({
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Neon project ID.',
      },
      endpointId: {
        type: 'string',
        description: 'Endpoint ID to start (e.g., "ep-abc123").',
      },
    },
    required: ['projectId', 'endpointId'],
    additionalProperties: false,
  }),
  async execute(input: StartEndpointInput) {
    return apiRequest<{ endpoint: Record<string, unknown>; operations: unknown[] }>(
      'POST',
      `/projects/${input.projectId}/endpoints/${input.endpointId}/start`
    );
  },
});

export interface SuspendEndpointInput {
  projectId: string;
  endpointId: string;
}

export const suspendEndpoint = tool({
  description:
    'Suspend a running compute endpoint to save costs. Existing connections will be dropped. The endpoint will auto-wake on next connection attempt.',
  inputSchema: jsonSchema<SuspendEndpointInput>({
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Neon project ID.',
      },
      endpointId: {
        type: 'string',
        description: 'Endpoint ID to suspend (e.g., "ep-abc123").',
      },
    },
    required: ['projectId', 'endpointId'],
    additionalProperties: false,
  }),
  async execute(input: SuspendEndpointInput) {
    return apiRequest<{ endpoint: Record<string, unknown>; operations: unknown[] }>(
      'POST',
      `/projects/${input.projectId}/endpoints/${input.endpointId}/suspend`
    );
  },
});

// ─── Connection URI ─────────────────────────────────────────────────────────

export interface GetConnectionUriInput {
  projectId: string;
  databaseName: string;
  roleName: string;
  branchId?: string;
}

export const getConnectionUri = tool({
  description:
    'Get a PostgreSQL connection string for a database. Returns a full connection URI with credentials that can be used with any Postgres client or ORM.',
  inputSchema: jsonSchema<GetConnectionUriInput>({
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Neon project ID.',
      },
      databaseName: {
        type: 'string',
        description: 'Database name to connect to (e.g., "neondb").',
      },
      roleName: {
        type: 'string',
        description: 'Role to connect as (e.g., "neondb_owner").',
      },
      branchId: {
        type: 'string',
        description: 'Branch ID. Defaults to the default branch.',
      },
    },
    required: ['projectId', 'databaseName', 'roleName'],
    additionalProperties: false,
  }),
  async execute(input: GetConnectionUriInput) {
    const params: Record<string, unknown> = {
      database_name: input.databaseName,
      role_name: input.roleName,
    };
    if (input.branchId) params.branch_id = input.branchId;

    const qs = buildQueryString(params);
    return apiRequest<{ uri: string }>('GET', `/projects/${input.projectId}/connection_uri${qs}`);
  },
});

// ─── Operations ─────────────────────────────────────────────────────────────

export interface ListOperationsInput {
  projectId: string;
  limit?: number;
}

export const listOperations = tool({
  description:
    'List recent operations for a Neon project. Shows async operations like branch creation, compute starts/suspends, and database operations with their status and duration.',
  inputSchema: jsonSchema<ListOperationsInput>({
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Neon project ID.',
      },
      limit: {
        type: 'number',
        description: 'Number of operations to return (max 400, default 10).',
      },
    },
    required: ['projectId'],
    additionalProperties: false,
  }),
  async execute(input: ListOperationsInput) {
    const params: Record<string, unknown> = {};
    if (input.limit) params.limit = input.limit;

    const qs = buildQueryString(params);
    return apiRequest<{ operations: unknown[]; pagination: unknown }>(
      'GET',
      `/projects/${input.projectId}/operations${qs}`
    );
  },
});

// ─── Consumption / Usage Metrics ────────────────────────────────────────────

export interface GetConsumptionInput {
  from: string;
  to: string;
  granularity: 'hourly' | 'daily' | 'monthly';
  projectIds?: string;
  orgId?: string;
}

export const getConsumption = tool({
  description:
    'Get usage metrics for Neon projects over a date range. Returns compute time, active time, storage size, and data written. Use "hourly" for up to 7 days, "daily" for up to 60 days, or "monthly" for up to 1 year.',
  inputSchema: jsonSchema<GetConsumptionInput>({
    type: 'object',
    properties: {
      from: {
        type: 'string',
        description: 'Start date in ISO 8601 format (e.g., "2025-01-01T00:00:00Z").',
      },
      to: {
        type: 'string',
        description: 'End date in ISO 8601 format (e.g., "2025-02-01T00:00:00Z").',
      },
      granularity: {
        type: 'string',
        enum: ['hourly', 'daily', 'monthly'],
        description:
          'Time granularity: "hourly" (max 7 days), "daily" (max 60 days), or "monthly" (max 1 year).',
      },
      projectIds: {
        type: 'string',
        description: 'Comma-separated project IDs to filter (max 100). Omit for all projects.',
      },
      orgId: {
        type: 'string',
        description: 'Organization ID. Defaults to the authenticated account.',
      },
    },
    required: ['from', 'to', 'granularity'],
    additionalProperties: false,
  }),
  async execute(input: GetConsumptionInput) {
    const params: Record<string, unknown> = {
      from: input.from,
      to: input.to,
      granularity: input.granularity,
    };
    if (input.projectIds) params.project_ids = input.projectIds;
    if (input.orgId) params.org_id = input.orgId;

    const qs = buildQueryString(params);

    // Use project-level endpoint if project IDs are specified, otherwise account-level
    const path = input.projectIds
      ? `/consumption_history/projects${qs}`
      : `/consumption_history/account${qs}`;

    return apiRequest<Record<string, unknown>>('GET', path);
  },
});

// ─── Default Export ─────────────────────────────────────────────────────────

export default {
  // Projects
  listProjects,
  getProject,
  createProject,
  deleteProject,
  // Branches
  listBranches,
  createBranch,
  deleteBranch,
  // Databases
  listDatabases,
  createDatabase,
  deleteDatabase,
  // Endpoints
  listEndpoints,
  startEndpoint,
  suspendEndpoint,
  // Connection
  getConnectionUri,
  // Operations
  listOperations,
  // Usage
  getConsumption,
};
