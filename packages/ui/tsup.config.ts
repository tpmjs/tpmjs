import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/Button/Button.ts', 'src/Card/Card.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  splitting: false,
  external: ['react', 'react-dom'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
