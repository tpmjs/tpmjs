import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 30000, // 30s for API calls
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
    },
  },
});
