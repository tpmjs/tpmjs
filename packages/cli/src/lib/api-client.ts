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
  slug: string;
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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      const data = await response.json() as T & { message?: string; error?: string };

      if (!response.ok) {
        throw new ApiError(
          data.message || data.error || `HTTP ${response.status}`,
          response.status,
          data
        );
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
    return this.request(`/tools/${encodeURIComponent(packageName)}/${encodeURIComponent(toolName)}`);
  }

  async getToolBySlug(slug: string): Promise<ApiResponse<Tool>> {
    // Search for the tool by slug
    const searchResult = await this.searchTools({ query: slug, limit: 1 });
    if (searchResult.data && searchResult.data.length > 0) {
      const tool = searchResult.data.find(t => t.slug === slug) || searchResult.data[0];
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

  async validateTpmjsField(field: unknown): Promise<ApiResponse<{ valid: boolean; tier: string | null; errors?: unknown[] }>> {
    return this.request('/tools/validate', {
      method: 'POST',
      body: JSON.stringify(field),
    });
  }

  async executeTool(slug: string, params: Record<string, unknown>): Promise<unknown> {
    return this.request(`/tools/${encodeURIComponent(slug)}/execute`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async *executeToolStream(
    slug: string,
    params: Record<string, unknown>
  ): AsyncGenerator<{ type: string; data: string }> {
    const url = `${this.baseUrl}/tools/${encodeURIComponent(slug)}/execute`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...params, stream: true }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(errorText || `HTTP ${response.status}`, response.status);
    }

    if (!response.body) {
      throw new ApiError('No response body', 0);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          yield { type: 'done', data: '' };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield { type: 'done', data: '' };
              return;
            }
            try {
              const parsed = JSON.parse(data);
              yield { type: parsed.type || 'text', data: parsed.content || parsed.data || data };
            } catch {
              yield { type: 'text', data };
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
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
    return this.request(`/collections/${id}`);
  }

  async createCollection(input: CreateCollectionInput): Promise<ApiResponse<Collection>> {
    return this.request('/collections', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateCollection(id: string, input: UpdateCollectionInput): Promise<ApiResponse<Collection>> {
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
      await this.request(`/collections/${id}/tools/${toolId}`, {
        method: 'POST',
      });
    }
    return { success: true };
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
