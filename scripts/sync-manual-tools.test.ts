import assert from 'node:assert/strict';
import test from 'node:test';
import {
  convertJsonSchemaToParameters,
  convertParametersToJsonSchema,
  extractToolSchema,
} from './sync-manual-tools.js';

function response(body: unknown, status = 200): typeof fetch {
  return async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
}

test('extractToolSchema validates and returns the executor contract', async () => {
  const result = await extractToolSchema(
    '@scope/example',
    'exampleTool',
    '1.2.3',
    response({
      success: true,
      tool: {
        description: 'Example tool',
        inputSchema: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query'],
        },
      },
    })
  );

  assert.deepEqual(result, {
    success: true,
    description: 'Example tool',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  });
});

test('extractToolSchema fails closed on malformed executor output', async () => {
  assert.deepEqual(
    await extractToolSchema('@scope/example', 'exampleTool', '1.2.3', response({ success: true })),
    { success: false, error: 'No inputSchema returned from executor' }
  );
  assert.deepEqual(
    await extractToolSchema('@scope/example', 'exampleTool', '1.2.3', response(['invalid'])),
    { success: false, error: 'Executor returned an invalid response' }
  );
});

test('extractToolSchema preserves structured executor errors', async () => {
  assert.deepEqual(
    await extractToolSchema(
      '@scope/example',
      'exampleTool',
      '1.2.3',
      response({ success: false, error: 'Package could not be loaded' }, 422)
    ),
    { success: false, error: 'Package could not be loaded' }
  );
});

test('manual parameter conversion round-trips the supported JSON Schema fields', () => {
  const inputSchema = convertParametersToJsonSchema([
    {
      name: 'query',
      type: 'string',
      description: 'Search query',
      required: true,
    },
    {
      name: 'limit',
      type: 'number',
      description: 'Maximum results',
      required: false,
      default: '10',
    },
  ]);

  assert.deepEqual(inputSchema, {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      limit: { type: 'number', description: 'Maximum results', default: '10' },
    },
    required: ['query'],
    additionalProperties: false,
  });
  assert.deepEqual(convertJsonSchemaToParameters(inputSchema), [
    { name: 'query', type: 'string', description: 'Search query', required: true },
    { name: 'limit', type: 'number', description: 'Maximum results', required: false },
  ]);
});
