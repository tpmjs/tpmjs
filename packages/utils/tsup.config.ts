import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cn.ts', 'src/format.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  splitting: false,
});
