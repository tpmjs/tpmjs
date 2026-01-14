/**
 * Block metadata for unsandbox tools
 * This file provides metadata for the blocks validator
 */
import { execute, executeCodeAsync, getJob, run } from './src/index.js';

export const block = {
  name: 'unsandbox',
  description: 'Execute code in a secure sandbox environment supporting 42+ languages',
  tools: {
    executeCodeAsync,
    getJob,
    execute,
    run,
  },
};

export default block;
