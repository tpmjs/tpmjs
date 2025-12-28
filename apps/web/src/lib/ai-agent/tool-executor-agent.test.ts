/**
 * Tests for AI SDK v6 integration
 * Verifies the upgrade from beta to stable versions works correctly
 */

import { openai } from '@ai-sdk/openai';
import { type ModelMessage, generateText } from 'ai';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  calculateTokenBreakdown,
  createToolDefinition,
  tpmjsParamsToZodSchema,
} from './tool-executor-agent';

describe('AI SDK v6 Integration', () => {
  describe('Type compatibility', () => {
    it('should use ModelMessage type correctly', () => {
      const messages: ModelMessage[] = [
        {
          role: 'user',
          content: 'Hello world',
        },
      ];

      expect(messages).toHaveLength(1);
      const firstMessage = messages[0];
      expect(firstMessage).toBeDefined();
      expect(firstMessage?.role).toBe('user');
      expect(firstMessage?.content).toBe('Hello world');
    });

    it('should create openai model instance', () => {
      // This will fail if OPENAI_API_KEY is not set, but that's expected
      // The important thing is that the import works
      const model = openai('gpt-4-turbo');
      expect(model).toBeDefined();
      expect(model.modelId).toBe('gpt-4-turbo');
    });
  });

  describe('tpmjsParamsToZodSchema', () => {
    it('should convert string parameter to Zod string schema', () => {
      const params = [
        {
          name: 'url',
          type: 'string',
          required: true,
          description: 'The URL to fetch',
        },
      ];

      const schema = tpmjsParamsToZodSchema(params);
      expect(schema).toBeDefined();

      // Test that valid data passes
      const result = schema.safeParse({ url: 'https://example.com' });
      expect(result.success).toBe(true);

      // Test that invalid data fails
      const invalidResult = schema.safeParse({ url: 123 });
      expect(invalidResult.success).toBe(false);
    });

    it('should convert number parameter to Zod number schema', () => {
      const params = [
        {
          name: 'count',
          type: 'number',
          required: true,
          description: 'Number of items',
        },
      ];

      const schema = tpmjsParamsToZodSchema(params);
      const result = schema.safeParse({ count: 42 });
      expect(result.success).toBe(true);
    });

    it('should convert boolean parameter to Zod boolean schema', () => {
      const params = [
        {
          name: 'enabled',
          type: 'boolean',
          required: true,
          description: 'Whether feature is enabled',
        },
      ];

      const schema = tpmjsParamsToZodSchema(params);
      const result = schema.safeParse({ enabled: true });
      expect(result.success).toBe(true);
    });

    it('should handle optional parameters', () => {
      const params = [
        {
          name: 'optional',
          type: 'string',
          required: false,
          description: 'Optional parameter',
        },
      ];

      const schema = tpmjsParamsToZodSchema(params);

      // Should pass without the optional field
      const result = schema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should handle array types', () => {
      const params = [
        {
          name: 'items',
          type: 'string[]',
          required: true,
          description: 'List of items',
        },
      ];

      const schema = tpmjsParamsToZodSchema(params);
      const result = schema.safeParse({ items: ['a', 'b', 'c'] });
      expect(result.success).toBe(true);
    });

    it('should handle enum/union types', () => {
      const params = [
        {
          name: 'format',
          type: "'markdown' | 'mdx'",
          required: true,
          description: 'Output format',
        },
      ];

      const schema = tpmjsParamsToZodSchema(params);

      const validResult = schema.safeParse({ format: 'markdown' });
      expect(validResult.success).toBe(true);

      const invalidResult = schema.safeParse({ format: 'html' });
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('createToolDefinition', () => {
    it('should create a valid AI SDK tool definition', () => {
      const mockTool = {
        id: 'test-id',
        name: 'helloWorld',
        description: 'Says hello to the world',
        parameters: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Name to greet',
          },
        ],
        returns: { type: 'string', description: 'Greeting message' },
        packageId: 'pkg-id',
        package: {
          id: 'pkg-id',
          npmPackageName: '@tpmjs/hello',
          npmVersion: '1.0.0',
          description: 'Hello world tool',
          tpmjsVersion: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          tier: 'rich',
          npmDownloadsLastMonth: 100,
          qualityScore: 0.8,
          category: 'utility',
          discoveryMethod: 'keyword',
          manualToolsJson: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // biome-ignore lint/suspicious/noExplicitAny: Mock data for testing
      const toolDef = createToolDefinition(mockTool as any);

      expect(toolDef).toBeDefined();
      expect(toolDef.description).toBe('Says hello to the world');
      expect(toolDef.inputSchema).toBeDefined();
      expect(typeof toolDef.execute).toBe('function');
    });

    it('should handle tools with no parameters', () => {
      const mockTool = {
        id: 'test-id',
        name: 'noParams',
        description: 'Tool with no parameters',
        parameters: [],
        returns: { type: 'string', description: 'Result' },
        packageId: 'pkg-id',
        package: {
          id: 'pkg-id',
          npmPackageName: '@tpmjs/no-params',
          npmVersion: '1.0.0',
          description: 'No params tool',
          tpmjsVersion: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          tier: 'minimal',
          npmDownloadsLastMonth: 0,
          qualityScore: 0.4,
          category: 'utility',
          discoveryMethod: 'keyword',
          manualToolsJson: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // biome-ignore lint/suspicious/noExplicitAny: Mock data for testing
      const toolDef = createToolDefinition(mockTool as any);

      expect(toolDef).toBeDefined();
      expect(toolDef.inputSchema).toBeDefined();
    });
  });

  describe('calculateTokenBreakdown', () => {
    it('should calculate token breakdown correctly', () => {
      const breakdown = calculateTokenBreakdown(
        'What is the weather?', // userPrompt
        'Get weather for a location', // toolDescription
        [{ name: 'location', type: 'string', required: true, description: 'City name' }],
        { type: 'object', description: 'Weather data' },
        '{"temperature": 72, "condition": "sunny"}' // output
      );

      expect(breakdown).toBeDefined();
      expect(breakdown.inputTokens).toBeGreaterThan(0);
      expect(breakdown.toolDescTokens).toBeGreaterThan(0);
      expect(breakdown.schemaTokens).toBeGreaterThan(0);
      expect(breakdown.outputTokens).toBeGreaterThan(0);
      expect(breakdown.totalTokens).toBe(
        breakdown.inputTokens +
          breakdown.toolDescTokens +
          breakdown.schemaTokens +
          breakdown.outputTokens
      );
      expect(breakdown.estimatedCost).toBeGreaterThan(0);
    });
  });
});

describe('AI SDK v6 API Integration', () => {
  const hasApiKey = !!process.env.OPENAI_API_KEY;

  beforeAll(() => {
    if (!hasApiKey) {
      console.log('⚠️  OPENAI_API_KEY not set - skipping API integration tests');
    }
  });

  it.skipIf(!hasApiKey)(
    'should successfully call generateText with a simple prompt',
    async () => {
      const result = await generateText({
        model: openai('gpt-4o-mini'),
        messages: [
          {
            role: 'user',
            content: 'Say "hello" and nothing else.',
          },
        ],
      });

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.text.toLowerCase()).toContain('hello');
    },
    30000
  );
});
