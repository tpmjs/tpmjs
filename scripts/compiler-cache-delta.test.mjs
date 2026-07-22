import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  applyCompilerCacheDelta,
  collectCompilerCacheDelta,
  snapshotCompilerCache,
} from './compiler-cache-delta.mjs';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'tpmjs-compiler-cache-'));
  const cacheDir = join(root, 'cache');
  mkdirSync(cacheDir);
  return {
    root,
    cacheDir,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

test('collects only content-addressed entries added after the snapshot', () => {
  const state = fixture();
  try {
    const baselinePath = join(state.root, 'baseline.json');
    const outputDir = join(state.root, 'delta');
    writeFileSync(join(state.cacheDir, '1111111111111111.tar.zst'), 'old');
    writeFileSync(join(state.cacheDir, 'not-a-turbo-entry'), 'ignored');
    assert.deepEqual(
      snapshotCompilerCache({ cacheDir: state.cacheDir, manifestPath: baselinePath }),
      {
        files: 1,
      }
    );

    writeFileSync(join(state.cacheDir, '2222222222222222.tar.zst'), 'new-data');
    writeFileSync(join(state.cacheDir, '2222222222222222-meta.json'), '{"new":true}');
    assert.deepEqual(
      collectCompilerCacheDelta({ cacheDir: state.cacheDir, baselinePath, outputDir }),
      { files: 2 }
    );
    assert.deepEqual(JSON.parse(readFileSync(join(outputDir, 'manifest.json'), 'utf8')).files, [
      '2222222222222222-meta.json',
      '2222222222222222.tar.zst',
    ]);
    assert.equal(readFileSync(join(outputDir, '2222222222222222.tar.zst'), 'utf8'), 'new-data');
  } finally {
    state.cleanup();
  }
});

test('emits a valid empty delta when a job produces no new cache state', () => {
  const state = fixture();
  try {
    const baselinePath = join(state.root, 'baseline.json');
    const outputDir = join(state.root, 'delta');
    snapshotCompilerCache({ cacheDir: state.cacheDir, manifestPath: baselinePath });
    mkdirSync(outputDir);
    writeFileSync(join(outputDir, 'stale-file'), 'must be removed');

    assert.deepEqual(
      collectCompilerCacheDelta({ cacheDir: state.cacheDir, baselinePath, outputDir }),
      { files: 0 }
    );
    assert.deepEqual(JSON.parse(readFileSync(join(outputDir, 'manifest.json'), 'utf8')).files, []);
    assert.throws(() => readFileSync(join(outputDir, 'stale-file')), /ENOENT/);
  } finally {
    state.cleanup();
  }
});

test('applies only declared safe cache entries and never overwrites an existing entry', () => {
  const state = fixture();
  try {
    const inputDir = join(state.root, 'delta');
    const destination = join(state.root, 'destination');
    mkdirSync(inputDir);
    mkdirSync(destination);
    const existing = '3333333333333333.tar.zst';
    const added = '4444444444444444.tar.zst';
    writeFileSync(join(inputDir, existing), 'replacement');
    writeFileSync(join(inputDir, added), 'new');
    writeFileSync(
      join(inputDir, 'manifest.json'),
      JSON.stringify({ version: 1, files: [existing, added] })
    );
    writeFileSync(join(destination, existing), 'original');

    assert.deepEqual(applyCompilerCacheDelta({ inputDir, cacheDir: destination }), {
      added: 1,
      alreadyPresent: 1,
    });
    assert.equal(readFileSync(join(destination, existing), 'utf8'), 'original');
    assert.equal(readFileSync(join(destination, added), 'utf8'), 'new');
  } finally {
    state.cleanup();
  }
});

test('rejects traversal names before applying an untrusted artifact manifest', () => {
  const state = fixture();
  try {
    const inputDir = join(state.root, 'delta');
    mkdirSync(inputDir);
    writeFileSync(
      join(inputDir, 'manifest.json'),
      JSON.stringify({ version: 1, files: ['../outside.tar.zst'] })
    );
    assert.throws(
      () => applyCompilerCacheDelta({ inputDir, cacheDir: state.cacheDir }),
      /manifest is invalid/
    );
  } finally {
    state.cleanup();
  }
});
