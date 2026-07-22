import { defineConfig } from 'tsdown';
import { multiEntryLibraryConfig } from '../../tsdown.config.ts';

export default defineConfig((inlineConfig) => ({
  ...multiEntryLibraryConfig,
  entry: {
    index: 'src/index.ts',
    'adapters/registry': 'src/adapters/registry.ts',
  },
  cwd: inlineConfig.cwd ?? process.cwd(),
}));
