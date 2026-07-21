import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractOpenApiOperations,
  extractToolOperations,
  verifyContract,
  verifyManifest,
} from './vercel-contract-lib';

const source = `
export const listProjects = tool({
  async execute(input) {
    return apiRequest<unknown>('GET', '/v10/projects', undefined, input);
  },
});

export const getProject = tool({
  async execute(input) {
    return apiRequest<unknown>('GET', \`/v9/projects/\${encodeURIComponent(input.id)}\`);
  },
});

export const downloadArtifact = tool({
  async execute(input) {
    const qs = input.slug ? \`?slug=\${input.slug}\` : '';
    return fetch(\`\${BASE_URL}/v8/artifacts/\${input.hash}\${qs}\`, { method: 'HEAD' });
  },
});
`;

const document = {
  openapi: '3.0.3',
  paths: {
    '/v10/projects': { get: {} },
    '/v9/projects/{idOrName}': { get: {} },
    '/v8/artifacts/{hash}': { get: {} },
    '/v1/old': { get: { deprecated: true } },
  },
};

test('extracts apiRequest and direct fetch operations from exported AI tools', () => {
  assert.deepEqual(extractToolOperations(source), {
    operations: [
      { name: 'listProjects', method: 'GET', path: '/v10/projects' },
      { name: 'getProject', method: 'GET', path: '/v9/projects/{}' },
      { name: 'downloadArtifact', method: 'HEAD', path: '/v8/artifacts/{}' },
    ],
    unresolved: [],
  });
});

test('extracts methods, normalized paths, and deprecation from OpenAPI', () => {
  assert.deepEqual(extractOpenApiOperations(document), [
    { method: 'GET', path: '/v10/projects', deprecated: false },
    { method: 'GET', path: '/v9/projects/{}', deprecated: false },
    { method: 'GET', path: '/v8/artifacts/{}', deprecated: false },
    { method: 'GET', path: '/v1/old', deprecated: true },
  ]);
});

test('accepts HEAD when OpenAPI declares GET for the same resource', () => {
  const result = verifyContract(source, document);
  assert.equal(result.matched.length, 3);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.unresolved, []);
});

test('reports operations absent from the current OpenAPI contract', () => {
  const drifted = source.replace('/v10/projects', '/v9/projects');
  const result = verifyContract(drifted, document);
  assert.deepEqual(result.missing, [{ name: 'listProjects', method: 'GET', path: '/v9/projects' }]);
});

test('reports exported tools whose network operation cannot be identified', () => {
  const result = extractToolOperations(
    `export const opaque = tool({ execute() { return run(); } });`
  );
  assert.deepEqual(result, { operations: [], unresolved: ['opaque'] });
});

test('requires package declarations and exported tools to stay in exact parity', () => {
  assert.deepEqual(verifyManifest(source, ['listProjects', 'getProject', 'downloadArtifact']), {
    duplicateDeclarations: [],
    missingImplementations: [],
    undeclaredImplementations: [],
  });
  assert.deepEqual(verifyManifest(source, ['listProjects', 'listProjects', 'missing']), {
    duplicateDeclarations: ['listProjects'],
    missingImplementations: ['missing'],
    undeclaredImplementations: ['getProject', 'downloadArtifact'],
  });
});
