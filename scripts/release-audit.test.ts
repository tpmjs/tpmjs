import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyRelease,
  compareSemVer,
  hasChangelogRelease,
  type RegistryPackage,
  summarizeAudit,
  type WorkspacePackage,
} from './release-audit-lib';

const workspace: WorkspacePackage = {
  name: '@tpmjs/example',
  version: '1.2.3',
  path: '/workspace/example',
  private: false,
};

function registry(latest: string, versions: string[]): RegistryPackage {
  return { latest, versions: new Set(versions) };
}

test('compares stable and prerelease semantic versions', () => {
  assert.equal(compareSemVer('1.2.3', '1.2.3'), 0);
  assert.equal(compareSemVer('1.10.0', '1.9.9'), 1);
  assert.equal(compareSemVer('2.0.0-beta.2', '2.0.0-beta.11'), -1);
  assert.equal(compareSemVer('2.0.0', '2.0.0-rc.1'), 1);
  assert.equal(compareSemVer('1.2.3+build.9', '1.2.3+build.1'), 0);
});

test('requires an exact generated changelog heading as release provenance', () => {
  assert.equal(hasChangelogRelease('# Changelog\n\n## 1.2.3\n', '1.2.3'), true);
  assert.equal(hasChangelogRelease('# Changelog\n\n## 1.2.30\n', '1.2.3'), false);
  assert.equal(hasChangelogRelease(null, '1.2.3'), false);
});

test('accepts a source version that is npm latest', () => {
  const entry = classifyRelease(workspace, registry('1.2.3', ['1.2.3']), null);
  assert.equal(entry.state, 'current');
  assert.equal(entry.safe, true);
});

test('blocks source versions behind npm even when the old version exists', () => {
  const entry = classifyRelease(workspace, registry('1.3.0', ['1.2.3', '1.3.0']), null);
  assert.equal(entry.state, 'behind');
  assert.equal(entry.safe, false);
});

test('blocks an unpublished version without changeset-generated changelog provenance', () => {
  const entry = classifyRelease(workspace, registry('1.2.2', ['1.2.2']), null);
  assert.equal(entry.state, 'unproven-release');
  assert.equal(entry.safe, false);
});

test('allows an unpublished version with matching changelog provenance', () => {
  const entry = classifyRelease(
    workspace,
    registry('1.2.2', ['1.2.2']),
    '# Changelog\n\n## 1.2.3\n\n### Patch Changes\n'
  );
  assert.equal(entry.state, 'publish');
  assert.equal(entry.safe, true);
});

test('applies the same provenance requirement to a new npm package', () => {
  const blocked = classifyRelease(workspace, null, null);
  const allowed = classifyRelease(workspace, null, '# Changelog\n\n## 1.2.3\n');
  assert.equal(blocked.state, 'unproven-release');
  assert.equal(blocked.safe, false);
  assert.equal(allowed.state, 'new-package');
  assert.equal(allowed.safe, true);
});

test('summarizes the publish set and fails when any package is unsafe', () => {
  const current = classifyRelease(workspace, registry('1.2.3', ['1.2.3']), null);
  const behind = classifyRelease(workspace, registry('1.3.0', ['1.3.0']), null);
  const summary = summarizeAudit([current, behind]);
  assert.equal(summary.total, 2);
  assert.equal(summary.safe, false);
  assert.equal(summary.publishCount, 0);
  assert.deepEqual(summary.counts, { behind: 1, current: 1 });
});
