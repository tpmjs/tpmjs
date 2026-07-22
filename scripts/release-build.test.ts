import assert from 'node:assert/strict';
import test from 'node:test';
import { releaseBuildPlan } from './release-build-lib';

function audit(
  packages: Array<{
    name: string;
    version: string;
    state: 'current' | 'publish' | 'new-package';
    safe: boolean;
  }>
) {
  const publishCount = packages.filter(
    (entry) => entry.state === 'publish' || entry.state === 'new-package'
  ).length;
  return { summary: { safe: true, publishCount }, packages };
}

test('builds only release candidates and their workspace dependencies', () => {
  const plan = releaseBuildPlan(
    audit([
      { name: '@tpmjs/current', version: '1.0.0', state: 'current', safe: true },
      { name: '@tpmjs/tools-unsandbox', version: '0.1.5', state: 'publish', safe: true },
      { name: '@tpmjs/tools-vercel', version: '0.3.0', state: 'publish', safe: true },
    ])
  );

  assert.deepEqual(plan.candidates, [
    { name: '@tpmjs/tools-unsandbox', version: '0.1.5', state: 'publish' },
    { name: '@tpmjs/tools-vercel', version: '0.3.0', state: 'publish' },
  ]);
  assert.deepEqual(plan.turboArguments, [
    'exec',
    'turbo',
    'run',
    'build',
    '--output-logs=new-only',
    '--filter=@tpmjs/tools-unsandbox...',
    '--filter=@tpmjs/tools-vercel...',
  ]);
});

test('turns an empty publish set into a no-op plan', () => {
  const plan = releaseBuildPlan(
    audit([{ name: '@tpmjs/current', version: '1.0.0', state: 'current', safe: true }])
  );
  assert.deepEqual(plan.candidates, []);
  assert.deepEqual(plan.turboArguments, [
    'exec',
    'turbo',
    'run',
    'build',
    '--output-logs=new-only',
  ]);
});

test('fails closed when release evidence is unsafe', () => {
  assert.throws(
    () =>
      releaseBuildPlan({
        summary: { safe: false, publishCount: 0 },
        packages: [],
      }),
    /not safe/
  );
});
