#!/usr/bin/env node

import {
  constants,
  copyFileSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const MANIFEST_VERSION = 1;
const TURBO_CACHE_ENTRY = /^[0-9a-f]{16}(?:-meta\.json|\.tar\.zst)$/;

function cacheEntries(cacheDir) {
  try {
    return readdirSync(cacheDir)
      .filter((name) => TURBO_CACHE_ENTRY.test(name) && lstatSync(join(cacheDir, name)).isFile())
      .sort();
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

function readManifest(path, purpose) {
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  if (
    manifest?.version !== MANIFEST_VERSION ||
    !Array.isArray(manifest.files) ||
    !manifest.files.every((name) => typeof name === 'string' && TURBO_CACHE_ENTRY.test(name))
  ) {
    throw new Error(`${purpose} manifest is invalid`);
  }
  return manifest;
}

export function snapshotCompilerCache({ cacheDir, manifestPath }) {
  const files = cacheEntries(cacheDir);
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, `${JSON.stringify({ version: MANIFEST_VERSION, files }, null, 2)}\n`);
  return { files: files.length };
}

export function collectCompilerCacheDelta({ cacheDir, baselinePath, outputDir }) {
  const baseline = new Set(readManifest(baselinePath, 'baseline').files);
  const files = cacheEntries(cacheDir).filter((name) => !baseline.has(name));

  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
  for (const name of files) copyFileSync(join(cacheDir, name), join(outputDir, name));
  writeFileSync(
    join(outputDir, 'manifest.json'),
    `${JSON.stringify({ version: MANIFEST_VERSION, files }, null, 2)}\n`
  );
  return { files: files.length };
}

export function applyCompilerCacheDelta({ inputDir, cacheDir }) {
  const manifest = readManifest(join(inputDir, 'manifest.json'), 'delta');
  mkdirSync(cacheDir, { recursive: true });

  let added = 0;
  let alreadyPresent = 0;
  for (const name of manifest.files) {
    const source = join(inputDir, name);
    if (!lstatSync(source).isFile()) throw new Error(`delta entry is not a file: ${name}`);

    try {
      copyFileSync(source, join(cacheDir, name), constants.COPYFILE_EXCL);
      added += 1;
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      alreadyPresent += 1;
    }
  }

  return { added, alreadyPresent };
}

function usage() {
  return [
    'Usage:',
    '  compiler-cache-delta.mjs snapshot <cache-dir> <manifest>',
    '  compiler-cache-delta.mjs collect <cache-dir> <baseline> <output-dir>',
    '  compiler-cache-delta.mjs apply <input-dir> <cache-dir>',
  ].join('\n');
}

function main([command, ...args]) {
  let result;
  if (command === 'snapshot' && args.length === 2) {
    result = snapshotCompilerCache({ cacheDir: args[0], manifestPath: args[1] });
  } else if (command === 'collect' && args.length === 3) {
    result = collectCompilerCacheDelta({
      cacheDir: args[0],
      baselinePath: args[1],
      outputDir: args[2],
    });
  } else if (command === 'apply' && args.length === 2) {
    result = applyCompilerCacheDelta({ inputDir: args[0], cacheDir: args[1] });
  } else {
    throw new Error(usage());
  }
  console.log(JSON.stringify({ command, ...result }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
