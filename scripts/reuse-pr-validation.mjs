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

export async function findReusablePullRequestValidation({
  sha,
  repository,
  token,
  git = defaultGit,
  fetchImpl = globalThis.fetch,
}) {
  try {
    if (!sha || !repository || !token) {
      return rejection('required GitHub provenance input is unavailable');
    }

    const revision = git(['rev-list', '--parents', '-n', '1', sha]).split(/\s+/);
    if (revision.length !== 3 || revision[0] !== sha) {
      return rejection('the pushed revision is not a normal two-parent merge commit');
    }

    const sourceSha = revision[2];
    const mergeTree = git(['show', '-s', '--format=%T', sha]);
    const sourceTree = git(['show', '-s', '--format=%T', sourceSha]);
    if (!mergeTree || mergeTree !== sourceTree) {
      return rejection('the merge tree differs from the pull-request head tree');
    }

    const url = new URL(`https://api.github.com/repos/${repository}/actions/workflows/ci.yml/runs`);
    url.searchParams.set('head_sha', sourceSha);
    url.searchParams.set('event', 'pull_request');
    url.searchParams.set('status', 'completed');
    url.searchParams.set('per_page', '100');

    const response = await fetchImpl(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'tpmjs-validation-provenance',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok) {
      return rejection(`GitHub workflow lookup returned HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload?.workflow_runs)) {
      return rejection('GitHub workflow lookup returned an unexpected response');
    }

    const sourceRun = payload.workflow_runs.find(
      (run) =>
        run?.head_sha === sourceSha &&
        run?.event === 'pull_request' &&
        run?.status === 'completed' &&
        run?.conclusion === 'success' &&
        run?.path === CI_WORKFLOW_PATH
    );
    if (!sourceRun) {
      return rejection('no successful completed pull-request CI run exists for the exact head SHA');
    }

    return {
      reuse: true,
      reason: 'the merge tree is identical to an exact successfully validated pull-request head',
      sourceSha,
      sourceTree,
      sourceRunId: String(sourceRun.id),
      sourceRunUrl: sourceRun.html_url ?? '',
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return rejection(`provenance lookup failed safely: ${detail}`);
  }
}

function writeOutput(result) {
  const output = [
    `reuse=${String(result.reuse)}`,
    `reason=${result.reason.replaceAll('\n', ' ')}`,
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
    token: process.env.GITHUB_TOKEN,
  });
  writeOutput(result);
  writeSummary(result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
