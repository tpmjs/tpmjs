import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/tool.ts', 'src/registry.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  splitting: false,
});
