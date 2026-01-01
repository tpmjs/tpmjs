/**
 * Dependency Audit Lite Tool for TPMJS
 * Performs a lightweight audit of package.json dependencies to identify
 * common issues like outdated patterns, deprecated names, and version issues.
 *
 * Domain rule: deprecated-package-detection - Identifies deprecated npm packages (node-sass, request, moment, etc.)
 * Domain rule: semver-validation - Validates semantic versioning patterns (wildcards, ^0.x unstable versions, unbounded ranges)
 * Domain rule: dependency-misplacement - Detects build tools and test frameworks incorrectly placed in production dependencies
 * Domain rule: duplicate-dependency-detection - Identifies packages appearing with different versions across dependency groups
 */

import { jsonSchema, tool } from 'ai';

/**
 * Severity levels for audit issues
 */
export type IssueSeverity = 'error' | 'warning' | 'info';

/**
 * Represents a single dependency audit issue
 */
export interface DependencyIssue {
  type: string;
  severity: IssueSeverity;
  package: string;
  version?: string;
  message: string;
  suggestion?: string;
}

/**
 * Represents a recommendation for dependency management
 */
export interface DependencyRecommendation {
  category: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Output interface for dependency audit
 */
export interface DependencyAudit {
  issues: DependencyIssue[];
  recommendations: DependencyRecommendation[];
  dependencyCount: {
    total: number;
    dependencies: number;
    devDependencies: number;
    peerDependencies: number;
  };
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

/**
 * Package.json structure (simplified)
 */
interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  [key: string]: unknown;
}

type DependencyAuditInput = {
  packageJson: string | Record<string, unknown>;
};

/**
 * Known deprecated package names and their replacements
 */
const DEPRECATED_PACKAGES: Record<string, string> = {
  'node-sass': 'sass (Dart Sass)',
  request: 'axios, node-fetch, or native fetch',
  'gulp-util': 'individual gulp utilities',
  'babel-core': '@babel/core',
  'babel-preset-env': '@babel/preset-env',
  'babel-preset-react': '@babel/preset-react',
  'eslint-loader': 'eslint-webpack-plugin',
  tslint: 'eslint with @typescript-eslint',
  moment: 'date-fns, dayjs, or luxon',
};

/**
 * Problematic version patterns
 */
const VERSION_PATTERNS = {
  // Unstable pre-1.0 with caret
  unstable: /^\^0\./,
  // Wildcard versions
  wildcard: /^(\*|x|X)$/,
  // Greater than without upper bound
  unboundedGte: /^>=\d/,
  // Tilde ranges (restrictive)
  tilde: /^~/,
  // Latest tag
  latest: /^latest$/,
  // Git URLs
  gitUrl: /^(git|https?):\/\//,
  // File/link protocol
  fileLink: /^(file|link):/,
};

/**
 * Parses package.json from string or object
 */
function parsePackageJson(input: string | Record<string, unknown>): PackageJson {
  if (typeof input === 'string') {
    try {
      return JSON.parse(input) as PackageJson;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Invalid JSON in packageJson: ${message}`);
    }
  }
  return input as PackageJson;
}

/**
 * Detects duplicate packages at different versions across dependency groups
 */
function detectDuplicates(pkg: PackageJson): DependencyIssue[] {
  const issues: DependencyIssue[] = [];
  const packageVersions = new Map<string, Array<{ version: string; type: string }>>();

  // Collect all package names and versions
  const deps = pkg.dependencies || {};
  const devDeps = pkg.devDependencies || {};
  const peerDeps = pkg.peerDependencies || {};

  for (const [name, version] of Object.entries(deps)) {
    if (!packageVersions.has(name)) {
      packageVersions.set(name, []);
    }
    packageVersions.get(name)!.push({ version, type: 'dependencies' });
  }

  for (const [name, version] of Object.entries(devDeps)) {
    if (!packageVersions.has(name)) {
      packageVersions.set(name, []);
    }
    packageVersions.get(name)!.push({ version, type: 'devDependencies' });
  }

  for (const [name, version] of Object.entries(peerDeps)) {
    if (!packageVersions.has(name)) {
      packageVersions.set(name, []);
    }
    packageVersions.get(name)!.push({ version, type: 'peerDependencies' });
  }

  // Find duplicates with different versions
  for (const [name, versions] of packageVersions.entries()) {
    if (versions.length > 1) {
      // Check if versions are actually different
      const uniqueVersions = new Set(versions.map((v) => v.version));
      if (uniqueVersions.size > 1) {
        const versionList = versions.map((v) => `${v.version} (${v.type})`).join(', ');
        issues.push({
          type: 'duplicate-package',
          severity: 'warning',
          package: name,
          message: `Package '${name}' appears with different versions: ${versionList}`,
          suggestion: 'Consolidate to a single version across all dependency groups',
        });
      }
    }
  }

  return issues;
}

/**
 * Audits a single dependency
 */
function auditDependency(
  name: string,
  version: string,
  type: 'dependencies' | 'devDependencies' | 'peerDependencies'
): DependencyIssue[] {
  const issues: DependencyIssue[] = [];

  // Check for deprecated packages
  if (DEPRECATED_PACKAGES[name]) {
    issues.push({
      type: 'deprecated-package',
      severity: 'warning',
      package: name,
      version,
      message: `Package '${name}' is deprecated`,
      suggestion: `Consider migrating to ${DEPRECATED_PACKAGES[name]}`,
    });
  }

  // Check for unstable versions with caret
  if (VERSION_PATTERNS.unstable.test(version)) {
    issues.push({
      type: 'unstable-version',
      severity: 'warning',
      package: name,
      version,
      message: 'Using caret (^) with pre-1.0 version allows breaking changes',
      suggestion: 'Consider pinning exact version or using tilde (~) for 0.x.x versions',
    });
  }

  // Check for wildcard versions
  if (VERSION_PATTERNS.wildcard.test(version)) {
    issues.push({
      type: 'wildcard-version',
      severity: 'error',
      package: name,
      version,
      message: `Wildcard version '*' is not recommended for production`,
      suggestion: 'Specify an explicit version or range',
    });
  }

  // Check for unbounded >= versions
  if (VERSION_PATTERNS.unboundedGte.test(version)) {
    issues.push({
      type: 'unbounded-version',
      severity: 'warning',
      package: name,
      version,
      message: `Unbounded '>=' version range may break with major updates`,
      suggestion: 'Use caret (^) or tilde (~) for bounded ranges',
    });
  }

  // Check for 'latest' tag
  if (VERSION_PATTERNS.latest.test(version)) {
    issues.push({
      type: 'latest-tag',
      severity: 'error',
      package: name,
      version,
      message: `Using 'latest' tag is not reproducible`,
      suggestion: 'Lock to a specific version or semver range',
    });
  }

  // Check for git URLs
  if (VERSION_PATTERNS.gitUrl.test(version)) {
    issues.push({
      type: 'git-dependency',
      severity: 'info',
      package: name,
      version,
      message: 'Git URL dependencies may cause issues with lock files',
      suggestion: 'Consider publishing to npm or using a specific commit hash',
    });
  }

  // Check for file/link protocol (local dependencies)
  if (VERSION_PATTERNS.fileLink.test(version)) {
    issues.push({
      type: 'local-dependency',
      severity: 'info',
      package: name,
      version,
      message: `Local file/link dependencies won't work in production`,
      suggestion: 'Use workspace protocol or publish to registry',
    });
  }

  // Check for very old Node.js packages (common patterns)
  if (name.startsWith('gulp-') && type === 'dependencies') {
    issues.push({
      type: 'build-tool-in-deps',
      severity: 'warning',
      package: name,
      version,
      message: `Build tool '${name}' should be in devDependencies`,
      suggestion: 'Move to devDependencies',
    });
  }

  // Check for testing tools in regular dependencies
  const testPackages = ['jest', 'mocha', 'vitest', 'playwright', 'cypress'];
  if (testPackages.some((test) => name.startsWith(test)) && type === 'dependencies') {
    issues.push({
      type: 'test-tool-in-deps',
      severity: 'warning',
      package: name,
      version,
      message: `Test framework '${name}' should be in devDependencies`,
      suggestion: 'Move to devDependencies',
    });
  }

  return issues;
}

/**
 * Generates recommendations based on package.json structure
 */
function generateRecommendations(
  pkg: PackageJson,
  issues: DependencyIssue[]
): DependencyRecommendation[] {
  const recommendations: DependencyRecommendation[] = [];

  // Check if engines field is specified
  if (!pkg.engines || !pkg.engines.node) {
    recommendations.push({
      category: 'engines',
      message: 'Consider specifying Node.js version in "engines" field',
      priority: 'medium',
    });
  }

  // Check for package-lock.json recommendation
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  if (errorCount > 0) {
    recommendations.push({
      category: 'security',
      message: 'Fix critical version issues before deploying to production',
      priority: 'high',
    });
  }

  // Check for high number of dependencies
  const totalDeps =
    Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length;

  if (totalDeps > 100) {
    recommendations.push({
      category: 'performance',
      message: `Large number of dependencies (${totalDeps}) may impact install time and security surface`,
      priority: 'low',
    });
  }

  // Check for missing version field
  if (!pkg.version) {
    recommendations.push({
      category: 'metadata',
      message: 'Package version not specified',
      priority: 'medium',
    });
  }

  // Recommend audit for deprecated packages
  const deprecatedCount = issues.filter((i) => i.type === 'deprecated-package').length;
  if (deprecatedCount > 0) {
    recommendations.push({
      category: 'maintenance',
      message: `Found ${deprecatedCount} deprecated package(s). Plan migration to maintained alternatives`,
      priority: 'high',
    });
  }

  return recommendations;
}

/**
 * Dependency Audit Lite Tool
 * Performs lightweight audit of package.json dependencies
 */
export const dependencyAuditLite = tool({
  description:
    'Audit package.json dependencies for common issues like deprecated packages, unstable versions (^0.x), wildcard versions, and misplaced devDependencies. Returns issues, recommendations, and dependency counts.',
  inputSchema: jsonSchema<DependencyAuditInput>({
    type: 'object',
    properties: {
      packageJson: {
        type: ['string', 'object'],
        description: 'The package.json content as a JSON string or parsed object',
      },
    },
    required: ['packageJson'],
    additionalProperties: false,
  }),
  async execute({ packageJson }): Promise<DependencyAudit> {
    // Validate input
    if (!packageJson) {
      throw new Error('packageJson is required');
    }

    // Parse package.json
    const pkg = parsePackageJson(packageJson);

    // Collect all issues
    const issues: DependencyIssue[] = [];

    // Detect duplicate packages first
    issues.push(...detectDuplicates(pkg));

    // Audit dependencies
    const deps = pkg.dependencies || {};
    for (const [name, version] of Object.entries(deps)) {
      issues.push(...auditDependency(name, version, 'dependencies'));
    }

    // Audit devDependencies
    const devDeps = pkg.devDependencies || {};
    for (const [name, version] of Object.entries(devDeps)) {
      issues.push(...auditDependency(name, version, 'devDependencies'));
    }

    // Audit peerDependencies
    const peerDeps = pkg.peerDependencies || {};
    for (const [name, version] of Object.entries(peerDeps)) {
      issues.push(...auditDependency(name, version, 'peerDependencies'));
    }

    // Generate recommendations
    const recommendations = generateRecommendations(pkg, issues);

    // Calculate counts
    const dependencyCount = {
      total: Object.keys(deps).length + Object.keys(devDeps).length + Object.keys(peerDeps).length,
      dependencies: Object.keys(deps).length,
      devDependencies: Object.keys(devDeps).length,
      peerDependencies: Object.keys(peerDeps).length,
    };

    // Calculate summary
    const summary = {
      errors: issues.filter((i) => i.severity === 'error').length,
      warnings: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
    };

    return {
      issues,
      recommendations,
      dependencyCount,
      summary,
    };
  },
});

export default dependencyAuditLite;
