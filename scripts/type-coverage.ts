import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lint } from 'type-coverage-core';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MINIMUM_COVERAGE = 95;

interface Workspace {
  name: string;
  path: string;
}

interface TypeGap {
  character: number;
  file: string;
  line: number;
  text: string;
}

function commandOutput(command: string, args: string[]): string {
  return execFileSync(command, args, {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
}

function isInside(parent: string, child: string): boolean {
  const pathFromParent = relative(parent, child);
  return (
    pathFromParent === '' || (!pathFromParent.startsWith(`..${sep}`) && pathFromParent !== '..')
  );
}

function loadWorkspaces(): Workspace[] {
  const parsed = JSON.parse(
    commandOutput('pnpm', ['list', '--recursive', '--depth', '-1', '--json'])
  ) as Array<Partial<Workspace>>;

  const workspaces = parsed
    .filter((workspace): workspace is Workspace => Boolean(workspace.name && workspace.path))
    .map((workspace) => ({ name: workspace.name, path: resolve(workspace.path) }));

  if (workspaces.length === 0) {
    throw new Error('pnpm returned no workspaces; refusing a vacuous type-coverage pass');
  }

  return workspaces;
}

function loadTypeScriptFiles(): Set<string> {
  const output = commandOutput('git', [
    'ls-files',
    '-z',
    '--cached',
    '--others',
    '--exclude-standard',
    '--',
    '*.ts',
    '*.tsx',
    '*.mts',
    '*.cts',
  ]);

  return new Set(
    output
      .split('\0')
      .filter(Boolean)
      .map((file) => resolve(REPOSITORY_ROOT, file))
      .filter((file) => {
        try {
          return statSync(file).isFile();
        } catch {
          return false;
        }
      })
  );
}

function loadCacheNamespace(): string {
  const inputs = commandOutput('git', ['ls-files', '-z'])
    .split('\0')
    .filter(
      (file) =>
        file === 'pnpm-lock.yaml' ||
        file === 'scripts/type-coverage.ts' ||
        /(^|\/)tsconfig[^/]*\.json$/.test(file)
    )
    .sort();
  const hash = createHash('sha256');

  for (const file of inputs) {
    hash.update(file);
    hash.update('\0');
    hash.update(readFileSync(resolve(REPOSITORY_ROOT, file)));
    hash.update('\0');
  }

  return hash.digest('hex').slice(0, 16);
}

async function main(): Promise<void> {
  const workspaces = loadWorkspaces();
  const measuredFiles = loadTypeScriptFiles();
  const cacheNamespace = loadCacheNamespace();
  const countsByFile = new Map<string, { correctCount: number; totalCount: number }>();
  const gaps: TypeGap[] = [];
  const appProjects = workspaces.filter(
    (workspace) =>
      isInside(resolve(REPOSITORY_ROOT, 'apps'), workspace.path) &&
      workspace.path !== resolve(REPOSITORY_ROOT, 'apps/railway-executor')
  );

  const collectResult = async (
    projectName: string,
    tsconfig: string,
    acceptsFile: (file: string) => boolean
  ): Promise<void> => {
    const cacheDirectory = resolve(
      REPOSITORY_ROOT,
      '.type-coverage',
      cacheNamespace,
      relative(REPOSITORY_ROOT, tsconfig).split(sep).join('__')
    );
    const result = await lint(tsconfig, {
      absolutePath: true,
      cacheDirectory,
      enableCache: true,
      fileCounts: true,
    });

    for (const [file, counts] of result.fileCounts) {
      const absoluteFile = resolve(file);
      if (measuredFiles.has(absoluteFile) && acceptsFile(absoluteFile)) {
        countsByFile.set(absoluteFile, counts);
      }
    }

    for (const gap of result.anys) {
      const absoluteFile = resolve(gap.file);
      if (measuredFiles.has(absoluteFile) && acceptsFile(absoluteFile)) {
        gaps.push({
          character: gap.character,
          file: absoluteFile,
          line: gap.line,
          text: gap.text,
        });
      }
    }

    console.log(`[type-coverage] inspected ${projectName}`);
  };

  await collectResult(
    'shared/root TypeScript',
    resolve(REPOSITORY_ROOT, 'tsconfig.type-coverage.json'),
    (file) => appProjects.every((workspace) => !isInside(workspace.path, file))
  );

  for (const workspace of appProjects) {
    await collectResult(workspace.name, resolve(workspace.path, 'tsconfig.json'), (file) =>
      isInside(workspace.path, file)
    );
  }

  const unmeasuredFiles = [...measuredFiles]
    .filter((file) => !countsByFile.has(file))
    .map((file) => relative(REPOSITORY_ROOT, file))
    .sort();

  if (unmeasuredFiles.length > 0) {
    throw new Error(
      `repository TypeScript escaped measurement:\n${unmeasuredFiles
        .map((file) => `  - ${file}`)
        .join('\n')}`
    );
  }

  const { correctCount, totalCount } = [...countsByFile.values()].reduce(
    (total, counts) => ({
      correctCount: total.correctCount + counts.correctCount,
      totalCount: total.totalCount + counts.totalCount,
    }),
    { correctCount: 0, totalCount: 0 }
  );
  const projectsAnalyzed = appProjects.length + 1;

  if (countsByFile.size === 0 || totalCount === 0) {
    throw new Error(
      `refusing a vacuous type-coverage pass: ${projectsAnalyzed} projects, ${countsByFile.size} files, ${totalCount} typed nodes`
    );
  }

  const percent = Math.floor((correctCount / totalCount) * 10_000) / 100;
  console.log(
    `[type-coverage] ${correctCount}/${totalCount} typed nodes across ${countsByFile.size} repository files in ${projectsAnalyzed} compiler programs (${percent.toFixed(2)}%)`
  );

  if (percent < MINIMUM_COVERAGE) {
    for (const gap of gaps
      .sort((left, right) =>
        left.file === right.file ? left.line - right.line : left.file.localeCompare(right.file)
      )
      .slice(0, 50)) {
      console.error(
        `${relative(REPOSITORY_ROOT, gap.file)}:${gap.line + 1}:${gap.character + 1}: ${gap.text}`
      );
    }

    throw new Error(
      `type coverage ${percent.toFixed(2)}% is below the ${MINIMUM_COVERAGE.toFixed(2)}% floor (${gaps.length} gaps)`
    );
  }
}

main().catch((error: unknown) => {
  console.error(`[type-coverage] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
