/**
 * @tpmjs/tools-railway — Railway API Tools for AI Agents
 *
 * Manage projects, services, deployments, variables, and logs
 * via Railway's GraphQL API.
 *
 * @requires RAILWAY_TOKEN environment variable
 */

import { jsonSchema, tool } from 'ai';

const GRAPHQL_ENDPOINT = 'https://backboard.railway.com/graphql/v2';

// ─── Client Infrastructure ──────────────────────────────────────────────────

function getApiToken(): string {
  const token = process.env.RAILWAY_TOKEN;
  if (!token) {
    throw new Error(
      'RAILWAY_TOKEN environment variable is required. Get your token from https://railway.com/account/tokens'
    );
  }
  return token;
}

async function graphqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = getApiToken();

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    switch (response.status) {
      case 401:
        throw new Error('Authentication failed: Invalid Railway token. Check RAILWAY_TOKEN.');
      case 403:
        throw new Error(`Access forbidden: ${text}`);
      case 429:
        throw new Error(`Rate limit exceeded: ${text}`);
      default:
        throw new Error(`Railway API error (${response.status}): ${text}`);
    }
  }

  const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };

  if (json.errors && json.errors.length > 0) {
    const messages = json.errors.map((e) => e.message).join('; ');
    throw new Error(`Railway GraphQL error: ${messages}`);
  }

  if (!json.data) {
    throw new Error('Railway API returned empty data');
  }

  return json.data;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export interface ListProjectsInput {
  workspaceId?: string;
}

export const listProjects = tool({
  description:
    'List all projects in your Railway account or a specific workspace. Returns project IDs, names, and timestamps.',
  inputSchema: jsonSchema<ListProjectsInput>({
    type: 'object',
    properties: {
      workspaceId: {
        type: 'string',
        description: 'Filter projects by workspace ID. Omit to list personal projects.',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: ListProjectsInput) {
    try {
      const query = input.workspaceId
        ? `query($workspaceId: String!) {
            workspace(id: $workspaceId) {
              projects {
                edges {
                  node {
                    id
                    name
                    description
                    createdAt
                    updatedAt
                  }
                }
              }
            }
          }`
        : `query {
            me {
              projects {
                edges {
                  node {
                    id
                    name
                    description
                    createdAt
                    updatedAt
                  }
                }
              }
            }
          }`;

      return await graphqlRequest<Record<string, unknown>>(
        query,
        input.workspaceId ? { workspaceId: input.workspaceId } : undefined
      );
    } catch (error) {
      throw new Error(`Failed to list projects: ${(error as Error).message}`);
    }
  },
});

export interface GetProjectInput {
  id: string;
}

export const getProject = tool({
  description:
    'Get detailed information about a specific Railway project including its services, environments, and configuration.',
  inputSchema: jsonSchema<GetProjectInput>({
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The Railway project ID.',
      },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: GetProjectInput) {
    try {
      if (!input.id) {
        throw new Error('Project ID is required');
      }
      const query = `query($id: String!) {
        project(id: $id) {
          id
          name
          description
          createdAt
          updatedAt
          services {
            edges {
              node {
                id
                name
                icon
                createdAt
              }
            }
          }
          environments {
            edges {
              node {
                id
                name
                createdAt
              }
            }
          }
        }
      }`;

      return await graphqlRequest<Record<string, unknown>>(query, { id: input.id });
    } catch (error) {
      throw new Error(`Failed to get project: ${(error as Error).message}`);
    }
  },
});

// ─── Services ────────────────────────────────────────────────────────────────

export interface GetServiceInput {
  id: string;
}

export const getService = tool({
  description: 'Get details of a specific Railway service including name, icon, and project ID.',
  inputSchema: jsonSchema<GetServiceInput>({
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The Railway service ID.',
      },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: GetServiceInput) {
    try {
      if (!input.id) {
        throw new Error('Service ID is required');
      }
      const query = `query($id: String!) {
        service(id: $id) {
          id
          name
          icon
          createdAt
          projectId
        }
      }`;

      return await graphqlRequest<Record<string, unknown>>(query, { id: input.id });
    } catch (error) {
      throw new Error(`Failed to get service: ${(error as Error).message}`);
    }
  },
});

export interface GetServiceInstanceInput {
  serviceId: string;
  environmentId: string;
}

export const getServiceInstance = tool({
  description:
    'Get configuration and latest deployment info for a Railway service in a specific environment. Returns build/start commands, health check path, region, replicas, and more.',
  inputSchema: jsonSchema<GetServiceInstanceInput>({
    type: 'object',
    properties: {
      serviceId: {
        type: 'string',
        description: 'The Railway service ID.',
      },
      environmentId: {
        type: 'string',
        description: 'The Railway environment ID.',
      },
    },
    required: ['serviceId', 'environmentId'],
    additionalProperties: false,
  }),
  async execute(input: GetServiceInstanceInput) {
    try {
      if (!input.serviceId || !input.environmentId) {
        throw new Error('serviceId and environmentId are required');
      }
      const query = `query($serviceId: String!, $environmentId: String!) {
        serviceInstance(serviceId: $serviceId, environmentId: $environmentId) {
          startCommand
          buildCommand
          rootDirectory
          healthcheckPath
          region
          numReplicas
          restartPolicyType
          restartPolicyMaxRetries
          cronSchedule
          latestDeployment {
            id
            status
            createdAt
            url
            staticUrl
          }
        }
      }`;

      return await graphqlRequest<Record<string, unknown>>(query, {
        serviceId: input.serviceId,
        environmentId: input.environmentId,
      });
    } catch (error) {
      throw new Error(`Failed to get service instance: ${(error as Error).message}`);
    }
  },
});

// ─── Deployments ─────────────────────────────────────────────────────────────

export interface ListDeploymentsInput {
  projectId: string;
  serviceId: string;
  environmentId: string;
  first?: number;
}

export const listDeployments = tool({
  description:
    'List deployments for a Railway service in a specific environment. Returns deployment IDs, status, URLs, and timestamps.',
  inputSchema: jsonSchema<ListDeploymentsInput>({
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'The Railway project ID.',
      },
      serviceId: {
        type: 'string',
        description: 'The Railway service ID.',
      },
      environmentId: {
        type: 'string',
        description: 'The Railway environment ID.',
      },
      first: {
        type: 'number',
        description: 'Number of deployments to return (default: 10).',
      },
    },
    required: ['projectId', 'serviceId', 'environmentId'],
    additionalProperties: false,
  }),
  async execute(input: ListDeploymentsInput) {
    try {
      if (!input.projectId || !input.serviceId || !input.environmentId) {
        throw new Error('projectId, serviceId, and environmentId are required');
      }
      const query = `query($input: DeploymentListInput!, $first: Int) {
        deployments(input: $input, first: $first) {
          edges {
            node {
              id
              status
              createdAt
              url
              staticUrl
              canRedeploy
              canRollback
            }
          }
        }
      }`;

      return await graphqlRequest<Record<string, unknown>>(query, {
        input: {
          projectId: input.projectId,
          serviceId: input.serviceId,
          environmentId: input.environmentId,
        },
        first: input.first ?? 10,
      });
    } catch (error) {
      throw new Error(`Failed to list deployments: ${(error as Error).message}`);
    }
  },
});

export interface GetDeploymentInput {
  id: string;
}

export const getDeployment = tool({
  description:
    'Get detailed information about a specific Railway deployment including status, URLs, and metadata.',
  inputSchema: jsonSchema<GetDeploymentInput>({
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The Railway deployment ID.',
      },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: GetDeploymentInput) {
    try {
      if (!input.id) {
        throw new Error('Deployment ID is required');
      }
      const query = `query($id: String!) {
        deployment(id: $id) {
          id
          status
          createdAt
          url
          staticUrl
          meta
          canRedeploy
          canRollback
        }
      }`;

      return await graphqlRequest<Record<string, unknown>>(query, { id: input.id });
    } catch (error) {
      throw new Error(`Failed to get deployment: ${(error as Error).message}`);
    }
  },
});

// ─── Logs ────────────────────────────────────────────────────────────────────

export interface GetBuildLogsInput {
  deploymentId: string;
  limit?: number;
}

export const getBuildLogs = tool({
  description:
    'Get build logs for a Railway deployment. Returns timestamped log entries with severity levels.',
  inputSchema: jsonSchema<GetBuildLogsInput>({
    type: 'object',
    properties: {
      deploymentId: {
        type: 'string',
        description: 'The Railway deployment ID.',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of log lines to return (default: 100).',
      },
    },
    required: ['deploymentId'],
    additionalProperties: false,
  }),
  async execute(input: GetBuildLogsInput) {
    try {
      if (!input.deploymentId) {
        throw new Error('Deployment ID is required');
      }
      const query = `query($deploymentId: String!, $limit: Int) {
        buildLogs(deploymentId: $deploymentId, limit: $limit) {
          timestamp
          message
          severity
        }
      }`;

      return await graphqlRequest<Record<string, unknown>>(query, {
        deploymentId: input.deploymentId,
        limit: input.limit ?? 100,
      });
    } catch (error) {
      throw new Error(`Failed to get build logs: ${(error as Error).message}`);
    }
  },
});

export interface GetDeploymentLogsInput {
  deploymentId: string;
  limit?: number;
  filter?: string;
}

export const getDeploymentLogs = tool({
  description:
    'Get runtime logs for a Railway deployment. Returns timestamped log entries. Supports optional text filtering.',
  inputSchema: jsonSchema<GetDeploymentLogsInput>({
    type: 'object',
    properties: {
      deploymentId: {
        type: 'string',
        description: 'The Railway deployment ID.',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of log lines to return (default: 100).',
      },
      filter: {
        type: 'string',
        description: 'Filter logs by text content.',
      },
    },
    required: ['deploymentId'],
    additionalProperties: false,
  }),
  async execute(input: GetDeploymentLogsInput) {
    try {
      if (!input.deploymentId) {
        throw new Error('Deployment ID is required');
      }
      const variables: Record<string, unknown> = {
        deploymentId: input.deploymentId,
        limit: input.limit ?? 100,
      };

      let filterArg = '';
      if (input.filter) {
        filterArg = ', $filter: String';
        variables.filter = input.filter;
      }

      const query = `query($deploymentId: String!, $limit: Int${filterArg}) {
        deploymentLogs(deploymentId: $deploymentId, limit: $limit${input.filter ? ', filter: $filter' : ''}) {
          timestamp
          message
          severity
        }
      }`;

      return await graphqlRequest<Record<string, unknown>>(query, variables);
    } catch (error) {
      throw new Error(`Failed to get deployment logs: ${(error as Error).message}`);
    }
  },
});

// ─── Deployment Actions ──────────────────────────────────────────────────────

export interface RedeployServiceInput {
  serviceId: string;
  environmentId: string;
}

export const redeployService = tool({
  description:
    'Trigger a redeploy of a Railway service in a specific environment. Creates a new deployment from the latest source.',
  inputSchema: jsonSchema<RedeployServiceInput>({
    type: 'object',
    properties: {
      serviceId: {
        type: 'string',
        description: 'The Railway service ID to redeploy.',
      },
      environmentId: {
        type: 'string',
        description: 'The Railway environment ID to redeploy in.',
      },
    },
    required: ['serviceId', 'environmentId'],
    additionalProperties: false,
  }),
  async execute(input: RedeployServiceInput) {
    try {
      if (!input.serviceId || !input.environmentId) {
        throw new Error('serviceId and environmentId are required');
      }
      const query = `mutation($serviceId: String!, $environmentId: String!) {
        serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
      }`;

      return await graphqlRequest<Record<string, unknown>>(query, {
        serviceId: input.serviceId,
        environmentId: input.environmentId,
      });
    } catch (error) {
      throw new Error(`Failed to redeploy service: ${(error as Error).message}`);
    }
  },
});

export interface RestartDeploymentInput {
  id: string;
}

export const restartDeployment = tool({
  description: 'Restart a running Railway deployment by its ID.',
  inputSchema: jsonSchema<RestartDeploymentInput>({
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The Railway deployment ID to restart.',
      },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: RestartDeploymentInput) {
    try {
      if (!input.id) {
        throw new Error('Deployment ID is required');
      }
      const query = `mutation($id: String!) {
        deploymentRestart(id: $id)
      }`;

      return await graphqlRequest<Record<string, unknown>>(query, { id: input.id });
    } catch (error) {
      throw new Error(`Failed to restart deployment: ${(error as Error).message}`);
    }
  },
});

// ─── Variables ───────────────────────────────────────────────────────────────

export interface GetVariablesInput {
  projectId: string;
  serviceId: string;
  environmentId: string;
}

export const getVariables = tool({
  description:
    'Get all environment variables for a Railway service in a specific environment. Returns key-value pairs.',
  inputSchema: jsonSchema<GetVariablesInput>({
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'The Railway project ID.',
      },
      serviceId: {
        type: 'string',
        description: 'The Railway service ID.',
      },
      environmentId: {
        type: 'string',
        description: 'The Railway environment ID.',
      },
    },
    required: ['projectId', 'serviceId', 'environmentId'],
    additionalProperties: false,
  }),
  async execute(input: GetVariablesInput) {
    try {
      if (!input.projectId || !input.serviceId || !input.environmentId) {
        throw new Error('projectId, serviceId, and environmentId are required');
      }
      const query = `query($projectId: String!, $serviceId: String!, $environmentId: String!) {
        variables(projectId: $projectId, serviceId: $serviceId, environmentId: $environmentId)
      }`;

      return await graphqlRequest<Record<string, unknown>>(query, {
        projectId: input.projectId,
        serviceId: input.serviceId,
        environmentId: input.environmentId,
      });
    } catch (error) {
      throw new Error(`Failed to get variables: ${(error as Error).message}`);
    }
  },
});

export interface UpsertVariableInput {
  projectId: string;
  serviceId: string;
  environmentId: string;
  name: string;
  value: string;
}

export const upsertVariable = tool({
  description:
    'Create or update an environment variable on a Railway service. If the variable exists, its value is updated.',
  inputSchema: jsonSchema<UpsertVariableInput>({
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'The Railway project ID.',
      },
      serviceId: {
        type: 'string',
        description: 'The Railway service ID.',
      },
      environmentId: {
        type: 'string',
        description: 'The Railway environment ID.',
      },
      name: {
        type: 'string',
        description: 'Environment variable name (e.g., "DATABASE_URL").',
      },
      value: {
        type: 'string',
        description: 'Environment variable value.',
      },
    },
    required: ['projectId', 'serviceId', 'environmentId', 'name', 'value'],
    additionalProperties: false,
  }),
  async execute(input: UpsertVariableInput) {
    try {
      if (!input.projectId || !input.serviceId || !input.environmentId || !input.name) {
        throw new Error('projectId, serviceId, environmentId, and name are required');
      }
      const query = `mutation($input: VariableUpsertInput!) {
        variableUpsert(input: $input)
      }`;

      return await graphqlRequest<Record<string, unknown>>(query, {
        input: {
          projectId: input.projectId,
          serviceId: input.serviceId,
          environmentId: input.environmentId,
          name: input.name,
          value: input.value,
        },
      });
    } catch (error) {
      throw new Error(`Failed to upsert variable: ${(error as Error).message}`);
    }
  },
});

export interface DeleteVariableInput {
  projectId: string;
  serviceId: string;
  environmentId: string;
  name: string;
}

export const deleteVariable = tool({
  description: 'Delete an environment variable from a Railway service in a specific environment.',
  inputSchema: jsonSchema<DeleteVariableInput>({
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'The Railway project ID.',
      },
      serviceId: {
        type: 'string',
        description: 'The Railway service ID.',
      },
      environmentId: {
        type: 'string',
        description: 'The Railway environment ID.',
      },
      name: {
        type: 'string',
        description: 'Environment variable name to delete.',
      },
    },
    required: ['projectId', 'serviceId', 'environmentId', 'name'],
    additionalProperties: false,
  }),
  async execute(input: DeleteVariableInput) {
    try {
      if (!input.projectId || !input.serviceId || !input.environmentId || !input.name) {
        throw new Error('projectId, serviceId, environmentId, and name are required');
      }
      const query = `mutation($input: VariableDeleteInput!) {
        variableDelete(input: $input)
      }`;

      return await graphqlRequest<Record<string, unknown>>(query, {
        input: {
          projectId: input.projectId,
          serviceId: input.serviceId,
          environmentId: input.environmentId,
          name: input.name,
        },
      });
    } catch (error) {
      throw new Error(`Failed to delete variable: ${(error as Error).message}`);
    }
  },
});

// ─── Default Export ──────────────────────────────────────────────────────────

export default {
  // Projects
  listProjects,
  getProject,
  // Services
  getService,
  getServiceInstance,
  // Deployments
  listDeployments,
  getDeployment,
  // Logs
  getBuildLogs,
  getDeploymentLogs,
  // Deployment Actions
  redeployService,
  restartDeployment,
  // Variables
  getVariables,
  upsertVariable,
  deleteVariable,
};
