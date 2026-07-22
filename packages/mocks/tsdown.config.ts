import { defineConfig } from 'tsdown';
import { multiEntryLibraryConfig } from '../../tsdown.config.ts';

export default defineConfig((inlineConfig) => ({
  ...multiEntryLibraryConfig,
  entry: {
    server: 'src/server.ts',
    handlers: 'src/handlers.ts',
  },
  cwd: inlineConfig.cwd ?? process.cwd(),
}));
