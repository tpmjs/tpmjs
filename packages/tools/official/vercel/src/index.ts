/**
 * @tpmjs/tools-vercel — Vercel Platform API Tools for AI Agents
 *
 * Broad access to the Vercel REST API: manage projects, deployments, domains,
 * DNS, teams, edge config, environment variables, and more.
 *
 * @requires VERCEL_TOKEN environment variable
 * @optional VERCEL_TEAM_ID environment variable (scopes requests to a team)
 */

import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://api.vercel.com';

// ─── Client Infrastructure ──────────────────────────────────────────────────

function getToken(): string {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error(
      'VERCEL_TOKEN environment variable is required. Create a token at https://vercel.com/account/tokens'
    );
  }
  return token;
}

function getTeamParams(): string {
  const teamId = process.env.VERCEL_TEAM_ID;
  return teamId ? `teamId=${encodeURIComponent(teamId)}` : '';
}

function buildQueryString(params: Record<string, unknown>): string {
  const teamParam = getTeamParams();
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  const parts: string[] = [];
  if (teamParam) parts.push(teamParam);
  for (const [k, v] of entries) {
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

async function handleApiError(response: Response): Promise<never> {
  let errorMessage: string;
  try {
    const errorData = (await response.json()) as {
      error?: { message?: string; code?: string };
      message?: string;
    };
    errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
  } catch {
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }

  switch (response.status) {
    case 400:
      throw new Error(`Bad request: ${errorMessage}`);
    case 401:
      throw new Error('Authentication failed: Invalid Vercel token. Check VERCEL_TOKEN.');
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
      throw new Error(`Vercel API error (${response.status}): ${errorMessage}`);
  }
}

async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  query?: Record<string, unknown>
): Promise<T> {
  const token = getToken();
  const qs = query ? buildQueryString(query) : getTeamParams() ? `?${getTeamParams()}` : '';
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = { method, headers };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}${qs}`, options);

  if (!response.ok) {
    await handleApiError(response);
  }

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

// ─── 1. Projects ────────────────────────────────────────────────────────────

export const listProjects = tool({
  description: 'List all Vercel projects with optional search and pagination.',
  inputSchema: jsonSchema<{ limit?: number; since?: number; until?: number; search?: string }>({
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results (1-100, default 20).' },
      since: { type: 'number', description: 'Timestamp to list projects created after.' },
      until: { type: 'number', description: 'Timestamp to list projects created before.' },
      search: { type: 'string', description: 'Search query to filter projects by name.' },
    },
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v10/projects', undefined, input);
  },
});

export const createProject = tool({
  description: 'Create a new Vercel project.',
  inputSchema: jsonSchema<{
    name: string;
    framework?: string;
    gitRepository?: { type: string; repo: string };
    buildCommand?: string;
    outputDirectory?: string;
    rootDirectory?: string;
    installCommand?: string;
  }>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Project name.' },
      framework: { type: 'string', description: 'Framework preset (nextjs, react, vue, etc).' },
      gitRepository: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Git provider (github, gitlab, bitbucket).' },
          repo: { type: 'string', description: 'Repository slug (owner/repo).' },
        },
        required: ['type', 'repo'],
        description: 'Git repository to connect.',
      },
      buildCommand: { type: 'string', description: 'Custom build command.' },
      outputDirectory: { type: 'string', description: 'Build output directory.' },
      rootDirectory: { type: 'string', description: 'Root directory for monorepos.' },
      installCommand: { type: 'string', description: 'Custom install command.' },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', '/v11/projects', input);
  },
});

export const getProject = tool({
  description: 'Get project details by ID or name.',
  inputSchema: jsonSchema<{ idOrName: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
    },
    required: ['idOrName'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', `/v9/projects/${encodeURIComponent(input.idOrName)}`);
  },
});

export const updateProject = tool({
  description: 'Update Vercel project settings.',
  inputSchema: jsonSchema<{
    idOrName: string;
    name?: string;
    framework?: string;
    buildCommand?: string;
    outputDirectory?: string;
    rootDirectory?: string;
    installCommand?: string;
  }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      name: { type: 'string', description: 'New project name.' },
      framework: { type: 'string', description: 'Framework preset.' },
      buildCommand: { type: 'string', description: 'Build command.' },
      outputDirectory: { type: 'string', description: 'Output directory.' },
      rootDirectory: { type: 'string', description: 'Root directory.' },
      installCommand: { type: 'string', description: 'Install command.' },
    },
    required: ['idOrName'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { idOrName, ...body } = input;
    return apiRequest<unknown>('PATCH', `/v9/projects/${encodeURIComponent(idOrName)}`, body);
  },
});

export const deleteProject = tool({
  description: 'Delete a Vercel project permanently.',
  inputSchema: jsonSchema<{ idOrName: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
    },
    required: ['idOrName'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('DELETE', `/v9/projects/${encodeURIComponent(input.idOrName)}`);
  },
});

export const listProjectDomains = tool({
  description: 'List domains for a project.',
  inputSchema: jsonSchema<{ idOrName: string; limit?: number; since?: number; until?: number }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      limit: { type: 'number', description: 'Max results.' },
      since: { type: 'number', description: 'Timestamp filter (after).' },
      until: { type: 'number', description: 'Timestamp filter (before).' },
    },
    required: ['idOrName'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { idOrName, ...query } = input;
    return apiRequest<unknown>(
      'GET',
      `/v9/projects/${encodeURIComponent(idOrName)}/domains`,
      undefined,
      query
    );
  },
});

export const getProjectDomain = tool({
  description: 'Get a specific domain for a project.',
  inputSchema: jsonSchema<{ idOrName: string; domain: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      domain: { type: 'string', description: 'Domain name.' },
    },
    required: ['idOrName', 'domain'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v9/projects/${encodeURIComponent(input.idOrName)}/domains/${encodeURIComponent(input.domain)}`
    );
  },
});

export const addProjectDomain = tool({
  description: 'Add a domain to a project.',
  inputSchema: jsonSchema<{
    idOrName: string;
    name: string;
    redirect?: string;
    redirectStatusCode?: number;
    gitBranch?: string;
  }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      name: { type: 'string', description: 'Domain name to add.' },
      redirect: { type: 'string', description: 'Target domain for redirect.' },
      redirectStatusCode: {
        type: 'number',
        description: 'Redirect status code (301, 302, 307, 308).',
      },
      gitBranch: { type: 'string', description: 'Git branch to link.' },
    },
    required: ['idOrName', 'name'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { idOrName, ...body } = input;
    return apiRequest<unknown>(
      'POST',
      `/v10/projects/${encodeURIComponent(idOrName)}/domains`,
      body
    );
  },
});

export const updateProjectDomain = tool({
  description: 'Update a project domain configuration.',
  inputSchema: jsonSchema<{
    idOrName: string;
    domain: string;
    redirect?: string;
    redirectStatusCode?: number;
    gitBranch?: string;
  }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      domain: { type: 'string', description: 'Domain name to update.' },
      redirect: { type: 'string', description: 'Target domain for redirect.' },
      redirectStatusCode: { type: 'number', description: 'Redirect status code.' },
      gitBranch: { type: 'string', description: 'Git branch to link.' },
    },
    required: ['idOrName', 'domain'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { idOrName, domain, ...body } = input;
    return apiRequest<unknown>(
      'PATCH',
      `/v9/projects/${encodeURIComponent(idOrName)}/domains/${encodeURIComponent(domain)}`,
      body
    );
  },
});

export const removeProjectDomain = tool({
  description: 'Remove a domain from a project.',
  inputSchema: jsonSchema<{ idOrName: string; domain: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      domain: { type: 'string', description: 'Domain name to remove.' },
    },
    required: ['idOrName', 'domain'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'DELETE',
      `/v9/projects/${encodeURIComponent(input.idOrName)}/domains/${encodeURIComponent(input.domain)}`
    );
  },
});

export const verifyProjectDomain = tool({
  description: 'Verify a project domain.',
  inputSchema: jsonSchema<{ idOrName: string; domain: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      domain: { type: 'string', description: 'Domain name to verify.' },
    },
    required: ['idOrName', 'domain'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'POST',
      `/v9/projects/${encodeURIComponent(input.idOrName)}/domains/${encodeURIComponent(input.domain)}/verify`
    );
  },
});

export const listProjectEnvVars = tool({
  description: 'List environment variables for a project.',
  inputSchema: jsonSchema<{ idOrName: string; gitBranch?: string; source?: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      gitBranch: { type: 'string', description: 'Filter by git branch.' },
      source: { type: 'string', description: 'Filter by source.' },
    },
    required: ['idOrName'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { idOrName, ...query } = input;
    return apiRequest<unknown>(
      'GET',
      `/v10/projects/${encodeURIComponent(idOrName)}/env`,
      undefined,
      query
    );
  },
});

export const createProjectEnvVar = tool({
  description: 'Create an environment variable for a project.',
  inputSchema: jsonSchema<{
    idOrName: string;
    key: string;
    value: string;
    type: string;
    target: string[];
  }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      key: { type: 'string', description: 'Variable name.' },
      value: { type: 'string', description: 'Variable value.' },
      type: { type: 'string', description: 'Type: plain, secret, encrypted, sensitive, system.' },
      target: {
        type: 'array',
        items: { type: 'string' },
        description: 'Targets: production, preview, development.',
      },
    },
    required: ['idOrName', 'key', 'value', 'type', 'target'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { idOrName, ...body } = input;
    return apiRequest<unknown>('POST', `/v10/projects/${encodeURIComponent(idOrName)}/env`, body);
  },
});

export const getProjectEnvVar = tool({
  description: 'Get a specific environment variable.',
  inputSchema: jsonSchema<{ idOrName: string; envId: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      envId: { type: 'string', description: 'Environment variable ID.' },
    },
    required: ['idOrName', 'envId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v1/projects/${encodeURIComponent(input.idOrName)}/env/${encodeURIComponent(input.envId)}`
    );
  },
});

export const editProjectEnvVar = tool({
  description: 'Edit an environment variable for a project.',
  inputSchema: jsonSchema<{
    idOrName: string;
    envId: string;
    key?: string;
    value?: string;
    type?: string;
    target?: string[];
  }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      envId: { type: 'string', description: 'Environment variable ID.' },
      key: { type: 'string', description: 'New variable name.' },
      value: { type: 'string', description: 'New variable value.' },
      type: { type: 'string', description: 'Type: plain, secret, encrypted, sensitive, system.' },
      target: {
        type: 'array',
        items: { type: 'string' },
        description: 'Targets: production, preview, development.',
      },
    },
    required: ['idOrName', 'envId'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { idOrName, envId, ...body } = input;
    return apiRequest<unknown>(
      'PATCH',
      `/v9/projects/${encodeURIComponent(idOrName)}/env/${encodeURIComponent(envId)}`,
      body
    );
  },
});

export const removeProjectEnvVar = tool({
  description: 'Remove an environment variable from a project.',
  inputSchema: jsonSchema<{ idOrName: string; envId: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      envId: { type: 'string', description: 'Environment variable ID.' },
    },
    required: ['idOrName', 'envId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'DELETE',
      `/v9/projects/${encodeURIComponent(input.idOrName)}/env/${encodeURIComponent(input.envId)}`
    );
  },
});

export const pauseProject = tool({
  description: 'Pause a Vercel project.',
  inputSchema: jsonSchema<{ idOrName: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
    },
    required: ['idOrName'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', `/v1/projects/${encodeURIComponent(input.idOrName)}/pause`);
  },
});

export const unpauseProject = tool({
  description: 'Unpause a Vercel project.',
  inputSchema: jsonSchema<{ idOrName: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
    },
    required: ['idOrName'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'POST',
      `/v1/projects/${encodeURIComponent(input.idOrName)}/unpause`
    );
  },
});

export const promoteDeployment = tool({
  description: 'Promote a deployment to production for a project.',
  inputSchema: jsonSchema<{ idOrName: string; deploymentId: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      deploymentId: { type: 'string', description: 'Deployment ID to promote.' },
    },
    required: ['idOrName', 'deploymentId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'POST',
      `/v10/projects/${encodeURIComponent(input.idOrName)}/promote/${encodeURIComponent(input.deploymentId)}`
    );
  },
});

export const listPromoteAliases = tool({
  description: 'List aliases for a promote deployment.',
  inputSchema: jsonSchema<{ projectId: string; limit?: number; since?: number; until?: number }>({
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID.' },
      limit: { type: 'number', description: 'Max results.' },
      since: { type: 'number', description: 'Timestamp filter (after).' },
      until: { type: 'number', description: 'Timestamp filter (before).' },
    },
    required: ['projectId'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { projectId, ...query } = input;
    return apiRequest<unknown>(
      'GET',
      `/v1/projects/${encodeURIComponent(projectId)}/promote/aliases`,
      undefined,
      query
    );
  },
});

export const updateProtectionBypass = tool({
  description: 'Update protection bypass for a project.',
  inputSchema: jsonSchema<{ idOrName: string; protectionBypass: Record<string, unknown> }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      protectionBypass: { type: 'object', description: 'Protection bypass configuration.' },
    },
    required: ['idOrName', 'protectionBypass'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { idOrName, ...body } = input;
    return apiRequest<unknown>('PATCH', `/v9/projects/${encodeURIComponent(idOrName)}`, body);
  },
});

// ─── 2. Deployments ─────────────────────────────────────────────────────────

export const listDeployments = tool({
  description: 'List all deployments with optional filters.',
  inputSchema: jsonSchema<{
    app?: string;
    projectId?: string;
    limit?: number;
    since?: number;
    until?: number;
    state?: string;
    target?: string;
  }>({
    type: 'object',
    properties: {
      app: { type: 'string', description: 'Filter by app name.' },
      projectId: { type: 'string', description: 'Filter by project ID.' },
      limit: { type: 'number', description: 'Max results (1-100).' },
      since: { type: 'number', description: 'Timestamp filter (after).' },
      until: { type: 'number', description: 'Timestamp filter (before).' },
      state: { type: 'string', description: 'Filter by state (BUILDING, READY, ERROR, CANCELED).' },
      target: { type: 'string', description: 'Filter by target (production, preview).' },
    },
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v7/deployments', undefined, input);
  },
});

export const createDeployment = tool({
  description: 'Create a new deployment.',
  inputSchema: jsonSchema<{
    name: string;
    project?: string;
    target?: string;
    gitSource?: { type: string; repo: string; ref?: string };
    files?: Array<{ file: string; data: string }>;
  }>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Deployment name.' },
      project: { type: 'string', description: 'Project ID or name.' },
      target: { type: 'string', description: 'Deployment target (production, preview).' },
      gitSource: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Git provider (github, gitlab, bitbucket).' },
          repo: { type: 'string', description: 'Repository slug (owner/repo).' },
          ref: { type: 'string', description: 'Git reference (branch, tag, commit).' },
        },
        required: ['type', 'repo'],
        description: 'Git source configuration.',
      },
      files: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            file: { type: 'string', description: 'File path.' },
            data: { type: 'string', description: 'Base64 encoded file content.' },
          },
          required: ['file', 'data'],
        },
        description: 'Files to deploy.',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', '/v13/deployments', input);
  },
});

export const getDeployment = tool({
  description: 'Get deployment details by ID or URL.',
  inputSchema: jsonSchema<{ idOrUrl: string }>({
    type: 'object',
    properties: {
      idOrUrl: { type: 'string', description: 'Deployment ID or URL.' },
    },
    required: ['idOrUrl'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', `/v13/deployments/${encodeURIComponent(input.idOrUrl)}`);
  },
});

export const deleteDeployment = tool({
  description: 'Delete a deployment by ID.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Deployment ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('DELETE', `/v13/deployments/${encodeURIComponent(input.id)}`);
  },
});

export const cancelDeployment = tool({
  description: 'Cancel a deployment.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Deployment ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('PATCH', `/v12/deployments/${encodeURIComponent(input.id)}/cancel`);
  },
});

export const getDeploymentEvents = tool({
  description: 'Get events for a deployment (build logs, etc).',
  inputSchema: jsonSchema<{ idOrUrl: string }>({
    type: 'object',
    properties: {
      idOrUrl: { type: 'string', description: 'Deployment ID or URL.' },
    },
    required: ['idOrUrl'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v3/deployments/${encodeURIComponent(input.idOrUrl)}/events`
    );
  },
});

export const listDeploymentFiles = tool({
  description: 'List files in a deployment.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Deployment ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', `/v6/deployments/${encodeURIComponent(input.id)}/files`);
  },
});

export const getDeploymentFile = tool({
  description: 'Get a specific file from a deployment.',
  inputSchema: jsonSchema<{ id: string; fileId: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Deployment ID.' },
      fileId: { type: 'string', description: 'File ID.' },
    },
    required: ['id', 'fileId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v8/deployments/${encodeURIComponent(input.id)}/files/${encodeURIComponent(input.fileId)}`
    );
  },
});

// ─── 3. Domains ─────────────────────────────────────────────────────────────

export const listDomains = tool({
  description: 'List all domains.',
  inputSchema: jsonSchema<{ limit?: number; since?: number; until?: number }>({
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results.' },
      since: { type: 'number', description: 'Timestamp filter (after).' },
      until: { type: 'number', description: 'Timestamp filter (before).' },
    },
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v5/domains', undefined, input);
  },
});

export const getDomain = tool({
  description: 'Get domain details.',
  inputSchema: jsonSchema<{ name: string }>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Domain name.' },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', `/v5/domains/${encodeURIComponent(input.name)}`);
  },
});

export const addDomain = tool({
  description: 'Add a domain to the account.',
  inputSchema: jsonSchema<{
    name: string;
    method?: 'add' | 'move-in';
    cdnEnabled?: boolean;
    zone?: boolean;
    token?: string;
  }>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Domain name to add.' },
      method: {
        type: 'string',
        enum: ['add', 'move-in'],
        description: 'Add a domain or complete an existing move-in request.',
      },
      cdnEnabled: { type: 'boolean', description: 'Enable the Vercel Edge Network.' },
      zone: { type: 'boolean', description: 'Create a Vercel DNS zone.' },
      token: { type: 'string', description: 'Move-in token when method is move-in.' },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', '/v7/domains', input);
  },
});

export const removeDomain = tool({
  description: 'Remove a domain from the account.',
  inputSchema: jsonSchema<{ name: string }>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Domain name to remove.' },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('DELETE', `/v6/domains/${encodeURIComponent(input.name)}`);
  },
});

export const getDomainConfig = tool({
  description: 'Get domain configuration.',
  inputSchema: jsonSchema<{ name: string }>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Domain name.' },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', `/v6/domains/${encodeURIComponent(input.name)}/config`);
  },
});

// ─── 4. DNS ─────────────────────────────────────────────────────────────────

export const listDnsRecords = tool({
  description: 'List DNS records for a domain.',
  inputSchema: jsonSchema<{ domain: string; limit?: number; since?: number; until?: number }>({
    type: 'object',
    properties: {
      domain: { type: 'string', description: 'Domain name.' },
      limit: { type: 'number', description: 'Max results.' },
      since: { type: 'number', description: 'Timestamp filter (after).' },
      until: { type: 'number', description: 'Timestamp filter (before).' },
    },
    required: ['domain'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { domain, ...query } = input;
    return apiRequest<unknown>(
      'GET',
      `/v5/domains/${encodeURIComponent(domain)}/records`,
      undefined,
      query
    );
  },
});

export const createDnsRecord = tool({
  description: 'Create a DNS record for a domain.',
  inputSchema: jsonSchema<{
    domain: string;
    name: string;
    type: string;
    value: string;
    ttl?: number;
    mxPriority?: number;
    srv?: { priority: number; weight: number; port: number; target: string };
  }>({
    type: 'object',
    properties: {
      domain: { type: 'string', description: 'Domain name.' },
      name: { type: 'string', description: 'Record name (subdomain or @).' },
      type: { type: 'string', description: 'Record type (A, AAAA, CNAME, MX, TXT, SRV, etc).' },
      value: { type: 'string', description: 'Record value.' },
      ttl: { type: 'number', description: 'TTL in seconds.' },
      mxPriority: { type: 'number', description: 'MX priority (for MX records).' },
      srv: {
        type: 'object',
        properties: {
          priority: { type: 'number' },
          weight: { type: 'number' },
          port: { type: 'number' },
          target: { type: 'string' },
        },
        description: 'SRV record config.',
      },
    },
    required: ['domain', 'name', 'type', 'value'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { domain, ...body } = input;
    return apiRequest<unknown>('POST', `/v2/domains/${encodeURIComponent(domain)}/records`, body);
  },
});

export const updateDnsRecord = tool({
  description: 'Update a DNS record.',
  inputSchema: jsonSchema<{
    recordId: string;
    name?: string;
    type?: string;
    value?: string;
    ttl?: number;
    mxPriority?: number;
  }>({
    type: 'object',
    properties: {
      recordId: { type: 'string', description: 'DNS record ID.' },
      name: { type: 'string', description: 'Record name.' },
      type: { type: 'string', description: 'Record type.' },
      value: { type: 'string', description: 'Record value.' },
      ttl: { type: 'number', description: 'TTL in seconds.' },
      mxPriority: { type: 'number', description: 'MX priority.' },
    },
    required: ['recordId'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { recordId, ...body } = input;
    return apiRequest<unknown>(
      'PATCH',
      `/v1/domains/records/${encodeURIComponent(recordId)}`,
      body
    );
  },
});

export const deleteDnsRecord = tool({
  description: 'Delete a DNS record.',
  inputSchema: jsonSchema<{ domain: string; recordId: string }>({
    type: 'object',
    properties: {
      domain: { type: 'string', description: 'Domain name.' },
      recordId: { type: 'string', description: 'DNS record ID.' },
    },
    required: ['domain', 'recordId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'DELETE',
      `/v2/domains/${encodeURIComponent(input.domain)}/records/${encodeURIComponent(input.recordId)}`
    );
  },
});

// ─── 5. Domain Registrar ────────────────────────────────────────────────────

export const checkDomainAvailability = tool({
  description: 'Check if a domain is available for purchase.',
  inputSchema: jsonSchema<{ name: string }>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Domain name to check.' },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v1/registrar/domains/${encodeURIComponent(input.name)}/availability`
    );
  },
});

export const getDomainPrice = tool({
  description: 'Get domain pricing information.',
  inputSchema: jsonSchema<{ name: string; years?: number }>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Domain name.' },
      years: { type: 'number', description: 'Number of registration years.' },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { name, ...query } = input;
    return apiRequest<unknown>(
      'GET',
      `/v1/registrar/domains/${encodeURIComponent(name)}/price`,
      undefined,
      query
    );
  },
});

export const buySingleDomain = tool({
  description: 'Purchase a domain.',
  inputSchema: jsonSchema<{
    name: string;
    expectedPrice: number;
    years: number;
    autoRenew: boolean;
    contactInformation: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      address1: string;
      address2?: string;
      city: string;
      state: string;
      zip: string;
      country: string;
      companyName?: string;
      fax?: string;
    };
    languageCode?: string;
  }>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Domain name to purchase.' },
      expectedPrice: { type: 'number', description: 'Expected purchase price.' },
      years: { type: 'number', description: 'Number of years to purchase.' },
      autoRenew: { type: 'boolean', description: 'Enable automatic renewal.' },
      contactInformation: {
        type: 'object',
        description: 'Registrant contact information.',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string', description: 'E.164 phone number.' },
          address1: { type: 'string' },
          address2: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zip: { type: 'string' },
          country: { type: 'string', description: 'ISO 3166-1 alpha-2 country code.' },
          companyName: { type: 'string' },
          fax: { type: 'string' },
        },
        required: [
          'firstName',
          'lastName',
          'email',
          'phone',
          'address1',
          'city',
          'state',
          'zip',
          'country',
        ],
        additionalProperties: false,
      },
      languageCode: { type: 'string', description: 'Language code for punycode domains.' },
    },
    required: ['name', 'expectedPrice', 'years', 'autoRenew', 'contactInformation'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { name, ...body } = input;
    return apiRequest<unknown>(
      'POST',
      `/v1/registrar/domains/${encodeURIComponent(name)}/buy`,
      body
    );
  },
});

// ─── 6. Teams ───────────────────────────────────────────────────────────────

export const listTeams = tool({
  description: 'List all teams.',
  inputSchema: jsonSchema<{ limit?: number; since?: number; until?: number }>({
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results.' },
      since: { type: 'number', description: 'Timestamp filter (after).' },
      until: { type: 'number', description: 'Timestamp filter (before).' },
    },
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v2/teams', undefined, input);
  },
});

export const getTeam = tool({
  description: 'Get team details.',
  inputSchema: jsonSchema<{ teamId: string }>({
    type: 'object',
    properties: {
      teamId: { type: 'string', description: 'Team ID.' },
    },
    required: ['teamId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', `/v2/teams/${encodeURIComponent(input.teamId)}`);
  },
});

export const createTeam = tool({
  description: 'Create a new team.',
  inputSchema: jsonSchema<{ slug: string; name?: string }>({
    type: 'object',
    properties: {
      slug: { type: 'string', description: 'Team slug (URL-friendly identifier).' },
      name: { type: 'string', description: 'Team display name.' },
    },
    required: ['slug'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', '/v1/teams', input);
  },
});

export const updateTeam = tool({
  description: 'Update team settings.',
  inputSchema: jsonSchema<{ teamId: string; name?: string; slug?: string; description?: string }>({
    type: 'object',
    properties: {
      teamId: { type: 'string', description: 'Team ID.' },
      name: { type: 'string', description: 'Team display name.' },
      slug: { type: 'string', description: 'Team slug.' },
      description: { type: 'string', description: 'Team description.' },
    },
    required: ['teamId'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { teamId, ...body } = input;
    return apiRequest<unknown>('PATCH', `/v2/teams/${encodeURIComponent(teamId)}`, body);
  },
});

export const deleteTeam = tool({
  description: 'Delete a team.',
  inputSchema: jsonSchema<{ teamId: string }>({
    type: 'object',
    properties: {
      teamId: { type: 'string', description: 'Team ID.' },
    },
    required: ['teamId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('DELETE', `/v1/teams/${encodeURIComponent(input.teamId)}`);
  },
});

export const listTeamMembers = tool({
  description: 'List team members.',
  inputSchema: jsonSchema<{
    teamId: string;
    limit?: number;
    since?: number;
    until?: number;
    role?: string;
    search?: string;
  }>({
    type: 'object',
    properties: {
      teamId: { type: 'string', description: 'Team ID.' },
      limit: { type: 'number', description: 'Max results.' },
      since: { type: 'number', description: 'Timestamp filter (after).' },
      until: { type: 'number', description: 'Timestamp filter (before).' },
      role: { type: 'string', description: 'Filter by role (OWNER, MEMBER, VIEWER).' },
      search: { type: 'string', description: 'Search query.' },
    },
    required: ['teamId'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { teamId, ...query } = input;
    return apiRequest<unknown>(
      'GET',
      `/v3/teams/${encodeURIComponent(teamId)}/members`,
      undefined,
      query
    );
  },
});

export const inviteTeamMembers = tool({
  description: 'Invite users to a team.',
  inputSchema: jsonSchema<{ teamId: string; email: string; role?: string }>({
    type: 'object',
    properties: {
      teamId: { type: 'string', description: 'Team ID.' },
      email: { type: 'string', description: 'Email address to invite.' },
      role: { type: 'string', description: 'Role (OWNER, MEMBER, VIEWER).' },
    },
    required: ['teamId', 'email'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { teamId, ...member } = input;
    return apiRequest<unknown>('POST', `/v2/teams/${encodeURIComponent(teamId)}/members`, [member]);
  },
});

export const updateTeamMember = tool({
  description: 'Update team member role.',
  inputSchema: jsonSchema<{ teamId: string; uid: string; role: string }>({
    type: 'object',
    properties: {
      teamId: { type: 'string', description: 'Team ID.' },
      uid: { type: 'string', description: 'User ID.' },
      role: { type: 'string', description: 'New role (OWNER, MEMBER, VIEWER).' },
    },
    required: ['teamId', 'uid', 'role'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { teamId, uid, ...body } = input;
    return apiRequest<unknown>(
      'PATCH',
      `/v1/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(uid)}`,
      body
    );
  },
});

export const removeTeamMember = tool({
  description: 'Remove a member from a team.',
  inputSchema: jsonSchema<{ teamId: string; uid: string }>({
    type: 'object',
    properties: {
      teamId: { type: 'string', description: 'Team ID.' },
      uid: { type: 'string', description: 'User ID.' },
    },
    required: ['teamId', 'uid'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'DELETE',
      `/v1/teams/${encodeURIComponent(input.teamId)}/members/${encodeURIComponent(input.uid)}`
    );
  },
});

export const joinTeam = tool({
  description: 'Join a team using an invite code.',
  inputSchema: jsonSchema<{ teamId: string; inviteCode: string }>({
    type: 'object',
    properties: {
      teamId: { type: 'string', description: 'Team ID.' },
      inviteCode: { type: 'string', description: 'Invite code.' },
    },
    required: ['teamId', 'inviteCode'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { teamId, ...body } = input;
    return apiRequest<unknown>(
      'POST',
      `/v1/teams/${encodeURIComponent(teamId)}/members/teams/join`,
      body
    );
  },
});

export const requestTeamAccess = tool({
  description: 'Request access to a team.',
  inputSchema: jsonSchema<{ teamId: string; joinedFrom: string }>({
    type: 'object',
    properties: {
      teamId: { type: 'string', description: 'Team ID.' },
      joinedFrom: { type: 'string', description: 'Source of join request.' },
    },
    required: ['teamId', 'joinedFrom'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { teamId, ...body } = input;
    return apiRequest<unknown>('POST', `/v1/teams/${encodeURIComponent(teamId)}/request`, body);
  },
});

export const getAccessRequestStatus = tool({
  description: 'Get access request status for a team.',
  inputSchema: jsonSchema<{ teamId: string; userId: string }>({
    type: 'object',
    properties: {
      teamId: { type: 'string', description: 'Team ID.' },
      userId: { type: 'string', description: 'User ID.' },
    },
    required: ['teamId', 'userId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v1/teams/${encodeURIComponent(input.teamId)}/request/${encodeURIComponent(input.userId)}`
    );
  },
});

export const deleteTeamInvite = tool({
  description: 'Delete a team invite.',
  inputSchema: jsonSchema<{ teamId: string; inviteId: string }>({
    type: 'object',
    properties: {
      teamId: { type: 'string', description: 'Team ID.' },
      inviteId: { type: 'string', description: 'Invite ID.' },
    },
    required: ['teamId', 'inviteId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'DELETE',
      `/v1/teams/${encodeURIComponent(input.teamId)}/members/${encodeURIComponent(input.inviteId)}`
    );
  },
});

// ─── 7. Access Groups ───────────────────────────────────────────────────────

export const listAccessGroups = tool({
  description: 'List access groups.',
  inputSchema: jsonSchema<{
    limit?: number;
    projectId?: string;
    search?: string;
    membersLimit?: number;
  }>({
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results.' },
      projectId: { type: 'string', description: 'Filter by project ID.' },
      search: { type: 'string', description: 'Search query.' },
      membersLimit: { type: 'number', description: 'Limit members returned per group.' },
    },
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v1/access-groups', undefined, input);
  },
});

export const createAccessGroup = tool({
  description: 'Create an access group.',
  inputSchema: jsonSchema<{ name: string; projects?: Array<{ projectId: string; role: string }> }>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Access group name.' },
      projects: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            role: { type: 'string' },
          },
          required: ['projectId', 'role'],
        },
        description: 'Projects to add to the group.',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', '/v1/access-groups', input);
  },
});

export const getAccessGroup = tool({
  description: 'Get access group details.',
  inputSchema: jsonSchema<{ accessGroupId: string }>({
    type: 'object',
    properties: {
      accessGroupId: { type: 'string', description: 'Access group ID.' },
    },
    required: ['accessGroupId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v1/access-groups/${encodeURIComponent(input.accessGroupId)}`
    );
  },
});

export const updateAccessGroup = tool({
  description: 'Update an access group.',
  inputSchema: jsonSchema<{
    accessGroupId: string;
    name?: string;
    projects?: Array<{ projectId: string; role: string }>;
  }>({
    type: 'object',
    properties: {
      accessGroupId: { type: 'string', description: 'Access group ID.' },
      name: { type: 'string', description: 'New group name.' },
      projects: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            role: { type: 'string' },
          },
          required: ['projectId', 'role'],
        },
        description: 'Projects configuration.',
      },
    },
    required: ['accessGroupId'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { accessGroupId, ...body } = input;
    return apiRequest<unknown>(
      'POST',
      `/v1/access-groups/${encodeURIComponent(accessGroupId)}`,
      body
    );
  },
});

export const deleteAccessGroup = tool({
  description: 'Delete an access group.',
  inputSchema: jsonSchema<{ accessGroupId: string }>({
    type: 'object',
    properties: {
      accessGroupId: { type: 'string', description: 'Access group ID.' },
    },
    required: ['accessGroupId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'DELETE',
      `/v1/access-groups/${encodeURIComponent(input.accessGroupId)}`
    );
  },
});

export const listAccessGroupMembers = tool({
  description: 'List members of an access group.',
  inputSchema: jsonSchema<{
    accessGroupId: string;
    limit?: number;
    since?: number;
    until?: number;
  }>({
    type: 'object',
    properties: {
      accessGroupId: { type: 'string', description: 'Access group ID.' },
      limit: { type: 'number', description: 'Max results.' },
      since: { type: 'number', description: 'Timestamp filter (after).' },
      until: { type: 'number', description: 'Timestamp filter (before).' },
    },
    required: ['accessGroupId'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { accessGroupId, ...query } = input;
    return apiRequest<unknown>(
      'GET',
      `/v1/access-groups/${encodeURIComponent(accessGroupId)}/members`,
      undefined,
      query
    );
  },
});

export const listAccessGroupProjects = tool({
  description: 'List projects in an access group.',
  inputSchema: jsonSchema<{ accessGroupId: string; limit?: number; next?: string }>({
    type: 'object',
    properties: {
      accessGroupId: { type: 'string', description: 'Access group ID.' },
      limit: { type: 'number', description: 'Max results.' },
      next: { type: 'string', description: 'Pagination cursor.' },
    },
    required: ['accessGroupId'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { accessGroupId, ...query } = input;
    return apiRequest<unknown>(
      'GET',
      `/v1/access-groups/${encodeURIComponent(accessGroupId)}/projects`,
      undefined,
      query
    );
  },
});

export const createAccessGroupProject = tool({
  description: 'Add a project to an access group.',
  inputSchema: jsonSchema<{ accessGroupId: string; projectId: string; role: string }>({
    type: 'object',
    properties: {
      accessGroupId: { type: 'string', description: 'Access group ID.' },
      projectId: { type: 'string', description: 'Project ID.' },
      role: { type: 'string', description: 'Project role (ADMIN, VIEWER, etc).' },
    },
    required: ['accessGroupId', 'projectId', 'role'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { accessGroupId, ...body } = input;
    return apiRequest<unknown>(
      'POST',
      `/v1/access-groups/${encodeURIComponent(accessGroupId)}/projects`,
      body
    );
  },
});

export const getAccessGroupProject = tool({
  description: 'Get a specific project in an access group.',
  inputSchema: jsonSchema<{ accessGroupId: string; projectId: string }>({
    type: 'object',
    properties: {
      accessGroupId: { type: 'string', description: 'Access group ID.' },
      projectId: { type: 'string', description: 'Project ID.' },
    },
    required: ['accessGroupId', 'projectId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v1/access-groups/${encodeURIComponent(input.accessGroupId)}/projects/${encodeURIComponent(input.projectId)}`
    );
  },
});

export const updateAccessGroupProject = tool({
  description: 'Update a project in an access group.',
  inputSchema: jsonSchema<{ accessGroupId: string; projectId: string; role: string }>({
    type: 'object',
    properties: {
      accessGroupId: { type: 'string', description: 'Access group ID.' },
      projectId: { type: 'string', description: 'Project ID.' },
      role: { type: 'string', description: 'New project role.' },
    },
    required: ['accessGroupId', 'projectId', 'role'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { accessGroupId, projectId, ...body } = input;
    return apiRequest<unknown>(
      'PATCH',
      `/v1/access-groups/${encodeURIComponent(accessGroupId)}/projects/${encodeURIComponent(projectId)}`,
      body
    );
  },
});

export const deleteAccessGroupProject = tool({
  description: 'Remove a project from an access group.',
  inputSchema: jsonSchema<{ accessGroupId: string; projectId: string }>({
    type: 'object',
    properties: {
      accessGroupId: { type: 'string', description: 'Access group ID.' },
      projectId: { type: 'string', description: 'Project ID.' },
    },
    required: ['accessGroupId', 'projectId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'DELETE',
      `/v1/access-groups/${encodeURIComponent(input.accessGroupId)}/projects/${encodeURIComponent(input.projectId)}`
    );
  },
});

// ─── 8. Edge Config ─────────────────────────────────────────────────────────

export const listEdgeConfigs = tool({
  description: 'List all Edge Configs.',
  inputSchema: jsonSchema<{ limit?: number; since?: number; until?: number }>({
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results.' },
      since: { type: 'number', description: 'Timestamp filter (after).' },
      until: { type: 'number', description: 'Timestamp filter (before).' },
    },
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v1/edge-config', undefined, input);
  },
});

export const createEdgeConfig = tool({
  description: 'Create an Edge Config.',
  inputSchema: jsonSchema<{ slug: string; items?: Record<string, unknown> }>({
    type: 'object',
    properties: {
      slug: { type: 'string', description: 'Edge Config slug.' },
      items: { type: 'object', description: 'Initial items (key-value pairs).' },
    },
    required: ['slug'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', '/v1/edge-config', input);
  },
});

export const getEdgeConfig = tool({
  description: 'Get Edge Config details.',
  inputSchema: jsonSchema<{ edgeConfigId: string }>({
    type: 'object',
    properties: {
      edgeConfigId: { type: 'string', description: 'Edge Config ID.' },
    },
    required: ['edgeConfigId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', `/v1/edge-config/${encodeURIComponent(input.edgeConfigId)}`);
  },
});

export const updateEdgeConfig = tool({
  description: 'Update an Edge Config.',
  inputSchema: jsonSchema<{ edgeConfigId: string; slug?: string; items?: Record<string, unknown> }>(
    {
      type: 'object',
      properties: {
        edgeConfigId: { type: 'string', description: 'Edge Config ID.' },
        slug: { type: 'string', description: 'New slug.' },
        items: { type: 'object', description: 'Items to update.' },
      },
      required: ['edgeConfigId'],
      additionalProperties: false,
    }
  ),
  async execute(input) {
    const { edgeConfigId, ...body } = input;
    return apiRequest<unknown>('PUT', `/v1/edge-config/${encodeURIComponent(edgeConfigId)}`, body);
  },
});

export const deleteEdgeConfig = tool({
  description: 'Delete an Edge Config.',
  inputSchema: jsonSchema<{ edgeConfigId: string }>({
    type: 'object',
    properties: {
      edgeConfigId: { type: 'string', description: 'Edge Config ID.' },
    },
    required: ['edgeConfigId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'DELETE',
      `/v1/edge-config/${encodeURIComponent(input.edgeConfigId)}`
    );
  },
});

export const getEdgeConfigItems = tool({
  description: 'Get all items from an Edge Config.',
  inputSchema: jsonSchema<{ edgeConfigId: string; limit?: number; edgeConfigToken?: string }>({
    type: 'object',
    properties: {
      edgeConfigId: { type: 'string', description: 'Edge Config ID.' },
      limit: { type: 'number', description: 'Max items to return.' },
      edgeConfigToken: { type: 'string', description: 'Optional read token for public access.' },
    },
    required: ['edgeConfigId'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { edgeConfigId, ...query } = input;
    return apiRequest<unknown>(
      'GET',
      `/v1/edge-config/${encodeURIComponent(edgeConfigId)}/items`,
      undefined,
      query
    );
  },
});

export const getEdgeConfigItem = tool({
  description: 'Get a specific item from an Edge Config.',
  inputSchema: jsonSchema<{ edgeConfigId: string; key: string; edgeConfigToken?: string }>({
    type: 'object',
    properties: {
      edgeConfigId: { type: 'string', description: 'Edge Config ID.' },
      key: { type: 'string', description: 'Item key.' },
      edgeConfigToken: { type: 'string', description: 'Optional read token.' },
    },
    required: ['edgeConfigId', 'key'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { edgeConfigId, key, ...query } = input;
    return apiRequest<unknown>(
      'GET',
      `/v1/edge-config/${encodeURIComponent(edgeConfigId)}/item/${encodeURIComponent(key)}`,
      undefined,
      query
    );
  },
});

export const batchUpdateEdgeConfigItems = tool({
  description: 'Batch update Edge Config items.',
  inputSchema: jsonSchema<{
    edgeConfigId: string;
    items: Array<{ operation: string; key: string; value?: unknown }>;
  }>({
    type: 'object',
    properties: {
      edgeConfigId: { type: 'string', description: 'Edge Config ID.' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            operation: {
              type: 'string',
              description: 'Operation: create, update, upsert, delete.',
            },
            key: { type: 'string', description: 'Item key.' },
            value: { description: 'Item value (not needed for delete).' },
          },
          required: ['operation', 'key'],
        },
        description: 'Batch operations to perform.',
      },
    },
    required: ['edgeConfigId', 'items'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { edgeConfigId, ...body } = input;
    return apiRequest<unknown>(
      'PATCH',
      `/v1/edge-config/${encodeURIComponent(edgeConfigId)}/items`,
      body
    );
  },
});

export const getEdgeConfigSchema = tool({
  description: 'Get Edge Config schema.',
  inputSchema: jsonSchema<{ edgeConfigId: string }>({
    type: 'object',
    properties: {
      edgeConfigId: { type: 'string', description: 'Edge Config ID.' },
    },
    required: ['edgeConfigId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v1/edge-config/${encodeURIComponent(input.edgeConfigId)}/schema`
    );
  },
});

export const updateEdgeConfigSchema = tool({
  description: 'Update Edge Config schema.',
  inputSchema: jsonSchema<{ edgeConfigId: string; definition: Record<string, unknown> }>({
    type: 'object',
    properties: {
      edgeConfigId: { type: 'string', description: 'Edge Config ID.' },
      definition: { type: 'object', description: 'JSON Schema definition.' },
    },
    required: ['edgeConfigId', 'definition'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { edgeConfigId, ...body } = input;
    return apiRequest<unknown>(
      'POST',
      `/v1/edge-config/${encodeURIComponent(edgeConfigId)}/schema`,
      body
    );
  },
});

export const deleteEdgeConfigSchema = tool({
  description: 'Delete Edge Config schema.',
  inputSchema: jsonSchema<{ edgeConfigId: string }>({
    type: 'object',
    properties: {
      edgeConfigId: { type: 'string', description: 'Edge Config ID.' },
    },
    required: ['edgeConfigId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'DELETE',
      `/v1/edge-config/${encodeURIComponent(input.edgeConfigId)}/schema`
    );
  },
});

export const createEdgeConfigToken = tool({
  description: 'Create an Edge Config read token.',
  inputSchema: jsonSchema<{ edgeConfigId: string; label: string }>({
    type: 'object',
    properties: {
      edgeConfigId: { type: 'string', description: 'Edge Config ID.' },
      label: { type: 'string', description: 'Token label.' },
    },
    required: ['edgeConfigId', 'label'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { edgeConfigId, ...body } = input;
    return apiRequest<unknown>(
      'POST',
      `/v1/edge-config/${encodeURIComponent(edgeConfigId)}/token`,
      body
    );
  },
});

export const getEdgeConfigToken = tool({
  description: 'Get an Edge Config token.',
  inputSchema: jsonSchema<{ edgeConfigId: string; token: string }>({
    type: 'object',
    properties: {
      edgeConfigId: { type: 'string', description: 'Edge Config ID.' },
      token: { type: 'string', description: 'Token value.' },
    },
    required: ['edgeConfigId', 'token'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v1/edge-config/${encodeURIComponent(input.edgeConfigId)}/token/${encodeURIComponent(input.token)}`
    );
  },
});

export const listEdgeConfigTokens = tool({
  description: 'List Edge Config tokens.',
  inputSchema: jsonSchema<{ edgeConfigId: string }>({
    type: 'object',
    properties: {
      edgeConfigId: { type: 'string', description: 'Edge Config ID.' },
    },
    required: ['edgeConfigId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v1/edge-config/${encodeURIComponent(input.edgeConfigId)}/tokens`
    );
  },
});

export const deleteEdgeConfigTokens = tool({
  description: 'Delete Edge Config tokens.',
  inputSchema: jsonSchema<{ edgeConfigId: string; tokens: string[] }>({
    type: 'object',
    properties: {
      edgeConfigId: { type: 'string', description: 'Edge Config ID.' },
      tokens: { type: 'array', items: { type: 'string' }, description: 'Token values to delete.' },
    },
    required: ['edgeConfigId', 'tokens'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { edgeConfigId, ...body } = input;
    return apiRequest<unknown>(
      'DELETE',
      `/v1/edge-config/${encodeURIComponent(edgeConfigId)}/tokens`,
      body
    );
  },
});

export const listEdgeConfigBackups = tool({
  description: 'List Edge Config backups.',
  inputSchema: jsonSchema<{ edgeConfigId: string; limit?: number; since?: number; until?: number }>(
    {
      type: 'object',
      properties: {
        edgeConfigId: { type: 'string', description: 'Edge Config ID.' },
        limit: { type: 'number', description: 'Max results.' },
        since: { type: 'number', description: 'Timestamp filter (after).' },
        until: { type: 'number', description: 'Timestamp filter (before).' },
      },
      required: ['edgeConfigId'],
      additionalProperties: false,
    }
  ),
  async execute(input) {
    const { edgeConfigId, ...query } = input;
    return apiRequest<unknown>(
      'GET',
      `/v1/edge-config/${encodeURIComponent(edgeConfigId)}/backups`,
      undefined,
      query
    );
  },
});

export const getEdgeConfigBackup = tool({
  description: 'Get a specific Edge Config backup.',
  inputSchema: jsonSchema<{ edgeConfigId: string; backupId: string }>({
    type: 'object',
    properties: {
      edgeConfigId: { type: 'string', description: 'Edge Config ID.' },
      backupId: { type: 'string', description: 'Backup ID.' },
    },
    required: ['edgeConfigId', 'backupId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v1/edge-config/${encodeURIComponent(input.edgeConfigId)}/backups/${encodeURIComponent(input.backupId)}`
    );
  },
});

// ─── 9. Environment Variables (Shared) ──────────────────────────────────────

export const createSharedEnvVar = tool({
  description: 'Create a shared environment variable.',
  inputSchema: jsonSchema<{
    key: string;
    value: string;
    type: string;
    target: string[];
    projectId?: string[];
  }>({
    type: 'object',
    properties: {
      key: { type: 'string', description: 'Variable name.' },
      value: { type: 'string', description: 'Variable value.' },
      type: { type: 'string', description: 'Type: plain, secret, encrypted, sensitive, system.' },
      target: {
        type: 'array',
        items: { type: 'string' },
        description: 'Targets: production, preview, development.',
      },
      projectId: { type: 'array', items: { type: 'string' }, description: 'Project IDs to link.' },
    },
    required: ['key', 'value', 'type', 'target'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', '/v1/env', input);
  },
});

export const listSharedEnvVars = tool({
  description: 'List shared environment variables.',
  inputSchema: jsonSchema<{ limit?: number; since?: number; until?: number }>({
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results.' },
      since: { type: 'number', description: 'Timestamp filter (after).' },
      until: { type: 'number', description: 'Timestamp filter (before).' },
    },
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v1/env', undefined, input);
  },
});

export const updateSharedEnvVars = tool({
  description: 'Update shared environment variables.',
  inputSchema: jsonSchema<{
    envs: Array<{ id: string; key?: string; value?: string; type?: string; target?: string[] }>;
  }>({
    type: 'object',
    properties: {
      envs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Environment variable ID.' },
            key: { type: 'string', description: 'New variable name.' },
            value: { type: 'string', description: 'New variable value.' },
            type: { type: 'string', description: 'New type.' },
            target: { type: 'array', items: { type: 'string' }, description: 'New targets.' },
          },
          required: ['id'],
        },
        description: 'Environment variables to update.',
      },
    },
    required: ['envs'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('PATCH', '/v1/env', input);
  },
});

export const deleteSharedEnvVars = tool({
  description: 'Delete shared environment variables.',
  inputSchema: jsonSchema<{ ids: string[] }>({
    type: 'object',
    properties: {
      ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Environment variable IDs to delete.',
      },
    },
    required: ['ids'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('DELETE', '/v1/env', input);
  },
});

export const getSharedEnvVar = tool({
  description: 'Get a shared environment variable.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Environment variable ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', `/v1/env/${encodeURIComponent(input.id)}`);
  },
});

export const createCustomEnvironment = tool({
  description: 'Create a custom environment for a project.',
  inputSchema: jsonSchema<{
    idOrName: string;
    name: string;
    slug: string;
    description?: string;
    branchPattern?: string;
  }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      name: { type: 'string', description: 'Environment name.' },
      slug: { type: 'string', description: 'Environment slug.' },
      description: { type: 'string', description: 'Environment description.' },
      branchPattern: { type: 'string', description: 'Git branch pattern (regex).' },
    },
    required: ['idOrName', 'name', 'slug'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { idOrName, ...body } = input;
    return apiRequest<unknown>(
      'POST',
      `/v9/projects/${encodeURIComponent(idOrName)}/custom-environments`,
      body
    );
  },
});

export const listCustomEnvironments = tool({
  description: 'List custom environments for a project.',
  inputSchema: jsonSchema<{ idOrName: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
    },
    required: ['idOrName'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v9/projects/${encodeURIComponent(input.idOrName)}/custom-environments`
    );
  },
});

export const getCustomEnvironment = tool({
  description: 'Get a custom environment.',
  inputSchema: jsonSchema<{ idOrName: string; environmentSlugOrId: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      environmentSlugOrId: { type: 'string', description: 'Environment slug or ID.' },
    },
    required: ['idOrName', 'environmentSlugOrId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v9/projects/${encodeURIComponent(input.idOrName)}/custom-environments/${encodeURIComponent(input.environmentSlugOrId)}`
    );
  },
});

export const updateCustomEnvironment = tool({
  description: 'Update a custom environment.',
  inputSchema: jsonSchema<{
    idOrName: string;
    environmentSlugOrId: string;
    name?: string;
    slug?: string;
    description?: string;
    branchPattern?: string;
  }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      environmentSlugOrId: { type: 'string', description: 'Environment slug or ID.' },
      name: { type: 'string', description: 'New environment name.' },
      slug: { type: 'string', description: 'New environment slug.' },
      description: { type: 'string', description: 'New description.' },
      branchPattern: { type: 'string', description: 'New branch pattern.' },
    },
    required: ['idOrName', 'environmentSlugOrId'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { idOrName, environmentSlugOrId, ...body } = input;
    return apiRequest<unknown>(
      'PATCH',
      `/v9/projects/${encodeURIComponent(idOrName)}/custom-environments/${encodeURIComponent(environmentSlugOrId)}`,
      body
    );
  },
});

export const removeCustomEnvironment = tool({
  description: 'Remove a custom environment.',
  inputSchema: jsonSchema<{ idOrName: string; environmentSlugOrId: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      environmentSlugOrId: { type: 'string', description: 'Environment slug or ID.' },
    },
    required: ['idOrName', 'environmentSlugOrId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'DELETE',
      `/v9/projects/${encodeURIComponent(input.idOrName)}/custom-environments/${encodeURIComponent(input.environmentSlugOrId)}`
    );
  },
});

// ─── 10. Security / Firewall ────────────────────────────────────────────────

export const getAttackStatus = tool({
  description: 'Get attack challenge mode status.',
  inputSchema: jsonSchema<{ projectId: string; since?: number }>({
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID.' },
      since: { type: 'number', description: 'Only include attacks after this timestamp.' },
    },
    required: ['projectId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v1/security/firewall/attack-status', undefined, input);
  },
});

export const toggleAttackMode = tool({
  description: 'Enable or disable attack challenge mode.',
  inputSchema: jsonSchema<{ projectId: string; enabled: boolean; activeUntil?: number }>({
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID.' },
      enabled: { type: 'boolean', description: 'Enable attack challenge mode.' },
      activeUntil: { type: 'number', description: 'Optional attack-mode expiry timestamp.' },
    },
    required: ['projectId', 'enabled'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', '/v1/security/attack-mode', {
      projectId: input.projectId,
      attackModeEnabled: input.enabled,
      ...(input.activeUntil === undefined ? {} : { attackModeActiveUntil: input.activeUntil }),
    });
  },
});

export const getFirewallConfig = tool({
  description: 'Get firewall configuration for a project.',
  inputSchema: jsonSchema<{ projectId: string }>({
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID.' },
    },
    required: ['projectId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v1/security/firewall/config', undefined, input);
  },
});

export const updateFirewallConfig = tool({
  description: 'Update firewall configuration.',
  inputSchema: jsonSchema<{
    projectId: string;
    rules: unknown[];
    ips: unknown[];
    changes: unknown[];
  }>({
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID.' },
      rules: { type: 'array', description: 'Firewall rules.' },
      ips: { type: 'array', description: 'IP allowlist/blocklist.' },
      changes: { type: 'array', description: 'Configuration changes.' },
    },
    required: ['projectId', 'rules', 'ips', 'changes'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('PATCH', '/v1/security/firewall/config', input);
  },
});

export const replaceFirewallConfig = tool({
  description: 'Replace entire firewall configuration.',
  inputSchema: jsonSchema<{ projectId: string; rules: unknown[]; ips: unknown[] }>({
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID.' },
      rules: { type: 'array', description: 'Firewall rules.' },
      ips: { type: 'array', description: 'IP allowlist/blocklist.' },
    },
    required: ['projectId', 'rules', 'ips'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('PUT', '/v1/security/firewall/config', input);
  },
});

export const listFirewallBypass = tool({
  description: 'List firewall bypass entries.',
  inputSchema: jsonSchema<{ projectId: string; limit?: number; offset?: number }>({
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID.' },
      limit: { type: 'number', description: 'Max results.' },
      offset: { type: 'number', description: 'Pagination offset.' },
    },
    required: ['projectId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v1/security/firewall/bypass', undefined, input);
  },
});

export const createFirewallBypass = tool({
  description: 'Create a firewall bypass entry.',
  inputSchema: jsonSchema<{ projectId: string; domain: string; ip?: string }>({
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID.' },
      domain: { type: 'string', description: 'Domain to bypass.' },
      ip: { type: 'string', description: 'IP address to bypass.' },
    },
    required: ['projectId', 'domain'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', '/v1/security/firewall/bypass', input);
  },
});

export const deleteFirewallBypass = tool({
  description: 'Delete firewall bypass entries.',
  inputSchema: jsonSchema<{ projectId: string; ids: string[] }>({
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID.' },
      ids: { type: 'array', items: { type: 'string' }, description: 'Bypass entry IDs to delete.' },
    },
    required: ['projectId', 'ids'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('DELETE', '/v1/security/firewall/bypass', input);
  },
});

// ─── 11. Aliases ────────────────────────────────────────────────────────────

export const listAliases = tool({
  description: 'List all aliases.',
  inputSchema: jsonSchema<{ limit?: number; since?: number; until?: number; projectId?: string }>({
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results.' },
      since: { type: 'number', description: 'Timestamp filter (after).' },
      until: { type: 'number', description: 'Timestamp filter (before).' },
      projectId: { type: 'string', description: 'Filter by project ID.' },
    },
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v4/aliases', undefined, input);
  },
});

export const getAlias = tool({
  description: 'Get alias details.',
  inputSchema: jsonSchema<{ aliasId: string }>({
    type: 'object',
    properties: {
      aliasId: { type: 'string', description: 'Alias ID.' },
    },
    required: ['aliasId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', `/v4/aliases/${encodeURIComponent(input.aliasId)}`);
  },
});

export const deleteAlias = tool({
  description: 'Delete an alias.',
  inputSchema: jsonSchema<{ aliasId: string }>({
    type: 'object',
    properties: {
      aliasId: { type: 'string', description: 'Alias ID.' },
    },
    required: ['aliasId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('DELETE', `/v2/aliases/${encodeURIComponent(input.aliasId)}`);
  },
});

export const listDeploymentAliases = tool({
  description: 'List aliases for a deployment.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Deployment ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', `/v2/deployments/${encodeURIComponent(input.id)}/aliases`);
  },
});

export const assignAlias = tool({
  description: 'Assign an alias to a deployment.',
  inputSchema: jsonSchema<{ id: string; alias: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Deployment ID.' },
      alias: { type: 'string', description: 'Alias to assign.' },
    },
    required: ['id', 'alias'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { id, ...body } = input;
    return apiRequest<unknown>('POST', `/v2/deployments/${encodeURIComponent(id)}/aliases`, body);
  },
});

// ─── 12. Checks ─────────────────────────────────────────────────────────────

export const createCheck = tool({
  description: 'Create a deployment check.',
  inputSchema: jsonSchema<{
    deploymentId: string;
    name: string;
    path?: string;
    detailsUrl?: string;
    output?: { summary: string; text?: string };
    externalId?: string;
  }>({
    type: 'object',
    properties: {
      deploymentId: { type: 'string', description: 'Deployment ID.' },
      name: { type: 'string', description: 'Check name.' },
      path: { type: 'string', description: 'File path.' },
      detailsUrl: { type: 'string', description: 'URL with check details.' },
      output: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'Check summary.' },
          text: { type: 'string', description: 'Check details.' },
        },
        required: ['summary'],
        description: 'Check output.',
      },
      externalId: { type: 'string', description: 'External check ID.' },
    },
    required: ['deploymentId', 'name'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { deploymentId, ...body } = input;
    return apiRequest<unknown>(
      'POST',
      `/v2/deployments/${encodeURIComponent(deploymentId)}/check-runs`,
      body
    );
  },
});

export const listChecks = tool({
  description: 'List deployment checks.',
  inputSchema: jsonSchema<{ deploymentId: string }>({
    type: 'object',
    properties: {
      deploymentId: { type: 'string', description: 'Deployment ID.' },
    },
    required: ['deploymentId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v2/deployments/${encodeURIComponent(input.deploymentId)}/check-runs`
    );
  },
});

export const getCheck = tool({
  description: 'Get a deployment check.',
  inputSchema: jsonSchema<{ deploymentId: string; checkId: string }>({
    type: 'object',
    properties: {
      deploymentId: { type: 'string', description: 'Deployment ID.' },
      checkId: { type: 'string', description: 'Check ID.' },
    },
    required: ['deploymentId', 'checkId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v2/deployments/${encodeURIComponent(input.deploymentId)}/check-runs/${encodeURIComponent(input.checkId)}`
    );
  },
});

export const updateCheck = tool({
  description: 'Update a deployment check.',
  inputSchema: jsonSchema<{
    deploymentId: string;
    checkId: string;
    name?: string;
    path?: string;
    detailsUrl?: string;
    output?: { summary: string; text?: string };
    status?: string;
    conclusion?: string;
  }>({
    type: 'object',
    properties: {
      deploymentId: { type: 'string', description: 'Deployment ID.' },
      checkId: { type: 'string', description: 'Check ID.' },
      name: { type: 'string', description: 'Check name.' },
      path: { type: 'string', description: 'File path.' },
      detailsUrl: { type: 'string', description: 'Details URL.' },
      output: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['summary'],
        description: 'Check output.',
      },
      status: { type: 'string', description: 'Status: queued, running, completed.' },
      conclusion: {
        type: 'string',
        description: 'Conclusion: succeeded, failed, skipped, canceled.',
      },
    },
    required: ['deploymentId', 'checkId'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { deploymentId, checkId, ...body } = input;
    return apiRequest<unknown>(
      'PATCH',
      `/v2/deployments/${encodeURIComponent(deploymentId)}/check-runs/${encodeURIComponent(checkId)}`,
      body
    );
  },
});

export const rerequestCheck = tool({
  description: 'Re-request a deployment check.',
  inputSchema: jsonSchema<{ deploymentId: string; checkId: string }>({
    type: 'object',
    properties: {
      deploymentId: { type: 'string', description: 'Deployment ID.' },
      checkId: { type: 'string', description: 'Check ID.' },
    },
    required: ['deploymentId', 'checkId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'POST',
      `/v1/deployments/${encodeURIComponent(input.deploymentId)}/checks/${encodeURIComponent(input.checkId)}/rerequest`
    );
  },
});

// ─── 13. Webhooks ───────────────────────────────────────────────────────────

export const createWebhook = tool({
  description: 'Create a webhook.',
  inputSchema: jsonSchema<{ url: string; events: string[] }>({
    type: 'object',
    properties: {
      url: { type: 'string', description: 'Webhook URL.' },
      events: {
        type: 'array',
        items: { type: 'string' },
        description: 'Event types to subscribe to.',
      },
    },
    required: ['url', 'events'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', '/v1/webhooks', input);
  },
});

export const listWebhooks = tool({
  description: 'List all webhooks.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute() {
    return apiRequest<unknown>('GET', '/v1/webhooks');
  },
});

export const getWebhook = tool({
  description: 'Get webhook details.',
  inputSchema: jsonSchema<{ webhookId: string }>({
    type: 'object',
    properties: {
      webhookId: { type: 'string', description: 'Webhook ID.' },
    },
    required: ['webhookId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', `/v1/webhooks/${encodeURIComponent(input.webhookId)}`);
  },
});

export const deleteWebhook = tool({
  description: 'Delete a webhook.',
  inputSchema: jsonSchema<{ webhookId: string }>({
    type: 'object',
    properties: {
      webhookId: { type: 'string', description: 'Webhook ID.' },
    },
    required: ['webhookId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('DELETE', `/v1/webhooks/${encodeURIComponent(input.webhookId)}`);
  },
});

// ─── 14. Log Drains ─────────────────────────────────────────────────────────

export const createDrain = tool({
  description: 'Create an observability drain.',
  inputSchema: jsonSchema<{
    name: string;
    projects: 'some' | 'all';
    projectIds?: string[];
    schemas: Record<string, { version: string }>;
    delivery?: {
      type: string;
      endpoint: string;
      encoding: 'json' | 'ndjson';
      headers: Record<string, string>;
      compression?: 'gzip' | 'none';
      secret?: string;
    };
  }>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Drain name.' },
      projects: {
        type: 'string',
        enum: ['some', 'all'],
        description: 'Apply the drain to selected projects or all projects.',
      },
      projectIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Project IDs when projects is some.',
      },
      schemas: {
        type: 'object',
        description: 'Enabled drain schemas keyed by schema name.',
        additionalProperties: {
          type: 'object',
          properties: { version: { type: 'string' } },
          required: ['version'],
          additionalProperties: false,
        },
      },
      delivery: {
        type: 'object',
        description: 'HTTP delivery configuration.',
        properties: {
          type: { type: 'string' },
          endpoint: { type: 'string' },
          encoding: { type: 'string', enum: ['json', 'ndjson'] },
          headers: { type: 'object', additionalProperties: { type: 'string' } },
          compression: { type: 'string', enum: ['gzip', 'none'] },
          secret: { type: 'string' },
        },
        required: ['type', 'endpoint', 'encoding', 'headers'],
        additionalProperties: false,
      },
    },
    required: ['name', 'projects', 'schemas'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', '/v1/drains', input);
  },
});

export const listDrains = tool({
  description: 'List observability drains.',
  inputSchema: jsonSchema<{ projectId?: string; includeMetadata?: boolean }>({
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Filter drains by project ID.' },
      includeMetadata: { type: 'boolean', description: 'Include drain metadata.' },
    },
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v1/drains', undefined, input);
  },
});

export const deleteDrain = tool({
  description: 'Delete an integration log drain.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Log drain ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('DELETE', `/v1/drains/${encodeURIComponent(input.id)}`);
  },
});

// ─── 15. Certificates ───────────────────────────────────────────────────────

export const issueCertificate = tool({
  description: 'Issue a TLS certificate for domains.',
  inputSchema: jsonSchema<{ domains: string[] }>({
    type: 'object',
    properties: {
      domains: {
        type: 'array',
        items: { type: 'string' },
        description: 'Domains to issue certificate for.',
      },
    },
    required: ['domains'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', '/v8/certs', { cns: input.domains });
  },
});

export const uploadCertificate = tool({
  description: 'Upload a custom TLS certificate.',
  inputSchema: jsonSchema<{ ca: string; cert: string; key: string }>({
    type: 'object',
    properties: {
      ca: { type: 'string', description: 'CA certificate chain (PEM).' },
      cert: { type: 'string', description: 'Certificate (PEM).' },
      key: { type: 'string', description: 'Private key (PEM).' },
    },
    required: ['ca', 'cert', 'key'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('PUT', '/v8/certs', input);
  },
});

export const getCertificate = tool({
  description: 'Get certificate details.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Certificate ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', `/v8/certs/${encodeURIComponent(input.id)}`);
  },
});

export const deleteCertificate = tool({
  description: 'Delete a certificate.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Certificate ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('DELETE', `/v8/certs/${encodeURIComponent(input.id)}`);
  },
});

// ─── 16. Artifacts / Remote Cache ───────────────────────────────────────────

export const getArtifactStatus = tool({
  description: 'Get artifact upload/download status.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute() {
    return apiRequest<unknown>('GET', '/v8/artifacts/status');
  },
});

export const uploadArtifact = tool({
  description: 'Upload an artifact to remote cache.',
  inputSchema: jsonSchema<{ hash: string; data: string; slug?: string }>({
    type: 'object',
    properties: {
      hash: { type: 'string', description: 'Artifact hash (SHA-256).' },
      data: { type: 'string', description: 'Base64-encoded artifact data.' },
      slug: { type: 'string', description: 'Team/project slug.' },
    },
    required: ['hash', 'data'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { hash, data, slug } = input;
    const token = getToken();
    const qs = slug ? `?slug=${encodeURIComponent(slug)}` : '';

    const response = await fetch(`${BASE_URL}/v8/artifacts/${encodeURIComponent(hash)}${qs}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
      },
      body: Buffer.from(data, 'base64'),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
  },
});

export const downloadArtifact = tool({
  description: 'Download an artifact from remote cache.',
  inputSchema: jsonSchema<{ hash: string; slug?: string }>({
    type: 'object',
    properties: {
      hash: { type: 'string', description: 'Artifact hash (SHA-256).' },
      slug: { type: 'string', description: 'Team/project slug.' },
    },
    required: ['hash'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { hash, slug } = input;
    const token = getToken();
    const qs = slug ? `?slug=${encodeURIComponent(slug)}` : '';

    const response = await fetch(`${BASE_URL}/v8/artifacts/${encodeURIComponent(hash)}${qs}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const buffer = await response.arrayBuffer();
    return {
      data: Buffer.from(buffer).toString('base64'),
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
    };
  },
});

export const checkArtifactExists = tool({
  description: 'Check if an artifact exists in remote cache.',
  inputSchema: jsonSchema<{ hash: string; slug?: string }>({
    type: 'object',
    properties: {
      hash: { type: 'string', description: 'Artifact hash (SHA-256).' },
      slug: { type: 'string', description: 'Team/project slug.' },
    },
    required: ['hash'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { hash, slug } = input;
    const token = getToken();
    const qs = slug ? `?slug=${encodeURIComponent(slug)}` : '';

    const response = await fetch(`${BASE_URL}/v8/artifacts/${encodeURIComponent(hash)}${qs}`, {
      method: 'HEAD',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      exists: response.ok,
      status: response.status,
      contentLength: response.headers.get('content-length'),
    };
  },
});

export const recordArtifactEvents = tool({
  description: 'Record artifact cache events.',
  inputSchema: jsonSchema<{ events: Array<{ hash: string; event: string; timestamp?: number }> }>({
    type: 'object',
    properties: {
      events: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            hash: { type: 'string', description: 'Artifact hash.' },
            event: { type: 'string', description: 'Event type (HIT, MISS, etc).' },
            timestamp: { type: 'number', description: 'Event timestamp.' },
          },
          required: ['hash', 'event'],
        },
        description: 'Cache events to record.',
      },
    },
    required: ['events'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', '/v8/artifacts/events', input);
  },
});

export const queryArtifacts = tool({
  description: 'Query artifacts by hashes.',
  inputSchema: jsonSchema<{ hashes: string[] }>({
    type: 'object',
    properties: {
      hashes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Artifact hashes to query.',
      },
    },
    required: ['hashes'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', '/v8/artifacts', input);
  },
});

// ─── 17. Authentication ─────────────────────────────────────────────────────

export const listAuthTokens = tool({
  description: 'List authentication tokens.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute() {
    return apiRequest<unknown>('GET', '/v6/user/tokens');
  },
});

export const getAuthToken = tool({
  description: 'Get authentication token details.',
  inputSchema: jsonSchema<{ tokenId: string }>({
    type: 'object',
    properties: {
      tokenId: { type: 'string', description: 'Token ID.' },
    },
    required: ['tokenId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', `/v5/user/tokens/${encodeURIComponent(input.tokenId)}`);
  },
});

export const createAuthToken = tool({
  description: 'Create an authentication token.',
  inputSchema: jsonSchema<{ name: string; expiresAt?: number }>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Token name.' },
      expiresAt: { type: 'number', description: 'Expiration timestamp (milliseconds).' },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', '/v3/user/tokens', input);
  },
});

export const deleteAuthToken = tool({
  description: 'Delete an authentication token.',
  inputSchema: jsonSchema<{ tokenId: string }>({
    type: 'object',
    properties: {
      tokenId: { type: 'string', description: 'Token ID.' },
    },
    required: ['tokenId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('DELETE', `/v3/user/tokens/${encodeURIComponent(input.tokenId)}`);
  },
});

// ─── 18. User ───────────────────────────────────────────────────────────────

export const getAuthUser = tool({
  description: 'Get authenticated user details.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute() {
    return apiRequest<unknown>('GET', '/v2/user');
  },
});

export const deleteUser = tool({
  description: 'Delete the authenticated user account.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute() {
    return apiRequest<unknown>('DELETE', '/v1/user');
  },
});

export const listUserEvents = tool({
  description: 'List user events.',
  inputSchema: jsonSchema<{ limit?: number; since?: number; until?: number; types?: string }>({
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results.' },
      since: { type: 'number', description: 'Timestamp filter (after).' },
      until: { type: 'number', description: 'Timestamp filter (before).' },
      types: { type: 'string', description: 'Comma-separated event types.' },
    },
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v3/events', undefined, input);
  },
});

// ─── 19. Bulk Redirects ─────────────────────────────────────────────────────

export const stageRedirects = tool({
  description: 'Stage bulk redirects for a project.',
  inputSchema: jsonSchema<{
    projectId: string;
    teamId: string;
    name?: string;
    overwrite?: boolean;
    redirects: Array<{ source: string; destination: string; statusCode?: number }>;
  }>({
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID.' },
      teamId: { type: 'string', description: 'Team ID that owns the project.' },
      name: { type: 'string', description: 'Optional staged version name.' },
      overwrite: { type: 'boolean', description: 'Replace the complete staged redirect set.' },
      redirects: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            source: { type: 'string', description: 'Source path pattern.' },
            destination: { type: 'string', description: 'Destination URL.' },
            statusCode: { type: 'number', description: 'HTTP status code (301, 302, 307, 308).' },
          },
          required: ['source', 'destination'],
        },
        description: 'Redirects to stage.',
      },
    },
    required: ['projectId', 'teamId', 'redirects'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('PUT', '/v1/bulk-redirects', input);
  },
});

export const getRedirects = tool({
  description: 'Get staged redirects for a project.',
  inputSchema: jsonSchema<{ projectId: string }>({
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID.' },
    },
    required: ['projectId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v1/bulk-redirects', undefined, input);
  },
});

export const deleteRedirects = tool({
  description: 'Delete staged redirects.',
  inputSchema: jsonSchema<{ projectId: string; sources: string[]; name?: string }>({
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID.' },
      sources: {
        type: 'array',
        items: { type: 'string' },
        description: 'Redirect source patterns to delete.',
      },
      name: { type: 'string', description: 'Optional staged version name.' },
    },
    required: ['projectId', 'sources'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { projectId, sources, name } = input;
    return apiRequest<unknown>(
      'DELETE',
      '/v1/bulk-redirects',
      { redirects: sources, name },
      {
        projectId,
      }
    );
  },
});

export const editRedirect = tool({
  description: 'Edit a staged redirect.',
  inputSchema: jsonSchema<{
    projectId: string;
    source: string;
    destination?: string;
    statusCode?: number;
    permanent?: boolean;
    caseSensitive?: boolean;
    query?: boolean;
    preserveQueryParams?: boolean;
    name?: string;
    restore?: boolean;
  }>({
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID.' },
      source: { type: 'string', description: 'Existing redirect source pattern to edit.' },
      destination: { type: 'string', description: 'New destination URL.' },
      statusCode: { type: 'number', description: 'New HTTP status code.' },
      permanent: { type: 'boolean' },
      caseSensitive: { type: 'boolean' },
      query: { type: 'boolean' },
      preserveQueryParams: { type: 'boolean' },
      name: { type: 'string', description: 'Optional staged version name.' },
      restore: { type: 'boolean', description: 'Restore from the latest production version.' },
    },
    required: ['projectId', 'source'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { projectId, name, restore, ...redirect } = input;
    return apiRequest<unknown>(
      'PATCH',
      '/v1/bulk-redirects',
      { redirect, name, restore },
      {
        projectId,
      }
    );
  },
});

export const restoreRedirects = tool({
  description: 'Restore redirects from a previous version.',
  inputSchema: jsonSchema<{ projectId: string; sources: string[]; name?: string }>({
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID.' },
      sources: {
        type: 'array',
        items: { type: 'string' },
        description: 'Redirect source patterns to restore.',
      },
      name: { type: 'string', description: 'Optional staged version name.' },
    },
    required: ['projectId', 'sources'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { projectId, sources, name } = input;
    return apiRequest<unknown>(
      'POST',
      '/v1/bulk-redirects/restore',
      { redirects: sources, name },
      { projectId }
    );
  },
});

export const getRedirectVersions = tool({
  description: 'Get redirect version history.',
  inputSchema: jsonSchema<{ projectId: string }>({
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID.' },
    },
    required: ['projectId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v1/bulk-redirects/versions', undefined, input);
  },
});

export const promoteRedirectVersion = tool({
  description: 'Promote a redirect version to production.',
  inputSchema: jsonSchema<{ projectId: string; versionId: string }>({
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID.' },
      versionId: { type: 'string', description: 'Version ID to promote.' },
    },
    required: ['projectId', 'versionId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'POST',
      '/v1/bulk-redirects/versions',
      { id: input.versionId, action: 'promote' },
      { projectId: input.projectId }
    );
  },
});

// ─── 20. Connect / Secure Compute (Networks) ────────────────────────────────

export const listNetworks = tool({
  description: 'List secure compute networks.',
  inputSchema: jsonSchema<{
    search?: string;
    includeHostedZones?: boolean;
    includePeeringConnections?: boolean;
    includeProjects?: boolean;
  }>({
    type: 'object',
    properties: {
      search: { type: 'string', description: 'Search networks by name.' },
      includeHostedZones: { type: 'boolean', description: 'Include hosted zones.' },
      includePeeringConnections: {
        type: 'boolean',
        description: 'Include peering connections.',
      },
      includeProjects: { type: 'boolean', description: 'Include connected projects.' },
    },
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v1/connect/networks', undefined, input);
  },
});

export const createNetwork = tool({
  description: 'Create a secure compute network.',
  inputSchema: jsonSchema<{
    name: string;
    cidr: string;
    region: string;
    awsAvailabilityZoneIds?: string[];
  }>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Network name.' },
      cidr: { type: 'string', description: 'Private IPv4 CIDR block.' },
      region: { type: 'string', description: 'Network region.' },
      awsAvailabilityZoneIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional AWS availability zone IDs.',
      },
    },
    required: ['name', 'cidr', 'region'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', '/v1/connect/networks', input);
  },
});

export const getNetwork = tool({
  description: 'Get network details.',
  inputSchema: jsonSchema<{ networkId: string }>({
    type: 'object',
    properties: {
      networkId: { type: 'string', description: 'Network ID.' },
    },
    required: ['networkId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v1/connect/networks/${encodeURIComponent(input.networkId)}`
    );
  },
});

export const updateNetwork = tool({
  description: 'Update a network.',
  inputSchema: jsonSchema<{ networkId: string; name: string }>({
    type: 'object',
    properties: {
      networkId: { type: 'string', description: 'Network ID.' },
      name: { type: 'string', description: 'New network name.' },
    },
    required: ['networkId', 'name'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { networkId, ...body } = input;
    return apiRequest<unknown>(
      'PATCH',
      `/v1/connect/networks/${encodeURIComponent(networkId)}`,
      body
    );
  },
});

export const deleteNetwork = tool({
  description: 'Delete a network.',
  inputSchema: jsonSchema<{ networkId: string }>({
    type: 'object',
    properties: {
      networkId: { type: 'string', description: 'Network ID.' },
    },
    required: ['networkId'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'DELETE',
      `/v1/connect/networks/${encodeURIComponent(input.networkId)}`
    );
  },
});

// ─── 21. Rolling Release ────────────────────────────────────────────────────

export const getRollingRelease = tool({
  description: 'Get current rolling release status.',
  inputSchema: jsonSchema<{ idOrName: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
    },
    required: ['idOrName'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v1/projects/${encodeURIComponent(input.idOrName)}/rolling-release`
    );
  },
});

export const getRollingReleaseConfig = tool({
  description: 'Get rolling release configuration.',
  inputSchema: jsonSchema<{ idOrName: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
    },
    required: ['idOrName'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v1/projects/${encodeURIComponent(input.idOrName)}/rolling-release/config`
    );
  },
});

export const updateRollingReleaseConfig = tool({
  description: 'Update rolling release configuration.',
  inputSchema: jsonSchema<{ idOrName: string; stages: unknown[]; enabled: boolean }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      stages: { type: 'array', description: 'Release stages configuration.' },
      enabled: { type: 'boolean', description: 'Enable rolling release.' },
    },
    required: ['idOrName', 'stages', 'enabled'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { idOrName, ...body } = input;
    return apiRequest<unknown>(
      'PATCH',
      `/v1/projects/${encodeURIComponent(idOrName)}/rolling-release/config`,
      body
    );
  },
});

export const deleteRollingReleaseConfig = tool({
  description: 'Delete rolling release configuration.',
  inputSchema: jsonSchema<{ idOrName: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
    },
    required: ['idOrName'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'DELETE',
      `/v1/projects/${encodeURIComponent(input.idOrName)}/rolling-release/config`
    );
  },
});

export const approveRollingReleaseStage = tool({
  description: 'Approve a rolling release stage.',
  inputSchema: jsonSchema<{
    idOrName: string;
    nextStageIndex: number;
    canaryDeploymentId: string;
  }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      nextStageIndex: { type: 'number', description: 'Stage index to approve.' },
      canaryDeploymentId: { type: 'string', description: 'Canary deployment ID.' },
    },
    required: ['idOrName', 'nextStageIndex', 'canaryDeploymentId'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { idOrName, ...body } = input;
    return apiRequest<unknown>(
      'POST',
      `/v1/projects/${encodeURIComponent(idOrName)}/rolling-release/approve-stage`,
      body
    );
  },
});

export const completeRollingRelease = tool({
  description: 'Complete a rolling release.',
  inputSchema: jsonSchema<{ idOrName: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
    },
    required: ['idOrName'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'POST',
      `/v1/projects/${encodeURIComponent(input.idOrName)}/rolling-release/complete`
    );
  },
});

// ─── 22. Integrations ───────────────────────────────────────────────────────

export const listIntegrationConfigs = tool({
  description: 'List integration configurations.',
  inputSchema: jsonSchema<{ view?: string }>({
    type: 'object',
    properties: {
      view: { type: 'string', description: 'View type.' },
    },
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v1/integrations/configurations', undefined, input);
  },
});

export const getIntegrationConfig = tool({
  description: 'Get integration configuration details.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Integration configuration ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'GET',
      `/v1/integrations/configuration/${encodeURIComponent(input.id)}`
    );
  },
});

export const deleteIntegrationConfig = tool({
  description: 'Delete an integration configuration.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Integration configuration ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'DELETE',
      `/v1/integrations/configuration/${encodeURIComponent(input.id)}`
    );
  },
});

export const listGitNamespaces = tool({
  description: 'List Git namespaces (orgs/users).',
  inputSchema: jsonSchema<{ provider?: string }>({
    type: 'object',
    properties: {
      provider: { type: 'string', description: 'Git provider (github, gitlab, bitbucket).' },
    },
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v1/integrations/git-namespaces', undefined, input);
  },
});

export const searchGitRepo = tool({
  description: 'Search for Git repositories.',
  inputSchema: jsonSchema<{ query?: string; provider?: string; installationId?: string }>({
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query.' },
      provider: { type: 'string', description: 'Git provider (github, gitlab, bitbucket).' },
      installationId: { type: 'string', description: 'Installation ID.' },
    },
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v1/integrations/search-repo', undefined, input);
  },
});

// ─── 23. Project Members ────────────────────────────────────────────────────

export const listProjectMembers = tool({
  description: 'List project members.',
  inputSchema: jsonSchema<{
    idOrName: string;
    limit?: number;
    since?: number;
    until?: number;
    search?: string;
  }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      limit: { type: 'number', description: 'Max results.' },
      since: { type: 'number', description: 'Timestamp filter (after).' },
      until: { type: 'number', description: 'Timestamp filter (before).' },
      search: { type: 'string', description: 'Search query.' },
    },
    required: ['idOrName'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { idOrName, ...query } = input;
    return apiRequest<unknown>(
      'GET',
      `/v1/projects/${encodeURIComponent(idOrName)}/members`,
      undefined,
      query
    );
  },
});

export const addProjectMember = tool({
  description: 'Add a member to a project.',
  inputSchema: jsonSchema<{ idOrName: string; email?: string; uid?: string; role: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      email: { type: 'string', description: 'Member email address.' },
      uid: { type: 'string', description: 'Member user ID.' },
      role: { type: 'string', description: 'Role (ADMIN, VIEWER, etc).' },
    },
    required: ['idOrName', 'role'],
    additionalProperties: false,
  }),
  async execute(input) {
    const { idOrName, ...body } = input;
    return apiRequest<unknown>(
      'POST',
      `/v1/projects/${encodeURIComponent(idOrName)}/members`,
      body
    );
  },
});

export const removeProjectMember = tool({
  description: 'Remove a member from a project.',
  inputSchema: jsonSchema<{ idOrName: string; uid: string }>({
    type: 'object',
    properties: {
      idOrName: { type: 'string', description: 'Project ID or name.' },
      uid: { type: 'string', description: 'User ID.' },
    },
    required: ['idOrName', 'uid'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'DELETE',
      `/v1/projects/${encodeURIComponent(input.idOrName)}/members/${encodeURIComponent(input.uid)}`
    );
  },
});

// ─── 24. Log Drains - Legacy ────────────────────────────────────────────────

export const listLogDrains = tool({
  description: 'List log drains (legacy API).',
  inputSchema: jsonSchema<{ projectId?: string }>({
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Filter by project ID.' },
    },
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', '/v1/log-drains', undefined, input);
  },
});

export const createLogDrain = tool({
  description: 'Create a log drain (legacy API).',
  inputSchema: jsonSchema<{
    name: string;
    type: string;
    url: string;
    projectId?: string;
    sources?: string[];
    environments?: string[];
  }>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Log drain name.' },
      type: { type: 'string', description: 'Type: json, ndjson, syslog.' },
      url: { type: 'string', description: 'Log drain URL.' },
      projectId: { type: 'string', description: 'Project ID.' },
      sources: { type: 'array', items: { type: 'string' }, description: 'Log sources.' },
      environments: { type: 'array', items: { type: 'string' }, description: 'Environments.' },
    },
    required: ['name', 'type', 'url'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', '/v1/log-drains', input);
  },
});

export const getLogDrain = tool({
  description: 'Get log drain details (legacy API).',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Log drain ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('GET', `/v1/log-drains/${encodeURIComponent(input.id)}`);
  },
});

export const deleteLogDrain = tool({
  description: 'Delete a log drain (legacy API).',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Log drain ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('DELETE', `/v1/log-drains/${encodeURIComponent(input.id)}`);
  },
});

export const createIntegrationLogDrain = tool({
  description: 'Create an integration log drain (v2 API).',
  inputSchema: jsonSchema<{
    name: string;
    type: string;
    url: string;
    sources?: string[];
    environments?: string[];
  }>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Log drain name.' },
      type: { type: 'string', description: 'Type: json, ndjson, syslog.' },
      url: { type: 'string', description: 'Log drain URL.' },
      sources: { type: 'array', items: { type: 'string' }, description: 'Log sources.' },
      environments: { type: 'array', items: { type: 'string' }, description: 'Environments.' },
    },
    required: ['name', 'type', 'url'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>('POST', '/v2/integrations/log-drains', input);
  },
});

export const listIntegrationLogDrains = tool({
  description: 'List integration log drains (v2 API).',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute() {
    return apiRequest<unknown>('GET', '/v2/integrations/log-drains');
  },
});

export const deleteIntegrationLogDrain = tool({
  description: 'Delete an integration log drain (v2 API).',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Log drain ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input) {
    return apiRequest<unknown>(
      'DELETE',
      `/v1/integrations/log-drains/${encodeURIComponent(input.id)}`
    );
  },
});

// ─── Default Export ─────────────────────────────────────────────────────────

export default {
  // Projects (21)
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  listProjectDomains,
  getProjectDomain,
  addProjectDomain,
  updateProjectDomain,
  removeProjectDomain,
  verifyProjectDomain,
  listProjectEnvVars,
  createProjectEnvVar,
  getProjectEnvVar,
  editProjectEnvVar,
  removeProjectEnvVar,
  pauseProject,
  unpauseProject,
  promoteDeployment,
  listPromoteAliases,
  updateProtectionBypass,

  // Deployments (8)
  listDeployments,
  createDeployment,
  getDeployment,
  deleteDeployment,
  cancelDeployment,
  getDeploymentEvents,
  listDeploymentFiles,
  getDeploymentFile,

  // Domains (5)
  listDomains,
  getDomain,
  addDomain,
  removeDomain,
  getDomainConfig,

  // DNS (4)
  listDnsRecords,
  createDnsRecord,
  updateDnsRecord,
  deleteDnsRecord,

  // Domain Registrar (3)
  checkDomainAvailability,
  getDomainPrice,
  buySingleDomain,

  // Teams (12)
  listTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  listTeamMembers,
  inviteTeamMembers,
  updateTeamMember,
  removeTeamMember,
  joinTeam,
  requestTeamAccess,
  getAccessRequestStatus,
  deleteTeamInvite,

  // Access Groups (11)
  listAccessGroups,
  createAccessGroup,
  getAccessGroup,
  updateAccessGroup,
  deleteAccessGroup,
  listAccessGroupMembers,
  listAccessGroupProjects,
  createAccessGroupProject,
  getAccessGroupProject,
  updateAccessGroupProject,
  deleteAccessGroupProject,

  // Edge Config (17)
  listEdgeConfigs,
  createEdgeConfig,
  getEdgeConfig,
  updateEdgeConfig,
  deleteEdgeConfig,
  getEdgeConfigItems,
  getEdgeConfigItem,
  batchUpdateEdgeConfigItems,
  getEdgeConfigSchema,
  updateEdgeConfigSchema,
  deleteEdgeConfigSchema,
  createEdgeConfigToken,
  getEdgeConfigToken,
  listEdgeConfigTokens,
  deleteEdgeConfigTokens,
  listEdgeConfigBackups,
  getEdgeConfigBackup,

  // Environment Variables (10)
  createSharedEnvVar,
  listSharedEnvVars,
  updateSharedEnvVars,
  deleteSharedEnvVars,
  getSharedEnvVar,
  createCustomEnvironment,
  listCustomEnvironments,
  getCustomEnvironment,
  updateCustomEnvironment,
  removeCustomEnvironment,

  // Security / Firewall (8)
  getAttackStatus,
  toggleAttackMode,
  getFirewallConfig,
  updateFirewallConfig,
  replaceFirewallConfig,
  listFirewallBypass,
  createFirewallBypass,
  deleteFirewallBypass,

  // Aliases (5)
  listAliases,
  getAlias,
  deleteAlias,
  listDeploymentAliases,
  assignAlias,

  // Checks (5)
  createCheck,
  listChecks,
  getCheck,
  updateCheck,
  rerequestCheck,

  // Webhooks (4)
  createWebhook,
  listWebhooks,
  getWebhook,
  deleteWebhook,

  // Log Drains (3)
  createDrain,
  listDrains,
  deleteDrain,

  // Certificates (4)
  issueCertificate,
  uploadCertificate,
  getCertificate,
  deleteCertificate,

  // Artifacts / Remote Cache (6)
  getArtifactStatus,
  uploadArtifact,
  downloadArtifact,
  checkArtifactExists,
  recordArtifactEvents,
  queryArtifacts,

  // Authentication (4)
  listAuthTokens,
  getAuthToken,
  createAuthToken,
  deleteAuthToken,

  // User (3)
  getAuthUser,
  deleteUser,
  listUserEvents,

  // Bulk Redirects (7)
  stageRedirects,
  getRedirects,
  deleteRedirects,
  editRedirect,
  restoreRedirects,
  getRedirectVersions,
  promoteRedirectVersion,

  // Networks (5)
  listNetworks,
  createNetwork,
  getNetwork,
  updateNetwork,
  deleteNetwork,

  // Rolling Release (6)
  getRollingRelease,
  getRollingReleaseConfig,
  updateRollingReleaseConfig,
  deleteRollingReleaseConfig,
  approveRollingReleaseStage,
  completeRollingRelease,

  // Integrations (5)
  listIntegrationConfigs,
  getIntegrationConfig,
  deleteIntegrationConfig,
  listGitNamespaces,
  searchGitRepo,

  // Project Members (3)
  listProjectMembers,
  addProjectMember,
  removeProjectMember,

  // Log Drains - Legacy (7)
  listLogDrains,
  createLogDrain,
  getLogDrain,
  deleteLogDrain,
  createIntegrationLogDrain,
  listIntegrationLogDrains,
  deleteIntegrationLogDrain,
};
