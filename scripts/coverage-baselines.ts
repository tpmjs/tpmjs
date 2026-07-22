export interface CoverageThresholds {
  branches?: number;
  functions?: number;
  lines: number;
  statements?: number;
}

export interface CoverageBaseline {
  directory: string;
  thresholds: CoverageThresholds;
}

/**
 * Honest starting points measured with every source file included. Keep these
 * package-specific: a well-tested library must not conceal an untested app.
 */
export const coverageBaselines: Record<string, CoverageBaseline> = {
  '@tpmjs/cli': {
    directory: 'packages/cli',
    thresholds: { branches: 3.4, functions: 10.2, lines: 3.2, statements: 3.5 },
  },
  '@tpmjs/bridge': {
    directory: 'packages/bridge',
    thresholds: { branches: 19.2, functions: 30.5, lines: 32.1, statements: 31.2 },
  },
  '@tpmjs/compose': {
    directory: 'packages/compose',
    thresholds: { branches: 93.1, functions: 91.6, lines: 100, statements: 97.9 },
  },
  '@tpmjs/executor-test': {
    directory: 'packages/executor-test',
    thresholds: { lines: 2.5, statements: 2.3 },
  },
  '@tpmjs/mcp-client': {
    directory: 'packages/mcp-client',
    thresholds: { branches: 83.6, functions: 64.2, lines: 83, statements: 81.2 },
  },
  '@tpmjs/tools-jq': {
    directory: 'packages/tools/official/jq',
    thresholds: { lines: 10, statements: 8 },
  },
  '@tpmjs/tools-pandoc': {
    directory: 'packages/tools/official/pandoc',
    thresholds: { lines: 15.7, statements: 14.2 },
  },
  '@tpmjs/tools-postgres': {
    directory: 'packages/tools/official/postgres',
    thresholds: { lines: 18.4, statements: 18.1 },
  },
  '@tpmjs/tools-redis': {
    directory: 'packages/tools/official/redis',
    thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
  },
  '@tpmjs/ui': {
    directory: 'packages/ui',
    thresholds: { branches: 25.1, functions: 15, lines: 16.5, statements: 16 },
  },
  '@tpmjs/utils': {
    directory: 'packages/utils',
    thresholds: { functions: 25, lines: 5, statements: 3.8 },
  },
  '@tpmjs/web': {
    directory: 'apps/web',
    thresholds: { branches: 2.8, functions: 3.3, lines: 3.9, statements: 3.9 },
  },
};
