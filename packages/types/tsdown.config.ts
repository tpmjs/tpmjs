import { defineConfig } from 'tsdown';
import { multiEntryLibraryConfig } from '../../tsdown.config.ts';

export default defineConfig((inlineConfig) => ({
  ...multiEntryLibraryConfig,
  entry: {
    tool: 'src/tool.ts',
    registry: 'src/registry.ts',
    tpmjs: 'src/tpmjs.ts',
    collection: 'src/collection.ts',
    agent: 'src/agent.ts',
    user: 'src/user.ts',
    executor: 'src/executor.ts',
  },
  cwd: inlineConfig.cwd ?? process.cwd(),
}));
