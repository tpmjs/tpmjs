import assert from 'node:assert/strict';
import test from 'node:test';

import { findReusablePullRequestValidation } from './reuse-pr-validation.mjs';

const mergeSha = 'a'.repeat(40);
const firstParent = 'b'.repeat(40);
const sourceSha = 'c'.repeat(40);
const sharedTree = 'd'.repeat(40);

function gitFixture({
  parents = [mergeSha, firstParent, sourceSha],
  sourceTree = sharedTree,
} = {}) {
  return (args) => {
    if (args[0] === 'rev-list') return parents.join(' ');
    if (args.at(-1) === mergeSha) return sharedTree;
    if (args.at(-1) === sourceSha) return sourceTree;
    throw new Error(`unexpected git command: ${args.join(' ')}`);
  };
}

function response(workflowRuns, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: async () => ({ workflow_runs: workflowRuns }),
  };
}

function successfulRun(overrides = {}) {
  return {
    id: 123,
    head_sha: sourceSha,
    event: 'pull_request',
    status: 'completed',
    conclusion: 'success',
    path: '.github/workflows/ci.yml',
    html_url: 'https://github.com/tpmjs/tpmjs/actions/runs/123',
    ...overrides,
  };
}

function decide({ git = gitFixture(), workflowRuns = [successfulRun()], fetchImpl } = {}) {
  return findReusablePullRequestValidation({
    sha: mergeSha,
    repository: 'tpmjs/tpmjs',
    token: 'test-token',
    git,
    fetchImpl: fetchImpl ?? (async () => response(workflowRuns)),
  });
}

test('reuses an exact successful pull-request validation for an identical merge tree', async () => {
  let requestedUrl;
  const result = await decide({
    fetchImpl: async (url) => {
      requestedUrl = url;
      return response([successfulRun()]);
    },
  });

  assert.equal(result.reuse, true);
  assert.equal(result.sourceSha, sourceSha);
  assert.equal(result.sourceTree, sharedTree);
  assert.equal(result.sourceRunId, '123');
  assert.equal(requestedUrl.searchParams.get('head_sha'), sourceSha);
  assert.equal(requestedUrl.searchParams.get('event'), 'pull_request');
  assert.equal(requestedUrl.searchParams.get('status'), 'completed');
});

test('rejects a direct push before consulting GitHub', async () => {
  let fetched = false;
  const result = await decide({
    git: gitFixture({ parents: [mergeSha, firstParent] }),
    fetchImpl: async () => {
      fetched = true;
      return response([]);
    },
  });

  assert.equal(result.reuse, false);
  assert.match(result.reason, /not a normal two-parent merge/);
  assert.equal(fetched, false);
});

test('rejects a merge whose tree differs from the pull-request head', async () => {
  const result = await decide({ git: gitFixture({ sourceTree: 'e'.repeat(40) }) });

  assert.equal(result.reuse, false);
  assert.match(result.reason, /tree differs/);
});

test('requires the exact workflow, commit, event, status, and successful conclusion', async () => {
  for (const run of [
    successfulRun({ head_sha: firstParent }),
    successfulRun({ event: 'push' }),
    successfulRun({ status: 'in_progress' }),
    successfulRun({ conclusion: 'failure' }),
    successfulRun({ path: '.github/workflows/release.yml' }),
  ]) {
    const result = await decide({ workflowRuns: [run] });
    assert.equal(result.reuse, false);
  }
});

test('fails open to complete validation when GitHub is unavailable or malformed', async () => {
  const unavailable = await decide({
    fetchImpl: async () => response([], { ok: false, status: 503 }),
  });
  const malformed = await decide({
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({}) }),
  });
  const rejected = await decide({
    fetchImpl: async () => {
      throw new Error('network unavailable');
    },
  });

  assert.equal(unavailable.reuse, false);
  assert.match(unavailable.reason, /HTTP 503/);
  assert.equal(malformed.reuse, false);
  assert.match(malformed.reason, /unexpected response/);
  assert.equal(rejected.reuse, false);
  assert.match(rejected.reason, /failed safely/);
});
