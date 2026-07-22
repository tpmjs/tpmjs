import { getApiKey, getApiUrl } from './config.js';

export interface TpmClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Tool types
export interface Tool {
  id: string;
  name: string;
  slug?: string;
  description: string;
  category: string;
  tier: string;
  qualityScore: number | null;
  importHealth: string;
  executionHealth: string;
  likeCount: number;
  npmPackageName: string;
  npmVersion: string;
  npmDownloadsLastMonth: number;
  isOfficial: boolean;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  tools?: { name: string; description?: string }[];
  package?: {
    npmPackageName: string;
    category: string;
    npmDownloadsLastMonth: number;
    isOfficial: boolean;
  };
}

interface RegistryExecuteResponse {
  success: boolean;
  toolId: string;
  result?: unknown;
  executionTimeMs: number;
  error?: { code: string; message: string };
}

/** Return the stable registry identifier represented by a tool response. */
export function canonicalToolId(tool: Tool): string | null {
  const packageName = tool.package?.npmPackageName ?? tool.npmPackageName;
  return packageName && tool.name ? `${packageName}::${tool.name}` : null;
}

export interface ToolSearchOptions extends PaginationOptions {
  category?: string;
  query?: string;
}

// Agent types
export interface Agent {
  id: string;
  uid: string;
  name: string;
  description: string | null;
  provider: string;
  modelId: string;
  systemPrompt: string | null;
  temperature: number;
  isPublic: boolean;
  likeCount: number;
  _count?: {
    tools: number;
    collections: number;
  };
}

export interface CreateAgentInput {
  name: string;
  uid?: string;
  description?: string;
  provider: string;
  modelId: string;
  systemPrompt?: string;
  temperature?: number;
  isPublic?: boolean;
  collectionIds?: string[];
  toolIds?: string[];
}

export interface UpdateAgentInput {
  name?: string;
  uid?: string;
  description?: string;
  provider?: string;
  modelId?: string;
  systemPrompt?: string;
  temperature?: number;
  isPublic?: boolean;
  maxToolCallsPerTurn?: number;
  maxMessagesInContext?: number;
}

// Collection types
export interface Collection {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  isPublic: boolean;
  likeCount: number;
  _count?: {
    tools: number;
  };
  tools?: Array<{ tool: Tool }>;
}

export interface CreateCollectionInput {
  name: string;
  description?: string;
  isPublic: boolean;
}

export interface UpdateCollectionInput {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

// User types
export interface User {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
}

// API Key types
export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

// Scenario types
export interface Scenario {
  id: string;
  collectionId: string | null;
  prompt: string;
  name: string | null;
  description: string | null;
  tags: string[];
  qualityScore: number;
  totalRuns: number;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  consecutivePasses: number;
  consecutiveFails: number;
  createdAt: string;
  updatedAt: string;
  collection?: {
    id: string;
    name: string;
    slug: string | null;
    username: string | null;
  } | null;
}

export interface ScenarioRun {
  id: string;
  status: string;
  success: boolean;
  evaluator: {
    model: string | null;
    verdict: string | null;
    reason: string | null;
  };
  assertions: unknown;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    executionTimeMs: number | null;
  };
  timestamps: {
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
  };
  quotaRemaining?: number;
}

export interface ScenarioListOptions extends PaginationOptions {
  collectionId?: string;
  tags?: string;
  sortBy?: 'qualityScore' | 'totalRuns' | 'createdAt' | 'lastRunAt';
}

export interface CreateScenarioInput {
  collectionId: string;
  prompt: string;
  name?: string;
  description?: string;
  tags?: string[];
}

export interface GenerateScenariosInput {
  count?: number;
  skipSimilarityCheck?: boolean;
}

// Stats types
export interface Stats {
  tools: {
    total: number;
    official: number;
    healthyImport: number;
    healthyExecution: number;
  };
  packages: {
    total: number;
    official: number;
  };
  categories: { name: string; count: number }[];
}

export class TpmClient {
  private baseUrl: string;
  private apiKey: string | undefined;
  private timeout: number;

  constructor(options: TpmClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? getApiUrl();
    this.apiKey = options.apiKey ?? getApiKey();
    this.timeout = options.timeout ?? 30000;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      const data = (await response.json()) as T & {
        message?: string;
        error?: string | { message?: string };
      };

      if (!response.ok) {
        const errorMessage =
          data.message ||
          (typeof data.error === 'string' ? data.error : data.error?.message) ||
          `HTTP ${response.status}`;
        throw new ApiError(errorMessage, response.status, data);
      }

      return data as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Health check
  async health(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }

  // Stats
  async getStats(): Promise<ApiResponse<Stats>> {
    return this.request('/stats');
  }

  // Tools
  async searchTools(options: ToolSearchOptions = {}): Promise<PaginatedResponse<Tool>> {
    const params = new URLSearchParams();
    if (options.query) params.set('q', options.query);
    if (options.category) params.set('category', options.category);
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));

    const queryString = params.toString();
    const endpoint = queryString ? `/tools?${queryString}` : '/tools';

    return this.request<PaginatedResponse<Tool>>(endpoint);
  }

  async getTool(packageName: string, toolName: string): Promise<ApiResponse<Tool>> {
    const packagePath = packageName.split('/').map(encodeURIComponent).join('/');
    return this.request(`/tools/${packagePath}/${encodeURIComponent(toolName)}`);
  }

  async getToolBySlug(slug: string): Promise<ApiResponse<Tool>> {
    const separatorIndex = slug.lastIndexOf('::');
    if (separatorIndex > 0 && separatorIndex < slug.length - 2) {
      return this.getTool(slug.slice(0, separatorIndex), slug.slice(separatorIndex + 2));
    }

    // Search for the tool by slug
    const searchResult = await this.searchTools({ query: slug, limit: 1 });
    if (searchResult.data && searchResult.data.length > 0) {
      const tool = searchResult.data.find((t) => t.slug === slug) || searchResult.data[0];
      return { success: true, data: tool };
    }
    return { success: false, error: 'Tool not found' };
  }

  async getTrendingTools(options: PaginationOptions = {}): Promise<PaginatedResponse<Tool>> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));

    const queryString = params.toString();
    const endpoint = queryString ? `/tools/trending?${queryString}` : '/tools/trending';

    return this.request<PaginatedResponse<Tool>>(endpoint);
  }

  async validateTpmjsField(
    field: unknown
  ): Promise<ApiResponse<{ valid: boolean; tier: string | null; errors?: unknown[] }>> {
    return this.request('/tools/validate', {
      method: 'POST',
      body: JSON.stringify(field),
    });
  }

  private async resolveToolId(identifier: string): Promise<string> {
    const separatorIndex = identifier.lastIndexOf('::');
    if (separatorIndex > 0 && separatorIndex < identifier.length - 2) return identifier;

    const searchResult = await this.searchTools({ query: identifier, limit: 10 });
    const exactMatches = searchResult.data.filter(
      (tool) => tool.id === identifier || tool.slug === identifier || tool.name === identifier
    );
    const candidates = exactMatches.length > 0 ? exactMatches : searchResult.data;

    if (candidates.length !== 1) {
      throw new Error(
        candidates.length === 0
          ? `Tool "${identifier}" was not found. Use package::toolName.`
          : `Tool "${identifier}" is ambiguous. Use package::toolName.`
      );
    }

    const candidate = candidates[0];
    if (!candidate) throw new Error(`Tool "${identifier}" was not found.`);
    const resolved = canonicalToolId(candidate);
    if (!resolved) throw new Error(`Tool "${identifier}" has no canonical registry ID.`);
    return resolved;
  }

  async executeTool(identifier: string, params: Record<string, unknown>): Promise<unknown> {
    const toolId = await this.resolveToolId(identifier);
    const response = await this.request<RegistryExecuteResponse>('/registry/execute', {
      method: 'POST',
      body: JSON.stringify({ toolId, params }),
    });

    if (!response.success) {
      throw new Error(response.error?.message || `Execution failed for ${toolId}`);
    }
    return response.result;
  }

  async *executeToolStream(
    identifier: string,
    params: Record<string, unknown>
  ): AsyncGenerator<{ type: string; data: string }> {
    const result = await this.executeTool(identifier, params);
    yield {
      type: 'text',
      data: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
    };
    yield { type: 'done', data: '' };
  }

  // Agents
  async listAgents(options: PaginationOptions = {}): Promise<PaginatedResponse<Agent>> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));

    const queryString = params.toString();
    const endpoint = queryString ? `/agents?${queryString}` : '/agents';

    return this.request<PaginatedResponse<Agent>>(endpoint);
  }

  async getAgent(id: string): Promise<ApiResponse<Agent>> {
    return this.request(`/agents/${id}`);
  }

  async createAgent(input: CreateAgentInput): Promise<ApiResponse<Agent>> {
    return this.request('/agents', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateAgent(id: string, input: UpdateAgentInput): Promise<ApiResponse<Agent>> {
    return this.request(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  async deleteAgent(id: string): Promise<ApiResponse<void>> {
    return this.request(`/agents/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Resolve a collection identifier (ID, slug, or username/slug) to a collection ID.
   * Returns the collection ID if found, or throws an error.
   */
  async resolveCollectionId(identifier: string): Promise<string> {
    // If it looks like a CUID (starts with 'c' and ~25 chars alphanumeric), try direct lookup first
    if (/^c[a-z0-9]{20,30}$/.test(identifier)) {
      return identifier;
    }

    // Strip username prefix if present (e.g., "ajax/dog-research-tools" -> "dog-research-tools")
    const slug = identifier.includes('/')
      ? (identifier.split('/').at(-1) ?? identifier)
      : identifier;

    // List user's collections and find by slug or name
    const result = await this.listCollections({ limit: 50 });
    const collections = result.data ?? [];

    // Try exact slug match first
    const bySlug = collections.find((c) => c.slug === slug);
    if (bySlug) return bySlug.id;

    // Try case-insensitive name match
    const byName = collections.find((c) => c.name.toLowerCase() === slug.toLowerCase());
    if (byName) return byName.id;

    // Try partial slug/name match
    const byPartial = collections.find(
      (c) => c.slug?.includes(slug) || c.name.toLowerCase().includes(slug.toLowerCase())
    );
    if (byPartial) return byPartial.id;

    throw new ApiError(
      `Collection "${identifier}" not found. Run \`tpm collection list\` to see your collections.`,
      404
    );
  }

  // Collections
  async listCollections(options: PaginationOptions = {}): Promise<PaginatedResponse<Collection>> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));

    const queryString = params.toString();
    const endpoint = queryString ? `/collections?${queryString}` : '/collections';

    return this.request<PaginatedResponse<Collection>>(endpoint);
  }

  async getCollection(id: string): Promise<ApiResponse<Collection>> {
    return this.request(`/collections/${id}?toolsLimit=100`);
  }

  async createCollection(input: CreateCollectionInput): Promise<ApiResponse<Collection>> {
    return this.request('/collections', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateCollection(
    id: string,
    input: UpdateCollectionInput
  ): Promise<ApiResponse<Collection>> {
    return this.request(`/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  async deleteCollection(id: string): Promise<ApiResponse<void>> {
    return this.request(`/collections/${id}`, {
      method: 'DELETE',
    });
  }

  async addToolsToCollection(id: string, toolIds: string[]): Promise<ApiResponse<void>> {
    // Add tools one by one (API doesn't support bulk)
    for (const toolId of toolIds) {
      await this.request(`/collections/${id}/tools`, {
        method: 'POST',
        body: JSON.stringify({ toolId }),
      });
    }
    return { success: true };
  }

  async addToolsFromPackage(
    collectionId: string,
    npmPackageName: string
  ): Promise<ApiResponse<{ added: number; skipped: number; limitReached: boolean }>> {
    return this.request(`/collections/${collectionId}/tools/from-package`, {
      method: 'POST',
      body: JSON.stringify({ npmPackageName }),
    });
  }

  async removeToolFromCollection(id: string, toolId: string): Promise<ApiResponse<void>> {
    return this.request(`/collections/${id}/tools/${toolId}`, {
      method: 'DELETE',
    });
  }

  // User
  async whoami(): Promise<ApiResponse<User>> {
    return this.request('/user/profile');
  }

  async listApiKeys(): Promise<ApiResponse<ApiKey[]>> {
    return this.request('/user/tpmjs-api-keys');
  }

  // Scenarios
  async listScenarios(options: ScenarioListOptions = {}): Promise<PaginatedResponse<Scenario>> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));
    if (options.collectionId) params.set('collectionId', options.collectionId);
    if (options.tags) params.set('tags', options.tags);
    if (options.sortBy) params.set('sortBy', options.sortBy);

    const queryString = params.toString();
    const endpoint = queryString ? `/scenarios?${queryString}` : '/scenarios';

    return this.request<PaginatedResponse<Scenario>>(endpoint);
  }

  async listCollectionScenarios(
    collectionId: string,
    options: PaginationOptions = {}
  ): Promise<ApiResponse<{ scenarios: Scenario[] }>> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));

    const queryString = params.toString();
    const endpoint = queryString
      ? `/collections/${collectionId}/scenarios?${queryString}`
      : `/collections/${collectionId}/scenarios`;

    return this.request<ApiResponse<{ scenarios: Scenario[] }>>(endpoint);
  }

  async getScenario(id: string): Promise<ApiResponse<Scenario>> {
    return this.request(`/scenarios/${id}`);
  }

  async createScenario(input: CreateScenarioInput): Promise<ApiResponse<Scenario>> {
    return this.request('/scenarios', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async generateScenarios(
    collectionId: string,
    input: GenerateScenariosInput = {}
  ): Promise<ApiResponse<{ scenarios: { scenario: Scenario; similarity?: unknown }[] }>> {
    return this.request(`/collections/${collectionId}/scenarios/generate`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async runScenario(scenarioId: string): Promise<ApiResponse<ScenarioRun>> {
    return this.request(`/scenarios/${scenarioId}/run`, {
      method: 'POST',
    });
  }

  async getScenarioRuns(
    scenarioId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResponse<ScenarioRun>> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));

    const queryString = params.toString();
    const endpoint = queryString
      ? `/scenarios/${scenarioId}/runs?${queryString}`
      : `/scenarios/${scenarioId}/runs`;

    return this.request<PaginatedResponse<ScenarioRun>>(endpoint);
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.apiKey;
  }
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Singleton instance
let clientInstance: TpmClient | null = null;

export function getClient(options?: TpmClientOptions): TpmClient {
  if (!clientInstance || options) {
    clientInstance = new TpmClient(options);
  }
  return clientInstance;
}
