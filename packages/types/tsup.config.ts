import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/tool.ts',
    'src/registry.ts',
    'src/tpmjs.ts',
    'src/collection.ts',
    'src/agent.ts',
    'src/user.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  splitting: false,
});
