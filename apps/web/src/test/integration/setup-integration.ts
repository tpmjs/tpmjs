/**
 * Integration test setup
 *
 * This file runs before all integration tests to:
 * - Load environment variables
 * - Validate required configuration
 * - Set up global test utilities
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load environment variables
config({ path: resolve(__dirname, '../../../.env.local') });
config({ path: resolve(__dirname, '../../../.env') });

// Validate required environment variables
const requiredEnvVars = [
  'TEST_BASE_URL',
  'INTEGRATION_TEST_SESSION_TOKEN',
  'INTEGRATION_TEST_API_KEY',
];

const missingVars: string[] = [];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
  }
}

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables for integration tests:');
  for (const varName of missingVars) {
    console.error(`   - ${varName}`);
  }
  console.error('\nTo set up integration tests:');
  console.error('1. Run: pnpm --filter=@tpmjs/web test:setup-credentials');
  console.error('2. Add the generated values to your .env.local or GitHub secrets');
  process.exit(1);
}

// Optional environment variables (warn if missing)
const optionalEnvVars = ['CRON_SECRET'];

for (const envVar of optionalEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Warning: ${envVar} not set. Cron endpoint tests may be skipped.`);
  }
}

// Log configuration (without sensitive values)
console.log('✅ Integration test configuration:');
console.log(`   Base URL: ${process.env.TEST_BASE_URL}`);
console.log(`   Session token: ${process.env.INTEGRATION_TEST_SESSION_TOKEN?.slice(0, 10)}...`);
console.log(`   API key: ${process.env.INTEGRATION_TEST_API_KEY?.slice(0, 15)}...`);
console.log(`   Cron secret: ${process.env.CRON_SECRET ? 'configured' : 'not set'}`);
console.log('');
