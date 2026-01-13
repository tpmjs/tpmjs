#!/usr/bin/env tsx
/**
 * Cleanup script for orphaned test data
 *
 * This script is run after integration tests (or manually) to clean up
 * any test data that wasn't properly cleaned up due to test failures.
 *
 * Test data is identified by:
 * - Agent UIDs starting with 'test-'
 * - Collection slugs starting with 'test-'
 *
 * Run with: pnpm --filter=@tpmjs/web tsx src/test/integration/_helpers/cleanup-orphans.ts
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load environment variables
config({ path: resolve(__dirname, '../../../../.env.local') });
config({ path: resolve(__dirname, '../../../../.env') });

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

// Import prisma after env is loaded
import { prisma } from '@tpmjs/db';

async function main() {
  const userId = process.env.INTEGRATION_TEST_USER_ID;

  console.log('🧹 Cleaning up orphaned test data...\n');

  try {
    // Count existing test data
    const testAgentCount = await prisma.agent.count({
      where: userId
        ? { userId, uid: { startsWith: 'test-' } }
        : { uid: { startsWith: 'test-' } },
    });

    const testCollectionCount = await prisma.collection.count({
      where: userId
        ? { userId, slug: { startsWith: 'test-' } }
        : { slug: { startsWith: 'test-' } },
    });

    console.log(`Found ${testAgentCount} test agent(s)`);
    console.log(`Found ${testCollectionCount} test collection(s)`);

    if (testAgentCount === 0 && testCollectionCount === 0) {
      console.log('\n✅ No orphaned test data found');
      return;
    }

    // Clean up test conversations (depend on agents)
    const convDeleteResult = await prisma.conversation.deleteMany({
      where: {
        agent: userId
          ? { userId, uid: { startsWith: 'test-' } }
          : { uid: { startsWith: 'test-' } },
      },
    });
    console.log(`Deleted ${convDeleteResult.count} conversation(s)`);

    // Clean up agent-tool associations
    const agentToolResult = await prisma.agentTool.deleteMany({
      where: {
        agent: userId
          ? { userId, uid: { startsWith: 'test-' } }
          : { uid: { startsWith: 'test-' } },
      },
    });
    console.log(`Deleted ${agentToolResult.count} agent-tool association(s)`);

    // Clean up agent-collection associations
    const agentCollResult = await prisma.agentCollection.deleteMany({
      where: {
        agent: userId
          ? { userId, uid: { startsWith: 'test-' } }
          : { uid: { startsWith: 'test-' } },
      },
    });
    console.log(`Deleted ${agentCollResult.count} agent-collection association(s)`);

    // Clean up test agents
    const agentResult = await prisma.agent.deleteMany({
      where: userId
        ? { userId, uid: { startsWith: 'test-' } }
        : { uid: { startsWith: 'test-' } },
    });
    console.log(`Deleted ${agentResult.count} agent(s)`);

    // Clean up collection-tool associations
    const collToolResult = await prisma.collectionTool.deleteMany({
      where: {
        collection: userId
          ? { userId, slug: { startsWith: 'test-' } }
          : { slug: { startsWith: 'test-' } },
      },
    });
    console.log(`Deleted ${collToolResult.count} collection-tool association(s)`);

    // Clean up test collections
    const collResult = await prisma.collection.deleteMany({
      where: userId
        ? { userId, slug: { startsWith: 'test-' } }
        : { slug: { startsWith: 'test-' } },
    });
    console.log(`Deleted ${collResult.count} collection(s)`);

    console.log('\n✅ Cleanup complete!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
