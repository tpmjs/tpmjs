/**
 * Vitest test setup for @tpmjs/web
 * Loads environment variables and configures test environment
 */

import { resolve } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local or .env
config({ path: resolve(__dirname, '../../.env.local') });
config({ path: resolve(__dirname, '../../.env') });

// Validate required environment variables for AI tests
const requiredEnvVars = ['OPENAI_API_KEY'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Warning: ${envVar} not set. Some tests may be skipped.`);
  }
}
