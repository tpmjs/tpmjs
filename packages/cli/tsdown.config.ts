import { defineConfig } from 'tsdown';
import { libraryConfig } from '../../tsdown.config.ts';

export default defineConfig((inlineConfig) => ({
  ...libraryConfig,
  entry: ['src/index.ts', 'src/commands/**/*.ts', 'src/hooks/**/*.ts'],
  sourcemap: true,
  shims: true,
  // Rolldown requires code splitting for multiple inputs. Every generated
  // chunk remains inside the published dist directory and is exercised by the
  // oclif manifest/runtime smoke tests.
  outputOptions: {
    codeSplitting: true,
  },
  cwd: inlineConfig.cwd ?? process.cwd(),
}));
