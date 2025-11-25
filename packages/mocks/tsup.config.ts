import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts', 'src/handlers.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
});
