import { defineConfig } from 'tsup';

export default defineConfig([
  // Main library exports
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: false,
    clean: true,
    treeshake: true,
    splitting: false,
  },
  // CLI entry point (with shebang)
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    dts: false,
    clean: false,
    treeshake: true,
    splitting: false,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
