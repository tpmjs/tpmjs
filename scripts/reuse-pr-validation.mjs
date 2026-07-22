#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const CI_WORKFLOW_PATH = '.github/workflows/ci.yml';

function defaultGit(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function rejection(reason) {
  return { reuse: false, reason };
}

class ProvenanceMiss extends Error {}

function rejectProvenance(reason) {
  throw new ProvenanceMiss(reason);
}

function githubHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'tpmjs-validation-provenance',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function fetchGithubJson({ fetchImpl, headers, label, url }) {
  const response = await fetchImpl(url, { headers });
  if (!response.ok) {
    rejectProvenance(`${label} returned HTTP ${response.status}`);
  }
  return response.json();
}

function requireExactTree({ mergeTree, sourceTree, source }) {
  if (typeof sourceTree !== 'string' || sourceTree.length === 0) {
    rejectProvenance('the pull-request head tree is unavailable');
  }
  if (mergeTree !== sourceTree) {
    rejectProvenance('the merge tree differs from the pull-request head tree');
  }
  return { ...source, sourceTree };
}

function isExactPullRequestAssociation(pullRequest, { refName, repository, sha }) {
  return [
    pullRequest?.state === 'closed',
    Boolean(pullRequest?.merged_at),
    pullRequest?.merge_commit_sha === sha,
    pullRequest?.base?.repo?.full_name === repository,
    pullRequest?.base?.ref === refName,
    Number.isInteger(pullRequest?.number),
    typeof pullRequest?.head?.sha === 'string' && pullRequest.head.sha.length > 0,
    typeof pullRequest?.head?.ref === 'string' && pullRequest.head.ref.length > 0,
    typeof pullRequest?.head?.repo?.full_name === 'string' &&
      pullRequest.head.repo.full_name.length > 0,
  ].every(Boolean);
}

async function resolveSingleParentSource({
  fetchImpl,
  headers,
  mergeTree,
  refName,
  repository,
  sha,
}) {
  if (!refName) {
    rejectProvenance('the pushed ref name is unavailable for single-parent provenance');
  }

  const pullRequestUrl = new URL(`https://api.github.com/repos/${repository}/commits/${sha}/pulls`);
  const pullRequests = await fetchGithubJson({
    fetchImpl,
    headers,
    label: 'GitHub commit-to-pull-request lookup',
    url: pullRequestUrl,
  });
  if (!Array.isArray(pullRequests)) {
    rejectProvenance('GitHub commit-to-pull-request lookup returned an unexpected response');
  }

  const matchingPullRequests = pullRequests.filter((pullRequest) =>
    isExactPullRequestAssociation(pullRequest, { refName, repository, sha })
  );
  if (matchingPullRequests.length !== 1) {
    rejectProvenance(
      'the single-parent revision is not uniquely associated with an exact merged pull request'
    );
  }

  const pullRequest = matchingPullRequests[0];
  const sourceSha = pullRequest.head.sha;
  const sourceCommitUrl = new URL(
    `https://api.github.com/repos/${repository}/git/commits/${encodeURIComponent(sourceSha)}`
  );
  const sourceCommit = await fetchGithubJson({
    fetchImpl,
    headers,
    label: 'GitHub source-commit lookup',
    url: sourceCommitUrl,
  });
  if (typeof sourceCommit?.tree?.sha !== 'string' || sourceCommit.tree.sha.length === 0) {
    rejectProvenance('GitHub source-commit lookup returned an unexpected response');
  }

  return requireExactTree({
    mergeTree,
    sourceTree: sourceCommit.tree.sha,
    source: {
      integrationMethod: 'squash',
      sourceHeadRef: pullRequest.head.ref,
      sourceHeadRepository: pullRequest.head.repo.full_name,
      sourcePullRequest: String(pullRequest.number),
      sourceSha,
    },
  });
}

async function resolveSource({ fetchImpl, headers, git, refName, repository, sha }) {
  const revision = git(['rev-list', '--parents', '-n', '1', sha]).split(/\s+/);
  if (revision[0] !== sha) {
    rejectProvenance('the pushed revision could not be resolved exactly');
  }

  const mergeTree = git(['show', '-s', '--format=%T', sha]);
  if (!mergeTree) {
    rejectProvenance('the pushed revision tree is unavailable');
  }

  if (revision.length === 3) {
    const sourceSha = revision[2];
    return requireExactTree({
      mergeTree,
      sourceTree: git(['show', '-s', '--format=%T', sourceSha]),
      source: { integrationMethod: 'merge', sourceSha },
    });
  }
  if (revision.length !== 2) {
    rejectProvenance('the pushed revision is not a supported one- or two-parent integration');
  }

  return resolveSingleParentSource({
    fetchImpl,
    headers,
    mergeTree,
    refName,
    repository,
    sha,
  });
}

function isExactSuccessfulRun(run, source) {
  const exactRun = [
    run?.head_sha === source.sourceSha,
    run?.event === 'pull_request',
    run?.status === 'completed',
    run?.conclusion === 'success',
    run?.path === CI_WORKFLOW_PATH,
  ].every(Boolean);
  if (!exactRun) return false;
  if (source.integrationMethod !== 'squash') return true;
  return (
    run?.head_branch === source.sourceHeadRef &&
    run?.head_repository?.full_name === source.sourceHeadRepository
  );
}

async function findSuccessfulRun({ fetchImpl, headers, repository, source }) {
  const url = new URL(`https://api.github.com/repos/${repository}/actions/workflows/ci.yml/runs`);
  url.searchParams.set('head_sha', source.sourceSha);
  url.searchParams.set('event', 'pull_request');
  url.searchParams.set('status', 'completed');
  url.searchParams.set('per_page', '100');

  const payload = await fetchGithubJson({
    fetchImpl,
    headers,
    label: 'GitHub workflow lookup',
    url,
  });
  if (!Array.isArray(payload?.workflow_runs)) {
    rejectProvenance('GitHub workflow lookup returned an unexpected response');
  }
  return payload.workflow_runs.find((run) => isExactSuccessfulRun(run, source));
}

export async function findReusablePullRequestValidation({
  sha,
  repository,
  refName,
  token,
  git = defaultGit,
  fetchImpl = globalThis.fetch,
}) {
  try {
    if (!sha || !repository || !token) {
      return rejection('required GitHub provenance input is unavailable');
    }

    const headers = githubHeaders(token);
    const source = await resolveSource({
      fetchImpl,
      headers,
      git,
      refName,
      repository,
      sha,
    });
    const sourceRun = await findSuccessfulRun({ fetchImpl, headers, repository, source });
    if (!sourceRun) {
      rejectProvenance('no successful completed pull-request CI run exists for the exact head SHA');
    }

    return {
      reuse: true,
      reason: 'the merge tree is identical to an exact successfully validated pull-request head',
      integrationMethod: source.integrationMethod,
      sourcePullRequest: source.sourcePullRequest,
      sourceSha: source.sourceSha,
      sourceTree: source.sourceTree,
      sourceRunId: String(sourceRun.id),
      sourceRunUrl: sourceRun.html_url ?? '',
    };
  } catch (error) {
    if (error instanceof ProvenanceMiss) {
      return rejection(error.message);
    }
    const detail = error instanceof Error ? error.message : String(error);
    return rejection(`provenance lookup failed safely: ${detail}`);
  }
}

function writeOutput(result) {
  const output = [
    `reuse=${String(result.reuse)}`,
    `reason=${result.reason.replaceAll('\n', ' ')}`,
    `integration_method=${result.integrationMethod ?? ''}`,
    `source_pull_request=${result.sourcePullRequest ?? ''}`,
    `source_sha=${result.sourceSha ?? ''}`,
    `source_tree=${result.sourceTree ?? ''}`,
    `source_run_id=${result.sourceRunId ?? ''}`,
    `source_run_url=${result.sourceRunUrl ?? ''}`,
  ].join('\n');

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${output}\n`);
  } else {
    console.log(output);
  }
}

function writeSummary(result) {
  const heading = result.reuse
    ? '## Reused exact pull-request validation'
    : '## Running the complete validation suite';
  const details = result.reuse
    ? [
        `- Integration method: \`${result.integrationMethod}\``,
        ...(result.sourcePullRequest
          ? [`- Source pull request: \`#${result.sourcePullRequest}\``]
          : []),
        `- Source commit: \`${result.sourceSha}\``,
        `- Source tree: \`${result.sourceTree}\``,
        `- Source run: [${result.sourceRunId}](${result.sourceRunUrl})`,
      ]
    : [];
  const summary = [heading, '', result.reason, ...details, ''].join('\n');

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  } else {
    console.log(summary);
  }
}

async function main() {
  const result = await findReusablePullRequestValidation({
    sha: process.env.GITHUB_SHA,
    repository: process.env.GITHUB_REPOSITORY,
    refName: process.env.GITHUB_REF_NAME,
    token: process.env.GITHUB_TOKEN,
  });
  writeOutput(result);
  writeSummary(result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
