/**
 * Changelog Entry Tool for TPMJS
 * Generates changelog entries in Keep a Changelog format
 *
 * @requires ai@6.x (Vercel AI SDK)
 */

import { jsonSchema, tool } from 'ai';

/**
 * Represents a single change in the changelog
 */
export interface Change {
  type: 'Added' | 'Changed' | 'Deprecated' | 'Removed' | 'Fixed' | 'Security';
  description: string;
}

/**
 * Output interface for the changelog entry
 */
export interface ChangelogEntry {
  entry: string;
  date: string;
  types: string[];
  version: string;
}

type ChangelogEntryInput = {
  version: string;
  changes: Change[];
  date?: string;
};

/**
 * Valid change types according to Keep a Changelog
 */
const VALID_CHANGE_TYPES = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];

/**
 * Validates version string format (semver-like)
 */
function isValidVersion(version: string): boolean {
  // Accept formats like: 1.0.0, 1.0, v1.0.0, Unreleased
  return /^(v?\d+\.\d+(\.\d+)?|Unreleased)$/i.test(version);
}

/**
 * Formats a date in YYYY-MM-DD format
 */
function formatDate(date?: string | Date): string {
  const d = date ? new Date(date) : new Date();

  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid date provided');
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Groups changes by type
 */
function groupChangesByType(changes: Change[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  for (const change of changes) {
    if (!grouped.has(change.type)) {
      grouped.set(change.type, []);
    }
    grouped.get(change.type)?.push(change.description);
  }

  return grouped;
}

/**
 * Generates markdown for a changelog entry
 */
function generateChangelogMarkdown(
  version: string,
  date: string,
  groupedChanges: Map<string, string[]>
): string {
  const lines: string[] = [];

  // Add version header
  lines.push(`## [${version}] - ${date}`);
  lines.push('');

  // Add changes by type in Keep a Changelog order
  const typeOrder = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];

  for (const type of typeOrder) {
    if (groupedChanges.has(type)) {
      lines.push(`### ${type}`);
      lines.push('');

      const descriptions = groupedChanges.get(type)!;
      for (const description of descriptions) {
        lines.push(`- ${description}`);
      }

      lines.push('');
    }
  }

  // Remove trailing blank line
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines.join('\n');
}

/**
 * Changelog Entry Tool
 * Generates changelog entries in Keep a Changelog format
 */
export const changelogEntryTool = tool({
  description:
    'Generate a changelog entry in Keep a Changelog format. Accepts a version number and an array of changes with types (Added, Changed, Deprecated, Removed, Fixed, Security) and descriptions. Returns formatted markdown.',
  inputSchema: jsonSchema<ChangelogEntryInput>({
    type: 'object',
    properties: {
      version: {
        type: 'string',
        description:
          "Version number (e.g., '1.2.0', 'v1.2.0', or 'Unreleased'). Should follow semantic versioning.",
      },
      changes: {
        type: 'array',
        description: 'Array of changes to include in this version',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'],
              description: 'Type of change according to Keep a Changelog',
            },
            description: {
              type: 'string',
              description: 'Description of the change',
            },
          },
          required: ['type', 'description'],
        },
      },
      date: {
        type: 'string',
        description:
          "Optional date for the release (YYYY-MM-DD). Defaults to today's date if not provided.",
      },
    },
    required: ['version', 'changes'],
    additionalProperties: false,
  }),
  async execute({ version, changes, date }): Promise<ChangelogEntry> {
    // Validate version
    if (!version || typeof version !== 'string') {
      throw new Error('Version is required and must be a string');
    }

    if (!isValidVersion(version)) {
      throw new Error(
        "Invalid version format. Use semantic versioning (e.g., '1.2.0', 'v1.2.0') or 'Unreleased'"
      );
    }

    // Validate changes
    if (!Array.isArray(changes) || changes.length === 0) {
      throw new Error('Changes must be a non-empty array');
    }

    // Validate each change
    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];

      if (!change || typeof change !== 'object') {
        throw new Error(`Change at index ${i} must be an object`);
      }

      if (!change.type || typeof change.type !== 'string') {
        throw new Error(`Change at index ${i} is missing a valid 'type' field`);
      }

      if (!VALID_CHANGE_TYPES.includes(change.type)) {
        throw new Error(
          `Change at index ${i} has invalid type '${change.type}'. Must be one of: ${VALID_CHANGE_TYPES.join(', ')}`
        );
      }

      if (!change.description || typeof change.description !== 'string') {
        throw new Error(`Change at index ${i} is missing a valid 'description' field`);
      }

      if (change.description.trim().length === 0) {
        throw new Error(`Change at index ${i} has empty description`);
      }
    }

    // Format date
    const formattedDate = formatDate(date);

    // Group changes by type
    const groupedChanges = groupChangesByType(changes);

    // Generate markdown
    const entry = generateChangelogMarkdown(version, formattedDate, groupedChanges);

    // Extract unique types used
    const types = Array.from(groupedChanges.keys());

    return {
      entry,
      date: formattedDate,
      types,
      version: version.replace(/^v/, ''), // Normalize by removing 'v' prefix
    };
  },
});

export default changelogEntryTool;
