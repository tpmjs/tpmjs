import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/test/integration/**/*.integration.test.ts'],
    setupFiles: ['./src/test/integration/setup-integration.ts'],
    testTimeout: 60000, // 60s for API calls to production
    // Run tests sequentially to avoid race conditions on shared test data
    sequence: {
      concurrent: false,
    },
    // Fail fast on integration tests
    bail: 5,
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
    },
  },
});
