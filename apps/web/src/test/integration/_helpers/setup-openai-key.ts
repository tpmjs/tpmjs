#!/usr/bin/env tsx
/**
 * Setup script to store OPENAI_API_KEY for integration tests
 *
 * This script should be run in CI before the integration tests to ensure
 * the test user has an OPENAI_API_KEY configured for agent conversation tests.
 *
 * Required environment variables:
 * - DATABASE_URL: Neon PostgreSQL connection string
 * - API_KEY_ENCRYPTION_SECRET: Encryption secret for API keys
 * - OPENAI_API_KEY: The OpenAI API key to store
 * - INTEGRATION_TEST_USER_ID: The test user's ID
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load environment variables
config({ path: resolve(__dirname, '../../../../.env.local') });
config({ path: resolve(__dirname, '../../../../.env') });

// Validate required env vars
const requiredEnvVars = [
  'DATABASE_URL',
  'API_KEY_ENCRYPTION_SECRET',
  'OPENAI_API_KEY',
  'INTEGRATION_TEST_USER_ID',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.log(`Skipping: ${envVar} not set`);
    process.exit(0); // Exit gracefully - tests that need this will be skipped
  }
}

// Import after env validation
import { prisma } from '@tpmjs/db';
import { encryptApiKey } from '@/lib/crypto/api-keys';

async function main() {
  const userId = process.env.INTEGRATION_TEST_USER_ID!;
  const openaiKey = process.env.OPENAI_API_KEY!;

  console.log('Setting up OPENAI_API_KEY for integration test user...');

  try {
    // Delete existing key if any
    await prisma.userApiKey.deleteMany({
      where: {
        userId,
        keyName: 'OPENAI_API_KEY',
      },
    });

    // Encrypt and store the key
    const { encrypted, iv } = encryptApiKey(openaiKey);
    await prisma.userApiKey.create({
      data: {
        userId,
        keyName: 'OPENAI_API_KEY',
        encryptedKey: encrypted,
        keyIv: iv,
        keyHint: openaiKey.slice(-4),
      },
    });

    console.log('OPENAI_API_KEY configured for test user');
  } catch (error) {
    console.error('Failed to setup OPENAI_API_KEY:', error);
    // Don't fail the build - tests will be skipped if key isn't available
    process.exit(0);
  } finally {
    await prisma.$disconnect();
  }
}

main();
