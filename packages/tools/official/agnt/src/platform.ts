/**
 * @tpmjs/official-agnt-platform — Agnt.gg Platform API Tools for AI Agents
 *
 * Manage agents, workflows, goals, executions, custom tools, and orchestration
 * on the agnt-gg platform via its REST API.
 *
 * @requires AGNT_API_URL environment variable (base URL of the agnt-gg platform)
 * @requires AGNT_API_KEY environment variable (API key for authentication)
 */

import { jsonSchema, tool } from 'ai';

// ─── Client Infrastructure ──────────────────────────────────────────────────

function getEnv(key: string): string | undefined {
  // Support both Deno and Node.js environments
  try {
    // @ts-expect-error Deno global
    if (typeof Deno !== 'undefined') return Deno.env.get(key);
  } catch {
    // fall through
  }
  return process.env[key];
}

function getConfig(): { apiUrl: string; apiKey: string } {
  const apiUrl = getEnv('AGNT_API_URL');
  if (!apiUrl) throw new Error('AGNT_API_URL env var is required');
  const apiKey = getEnv('AGNT_API_KEY');
  if (!apiKey) throw new Error('AGNT_API_KEY env var is required');
  return { apiUrl: apiUrl.replace(/\/$/, ''), apiKey };
}

async function agntRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { apiUrl, apiKey } = getConfig();
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Agnt API error (${response.status}): ${text || response.statusText}`);
  }
  if (response.status === 204) {
    return { success: true } as T;
  }
  const responseText = await response.text();
  if (!responseText) {
    return {} as T;
  }
  return JSON.parse(responseText) as T;
}

// ─── Output Types ────────────────────────────────────────────────────────────

export interface AgntAgent {
  id: string;
  name: string;
  description?: string;
  model?: string;
  provider?: string;
  systemPrompt?: string;
  tools?: unknown[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AgntWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes?: unknown[];
  edges?: unknown[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AgntGoal {
  id: string;
  name: string;
  description?: string;
  agentId?: string;
  steps?: unknown[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgntExecution {
  id: string;
  status?: string;
  workflowId?: string;
  agentId?: string;
  result?: unknown;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface AgntCustomTool {
  id: string;
  name: string;
  description?: string;
  schema?: unknown;
  code?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgntChatResponse {
  message?: string;
  conversationId?: string;
  response?: unknown;
}

export interface AgntWorkflowStatus {
  id: string;
  status: string;
  progress?: number;
  currentNode?: string;
  error?: string;
}

export interface AgntGoalStatus {
  id: string;
  status: string;
  progress?: number;
  currentStep?: string;
  error?: string;
}

export interface AgntGenerateResult {
  id?: string;
  name?: string;
  description?: string;
  result?: unknown;
}

export interface AgntOrchestratorResponse {
  message?: string;
  actions?: unknown[];
  response?: unknown;
}

export interface AgntDeleteResult {
  success: boolean;
}

// ─── Agents ──────────────────────────────────────────────────────────────────

// ─── listAgents ──────────────────────────────────────────────────────────────

export type ListAgentsInput = Record<string, never>;

export const listAgents = tool({
  description:
    'List all agents on the agnt-gg platform. Returns an array of agent objects with their IDs, names, and configurations.',
  inputSchema: jsonSchema<ListAgentsInput>({
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false,
  }),
  async execute(_input: ListAgentsInput): Promise<AgntAgent[]> {
    try {
      return await agntRequest<AgntAgent[]>('GET', '/agents/');
    } catch (error) {
      throw new Error(`Failed to list agents: ${(error as Error).message}`);
    }
  },
});

// ─── getAgent ────────────────────────────────────────────────────────────────

export interface GetAgentInput {
  agentId: string;
}

export const getAgent = tool({
  description:
    'Get detailed information about a specific agent by its ID, including its configuration, model, system prompt, and tools.',
  inputSchema: jsonSchema<GetAgentInput>({
    type: 'object',
    properties: {
      agentId: { type: 'string', description: 'The unique identifier of the agent.' },
    },
    required: ['agentId'],
    additionalProperties: false,
  }),
  async execute(input: GetAgentInput): Promise<AgntAgent> {
    try {
      if (!input.agentId) {
        throw new Error('agentId is required and must be non-empty');
      }
      return await agntRequest<AgntAgent>('GET', `/agents/${input.agentId}`);
    } catch (error) {
      throw new Error(`Failed to get agent: ${(error as Error).message}`);
    }
  },
});

// ─── createAgent ─────────────────────────────────────────────────────────────

export interface CreateAgentInput {
  name: string;
  description?: string;
  model?: string;
  provider?: string;
  systemPrompt?: string;
  tools?: string;
}

export const createAgent = tool({
  description:
    'Create a new agent on the agnt-gg platform with a name, optional description, model, provider, system prompt, and tools configuration.',
  inputSchema: jsonSchema<CreateAgentInput>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'The name of the agent.' },
      description: { type: 'string', description: 'A description of what the agent does.' },
      model: { type: 'string', description: 'The AI model to use (e.g., "gpt-4", "claude-3").' },
      provider: {
        type: 'string',
        description: 'The model provider (e.g., "openai", "anthropic").',
      },
      systemPrompt: {
        type: 'string',
        description: 'The system prompt that defines the agent behavior.',
      },
      tools: {
        type: 'string',
        description:
          'JSON string of an array of tool configurations for the agent (e.g., \'[{"name":"search","type":"builtin"}]\').',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input: CreateAgentInput): Promise<AgntAgent> {
    try {
      if (!input.name) {
        throw new Error('name is required and must be non-empty');
      }

      const agent: Record<string, unknown> = {
        name: input.name,
        status: 'ACTIVE',
        assignedTools: [],
      };
      if (input.description !== undefined) agent.description = input.description;
      if (input.model !== undefined) agent.model = input.model;
      if (input.provider !== undefined) agent.provider = input.provider;
      if (input.systemPrompt !== undefined) agent.systemPrompt = input.systemPrompt;
      if (input.tools !== undefined) {
        try {
          agent.assignedTools = JSON.parse(input.tools);
        } catch {
          throw new Error(
            'tools must be a valid JSON string representing an array of tool configurations'
          );
        }
      }

      return await agntRequest<AgntAgent>('POST', '/agents/save', { agent });
    } catch (error) {
      throw new Error(`Failed to create agent: ${(error as Error).message}`);
    }
  },
});

// ─── updateAgent ─────────────────────────────────────────────────────────────

export interface UpdateAgentInput {
  agentId: string;
  name?: string;
  description?: string;
  model?: string;
  provider?: string;
  systemPrompt?: string;
  tools?: string;
}

export const updateAgent = tool({
  description:
    'Update an existing agent on the agnt-gg platform. Provide the agent ID and any fields to update.',
  inputSchema: jsonSchema<UpdateAgentInput>({
    type: 'object',
    properties: {
      agentId: { type: 'string', description: 'The unique identifier of the agent to update.' },
      name: { type: 'string', description: 'The new name for the agent.' },
      description: { type: 'string', description: 'The new description for the agent.' },
      model: { type: 'string', description: 'The new AI model to use.' },
      provider: { type: 'string', description: 'The new model provider.' },
      systemPrompt: { type: 'string', description: 'The new system prompt.' },
      tools: {
        type: 'string',
        description: 'JSON string of an array of updated tool configurations.',
      },
    },
    required: ['agentId'],
    additionalProperties: false,
  }),
  async execute(input: UpdateAgentInput): Promise<AgntAgent> {
    try {
      if (!input.agentId) {
        throw new Error('agentId is required and must be non-empty');
      }

      const agent: Record<string, unknown> = {};
      if (input.name !== undefined) agent.name = input.name;
      if (input.description !== undefined) agent.description = input.description;
      if (input.model !== undefined) agent.model = input.model;
      if (input.provider !== undefined) agent.provider = input.provider;
      if (input.systemPrompt !== undefined) agent.systemPrompt = input.systemPrompt;
      if (input.tools !== undefined) {
        try {
          agent.assignedTools = JSON.parse(input.tools);
        } catch {
          throw new Error(
            'tools must be a valid JSON string representing an array of tool configurations'
          );
        }
      }

      return await agntRequest<AgntAgent>('PUT', `/agents/${input.agentId}`, { agent });
    } catch (error) {
      throw new Error(`Failed to update agent: ${(error as Error).message}`);
    }
  },
});

// ─── deleteAgent ─────────────────────────────────────────────────────────────

export interface DeleteAgentInput {
  agentId: string;
}

export const deleteAgent = tool({
  description: 'Delete an agent from the agnt-gg platform by its ID.',
  inputSchema: jsonSchema<DeleteAgentInput>({
    type: 'object',
    properties: {
      agentId: { type: 'string', description: 'The unique identifier of the agent to delete.' },
    },
    required: ['agentId'],
    additionalProperties: false,
  }),
  async execute(input: DeleteAgentInput): Promise<AgntDeleteResult> {
    try {
      if (!input.agentId) {
        throw new Error('agentId is required and must be non-empty');
      }
      return await agntRequest<AgntDeleteResult>('DELETE', `/agents/${input.agentId}`);
    } catch (error) {
      throw new Error(`Failed to delete agent: ${(error as Error).message}`);
    }
  },
});

// ─── chatWithAgent ───────────────────────────────────────────────────────────

export interface ChatWithAgentInput {
  agentId: string;
  message: string;
  conversationId?: string;
}

export const chatWithAgent = tool({
  description:
    'Send a chat message to an agent and receive a response. Optionally provide a conversation ID to continue an existing conversation.',
  inputSchema: jsonSchema<ChatWithAgentInput>({
    type: 'object',
    properties: {
      agentId: { type: 'string', description: 'The unique identifier of the agent to chat with.' },
      message: { type: 'string', description: 'The message to send to the agent.' },
      conversationId: {
        type: 'string',
        description:
          'An existing conversation ID to continue a previous conversation. Omit to start a new one.',
      },
    },
    required: ['agentId', 'message'],
    additionalProperties: false,
  }),
  async execute(input: ChatWithAgentInput): Promise<AgntChatResponse> {
    try {
      if (!input.agentId) {
        throw new Error('agentId is required and must be non-empty');
      }
      if (!input.message) {
        throw new Error('message is required and must be non-empty');
      }

      const body: Record<string, unknown> = { message: input.message };
      if (input.conversationId !== undefined) body.conversationId = input.conversationId;

      return await agntRequest<AgntChatResponse>('POST', `/agents/${input.agentId}/chat`, body);
    } catch (error) {
      throw new Error(`Failed to chat with agent: ${(error as Error).message}`);
    }
  },
});

// ─── Workflows ───────────────────────────────────────────────────────────────

// ─── listWorkflows ───────────────────────────────────────────────────────────

export type ListWorkflowsInput = Record<string, never>;

export const listWorkflows = tool({
  description:
    'List all workflows on the agnt-gg platform. Returns an array of workflow objects with their IDs, names, and configurations.',
  inputSchema: jsonSchema<ListWorkflowsInput>({
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false,
  }),
  async execute(_input: ListWorkflowsInput): Promise<AgntWorkflow[]> {
    try {
      return await agntRequest<AgntWorkflow[]>('GET', '/workflows/');
    } catch (error) {
      throw new Error(`Failed to list workflows: ${(error as Error).message}`);
    }
  },
});

// ─── getWorkflow ─────────────────────────────────────────────────────────────

export interface GetWorkflowInput {
  workflowId: string;
}

export const getWorkflow = tool({
  description:
    'Get detailed information about a specific workflow by its ID, including its nodes and edges.',
  inputSchema: jsonSchema<GetWorkflowInput>({
    type: 'object',
    properties: {
      workflowId: { type: 'string', description: 'The unique identifier of the workflow.' },
    },
    required: ['workflowId'],
    additionalProperties: false,
  }),
  async execute(input: GetWorkflowInput): Promise<AgntWorkflow> {
    try {
      if (!input.workflowId) {
        throw new Error('workflowId is required and must be non-empty');
      }
      return await agntRequest<AgntWorkflow>('GET', `/workflows/${input.workflowId}`);
    } catch (error) {
      throw new Error(`Failed to get workflow: ${(error as Error).message}`);
    }
  },
});

// ─── createWorkflow ──────────────────────────────────────────────────────────

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  nodes?: string;
  edges?: string;
}

export const createWorkflow = tool({
  description:
    'Create a new workflow on the agnt-gg platform with a name, optional description, and node/edge definitions.',
  inputSchema: jsonSchema<CreateWorkflowInput>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'The name of the workflow.' },
      description: { type: 'string', description: 'A description of what the workflow does.' },
      nodes: {
        type: 'string',
        description: 'JSON string of an array of workflow node objects defining the steps.',
      },
      edges: {
        type: 'string',
        description:
          'JSON string of an array of workflow edge objects defining connections between nodes.',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input: CreateWorkflowInput): Promise<AgntWorkflow> {
    try {
      if (!input.name) {
        throw new Error('name is required and must be non-empty');
      }

      const workflow: Record<string, unknown> = { name: input.name };
      if (input.description !== undefined) workflow.description = input.description;
      if (input.nodes !== undefined) {
        try {
          workflow.nodes = JSON.parse(input.nodes);
        } catch {
          throw new Error(
            'nodes must be a valid JSON string representing an array of node objects'
          );
        }
      }
      if (input.edges !== undefined) {
        try {
          workflow.edges = JSON.parse(input.edges);
        } catch {
          throw new Error(
            'edges must be a valid JSON string representing an array of edge objects'
          );
        }
      }

      return await agntRequest<AgntWorkflow>('POST', '/workflows/save', { workflow });
    } catch (error) {
      throw new Error(`Failed to create workflow: ${(error as Error).message}`);
    }
  },
});

// ─── deleteWorkflow ──────────────────────────────────────────────────────────

export interface DeleteWorkflowInput {
  workflowId: string;
}

export const deleteWorkflow = tool({
  description: 'Delete a workflow from the agnt-gg platform by its ID.',
  inputSchema: jsonSchema<DeleteWorkflowInput>({
    type: 'object',
    properties: {
      workflowId: {
        type: 'string',
        description: 'The unique identifier of the workflow to delete.',
      },
    },
    required: ['workflowId'],
    additionalProperties: false,
  }),
  async execute(input: DeleteWorkflowInput): Promise<AgntDeleteResult> {
    try {
      if (!input.workflowId) {
        throw new Error('workflowId is required and must be non-empty');
      }
      return await agntRequest<AgntDeleteResult>('DELETE', `/workflows/${input.workflowId}`);
    } catch (error) {
      throw new Error(`Failed to delete workflow: ${(error as Error).message}`);
    }
  },
});

// ─── startWorkflow ───────────────────────────────────────────────────────────

export interface StartWorkflowInput {
  workflowId: string;
  inputData?: string;
}

export const startWorkflow = tool({
  description:
    'Start executing a workflow by its ID. Optionally provide input data as a JSON string.',
  inputSchema: jsonSchema<StartWorkflowInput>({
    type: 'object',
    properties: {
      workflowId: {
        type: 'string',
        description: 'The unique identifier of the workflow to start.',
      },
      inputData: {
        type: 'string',
        description: 'JSON string of input data to pass to the workflow at startup.',
      },
    },
    required: ['workflowId'],
    additionalProperties: false,
  }),
  async execute(input: StartWorkflowInput): Promise<AgntExecution> {
    try {
      if (!input.workflowId) {
        throw new Error('workflowId is required and must be non-empty');
      }

      const body: Record<string, unknown> = {};
      if (input.inputData !== undefined) {
        try {
          body.inputData = JSON.parse(input.inputData);
        } catch {
          throw new Error('inputData must be a valid JSON string');
        }
      }

      return await agntRequest<AgntExecution>('POST', `/workflows/${input.workflowId}/start`, body);
    } catch (error) {
      throw new Error(`Failed to start workflow: ${(error as Error).message}`);
    }
  },
});

// ─── stopWorkflow ────────────────────────────────────────────────────────────

export interface StopWorkflowInput {
  workflowId: string;
}

export const stopWorkflow = tool({
  description: 'Stop an actively running workflow by its ID.',
  inputSchema: jsonSchema<StopWorkflowInput>({
    type: 'object',
    properties: {
      workflowId: {
        type: 'string',
        description: 'The unique identifier of the workflow to stop.',
      },
    },
    required: ['workflowId'],
    additionalProperties: false,
  }),
  async execute(input: StopWorkflowInput): Promise<AgntWorkflowStatus> {
    try {
      if (!input.workflowId) {
        throw new Error('workflowId is required and must be non-empty');
      }
      return await agntRequest<AgntWorkflowStatus>('POST', `/workflows/${input.workflowId}/stop`);
    } catch (error) {
      throw new Error(`Failed to stop workflow: ${(error as Error).message}`);
    }
  },
});

// ─── getWorkflowStatus ───────────────────────────────────────────────────────

export interface GetWorkflowStatusInput {
  workflowId: string;
}

export const getWorkflowStatus = tool({
  description:
    'Get the current execution status of a workflow, including progress and current node.',
  inputSchema: jsonSchema<GetWorkflowStatusInput>({
    type: 'object',
    properties: {
      workflowId: {
        type: 'string',
        description: 'The unique identifier of the workflow to check status for.',
      },
    },
    required: ['workflowId'],
    additionalProperties: false,
  }),
  async execute(input: GetWorkflowStatusInput): Promise<AgntWorkflowStatus> {
    try {
      if (!input.workflowId) {
        throw new Error('workflowId is required and must be non-empty');
      }
      return await agntRequest<AgntWorkflowStatus>('GET', `/workflows/${input.workflowId}/status`);
    } catch (error) {
      throw new Error(`Failed to get workflow status: ${(error as Error).message}`);
    }
  },
});

// ─── Generate ────────────────────────────────────────────────────────────────

// ─── generateWorkflow ────────────────────────────────────────────────────────

export interface GenerateWorkflowInput {
  description: string;
  provider?: string;
  model?: string;
}

export const generateWorkflow = tool({
  description:
    'Generate a workflow definition from a natural language description using AI. Optionally specify the provider and model.',
  inputSchema: jsonSchema<GenerateWorkflowInput>({
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'A natural language description of the desired workflow.',
      },
      provider: {
        type: 'string',
        description: 'The AI provider to use for generation (e.g., "openai", "anthropic").',
      },
      model: {
        type: 'string',
        description: 'The AI model to use for generation.',
      },
    },
    required: ['description'],
    additionalProperties: false,
  }),
  async execute(input: GenerateWorkflowInput): Promise<AgntGenerateResult> {
    try {
      if (!input.description) {
        throw new Error('description is required and must be non-empty');
      }

      const body: Record<string, unknown> = { description: input.description };
      if (input.provider !== undefined) body.provider = input.provider;
      if (input.model !== undefined) body.model = input.model;

      return await agntRequest<AgntGenerateResult>('POST', '/streams/generate-workflow', body);
    } catch (error) {
      throw new Error(`Failed to generate workflow: ${(error as Error).message}`);
    }
  },
});

// ─── generateAgent ───────────────────────────────────────────────────────────

export interface GenerateAgentInput {
  description: string;
  provider?: string;
  model?: string;
}

export const generateAgent = tool({
  description:
    'Generate an agent configuration from a natural language description using AI. Optionally specify the provider and model.',
  inputSchema: jsonSchema<GenerateAgentInput>({
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'A natural language description of the desired agent.',
      },
      provider: {
        type: 'string',
        description: 'The AI provider to use for generation (e.g., "openai", "anthropic").',
      },
      model: {
        type: 'string',
        description: 'The AI model to use for generation.',
      },
    },
    required: ['description'],
    additionalProperties: false,
  }),
  async execute(input: GenerateAgentInput): Promise<AgntGenerateResult> {
    try {
      if (!input.description) {
        throw new Error('description is required and must be non-empty');
      }

      const body: Record<string, unknown> = { description: input.description };
      if (input.provider !== undefined) body.provider = input.provider;
      if (input.model !== undefined) body.model = input.model;

      return await agntRequest<AgntGenerateResult>('POST', '/streams/generate-agent', body);
    } catch (error) {
      throw new Error(`Failed to generate agent: ${(error as Error).message}`);
    }
  },
});

// ─── Goals ───────────────────────────────────────────────────────────────────

// ─── listGoals ───────────────────────────────────────────────────────────────

export type ListGoalsInput = Record<string, never>;

export const listGoals = tool({
  description:
    'List all goals on the agnt-gg platform. Returns an array of goal objects with their IDs, names, and statuses.',
  inputSchema: jsonSchema<ListGoalsInput>({
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false,
  }),
  async execute(_input: ListGoalsInput): Promise<AgntGoal[]> {
    try {
      return await agntRequest<AgntGoal[]>('GET', '/goals/');
    } catch (error) {
      throw new Error(`Failed to list goals: ${(error as Error).message}`);
    }
  },
});

// ─── createGoal ──────────────────────────────────────────────────────────────

export interface CreateGoalInput {
  name: string;
  description: string;
  agentId?: string;
  steps?: string;
}

export const createGoal = tool({
  description:
    'Create a new goal on the agnt-gg platform with a name, description, optional agent assignment, and step definitions.',
  inputSchema: jsonSchema<CreateGoalInput>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'The name of the goal.' },
      description: { type: 'string', description: 'A detailed description of the goal.' },
      agentId: {
        type: 'string',
        description: 'The ID of the agent to assign to this goal.',
      },
      steps: {
        type: 'string',
        description: 'JSON string of an array of step objects defining how to achieve the goal.',
      },
    },
    required: ['name', 'description'],
    additionalProperties: false,
  }),
  async execute(input: CreateGoalInput): Promise<AgntGoal> {
    try {
      if (!input.name) {
        throw new Error('name is required and must be non-empty');
      }
      if (!input.description) {
        throw new Error('description is required and must be non-empty');
      }

      const body: Record<string, unknown> = {
        name: input.name,
        description: input.description,
      };
      if (input.agentId !== undefined) body.agentId = input.agentId;
      if (input.steps !== undefined) {
        try {
          body.steps = JSON.parse(input.steps);
        } catch {
          throw new Error(
            'steps must be a valid JSON string representing an array of step objects'
          );
        }
      }

      return await agntRequest<AgntGoal>('POST', '/goals/create', body);
    } catch (error) {
      throw new Error(`Failed to create goal: ${(error as Error).message}`);
    }
  },
});

// ─── executeGoal ─────────────────────────────────────────────────────────────

export interface ExecuteGoalInput {
  goalId: string;
}

export const executeGoal = tool({
  description:
    'Start executing a goal by its ID. The assigned agent will begin working on the goal steps.',
  inputSchema: jsonSchema<ExecuteGoalInput>({
    type: 'object',
    properties: {
      goalId: {
        type: 'string',
        description: 'The unique identifier of the goal to execute.',
      },
    },
    required: ['goalId'],
    additionalProperties: false,
  }),
  async execute(input: ExecuteGoalInput): Promise<AgntExecution> {
    try {
      if (!input.goalId) {
        throw new Error('goalId is required and must be non-empty');
      }
      return await agntRequest<AgntExecution>('POST', `/goals/${input.goalId}/execute`);
    } catch (error) {
      throw new Error(`Failed to execute goal: ${(error as Error).message}`);
    }
  },
});

// ─── getGoalStatus ───────────────────────────────────────────────────────────

export interface GetGoalStatusInput {
  goalId: string;
}

export const getGoalStatus = tool({
  description: 'Get the current execution status of a goal, including progress and current step.',
  inputSchema: jsonSchema<GetGoalStatusInput>({
    type: 'object',
    properties: {
      goalId: {
        type: 'string',
        description: 'The unique identifier of the goal to check status for.',
      },
    },
    required: ['goalId'],
    additionalProperties: false,
  }),
  async execute(input: GetGoalStatusInput): Promise<AgntGoalStatus> {
    try {
      if (!input.goalId) {
        throw new Error('goalId is required and must be non-empty');
      }
      return await agntRequest<AgntGoalStatus>('GET', `/goals/${input.goalId}/status`);
    } catch (error) {
      throw new Error(`Failed to get goal status: ${(error as Error).message}`);
    }
  },
});

// ─── deleteGoal ──────────────────────────────────────────────────────────────

export interface DeleteGoalInput {
  goalId: string;
}

export const deleteGoal = tool({
  description: 'Delete a goal from the agnt-gg platform by its ID.',
  inputSchema: jsonSchema<DeleteGoalInput>({
    type: 'object',
    properties: {
      goalId: {
        type: 'string',
        description: 'The unique identifier of the goal to delete.',
      },
    },
    required: ['goalId'],
    additionalProperties: false,
  }),
  async execute(input: DeleteGoalInput): Promise<AgntDeleteResult> {
    try {
      if (!input.goalId) {
        throw new Error('goalId is required and must be non-empty');
      }
      return await agntRequest<AgntDeleteResult>('DELETE', `/goals/${input.goalId}`);
    } catch (error) {
      throw new Error(`Failed to delete goal: ${(error as Error).message}`);
    }
  },
});

// ─── Orchestrator ────────────────────────────────────────────────────────────

// ─── orchestratorChat ────────────────────────────────────────────────────────

export interface OrchestratorChatInput {
  message: string;
  context?: string;
}

export const orchestratorChat = tool({
  description:
    'Send a message to the agnt-gg orchestrator, which can coordinate across agents and workflows. Optionally provide context as a JSON string.',
  inputSchema: jsonSchema<OrchestratorChatInput>({
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The message to send to the orchestrator.',
      },
      context: {
        type: 'string',
        description: 'JSON string of additional context to provide to the orchestrator.',
      },
    },
    required: ['message'],
    additionalProperties: false,
  }),
  async execute(input: OrchestratorChatInput): Promise<AgntOrchestratorResponse> {
    try {
      if (!input.message) {
        throw new Error('message is required and must be non-empty');
      }

      const body: Record<string, unknown> = { message: input.message };
      if (input.context !== undefined) {
        try {
          body.context = JSON.parse(input.context);
        } catch {
          throw new Error('context must be a valid JSON string');
        }
      }

      return await agntRequest<AgntOrchestratorResponse>('POST', '/orchestrator/chat', body);
    } catch (error) {
      throw new Error(`Failed to chat with orchestrator: ${(error as Error).message}`);
    }
  },
});

// ─── Executions ──────────────────────────────────────────────────────────────

// ─── listExecutions ──────────────────────────────────────────────────────────

export type ListExecutionsInput = Record<string, never>;

export const listExecutions = tool({
  description:
    'List all executions on the agnt-gg platform. Returns an array of execution objects with their statuses and results.',
  inputSchema: jsonSchema<ListExecutionsInput>({
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false,
  }),
  async execute(_input: ListExecutionsInput): Promise<AgntExecution[]> {
    try {
      return await agntRequest<AgntExecution[]>('GET', '/executions/');
    } catch (error) {
      throw new Error(`Failed to list executions: ${(error as Error).message}`);
    }
  },
});

// ─── getExecution ────────────────────────────────────────────────────────────

export interface GetExecutionInput {
  executionId: string;
}

export const getExecution = tool({
  description:
    'Get detailed information about a specific execution by its ID, including status, result, and timing.',
  inputSchema: jsonSchema<GetExecutionInput>({
    type: 'object',
    properties: {
      executionId: {
        type: 'string',
        description: 'The unique identifier of the execution.',
      },
    },
    required: ['executionId'],
    additionalProperties: false,
  }),
  async execute(input: GetExecutionInput): Promise<AgntExecution> {
    try {
      if (!input.executionId) {
        throw new Error('executionId is required and must be non-empty');
      }
      return await agntRequest<AgntExecution>('GET', `/executions/${input.executionId}`);
    } catch (error) {
      throw new Error(`Failed to get execution: ${(error as Error).message}`);
    }
  },
});

// ─── Custom Tools ────────────────────────────────────────────────────────────

// ─── listCustomTools ─────────────────────────────────────────────────────────

export type ListCustomToolsInput = Record<string, never>;

export const listCustomTools = tool({
  description:
    'List all custom tools registered on the agnt-gg platform. Returns an array of tool objects with their names and schemas.',
  inputSchema: jsonSchema<ListCustomToolsInput>({
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false,
  }),
  async execute(_input: ListCustomToolsInput): Promise<AgntCustomTool[]> {
    try {
      return await agntRequest<AgntCustomTool[]>('GET', '/custom-tools/');
    } catch (error) {
      throw new Error(`Failed to list custom tools: ${(error as Error).message}`);
    }
  },
});

// ─── createCustomTool ────────────────────────────────────────────────────────

export interface CreateCustomToolInput {
  name: string;
  description: string;
  schema?: string;
  code?: string;
}

export const createCustomTool = tool({
  description:
    'Create a new custom tool on the agnt-gg platform with a name, description, optional JSON schema, and implementation code.',
  inputSchema: jsonSchema<CreateCustomToolInput>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'The name of the custom tool.' },
      description: { type: 'string', description: 'A description of what the custom tool does.' },
      schema: {
        type: 'string',
        description: 'JSON string of the JSON Schema defining the tool input parameters.',
      },
      code: {
        type: 'string',
        description: 'JSON string of the tool implementation code or configuration.',
      },
    },
    required: ['name', 'description'],
    additionalProperties: false,
  }),
  async execute(input: CreateCustomToolInput): Promise<AgntCustomTool> {
    try {
      if (!input.name) {
        throw new Error('name is required and must be non-empty');
      }
      if (!input.description) {
        throw new Error('description is required and must be non-empty');
      }

      const customTool: Record<string, unknown> = {
        name: input.name,
        description: input.description,
      };
      if (input.schema !== undefined) {
        try {
          customTool.schema = JSON.parse(input.schema);
        } catch {
          throw new Error('schema must be a valid JSON string');
        }
      }
      if (input.code !== undefined) {
        try {
          customTool.code = JSON.parse(input.code);
        } catch {
          customTool.code = input.code;
        }
      }

      return await agntRequest<AgntCustomTool>('POST', '/custom-tools/save', { tool: customTool });
    } catch (error) {
      throw new Error(`Failed to create custom tool: ${(error as Error).message}`);
    }
  },
});

// ─── deleteCustomTool ────────────────────────────────────────────────────────

export interface DeleteCustomToolInput {
  toolId: string;
}

export const deleteCustomTool = tool({
  description: 'Delete a custom tool from the agnt-gg platform by its ID.',
  inputSchema: jsonSchema<DeleteCustomToolInput>({
    type: 'object',
    properties: {
      toolId: {
        type: 'string',
        description: 'The unique identifier of the custom tool to delete.',
      },
    },
    required: ['toolId'],
    additionalProperties: false,
  }),
  async execute(input: DeleteCustomToolInput): Promise<AgntDeleteResult> {
    try {
      if (!input.toolId) {
        throw new Error('toolId is required and must be non-empty');
      }
      return await agntRequest<AgntDeleteResult>('DELETE', `/custom-tools/${input.toolId}`);
    } catch (error) {
      throw new Error(`Failed to delete custom tool: ${(error as Error).message}`);
    }
  },
});

export default {
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  chatWithAgent,
  listWorkflows,
  getWorkflow,
  createWorkflow,
  deleteWorkflow,
  startWorkflow,
  stopWorkflow,
  getWorkflowStatus,
  generateWorkflow,
  generateAgent,
  listGoals,
  createGoal,
  executeGoal,
  getGoalStatus,
  deleteGoal,
  orchestratorChat,
  listExecutions,
  getExecution,
  listCustomTools,
  createCustomTool,
  deleteCustomTool,
};
