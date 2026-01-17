/**
 * Block metadata for judge tool
 * This file provides metadata for the blocks validator
 */
import { judgeConversation } from './src/index.js';

export const block = {
  name: 'judge',
  description: 'AI conversation quality judge. Evaluates AI SDK messages across 10 metrics with scores, reasoning, suggestions, and actionable improvements.',
  tools: {
    judgeConversation,
  },
};

export default block;
