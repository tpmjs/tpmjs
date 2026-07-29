import assert from 'node:assert/strict';
import test from 'node:test';
import { excludedManifests } from './release-exclude-private-lib';
import { PUBLISH_EXCLUSIONS } from './release-exclusions';

const excludedName = PUBLISH_EXCLUSIONS[0]?.name ?? '@tpmjs/tools-unsandbox';

test('selects only excluded packages that are on the declared exclusion list', () => {
  const manifests = excludedManifests({
    summary: { safe: true, publishCount: 1 },
    packages: [
      {
        name: '@tpmjs/existing',
        version: '1.1.0',
        path: '/workspace/existing',
        state: 'publish',
        safe: true,
      },
      {
        name: excludedName,
        version: '0.1.5',
        path: '/workspace/tools/official/unsandbox',
        state: 'excluded',
        safe: true,
      },
    ],
  });
  assert.deepEqual(manifests, [
    { name: excludedName, path: '/workspace/tools/official/unsandbox' },
  ]);
});

test('ignores an excluded-state package that is not on the declared list (defence in depth)', () => {
  const manifests = excludedManifests({
    packages: [
      {
        name: '@tpmjs/not-on-the-list',
        version: '9.9.9',
        path: '/workspace/rogue',
        state: 'excluded',
        safe: true,
      },
    ],
  });
  assert.deepEqual(manifests, []);
});

test('fails closed on a malformed audit or an excluded entry missing its path', () => {
  assert.throws(() => excludedManifests(null), /must be an object/);
  assert.throws(() => excludedManifests({}), /packages must be an array/);
  assert.throws(
    () =>
      excludedManifests({
        packages: [{ name: excludedName, version: '0.1.5', state: 'excluded' }],
      }),
    /missing a name or path/
  );
});
