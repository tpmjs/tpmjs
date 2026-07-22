import assert from 'node:assert/strict';
import test from 'node:test';

import { findReusablePullRequestValidation } from './reuse-pr-validation.mjs';

const mergeSha = 'a'.repeat(40);
const firstParent = 'b'.repeat(40);
const sourceSha = 'c'.repeat(40);
const sharedTree = 'd'.repeat(40);
const repository = 'tpmjs/tpmjs';
const refName = 'main';

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

function jsonResponse(payload, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: async () => payload,
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
    head_branch: 'perf/squash-validation-reuse',
    head_repository: { full_name: repository },
    html_url: 'https://github.com/tpmjs/tpmjs/actions/runs/123',
    ...overrides,
  };
}

function associatedPullRequest(overrides = {}) {
  return {
    number: 171,
    state: 'closed',
    merged_at: '2026-07-22T22:24:05Z',
    merge_commit_sha: mergeSha,
    base: { ref: refName, repo: { full_name: repository } },
    head: {
      sha: sourceSha,
      ref: 'perf/squash-validation-reuse',
      repo: { full_name: repository },
    },
    ...overrides,
  };
}

function fetchFixture({
  pullRequests = [associatedPullRequest()],
  sourceTree = sharedTree,
  workflowRuns = [successfulRun()],
  onRequest = () => {},
} = {}) {
  return async (url) => {
    onRequest(url);
    if (url.pathname.endsWith(`/commits/${mergeSha}/pulls`)) {
      return jsonResponse(pullRequests);
    }
    if (url.pathname.endsWith(`/git/commits/${sourceSha}`)) {
      return jsonResponse({ tree: { sha: sourceTree } });
    }
    if (url.pathname.endsWith('/actions/workflows/ci.yml/runs')) {
      return jsonResponse({ workflow_runs: workflowRuns });
    }
    throw new Error(`unexpected GitHub request: ${url}`);
  };
}

function decide({
  git = gitFixture(),
  workflowRuns = [successfulRun()],
  fetchImpl,
  pushedRefName = refName,
} = {}) {
  return findReusablePullRequestValidation({
    sha: mergeSha,
    repository,
    refName: pushedRefName,
    token: 'test-token',
    git,
    fetchImpl: fetchImpl ?? fetchFixture({ workflowRuns }),
  });
}

test('reuses exact pull-request validation for an identical two-parent merge tree', async () => {
  let requestedUrl;
  const result = await decide({
    fetchImpl: fetchFixture({
      onRequest: (url) => {
        requestedUrl = url;
      },
    }),
  });

  assert.equal(result.reuse, true);
  assert.equal(result.integrationMethod, 'merge');
  assert.equal(result.sourcePullRequest, undefined);
  assert.equal(result.sourceSha, sourceSha);
  assert.equal(result.sourceTree, sharedTree);
  assert.equal(result.sourceRunId, '123');
  assert.equal(requestedUrl.searchParams.get('head_sha'), sourceSha);
  assert.equal(requestedUrl.searchParams.get('event'), 'pull_request');
  assert.equal(requestedUrl.searchParams.get('status'), 'completed');
});

test('reuses exact pull-request validation for a uniquely associated squash merge', async () => {
  const requestedPaths = [];
  const result = await decide({
    git: gitFixture({ parents: [mergeSha, firstParent] }),
    fetchImpl: fetchFixture({ onRequest: (url) => requestedPaths.push(url.pathname) }),
  });

  assert.equal(result.reuse, true);
  assert.equal(result.integrationMethod, 'squash');
  assert.equal(result.sourcePullRequest, '171');
  assert.equal(result.sourceSha, sourceSha);
  assert.equal(result.sourceTree, sharedTree);
  assert.deepEqual(requestedPaths, [
    `/repos/${repository}/commits/${mergeSha}/pulls`,
    `/repos/${repository}/git/commits/${sourceSha}`,
    `/repos/${repository}/actions/workflows/ci.yml/runs`,
  ]);
});

test('rejects a direct push when GitHub has no exact merged pull-request association', async () => {
  const result = await decide({
    git: gitFixture({ parents: [mergeSha, firstParent] }),
    fetchImpl: fetchFixture({ pullRequests: [] }),
  });

  assert.equal(result.reuse, false);
  assert.match(result.reason, /not uniquely associated/);
});

test('rejects ambiguous or inexact single-parent pull-request associations', async () => {
  const invalidAssociations = [
    [associatedPullRequest(), associatedPullRequest({ number: 172 })],
    [associatedPullRequest({ merge_commit_sha: firstParent })],
    [
      associatedPullRequest({
        base: { ref: 'release', repo: { full_name: repository } },
      }),
    ],
    [
      associatedPullRequest({
        base: { ref: refName, repo: { full_name: 'someone/else' } },
      }),
    ],
    [associatedPullRequest({ state: 'open', merged_at: null })],
    [associatedPullRequest({ number: undefined })],
    [associatedPullRequest({ head: { sha: sourceSha, ref: '', repo: { full_name: repository } } })],
    [associatedPullRequest({ head: { sha: sourceSha, ref: 'feature', repo: null } })],
  ];

  for (const pullRequests of invalidAssociations) {
    const result = await decide({
      git: gitFixture({ parents: [mergeSha, firstParent] }),
      fetchImpl: fetchFixture({ pullRequests }),
    });
    assert.equal(result.reuse, false);
    assert.match(result.reason, /not uniquely associated/);
  }
});

test('rejects a single-parent revision when its destination ref is unavailable', async () => {
  let fetched = false;
  const result = await decide({
    git: gitFixture({ parents: [mergeSha, firstParent] }),
    pushedRefName: '',
    fetchImpl: async () => {
      fetched = true;
      return jsonResponse([]);
    },
  });

  assert.equal(result.reuse, false);
  assert.match(result.reason, /ref name is unavailable/);
  assert.equal(fetched, false);
});

test('rejects a merge whose tree differs from the pull-request head', async () => {
  const normalMerge = await decide({ git: gitFixture({ sourceTree: 'e'.repeat(40) }) });
  const squashMerge = await decide({
    git: gitFixture({ parents: [mergeSha, firstParent] }),
    fetchImpl: fetchFixture({ sourceTree: 'e'.repeat(40) }),
  });

  assert.equal(normalMerge.reuse, false);
  assert.match(normalMerge.reason, /tree differs/);
  assert.equal(squashMerge.reuse, false);
  assert.match(squashMerge.reason, /tree differs/);
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

test('binds squash validation to the associated pull-request branch and repository', async () => {
  for (const run of [
    successfulRun({ head_branch: 'different-branch' }),
    successfulRun({ head_repository: { full_name: 'someone/else' } }),
  ]) {
    const result = await decide({
      git: gitFixture({ parents: [mergeSha, firstParent] }),
      fetchImpl: fetchFixture({ workflowRuns: [run] }),
    });
    assert.equal(result.reuse, false);
    assert.match(result.reason, /no successful completed pull-request CI run/);
  }
});

test('fails open to complete validation when GitHub is unavailable or malformed', async () => {
  const unavailable = await decide({
    fetchImpl: async () => jsonResponse({}, { ok: false, status: 503 }),
  });
  const malformed = await decide({
    fetchImpl: async () => jsonResponse({}),
  });
  const rejected = await decide({
    fetchImpl: async () => {
      throw new Error('network unavailable');
    },
  });
  const malformedSourceCommit = await decide({
    git: gitFixture({ parents: [mergeSha, firstParent] }),
    fetchImpl: async (url) => {
      if (url.pathname.endsWith('/pulls')) {
        return jsonResponse([associatedPullRequest()]);
      }
      return jsonResponse({});
    },
  });

  assert.equal(unavailable.reuse, false);
  assert.match(unavailable.reason, /HTTP 503/);
  assert.equal(malformed.reuse, false);
  assert.match(malformed.reason, /unexpected response/);
  assert.equal(rejected.reuse, false);
  assert.match(rejected.reason, /failed safely/);
  assert.equal(malformedSourceCommit.reuse, false);
  assert.match(
    malformedSourceCommit.reason,
    /source-commit lookup returned an unexpected response/
  );
});
