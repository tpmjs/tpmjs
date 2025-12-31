/**
 * Conventional Commit Suggest Tool for TPMJS
 * Suggests conventional commit messages from descriptions or file changes
 * Follows the Conventional Commits specification: https://www.conventionalcommits.org/
 */

import { jsonSchema, tool } from 'ai';

/**
 * Conventional commit types
 */
type CommitType =
  | 'feat'
  | 'fix'
  | 'docs'
  | 'style'
  | 'refactor'
  | 'perf'
  | 'test'
  | 'build'
  | 'ci'
  | 'chore'
  | 'revert';

/**
 * Output interface for the conventional commit suggestion
 */
export interface ConventionalCommit {
  message: string;
  type: CommitType;
  scope: string | null;
  breaking: boolean;
  body: string | null;
  fullMessage: string;
  explanation: string;
}

type ConventionalCommitSuggestInput = {
  description: string;
  files?: string[];
};

/**
 * Determines the commit type based on description keywords
 */
function determineCommitType(description: string, files: string[] = []): CommitType {
  const lowerDesc = description.toLowerCase();

  // Check for feature-related keywords
  if (
    /\b(add|new|feature|implement|introduce|create)\b/.test(lowerDesc) &&
    !/\b(test|doc|readme|comment)\b/.test(lowerDesc)
  ) {
    return 'feat';
  }

  // Check for bug fixes
  if (/\b(fix|bug|resolve|patch|correct|repair)\b/.test(lowerDesc)) {
    return 'fix';
  }

  // Check for documentation
  if (
    /\b(doc|readme|comment|guide|tutorial)\b/.test(lowerDesc) ||
    files.some((f) => /\.(md|txt|rst)$/i.test(f))
  ) {
    return 'docs';
  }

  // Check for tests
  if (
    /\b(test|spec|jest|vitest|cypress)\b/.test(lowerDesc) ||
    files.some((f) => /\.(test|spec)\.[jt]sx?$/.test(f))
  ) {
    return 'test';
  }

  // Check for performance improvements
  if (/\b(perf|performance|optimize|speed|faster)\b/.test(lowerDesc)) {
    return 'perf';
  }

  // Check for refactoring
  if (/\b(refactor|restructure|reorganize|rewrite)\b/.test(lowerDesc)) {
    return 'refactor';
  }

  // Check for styling
  if (/\b(style|format|lint|prettier|whitespace)\b/.test(lowerDesc)) {
    return 'style';
  }

  // Check for build system
  if (
    /\b(build|webpack|rollup|vite|bundle|dependencies|package\.json)\b/.test(lowerDesc) ||
    files.some((f) => /package\.json|tsconfig\.json|webpack|vite|rollup/i.test(f))
  ) {
    return 'build';
  }

  // Check for CI/CD
  if (
    /\b(ci|cd|github actions|workflow|pipeline|deploy)\b/.test(lowerDesc) ||
    files.some((f) => /\.github\/workflows|\.gitlab-ci|jenkins/i.test(f))
  ) {
    return 'ci';
  }

  // Check for reverts
  if (/\b(revert|rollback|undo)\b/.test(lowerDesc)) {
    return 'revert';
  }

  // Default to chore for maintenance tasks
  return 'chore';
}

/**
 * Extracts potential scope from file paths
 */
function extractScope(files: string[] = []): string | null {
  if (files.length === 0) return null;

  // Extract directory names from file paths
  const dirs = files
    .map((file) => {
      const parts = file.split('/');
      // Get the first meaningful directory (skip common prefixes)
      for (const part of parts) {
        if (
          part &&
          part !== '.' &&
          part !== '..' &&
          part !== 'src' &&
          part !== 'lib' &&
          part !== 'dist'
        ) {
          return part;
        }
      }
      return null;
    })
    .filter((dir): dir is string => dir !== null);

  // Find the most common directory
  const dirCounts = new Map<string, number>();
  for (const dir of dirs) {
    dirCounts.set(dir, (dirCounts.get(dir) || 0) + 1);
  }

  if (dirCounts.size === 0) return null;

  // Get the most common directory
  let maxCount = 0;
  let mostCommonDir: string | null = null;
  for (const [dir, count] of dirCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonDir = dir;
    }
  }

  return mostCommonDir;
}

/**
 * Checks if the change is a breaking change
 */
function isBreakingChange(description: string): boolean {
  const lowerDesc = description.toLowerCase();
  return /\b(breaking|break|major|incompatible|remove|delete)\b/.test(lowerDesc);
}

/**
 * Generates the commit message subject line
 */
function generateSubject(description: string, type: CommitType, scope: string | null): string {
  // Clean up the description
  let subject = description.trim();

  // Remove common prefixes
  subject = subject.replace(/^(added|fixed|updated|changed|removed|created)\s+/i, '');

  // Lowercase first character
  subject = subject.charAt(0).toLowerCase() + subject.slice(1);

  // Remove trailing punctuation
  subject = subject.replace(/[.!?]+$/, '');

  // Truncate if too long (max 72 chars for subject)
  const maxLength = 72 - type.length - (scope ? scope.length + 3 : 1);
  if (subject.length > maxLength) {
    subject = `${subject.substring(0, maxLength - 3)}...`;
  }

  return subject;
}

/**
 * Generates a body for the commit message if needed
 */
function generateBody(description: string, files: string[] = []): string | null {
  // If description is very short, no body needed
  if (description.length < 50) return null;

  // If we have file information, add it to the body
  if (files.length > 0 && files.length <= 10) {
    return `Files changed:\n${files.map((f) => `- ${f}`).join('\n')}`;
  }

  if (files.length > 10) {
    return `${files.length} files changed`;
  }

  return null;
}

/**
 * Conventional Commit Suggest Tool
 * Suggests conventional commit messages from descriptions or file changes
 */
export const conventionalCommitSuggest = tool({
  description:
    'Suggests a conventional commit message based on a description of changes and optionally a list of changed files. Follows the Conventional Commits specification with types like feat, fix, docs, etc. Useful for maintaining consistent commit history.',
  inputSchema: jsonSchema<ConventionalCommitSuggestInput>({
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'Description of the changes made (e.g., "fixed login bug", "added dark mode")',
      },
      files: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional array of changed file paths to help determine scope',
      },
    },
    required: ['description'],
    additionalProperties: false,
  }),
  async execute({ description, files = [] }): Promise<ConventionalCommit> {
    // Validate input
    if (typeof description !== 'string' || description.trim().length === 0) {
      throw new Error('description must be a non-empty string');
    }

    if (!Array.isArray(files)) {
      throw new Error('files must be an array');
    }

    // Determine commit properties
    const type = determineCommitType(description, files);
    const scope = extractScope(files);
    const breaking = isBreakingChange(description);
    const subject = generateSubject(description, type, scope);
    const body = generateBody(description, files);

    // Build the commit message
    const scopePart = scope ? `(${scope})` : '';
    const breakingPart = breaking ? '!' : '';
    const message = `${type}${scopePart}${breakingPart}: ${subject}`;

    // Build full message with body
    let fullMessage = message;
    if (body) {
      fullMessage += `\n\n${body}`;
    }
    if (breaking) {
      fullMessage += '\n\nBREAKING CHANGE: This change is not backwards compatible';
    }

    // Generate explanation
    const typeExplanations: Record<CommitType, string> = {
      feat: 'A new feature',
      fix: 'A bug fix',
      docs: 'Documentation changes',
      style: 'Code style/formatting changes',
      refactor: 'Code refactoring',
      perf: 'Performance improvement',
      test: 'Adding or updating tests',
      build: 'Build system or dependency changes',
      ci: 'CI/CD configuration changes',
      chore: 'Maintenance tasks',
      revert: 'Reverting a previous commit',
    };

    const explanation = typeExplanations[type];

    return {
      message,
      type,
      scope,
      breaking,
      body,
      fullMessage,
      explanation,
    };
  },
});

export default conventionalCommitSuggest;
