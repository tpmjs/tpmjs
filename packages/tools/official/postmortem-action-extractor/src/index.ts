/**
 * Postmortem Action Extractor Tool for TPMJS
 * Extracts action items from postmortem documents, detecting patterns for actions,
 * owners, priorities, and due dates.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Extracted action item
 */
export interface ActionItem {
  action: string;
  owner?: string;
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string;
  context?: string;
}

/**
 * Output interface for postmortem action extraction
 */
export interface PostmortemActions {
  actions: ActionItem[];
  count: number;
  metadata: {
    extractedAt: string;
    textLength: number;
    hasOwners: number;
    hasPriorities: number;
    hasDueDates: number;
  };
}

type PostmortemActionExtractorInput = {
  text: string;
};

/**
 * Action item patterns to detect
 */
const ACTION_PATTERNS = [
  /^[-*•]\s*(?:action|todo|follow-up|next step)[:：]\s*(.+)/im,
  /^(?:action|todo|follow-up|next step)[:：]\s*(.+)/im,
  /\[(?:action|todo|follow-up)\]\s*(.+)/i,
  /(?:we (?:should|need to|must|will)|team (?:should|needs to|must|will))\s+(.+?)(?:\.|$)/i,
];

/**
 * Owner patterns (assigned to someone)
 */
const OWNER_PATTERNS = [
  /\((@?\w+)\)/,
  /@(\w+)/,
  /assigned to\s+(@?\w+)/i,
  /owner:\s*(@?\w+)/i,
  /\[owner:\s*(@?\w+)\]/i,
];

/**
 * Priority patterns
 */
const PRIORITY_PATTERNS = [
  {
    pattern: /\[p0\]|\(p0\)|priority\s*[:：]\s*(?:p0|0|critical|urgent)/i,
    priority: 'high' as const,
  },
  { pattern: /\[p1\]|\(p1\)|priority\s*[:：]\s*(?:p1|1|high)/i, priority: 'high' as const },
  {
    pattern: /\[p2\]|\(p2\)|priority\s*[:：]\s*(?:p2|2|medium|normal)/i,
    priority: 'medium' as const,
  },
  { pattern: /\[p3\]|\(p3\)|priority\s*[:：]\s*(?:p3|3|low)/i, priority: 'low' as const },
  { pattern: /🔴|⚠️|critical|urgent/i, priority: 'high' as const },
];

/**
 * Due date patterns
 */
const DUE_DATE_PATTERNS = [
  /due\s*[:：]\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
  /by\s+([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
  /\[due:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\]/i,
  /deadline\s*[:：]\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
  /(?:within|in)\s+(\d+)\s+(day|week|month)s?/i,
];

/**
 * Extracts owner from text
 */
function extractOwner(text: string): string | undefined {
  for (const pattern of OWNER_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/^@/, ''); // Remove @ prefix if present
    }
  }
  return undefined;
}

/**
 * Extracts priority from text
 */
function extractPriority(text: string): 'high' | 'medium' | 'low' | undefined {
  for (const { pattern, priority } of PRIORITY_PATTERNS) {
    if (pattern.test(text)) {
      return priority;
    }
  }
  return undefined;
}

/**
 * Extracts due date from text
 */
function extractDueDate(text: string): string | undefined {
  for (const pattern of DUE_DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      // If it's a relative date like "3 days", convert to approximate date
      if (match[2]) {
        const amount = Number.parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        const date = new Date();

        if (unit === 'day') {
          date.setDate(date.getDate() + amount);
        } else if (unit === 'week') {
          date.setDate(date.getDate() + amount * 7);
        } else if (unit === 'month') {
          date.setMonth(date.getMonth() + amount);
        }

        return date.toISOString().split('T')[0];
      }

      // Otherwise it's an absolute date
      return match[1];
    }
  }
  return undefined;
}

/**
 * Cleans action text by removing metadata patterns
 */
function cleanActionText(text: string): string {
  let cleaned = text.trim();

  // Remove owner annotations
  cleaned = cleaned.replace(/\(@?\w+\)/g, '').trim();
  cleaned = cleaned.replace(/@\w+/g, '').trim();
  cleaned = cleaned.replace(/assigned to\s+@?\w+/gi, '').trim();
  cleaned = cleaned.replace(/owner:\s*@?\w+/gi, '').trim();

  // Remove priority annotations
  cleaned = cleaned.replace(/\[p[0-3]\]|\(p[0-3]\)/gi, '').trim();
  cleaned = cleaned
    .replace(/priority\s*[:：]\s*(?:p[0-3]|[0-3]|critical|urgent|high|medium|low)/gi, '')
    .trim();
  cleaned = cleaned.replace(/🔴|⚠️/g, '').trim();

  // Remove due date annotations
  cleaned = cleaned.replace(/due\s*[:：]\s*[0-9]{4}-[0-9]{2}-[0-9]{2}/gi, '').trim();
  cleaned = cleaned.replace(/by\s+[0-9]{4}-[0-9]{2}-[0-9]{2}/gi, '').trim();
  cleaned = cleaned.replace(/\[due:\s*[0-9]{4}-[0-9]{2}-[0-9]{2}\]/gi, '').trim();
  cleaned = cleaned.replace(/deadline\s*[:：]\s*[0-9]{4}-[0-9]{2}-[0-9]{2}/gi, '').trim();
  cleaned = cleaned.replace(/(?:within|in)\s+\d+\s+(?:day|week|month)s?/gi, '').trim();

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Remove trailing punctuation from metadata removal
  cleaned = cleaned.replace(/[,;]\s*$/, '').trim();

  return cleaned;
}

/**
 * Extracts action items from a single line
 */
function extractActionFromLine(line: string): ActionItem | null {
  // Try each action pattern
  for (const pattern of ACTION_PATTERNS) {
    const match = line.match(pattern);
    if (match?.[1]) {
      const rawAction = match[1].trim();
      if (rawAction.length < 10) continue; // Skip very short matches

      const owner = extractOwner(line);
      const priority = extractPriority(line);
      const dueDate = extractDueDate(line);
      const action = cleanActionText(rawAction);

      return {
        action,
        ...(owner && { owner }),
        ...(priority && { priority }),
        ...(dueDate && { dueDate }),
      };
    }
  }

  return null;
}

/**
 * Extracts actions from section-based format (## Actions, ## Action Items, etc.)
 */
function extractFromActionSections(text: string): ActionItem[] {
  const actions: ActionItem[] = [];
  const lines = text.split('\n');

  let inActionSection = false;
  let currentContext = '';

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Detect action section headers
    if (/^#{1,4}\s*(?:actions?|todos?|follow-?ups?|next steps?|action items?)/i.test(trimmedLine)) {
      inActionSection = true;
      currentContext = trimmedLine.replace(/^#{1,4}\s*/, '');
      continue;
    }

    // Exit action section on next header
    if (/^#{1,4}\s/.test(trimmedLine) && inActionSection) {
      inActionSection = false;
      currentContext = '';
    }

    // Extract actions from list items in action sections
    if (inActionSection && /^[-*•]\s+/.test(trimmedLine)) {
      const itemText = trimmedLine.replace(/^[-*•]\s+/, '');
      if (itemText.length >= 10) {
        const owner = extractOwner(itemText);
        const priority = extractPriority(itemText);
        const dueDate = extractDueDate(itemText);
        const action = cleanActionText(itemText);

        actions.push({
          action,
          ...(owner && { owner }),
          ...(priority && { priority }),
          ...(dueDate && { dueDate }),
          ...(currentContext && { context: currentContext }),
        });
      }
    }
  }

  return actions;
}

/**
 * Extracts actions from inline patterns throughout the text
 */
function extractFromInlinePatterns(text: string): ActionItem[] {
  const actions: ActionItem[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const action = extractActionFromLine(line);
    if (action) {
      actions.push(action);
    }
  }

  return actions;
}

/**
 * Deduplicates actions based on similarity
 */
function deduplicateActions(actions: ActionItem[]): ActionItem[] {
  const seen = new Set<string>();
  const deduplicated: ActionItem[] = [];

  for (const action of actions) {
    // Use first 50 chars of action as dedup key
    const key = action.action.substring(0, 50).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(action);
    }
  }

  return deduplicated;
}

/**
 * Postmortem Action Extractor Tool
 * Extracts action items from postmortem documents
 */
export const postmortemActionExtractorTool = tool({
  description:
    'Extract action items from postmortem or incident review documents. Detects action items with patterns like "Action:", "TODO:", "Follow-up:", etc., and extracts owners, priorities (high/medium/low), and due dates when present. Returns a structured list of all action items found.',
  inputSchema: jsonSchema<PostmortemActionExtractorInput>({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'Postmortem or incident review text to analyze for action items',
      },
    },
    required: ['text'],
    additionalProperties: false,
  }),
  async execute({ text }): Promise<PostmortemActions> {
    // Validate input
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required and must be a string');
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Extract actions using multiple strategies
    const sectionActions = extractFromActionSections(trimmedText);
    const inlineActions = extractFromInlinePatterns(trimmedText);

    // Combine and deduplicate
    const allActions = [...sectionActions, ...inlineActions];
    const actions = deduplicateActions(allActions);

    // Sort by priority (high > medium > low > undefined)
    actions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2, undefined: 3 };
      const aPriority = a.priority ?? 'undefined';
      const bPriority = b.priority ?? 'undefined';
      return priorityOrder[aPriority] - priorityOrder[bPriority];
    });

    // Calculate metadata
    const hasOwners = actions.filter((a) => a.owner).length;
    const hasPriorities = actions.filter((a) => a.priority).length;
    const hasDueDates = actions.filter((a) => a.dueDate).length;

    return {
      actions,
      count: actions.length,
      metadata: {
        extractedAt: new Date().toISOString(),
        textLength: trimmedText.length,
        hasOwners,
        hasPriorities,
        hasDueDates,
      },
    };
  },
});

export default postmortemActionExtractorTool;
