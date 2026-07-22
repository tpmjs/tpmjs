import { defineConfig } from 'tsdown';
import { multiEntryLibraryConfig } from '../../tsdown.config.ts';

export default defineConfig((inlineConfig) => ({
  ...multiEntryLibraryConfig,
  entry: {
    cn: 'src/cn.ts',
    format: 'src/format.ts',
  },
  cwd: inlineConfig.cwd ?? process.cwd(),
}));
