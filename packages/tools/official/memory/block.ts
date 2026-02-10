import { createMemoryTool, searchMemoryTool } from './src/index.js';

export const block = {
  name: 'memory',
  tools: { createMemoryTool, searchMemoryTool },
};

export default block;
