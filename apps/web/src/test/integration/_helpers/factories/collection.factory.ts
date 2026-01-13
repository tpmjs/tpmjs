/**
 * Collection factory for integration tests
 *
 * Creates test collections with auto-generated test prefixes
 * and tracks them for cleanup.
 */

import type { ApiClient } from '../api-client';
import type { TestDataTracker } from '../cleanup';

export interface CreateCollectionOptions {
  slug?: string;
  name?: string;
  description?: string;
  isPublic?: boolean;
  toolIds?: string[];
}

export interface CollectionFactoryResult {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  toolCount?: number;
}

/**
 * Create a collection factory bound to a specific API client and tracker
 */
export function createCollectionFactory(api: ApiClient, tracker: TestDataTracker) {
  let counter = 0;

  return {
    /**
     * Create a new test collection
     */
    async create(options: CreateCollectionOptions = {}): Promise<CollectionFactoryResult> {
      counter++;
      const timestamp = Date.now();

      const slug = options.slug || `test-collection-${timestamp}-${counter}`;
      const name = options.name || `Test Collection ${timestamp}-${counter}`;

      const result = await api.post<{ success: boolean; data: CollectionFactoryResult }>(
        '/api/collections',
        {
          slug,
          name,
          description: options.description ?? 'Integration test collection',
          isPublic: options.isPublic ?? true,
        }
      );

      if (!result.ok) {
        const errorResult = result as { error: string; status: number };
        throw new Error(
          `Failed to create collection: ${errorResult.error} (status: ${errorResult.status})`
        );
      }

      const collection = result.data.data;
      tracker.trackCollection(collection.id);

      // Add tools if specified
      if (options.toolIds && options.toolIds.length > 0) {
        for (const toolId of options.toolIds) {
          await api.post(`/api/collections/${collection.id}/tools`, { toolId });
        }
      }

      return collection;
    },

    /**
     * Create multiple test collections
     */
    async createMany(
      count: number,
      options: CreateCollectionOptions = {}
    ): Promise<CollectionFactoryResult[]> {
      const collections: CollectionFactoryResult[] = [];
      for (let i = 0; i < count; i++) {
        const collection = await this.create({
          ...options,
          slug: options.slug ? `${options.slug}-${i}` : undefined,
          name: options.name ? `${options.name} ${i}` : undefined,
        });
        collections.push(collection);
      }
      return collections;
    },

    /**
     * Get a collection by ID
     */
    async get(id: string): Promise<CollectionFactoryResult | null> {
      const result = await api.get<{ success: boolean; data: CollectionFactoryResult }>(
        `/api/collections/${id}`
      );
      if (!result.ok) {
        return null;
      }
      return result.data.data;
    },

    /**
     * Update a collection
     */
    async update(
      id: string,
      updates: Partial<CreateCollectionOptions>
    ): Promise<CollectionFactoryResult> {
      const result = await api.patch<{ success: boolean; data: CollectionFactoryResult }>(
        `/api/collections/${id}`,
        updates
      );
      if (!result.ok) {
        throw new Error(`Failed to update collection: ${(result as { error: string }).error}`);
      }
      return result.data.data;
    },

    /**
     * Delete a collection
     */
    async delete(id: string): Promise<void> {
      const result = await api.delete(`/api/collections/${id}`);
      if (!result.ok) {
        throw new Error(`Failed to delete collection: ${(result as { error: string }).error}`);
      }
    },

    /**
     * Add a tool to a collection
     */
    async addTool(collectionId: string, toolId: string): Promise<void> {
      const result = await api.post(`/api/collections/${collectionId}/tools`, { toolId });
      if (!result.ok) {
        throw new Error(`Failed to add tool to collection: ${(result as { error: string }).error}`);
      }
    },

    /**
     * Remove a tool from a collection
     */
    async removeTool(collectionId: string, toolId: string): Promise<void> {
      const result = await api.delete(`/api/collections/${collectionId}/tools/${toolId}`);
      if (!result.ok) {
        throw new Error(
          `Failed to remove tool from collection: ${(result as { error: string }).error}`
        );
      }
    },
  };
}

export type CollectionFactory = ReturnType<typeof createCollectionFactory>;
