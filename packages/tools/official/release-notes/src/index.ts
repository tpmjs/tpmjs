/**
 * Release Notes Tool for TPMJS
 * Generates release notes from structured changes.
 * Groups by type (features, fixes, breaking changes, etc.)
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for release notes
 */
export interface ReleaseNotesResult {
  notes: string;
  version: string;
  date: string;
  summary: {
    features: number;
    fixes: number;
    breaking: number;
    other: number;
    total: number;
  };
}

/**
 * Change type
 */
type ChangeType =
  | 'feature'
  | 'fix'
  | 'breaking'
  | 'docs'
  | 'chore'
  | 'perf'
  | 'refactor'
  | 'test'
  | 'other';

/**
 * Individual change item
 */
interface Change {
  type: ChangeType;
  description: string;
  issue?: string;
}

type ReleaseNotesInput = {
  version: string;
  changes: Change[];
};

/**
 * Gets the section title for a change type
 *
 * Domain rule: change_categorization - Maps change types (feature, fix, breaking, etc.) to section titles
 */
function getSectionTitle(type: ChangeType): string {
  switch (type) {
    case 'feature':
      return 'Features';
    case 'fix':
      return 'Bug Fixes';
    case 'breaking':
      return 'BREAKING CHANGES';
    case 'docs':
      return 'Documentation';
    case 'chore':
      return 'Chores';
    case 'perf':
      return 'Performance';
    case 'refactor':
      return 'Refactoring';
    case 'test':
      return 'Tests';
    default:
      return 'Other Changes';
  }
}

/**
 * Gets the emoji for a change type
 */
function getTypeEmoji(type: ChangeType): string {
  switch (type) {
    case 'feature':
      return '✨';
    case 'fix':
      return '🐛';
    case 'breaking':
      return '💥';
    case 'docs':
      return '📝';
    case 'chore':
      return '🔧';
    case 'perf':
      return '⚡';
    case 'refactor':
      return '♻️';
    case 'test':
      return '✅';
    default:
      return '📦';
  }
}

/**
 * Groups changes by type
 */
function groupChangesByType(changes: Change[]): Map<ChangeType, Change[]> {
  const grouped = new Map<ChangeType, Change[]>();

  for (const change of changes) {
    const type = change.type || 'other';
    if (!grouped.has(type)) {
      grouped.set(type, []);
    }
    grouped.get(type)?.push(change);
  }

  return grouped;
}

/**
 * Formats a single change as a markdown list item
 */
function formatChange(change: Change): string {
  const issueLink = change.issue ? ` ([#${change.issue}](../../issues/${change.issue}))` : '';
  return `- ${change.description}${issueLink}`;
}

/**
 * Generates release notes in markdown format
 *
 * Domain rule: doc_sections - Follows release notes pattern: Header with stats -> Breaking Changes -> Features -> Fixes -> Other sections
 * Domain rule: markdown_template - Uses # for title, ## for sections, emoji prefixes, markdown lists
 * Domain rule: change_categorization - Groups changes by type, orders sections (breaking first), formats with issue links
 */
function generateReleaseNotes(version: string, changes: Change[]): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const grouped = groupChangesByType(changes);

  // Define the order of sections (breaking changes first!)
  const sectionOrder: ChangeType[] = [
    'breaking',
    'feature',
    'fix',
    'perf',
    'refactor',
    'docs',
    'test',
    'chore',
    'other',
  ];

  let markdown = `# ${version} (${date})\n\n`;

  // Add summary stats
  const stats = {
    features: grouped.get('feature')?.length || 0,
    fixes: grouped.get('fix')?.length || 0,
    breaking: grouped.get('breaking')?.length || 0,
    other:
      changes.length -
      (grouped.get('feature')?.length || 0) -
      (grouped.get('fix')?.length || 0) -
      (grouped.get('breaking')?.length || 0),
  };

  if (stats.breaking > 0) {
    markdown += '⚠️ **This release contains breaking changes!**\n\n';
  }

  markdown += `**Changes:** ${changes.length} total (`;
  const parts: string[] = [];
  if (stats.features > 0) parts.push(`${stats.features} feature${stats.features > 1 ? 's' : ''}`);
  if (stats.fixes > 0) parts.push(`${stats.fixes} fix${stats.fixes > 1 ? 'es' : ''}`);
  if (stats.breaking > 0) parts.push(`${stats.breaking} breaking`);
  if (stats.other > 0) parts.push(`${stats.other} other`);
  markdown += `${parts.join(', ')})\n\n`;

  markdown += '---\n\n';

  // Generate sections in order
  for (const type of sectionOrder) {
    const sectionChanges = grouped.get(type);
    if (!sectionChanges || sectionChanges.length === 0) continue;

    const emoji = getTypeEmoji(type);
    const title = getSectionTitle(type);

    markdown += `## ${emoji} ${title}\n\n`;

    for (const change of sectionChanges) {
      markdown += `${formatChange(change)}\n`;
    }

    markdown += '\n';
  }

  return markdown.trim();
}

/**
 * Release Notes Tool
 * Generates release notes from structured changes
 */
export const releaseNotesTool = tool({
  description:
    'Generate release notes from structured changes. Groups changes by type (features, fixes, breaking changes, etc.) and formats them as markdown. Returns formatted notes with version, date, and summary statistics.',
  inputSchema: jsonSchema<ReleaseNotesInput>({
    type: 'object',
    properties: {
      version: {
        type: 'string',
        description: 'Version number (e.g., "1.2.0", "v2.0.0-beta.1")',
      },
      changes: {
        type: 'array',
        description: 'Array of changes to include in the release notes',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: [
                'feature',
                'fix',
                'breaking',
                'docs',
                'chore',
                'perf',
                'refactor',
                'test',
                'other',
              ],
              description: 'Type of change',
            },
            description: {
              type: 'string',
              description: 'Description of the change',
            },
            issue: {
              type: 'string',
              description: 'Optional issue number (e.g., "123")',
            },
          },
          required: ['type', 'description'],
        },
      },
    },
    required: ['version', 'changes'],
    additionalProperties: false,
  }),
  async execute({ version, changes }): Promise<ReleaseNotesResult> {
    // Domain rule: input_validation - Validates version (string), changes (non-empty array), each change has type and description
    // Validate input
    if (!version || typeof version !== 'string') {
      throw new Error('Version is required and must be a string');
    }

    if (!Array.isArray(changes)) {
      throw new Error('Changes must be an array');
    }

    if (changes.length === 0) {
      throw new Error('Changes array cannot be empty');
    }

    // Validate each change
    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      if (!change || !change.type || typeof change.type !== 'string') {
        throw new Error(`Change at index ${i} must have a type`);
      }
      if (!change || !change.description || typeof change.description !== 'string') {
        throw new Error(`Change at index ${i} must have a description`);
      }
    }

    // Generate the release notes
    const notes = generateReleaseNotes(version, changes);
    const date = new Date().toISOString().split('T')[0] ?? '';

    // Calculate summary
    const grouped = groupChangesByType(changes);
    const summary = {
      features: grouped.get('feature')?.length || 0,
      fixes: grouped.get('fix')?.length || 0,
      breaking: grouped.get('breaking')?.length || 0,
      other: 0,
      total: changes.length,
    };
    summary.other = summary.total - summary.features - summary.fixes - summary.breaking;

    return {
      notes,
      version,
      date,
      summary,
    };
  },
});

export default releaseNotesTool;
