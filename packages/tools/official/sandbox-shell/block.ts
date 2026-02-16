/**
 * Block metadata for sandbox-shell tools
 * This file provides metadata for the blocks validator
 */
import { listFiles, readFile, shellExec, writeFile } from './src/index.js';

export const block = {
  name: 'sandbox-shell',
  description: 'Shell execution, file I/O, and directory listing for the TPMJS Agent Sandbox',
  tools: { shellExec, readFile, writeFile, listFiles },
};

export default block;
