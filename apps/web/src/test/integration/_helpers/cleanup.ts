/**
 * Test data cleanup utilities
 *
 * Tracks created test data and provides cleanup functions
 * to ensure a clean state after tests complete.
 */

import { prisma } from '@tpmjs/db';

/**
 * Tracks created test data IDs for cleanup
 */
export class TestDataTracker {
  private agentIds: Set<string> = new Set();
  private collectionIds: Set<string> = new Set();
  private conversationIds: Set<string> = new Set();
  private apiKeyIds: Set<string> = new Set();
  private tpmjsApiKeyIds: Set<string> = new Set();

  trackAgent(id: string): void {
    this.agentIds.add(id);
  }

  trackCollection(id: string): void {
    this.collectionIds.add(id);
  }

  trackConversation(id: string): void {
    this.conversationIds.add(id);
  }

  trackApiKey(id: string): void {
    this.apiKeyIds.add(id);
  }

  trackTpmjsApiKey(id: string): void {
    this.tpmjsApiKeyIds.add(id);
  }

  getTrackedIds(): {
    agents: string[];
    collections: string[];
    conversations: string[];
    apiKeys: string[];
    tpmjsApiKeys: string[];
  } {
    return {
      agents: Array.from(this.agentIds),
      collections: Array.from(this.collectionIds),
      conversations: Array.from(this.conversationIds),
      apiKeys: Array.from(this.apiKeyIds),
      tpmjsApiKeys: Array.from(this.tpmjsApiKeyIds),
    };
  }

  /**
   * Clean up all tracked test data
   */
  async cleanup(): Promise<void> {
    const { agents, collections, conversations, apiKeys, tpmjsApiKeys } = this.getTrackedIds();

    // Delete in order to respect foreign key constraints
    // 1. Conversations (depend on agents)
    if (conversations.length > 0) {
      await prisma.conversation.deleteMany({
        where: { id: { in: conversations } },
      });
    }

    // 2. Agent tool associations
    if (agents.length > 0) {
      await prisma.agentTool.deleteMany({
        where: { agentId: { in: agents } },
      });
      await prisma.agentCollection.deleteMany({
        where: { agentId: { in: agents } },
      });
    }

    // 3. Collection tool associations
    if (collections.length > 0) {
      await prisma.collectionTool.deleteMany({
        where: { collectionId: { in: collections } },
      });
    }

    // 4. Agents
    if (agents.length > 0) {
      await prisma.agent.deleteMany({
        where: { id: { in: agents } },
      });
    }

    // 5. Collections
    if (collections.length > 0) {
      await prisma.collection.deleteMany({
        where: { id: { in: collections } },
      });
    }

    // 6. User API keys
    if (apiKeys.length > 0) {
      await prisma.userApiKey.deleteMany({
        where: { id: { in: apiKeys } },
      });
    }

    // 7. TPMJS API keys
    if (tpmjsApiKeys.length > 0) {
      await prisma.tpmjsApiKey.deleteMany({
        where: { id: { in: tpmjsApiKeys } },
      });
    }

    // Clear tracked IDs
    this.agentIds.clear();
    this.collectionIds.clear();
    this.conversationIds.clear();
    this.apiKeyIds.clear();
    this.tpmjsApiKeyIds.clear();
  }
}

/**
 * Clean up orphaned test data from previous failed runs
 * Test data is identified by the 'test-' prefix
 */
export async function cleanupOrphanedTestData(userId: string): Promise<{
  agents: number;
  collections: number;
  conversations: number;
}> {
  // Delete test conversations
  const conversationsResult = await prisma.conversation.deleteMany({
    where: {
      agent: {
        userId,
        uid: { startsWith: 'test-' },
      },
    },
  });

  // Delete test agent associations
  await prisma.agentTool.deleteMany({
    where: {
      agent: {
        userId,
        uid: { startsWith: 'test-' },
      },
    },
  });
  await prisma.agentCollection.deleteMany({
    where: {
      agent: {
        userId,
        uid: { startsWith: 'test-' },
      },
    },
  });

  // Delete test agents
  const agentsResult = await prisma.agent.deleteMany({
    where: {
      userId,
      uid: { startsWith: 'test-' },
    },
  });

  // Delete test collection associations
  await prisma.collectionTool.deleteMany({
    where: {
      collection: {
        userId,
        slug: { startsWith: 'test-' },
      },
    },
  });

  // Delete test collections
  const collectionsResult = await prisma.collection.deleteMany({
    where: {
      userId,
      slug: { startsWith: 'test-' },
    },
  });

  return {
    agents: agentsResult.count,
    collections: collectionsResult.count,
    conversations: conversationsResult.count,
  };
}

/**
 * Clean up all test data for a specific user
 */
export async function cleanupAllTestData(userId: string): Promise<void> {
  // Delete all conversations for test agents
  await prisma.conversation.deleteMany({
    where: {
      agent: {
        userId,
        uid: { startsWith: 'test-' },
      },
    },
  });

  // Delete all agent associations
  await prisma.agentTool.deleteMany({
    where: {
      agent: {
        userId,
        uid: { startsWith: 'test-' },
      },
    },
  });
  await prisma.agentCollection.deleteMany({
    where: {
      agent: {
        userId,
        uid: { startsWith: 'test-' },
      },
    },
  });

  // Delete all test agents
  await prisma.agent.deleteMany({
    where: {
      userId,
      uid: { startsWith: 'test-' },
    },
  });

  // Delete all collection associations
  await prisma.collectionTool.deleteMany({
    where: {
      collection: {
        userId,
        slug: { startsWith: 'test-' },
      },
    },
  });

  // Delete all test collections
  await prisma.collection.deleteMany({
    where: {
      userId,
      slug: { startsWith: 'test-' },
    },
  });
}
