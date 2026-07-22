import { defineConfig } from 'tsdown';
import { multiEntryLibraryConfig } from '../../../tsdown.config.ts';

export default defineConfig((inlineConfig) => ({
  ...multiEntryLibraryConfig,
  entry: {
    index: 'src/index.ts',
    server: 'src/server.ts',
  },
  sourcemap: true,
  cwd: inlineConfig.cwd ?? process.cwd(),
}));
