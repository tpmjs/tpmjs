import { describe, it, expect } from 'vitest';
import { assertValidTool, executeTool } from '@tpmjs/tool-test-utils';
import { exampleRedis } from './index.js';

describe('redis tools', () => {
  describe('exampleRedis', () => {
    it('should have valid tool structure', () => {
      assertValidTool(exampleRedis, 'exampleRedis');
    });

    it('should echo a message', async () => {
      const { result, error } = await executeTool(exampleRedis, {
        message: 'Hello, World!',
      });

      expect(error).toBeUndefined();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Echo: Hello, World!');
      expect(result).toHaveProperty('timestamp');
    });

    it('should handle empty message', async () => {
      const { result, error } = await executeTool(exampleRedis, {
        message: '',
      });

      expect(error).toBeUndefined();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('message', 'Echo: ');
    });
  });
});
