#!/usr/bin/env tsx
/**
 * Setup script for integration test credentials
 *
 * This script creates or updates the test user and generates:
 * - A session token for session-based authentication
 * - A TPMJS API key for API key authentication
 *
 * Run with: pnpm --filter=@tpmjs/web test:setup-credentials
 *
 * The output should be added to:
 * - .env.local for local testing
 * - GitHub secrets for CI testing
 */

import { randomBytes, createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load environment variables
config({ path: resolve(__dirname, '../../../../.env.local') });
config({ path: resolve(__dirname, '../../../../.env') });

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set. Please configure your .env.local file.');
  process.exit(1);
}

// Import prisma after env is loaded
import { prisma } from '@tpmjs/db';

const TEST_EMAIL = 'integration-tests@tpmjs.com';
const TEST_USERNAME = 'tpmjs-integration-test';
const TEST_NAME = 'Integration Test User';

async function main() {
  console.log('🔧 Setting up integration test credentials...\n');

  try {
    // 1. Find or create test user
    let user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });

    if (!user) {
      console.log('📝 Creating test user...');
      user = await prisma.user.create({
        data: {
          email: TEST_EMAIL,
          username: TEST_USERNAME,
          name: TEST_NAME,
          emailVerified: true,
        },
      });
      console.log(`   Created user: ${user.id}`);
    } else {
      console.log(`✅ Test user exists: ${user.id}`);

      // Ensure username is set
      if (!user.username) {
        await prisma.user.update({
          where: { id: user.id },
          data: { username: TEST_USERNAME },
        });
        console.log('   Updated username');
      }
    }

    // 2. Create or refresh session token
    console.log('\n📝 Creating session token...');

    // Delete old sessions
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    // Create new session (valid for 30 days)
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt,
      },
    });
    console.log('   Session created (expires in 30 days)');

    // 3. Create or refresh TPMJS API key
    console.log('\n📝 Creating TPMJS API key...');

    // Delete old test API keys
    await prisma.tpmjsApiKey.deleteMany({
      where: {
        userId: user.id,
        name: { startsWith: 'Integration Test' },
      },
    });

    // Generate API key
    const apiKeyRaw = `tpmjs_sk_${randomBytes(24).toString('hex')}`;
    const keyHash = createHash('sha256').update(apiKeyRaw).digest('hex');
    const keyPrefix = apiKeyRaw.slice(0, 16);

    await prisma.tpmjsApiKey.create({
      data: {
        userId: user.id,
        name: 'Integration Test Key',
        keyHash,
        keyPrefix,
        scopes: ['mcp:execute', 'agent:chat', 'bridge:connect', 'usage:read'],
        isActive: true,
      },
    });
    console.log('   API key created');

    // 4. Store OPENAI_API_KEY for agent conversations (if available)
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      console.log('\n📝 Storing OPENAI_API_KEY for agent conversations...');

      // Import encryption function
      const { encryptApiKey } = await import('@/lib/crypto/api-keys');

      // Delete existing key if any
      await prisma.userApiKey.deleteMany({
        where: {
          userId: user.id,
          keyName: 'OPENAI_API_KEY',
        },
      });

      // Encrypt and store the key
      const { encrypted, iv } = encryptApiKey(openaiKey);
      await prisma.userApiKey.create({
        data: {
          userId: user.id,
          keyName: 'OPENAI_API_KEY',
          encryptedKey: encrypted,
          keyIv: iv,
          keyHint: openaiKey.slice(-4),
        },
      });
      console.log('   OPENAI_API_KEY stored');
    } else {
      console.log('\n⚠️  OPENAI_API_KEY not set - agent conversation tests will be skipped');
    }

    // 5. Output credentials
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Integration test credentials generated!\n');
    console.log('Add these to your .env.local or GitHub secrets:\n');
    console.log('```');
    console.log(`INTEGRATION_TEST_USER_ID=${user.id}`);
    console.log(`INTEGRATION_TEST_USERNAME=${TEST_USERNAME}`);
    console.log(`INTEGRATION_TEST_SESSION_TOKEN=${sessionToken}`);
    console.log(`INTEGRATION_TEST_API_KEY=${apiKeyRaw}`);
    console.log('```');
    console.log('\n' + '='.repeat(60));

    // 5. Verify credentials work
    console.log('\n🔍 Verifying credentials...');

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (session && session.user.id === user.id) {
      console.log('   ✅ Session token is valid');
    } else {
      console.log('   ❌ Session token verification failed');
    }

    const apiKey = await prisma.tpmjsApiKey.findUnique({
      where: { keyHash },
    });

    if (apiKey && apiKey.userId === user.id) {
      console.log('   ✅ API key is valid');
    } else {
      console.log('   ❌ API key verification failed');
    }

    console.log('\n✅ Setup complete!\n');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
