import { defineConfig } from 'tsdown';
import { multiEntryLibraryConfig } from '../../tsdown.config.ts';

export default defineConfig((inlineConfig) => ({
  ...multiEntryLibraryConfig,
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  sourcemap: true,
  cwd: inlineConfig.cwd ?? process.cwd(),
}));
