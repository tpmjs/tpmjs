import { defineConfig } from 'tsdown';
import { libraryConfig } from '../../../tsdown.config.ts';

export default defineConfig((inlineConfig) => ({
  ...libraryConfig,
  shims: true,
  cwd: inlineConfig.cwd ?? process.cwd(),
}));
