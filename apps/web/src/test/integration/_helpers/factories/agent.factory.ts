/**
 * Agent factory for integration tests
 *
 * Creates test agents with auto-generated test prefixes
 * and tracks them for cleanup.
 */

import type { ApiClient } from '../api-client';
import type { TestDataTracker } from '../cleanup';

export interface CreateAgentOptions {
  uid?: string;
  name?: string;
  description?: string;
  provider?: 'OPENAI' | 'ANTHROPIC' | 'GOOGLE' | 'GROQ' | 'MISTRAL';
  modelId?: string;
  systemPrompt?: string;
  temperature?: number;
  maxToolCallsPerTurn?: number;
  maxMessagesInContext?: number;
  isPublic?: boolean;
  toolIds?: string[];
  collectionIds?: string[];
}

export interface AgentFactoryResult {
  id: string;
  uid: string;
  name: string;
  description: string | null;
  provider: string;
  modelId: string;
  isPublic: boolean;
}

/**
 * Create an agent factory bound to a specific API client and tracker
 */
export function createAgentFactory(api: ApiClient, tracker: TestDataTracker) {
  let counter = 0;

  return {
    /**
     * Create a new test agent
     */
    async create(options: CreateAgentOptions = {}): Promise<AgentFactoryResult> {
      counter++;
      const timestamp = Date.now();

      const uid = options.uid || `test-agent-${timestamp}-${counter}`;
      const name = options.name || `Test Agent ${timestamp}-${counter}`;

      const result = await api.post<{ success: boolean; data: AgentFactoryResult }>('/api/agents', {
        uid,
        name,
        description: options.description ?? 'Integration test agent',
        provider: options.provider ?? 'OPENAI',
        modelId: options.modelId ?? 'gpt-4o-mini',
        systemPrompt: options.systemPrompt ?? 'You are a helpful test agent.',
        temperature: options.temperature ?? 0.7,
        maxToolCallsPerTurn: options.maxToolCallsPerTurn ?? 5,
        maxMessagesInContext: options.maxMessagesInContext ?? 10,
        isPublic: options.isPublic ?? true,
      });

      if (!result.ok) {
        throw new Error(`Failed to create agent: ${(result as { error: string }).error}`);
      }

      const agent = result.data.data;
      tracker.trackAgent(agent.id);

      // Add tools if specified
      if (options.toolIds && options.toolIds.length > 0) {
        for (const toolId of options.toolIds) {
          await api.post(`/api/agents/${agent.id}/tools`, { toolId });
        }
      }

      // Add collections if specified
      if (options.collectionIds && options.collectionIds.length > 0) {
        for (const collectionId of options.collectionIds) {
          await api.post(`/api/agents/${agent.id}/collections`, { collectionId });
        }
      }

      return agent;
    },

    /**
     * Create multiple test agents
     */
    async createMany(count: number, options: CreateAgentOptions = {}): Promise<AgentFactoryResult[]> {
      const agents: AgentFactoryResult[] = [];
      for (let i = 0; i < count; i++) {
        const agent = await this.create({
          ...options,
          uid: options.uid ? `${options.uid}-${i}` : undefined,
          name: options.name ? `${options.name} ${i}` : undefined,
        });
        agents.push(agent);
      }
      return agents;
    },

    /**
     * Get an agent by ID
     */
    async get(id: string): Promise<AgentFactoryResult | null> {
      const result = await api.get<{ success: boolean; data: AgentFactoryResult }>(`/api/agents/${id}`);
      if (!result.ok) {
        return null;
      }
      return result.data.data;
    },

    /**
     * Update an agent
     */
    async update(
      id: string,
      updates: Partial<CreateAgentOptions>
    ): Promise<AgentFactoryResult> {
      const result = await api.patch<{ success: boolean; data: AgentFactoryResult }>(
        `/api/agents/${id}`,
        updates
      );
      if (!result.ok) {
        throw new Error(`Failed to update agent: ${(result as { error: string }).error}`);
      }
      return result.data.data;
    },

    /**
     * Delete an agent
     */
    async delete(id: string): Promise<void> {
      const result = await api.delete(`/api/agents/${id}`);
      if (!result.ok) {
        throw new Error(`Failed to delete agent: ${(result as { error: string }).error}`);
      }
    },
  };
}

export type AgentFactory = ReturnType<typeof createAgentFactory>;
