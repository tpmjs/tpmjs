import { jsonSchema, tool } from 'ai';

// =============================================================================
// Config & Helpers
// =============================================================================

const BASE_URL = 'https://evals.blah.dev/api/v1';

function getApiKey(): string {
  const key = process.env.EVALS_BLAH_API_KEY;
  if (!key) {
    throw new Error(
      'EVALS_BLAH_API_KEY environment variable is required for write operations. Get one at https://evals.blah.dev/settings/api-keys'
    );
  }
  return key;
}

async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, auth = false } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    headers['Authorization'] = `Bearer ${getApiKey()}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage: string;
    try {
      const parsed = JSON.parse(errorBody);
      errorMessage = parsed.error || errorBody;
    } catch {
      errorMessage = errorBody;
    }
    throw new Error(`evals.blah.dev API error (${response.status}): ${errorMessage}`);
  }

  return response.json() as Promise<T>;
}

// =============================================================================
// Types
// =============================================================================

export interface Model {
  id: string;
  name: string;
  description: string;
  inference_uri: string;
  is_official: boolean;
  submitted_by: string;
  created_at: number;
  updated_at: number;
}

export interface Eval {
  id: string;
  name: string;
  description: string;
  prompt: string;
  expected_behavior: string;
  eval_type: 'semantic' | 'rubric';
  eval_criteria: string;
  submitted_by: string;
  created_at: number;
  updated_at: number;
}

export interface EvalRun {
  id: string;
  started_at: number;
  completed_at: number | null;
  status: 'running' | 'completed' | 'failed';
  total_evals: number;
  total_models: number;
  completed_count: number;
  error: string | null;
}

export interface EvalResult {
  id: string;
  eval_run_id: string;
  eval_id: string;
  model_id: string;
  response: string;
  score: number;
  score_details: string;
  latency_ms: number;
  error: string | null;
  raw_data: string;
  created_at: number;
}

export interface LeaderboardEntry {
  model_id: string;
  model_name: string;
  avg_score: number;
  eval_count: number;
  last_run_at: number;
}

// =============================================================================
// Input Types
// =============================================================================

interface IdInput {
  id: string;
}

interface CreateModelInput {
  name: string;
  inference_uri: string;
  description?: string;
  api_key?: string;
  is_official?: boolean;
}

interface CreateEvalInput {
  name: string;
  prompt: string;
  eval_type: 'rubric' | 'semantic';
  eval_criteria: string;
  description?: string;
  expected_behavior?: string;
}

// =============================================================================
// Models
// =============================================================================

export const listModels = tool({
  description:
    'List all registered LLM models on evals.blah.dev. Returns model names, inference URIs, descriptions, and metadata. No authentication required.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<{ models: Model[] }> {
    const models = await apiRequest<Model[]>('/models');
    return { models };
  },
});

export const getModel = tool({
  description:
    'Get details of a specific model by ID on evals.blah.dev, including name, inference URI, description, and timestamps.',
  inputSchema: jsonSchema<IdInput>({
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The model ID to retrieve',
      },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: IdInput): Promise<{ model: Model }> {
    if (!input.id) {
      throw new Error('Model ID is required');
    }
    const model = await apiRequest<Model>(`/models/${encodeURIComponent(input.id)}`);
    return { model };
  },
});

export const createModel = tool({
  description:
    'Register a new LLM model on evals.blah.dev. The model will be included in future eval runs and appear on the leaderboard. Requires EVALS_BLAH_API_KEY. inference_uri can be an OpenRouter provider string (e.g. "openai/gpt-4.1-mini"), an OpenAI-compatible endpoint (e.g. "openai-compatible:https://server.com/v1#model"), or a custom HTTP URL.',
  inputSchema: jsonSchema<CreateModelInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Model name (1-100 characters)',
      },
      inference_uri: {
        type: 'string',
        description:
          'How to reach the model. OpenRouter string (e.g. "anthropic/claude-sonnet-4-6"), OpenAI-compatible endpoint (e.g. "openai-compatible:https://server.com/v1#model"), or custom HTTP URL.',
      },
      description: {
        type: 'string',
        description: 'Optional model description (max 1000 characters)',
      },
      api_key: {
        type: 'string',
        description: 'Optional API key for the inference endpoint',
      },
      is_official: {
        type: 'boolean',
        description: 'Whether this is an official model entry (default false)',
      },
    },
    required: ['name', 'inference_uri'],
    additionalProperties: false,
  }),
  async execute(input: CreateModelInput): Promise<{ model: Model }> {
    if (!input.name || input.name.length < 1 || input.name.length > 100) {
      throw new Error('Model name is required and must be 1-100 characters');
    }
    if (!input.inference_uri) {
      throw new Error('inference_uri is required');
    }
    if (input.description && input.description.length > 1000) {
      throw new Error('Description must be at most 1000 characters');
    }

    const body: Record<string, unknown> = {
      name: input.name,
      inference_uri: input.inference_uri,
    };
    if (input.description !== undefined) body.description = input.description;
    if (input.api_key !== undefined) body.api_key = input.api_key;
    if (input.is_official !== undefined) body.is_official = input.is_official;

    const model = await apiRequest<Model>('/models', {
      method: 'POST',
      body,
      auth: true,
    });
    return { model };
  },
});

export const getModelResults = tool({
  description:
    'Get all eval results for a specific model on evals.blah.dev. Returns scores, judge reasoning, latency, and response text for each eval the model has been tested on.',
  inputSchema: jsonSchema<IdInput>({
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The model ID to get results for',
      },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: IdInput): Promise<{ results: EvalResult[] }> {
    if (!input.id) {
      throw new Error('Model ID is required');
    }
    const results = await apiRequest<EvalResult[]>(
      `/models/${encodeURIComponent(input.id)}/results`
    );
    return { results };
  },
});

// =============================================================================
// Evals
// =============================================================================

export const listEvals = tool({
  description:
    'List all evaluation definitions on evals.blah.dev. Returns eval names, prompts, scoring criteria, and types (rubric or semantic).',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<{ evals: Eval[] }> {
    const evals = await apiRequest<Eval[]>('/evals');
    return { evals };
  },
});

export const getEval = tool({
  description:
    'Get details of a specific evaluation by ID on evals.blah.dev, including the prompt, expected behavior, type, and scoring criteria.',
  inputSchema: jsonSchema<IdInput>({
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The eval ID to retrieve',
      },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: IdInput): Promise<{ eval: Eval }> {
    if (!input.id) {
      throw new Error('Eval ID is required');
    }
    const evalDef = await apiRequest<Eval>(`/evals/${encodeURIComponent(input.id)}`);
    return { eval: evalDef };
  },
});

export const createEval = tool({
  description:
    'Create a new evaluation definition on evals.blah.dev. Evals are prompts with scoring criteria judged by an LLM judge. Requires EVALS_BLAH_API_KEY.',
  inputSchema: jsonSchema<CreateEvalInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Eval name (1-100 characters)',
      },
      prompt: {
        type: 'string',
        description: 'The prompt that will be sent to models',
      },
      eval_type: {
        type: 'string',
        enum: ['rubric', 'semantic'],
        description:
          '"rubric" scores against a detailed rubric; "semantic" compares to an ideal response',
      },
      eval_criteria: {
        type: 'string',
        description:
          'JSON string of scoring criteria. For rubric: {"rubric": "...", "max_score": 1}. For semantic: {"ideal_response": "...", "rubric": "..."}.',
      },
      description: {
        type: 'string',
        description: 'Optional eval description (max 1000 characters)',
      },
      expected_behavior: {
        type: 'string',
        description:
          'Optional human-readable description of expected behavior (max 2000 characters)',
      },
    },
    required: ['name', 'prompt', 'eval_type', 'eval_criteria'],
    additionalProperties: false,
  }),
  async execute(input: CreateEvalInput): Promise<{ eval: Eval }> {
    if (!input.name || input.name.length < 1 || input.name.length > 100) {
      throw new Error('Eval name is required and must be 1-100 characters');
    }
    if (!input.prompt) {
      throw new Error('Prompt is required');
    }
    if (!['rubric', 'semantic'].includes(input.eval_type)) {
      throw new Error('eval_type must be "rubric" or "semantic"');
    }
    if (!input.eval_criteria) {
      throw new Error('eval_criteria is required (JSON string)');
    }
    if (input.description && input.description.length > 1000) {
      throw new Error('Description must be at most 1000 characters');
    }
    if (input.expected_behavior && input.expected_behavior.length > 2000) {
      throw new Error('Expected behavior must be at most 2000 characters');
    }

    // Validate that eval_criteria is valid JSON
    try {
      JSON.parse(input.eval_criteria);
    } catch {
      throw new Error('eval_criteria must be a valid JSON string');
    }

    const body: Record<string, unknown> = {
      name: input.name,
      prompt: input.prompt,
      eval_type: input.eval_type,
      eval_criteria: input.eval_criteria,
    };
    if (input.description !== undefined) body.description = input.description;
    if (input.expected_behavior !== undefined) body.expected_behavior = input.expected_behavior;

    const evalDef = await apiRequest<Eval>('/evals', {
      method: 'POST',
      body,
      auth: true,
    });
    return { eval: evalDef };
  },
});

// =============================================================================
// Runs
// =============================================================================

export const listRuns = tool({
  description:
    'List all eval runs on evals.blah.dev, newest first. Shows run status, total models/evals, and completion count.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<{ runs: EvalRun[] }> {
    const runs = await apiRequest<EvalRun[]>('/runs');
    return { runs };
  },
});

export const getRun = tool({
  description:
    'Get details of a specific eval run by ID on evals.blah.dev, including status, model/eval counts, and completion progress.',
  inputSchema: jsonSchema<IdInput>({
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The run ID to retrieve',
      },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: IdInput): Promise<{ run: EvalRun }> {
    if (!input.id) {
      throw new Error('Run ID is required');
    }
    const run = await apiRequest<EvalRun>(`/runs/${encodeURIComponent(input.id)}`);
    return { run };
  },
});

export const getRunResults = tool({
  description:
    'Get all results for a specific eval run on evals.blah.dev. Returns every model-eval pair result including scores, responses, and latency.',
  inputSchema: jsonSchema<IdInput>({
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The run ID to get results for',
      },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: IdInput): Promise<{ results: EvalResult[] }> {
    if (!input.id) {
      throw new Error('Run ID is required');
    }
    const results = await apiRequest<EvalResult[]>(
      `/runs/${encodeURIComponent(input.id)}/results`
    );
    return { results };
  },
});

export const triggerRun = tool({
  description:
    'Trigger a new eval run across all models and evals on evals.blah.dev. The run executes asynchronously. Requires EVALS_BLAH_API_KEY.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<{ message: string }> {
    const result = await apiRequest<{ message: string }>('/runs', {
      method: 'POST',
      auth: true,
    });
    return result;
  },
});

// =============================================================================
// Results
// =============================================================================

export const getResult = tool({
  description:
    'Get a single eval result by ID on evals.blah.dev. Returns the model response, score (0-1), judge reasoning, latency, and raw request/response data.',
  inputSchema: jsonSchema<IdInput>({
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The result ID to retrieve',
      },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: IdInput): Promise<{ result: EvalResult }> {
    if (!input.id) {
      throw new Error('Result ID is required');
    }
    const result = await apiRequest<EvalResult>(`/results/${encodeURIComponent(input.id)}`);
    return { result };
  },
});

// =============================================================================
// Leaderboard
// =============================================================================

export const getLeaderboard = tool({
  description:
    'Get the model leaderboard on evals.blah.dev, ranked by average eval score. Shows each model name, average score (0-1), number of evals completed, and last run timestamp.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<{ leaderboard: LeaderboardEntry[] }> {
    const leaderboard = await apiRequest<LeaderboardEntry[]>('/leaderboard');
    return { leaderboard };
  },
});

// =============================================================================
// Default export
// =============================================================================

export default {
  listModels,
  getModel,
  createModel,
  getModelResults,
  listEvals,
  getEval,
  createEval,
  listRuns,
  getRun,
  getRunResults,
  triggerRun,
  getResult,
  getLeaderboard,
};
