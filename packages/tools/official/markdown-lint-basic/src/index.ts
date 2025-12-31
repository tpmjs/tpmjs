/**
 * Markdown Lint Basic Tool for TPMJS
 * Basic markdown linting to check for common issues
 *
 * @requires ai@6.x (Vercel AI SDK)
 */

import { jsonSchema, tool } from 'ai';

/**
 * Represents a linting issue found in the markdown
 */
export interface LintIssue {
  rule: string;
  severity: 'error' | 'warning';
  line: number;
  column?: number;
  message: string;
  context?: string;
}

/**
 * Output interface for the lint result
 */
export interface LintResult {
  issues: LintIssue[];
  passed: boolean;
  summary: {
    errors: number;
    warnings: number;
    totalLines: number;
    rulesChecked: string[];
  };
}

type MarkdownLintInput = {
  markdown: string;
};

/**
 * Check for trailing whitespace
 */
function checkTrailingWhitespace(lines: string[]): LintIssue[] {
  const issues: LintIssue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (line.length > 0 && /\s+$/.test(line)) {
      issues.push({
        rule: 'no-trailing-spaces',
        severity: 'warning',
        line: i + 1,
        message: 'Line has trailing whitespace',
        context: line.substring(Math.max(0, line.length - 20)),
      });
    }
  }

  return issues;
}

/**
 * Check for multiple consecutive blank lines
 */
function checkMultipleBlankLines(lines: string[]): LintIssue[] {
  const issues: LintIssue[] = [];
  let blankCount = 0;
  let blankStartLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === '') {
      if (blankCount === 0) {
        blankStartLine = i + 1;
      }
      blankCount++;
    } else {
      if (blankCount > 2) {
        issues.push({
          rule: 'no-multiple-blanks',
          severity: 'warning',
          line: blankStartLine,
          message: `Found ${blankCount} consecutive blank lines (max: 2)`,
        });
      }
      blankCount = 0;
    }
  }

  return issues;
}

/**
 * Check heading hierarchy (no skipping levels)
 */
function checkHeadingHierarchy(lines: string[]): LintIssue[] {
  const issues: LintIssue[] = [];
  let previousLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const match = line.match(/^(#{1,6})\s+(.+)/);

    if (match?.[1]) {
      const level = match[1].length;

      // Check if we skipped a level
      if (previousLevel > 0 && level > previousLevel + 1) {
        issues.push({
          rule: 'heading-increment',
          severity: 'error',
          line: i + 1,
          message: `Heading level ${level} skips level ${previousLevel + 1}`,
          context: line,
        });
      }

      previousLevel = level;
    }
  }

  return issues;
}

/**
 * Check for missing blank lines around headings
 */
function checkBlankLinesAroundHeadings(lines: string[]): LintIssue[] {
  const issues: LintIssue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const isHeading = /^#{1,6}\s+/.test(line);

    if (isHeading) {
      // Check for blank line before heading (except first line)
      const prevLine = lines[i - 1];
      if (i > 0 && prevLine && prevLine.trim() !== '') {
        issues.push({
          rule: 'blanks-around-headings',
          severity: 'warning',
          line: i + 1,
          message: 'Heading should have a blank line before it',
          context: line,
        });
      }

      // Check for blank line after heading (except last line)
      const nextLine = lines[i + 1];
      if (i < lines.length - 1 && nextLine && nextLine.trim() !== '') {
        // Allow list items immediately after headings
        if (!/^[-*+]\s/.test(nextLine) && !/^\d+\.\s/.test(nextLine)) {
          issues.push({
            rule: 'blanks-around-headings',
            severity: 'warning',
            line: i + 1,
            message: 'Heading should have a blank line after it',
            context: line,
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Check for inconsistent list marker style
 */
function checkListMarkerStyle(lines: string[]): LintIssue[] {
  const issues: LintIssue[] = [];
  const unorderedMarkers = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const match = line.match(/^(\s*)([-*+])\s/);

    if (match?.[2]) {
      const marker = match[2];
      unorderedMarkers.add(marker);

      if (unorderedMarkers.size > 1) {
        issues.push({
          rule: 'list-marker-style',
          severity: 'warning',
          line: i + 1,
          message: `Inconsistent list markers found. Use one style: ${Array.from(unorderedMarkers).join(', ')}`,
          context: line,
        });
        break; // Only report once
      }
    }
  }

  return issues;
}

/**
 * Check for hard tabs (should use spaces)
 */
function checkHardTabs(lines: string[]): LintIssue[] {
  const issues: LintIssue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line?.includes('\t')) {
      issues.push({
        rule: 'no-hard-tabs',
        severity: 'error',
        line: i + 1,
        message: 'Hard tabs found. Use spaces for indentation.',
        context: line.substring(0, 40),
      });
    }
  }

  return issues;
}

/**
 * Check for missing language in fenced code blocks
 */
function checkCodeBlockLanguage(lines: string[]): LintIssue[] {
  const issues: LintIssue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    // Check for opening fence without language
    if (/^```\s*$/.test(line)) {
      issues.push({
        rule: 'fenced-code-language',
        severity: 'warning',
        line: i + 1,
        message: 'Code block should specify a language',
        context: line,
      });
    }
  }

  return issues;
}

/**
 * Check for proper link formatting
 */
function checkLinkFormatting(lines: string[]): LintIssue[] {
  const issues: LintIssue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Check for bare URLs (not in links or code)
    const bareUrlMatch = line.match(/(?<![\(\[`])(https?:\/\/[^\s\)]+)(?![\)\]`])/);
    if (bareUrlMatch?.[1]) {
      const url = bareUrlMatch[1];
      // Make sure it's not in a code block or already a link
      if (!line.includes(`](${url})`) && !line.includes('`')) {
        issues.push({
          rule: 'no-bare-urls',
          severity: 'warning',
          line: i + 1,
          message: 'URLs should be formatted as markdown links',
          context: line,
        });
      }
    }

    // Check for empty links
    if (/\[\]\(/.test(line)) {
      issues.push({
        rule: 'no-empty-links',
        severity: 'error',
        line: i + 1,
        message: 'Link text cannot be empty',
        context: line,
      });
    }
  }

  return issues;
}

/**
 * Markdown Lint Basic Tool
 * Checks markdown for common formatting and style issues
 */
export const markdownLintBasicTool = tool({
  description:
    'Perform basic markdown linting to check for common issues like trailing whitespace, multiple blank lines, heading hierarchy problems, and formatting inconsistencies. Returns a list of issues with severity levels.',
  inputSchema: jsonSchema<MarkdownLintInput>({
    type: 'object',
    properties: {
      markdown: {
        type: 'string',
        description: 'The markdown content to lint',
      },
    },
    required: ['markdown'],
    additionalProperties: false,
  }),
  async execute({ markdown }): Promise<LintResult> {
    // Validate input
    if (!markdown || typeof markdown !== 'string') {
      throw new Error('Markdown content is required and must be a string');
    }

    const lines = markdown.split('\n');
    const allIssues: LintIssue[] = [];

    // Run all lint checks
    const checks = [
      checkTrailingWhitespace,
      checkMultipleBlankLines,
      checkHeadingHierarchy,
      checkBlankLinesAroundHeadings,
      checkListMarkerStyle,
      checkHardTabs,
      checkCodeBlockLanguage,
      checkLinkFormatting,
    ];

    for (const check of checks) {
      allIssues.push(...check(lines));
    }

    // Sort issues by line number
    allIssues.sort((a, b) => a.line - b.line);

    // Count errors and warnings
    const errors = allIssues.filter((i) => i.severity === 'error').length;
    const warnings = allIssues.filter((i) => i.severity === 'warning').length;

    // Extract rule names
    const rulesChecked = [
      'no-trailing-spaces',
      'no-multiple-blanks',
      'heading-increment',
      'blanks-around-headings',
      'list-marker-style',
      'no-hard-tabs',
      'fenced-code-language',
      'no-bare-urls',
      'no-empty-links',
    ];

    return {
      issues: allIssues,
      passed: errors === 0,
      summary: {
        errors,
        warnings,
        totalLines: lines.length,
        rulesChecked,
      },
    };
  },
});

export default markdownLintBasicTool;
