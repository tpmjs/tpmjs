/**
 * Meeting Minutes Format Tool for TPMJS
 * Parses raw meeting notes and extracts decisions, action items, and key points.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Decision extracted from meeting notes
 */
export interface Decision {
  decision: string;
  context?: string;
}

/**
 * Action item extracted from meeting notes
 */
export interface ActionItem {
  action: string;
  owner?: string;
  dueDate?: string;
}

/**
 * Output interface for meeting minutes
 */
export interface MeetingMinutes {
  summary: string;
  decisions: Decision[];
  actionItems: ActionItem[];
  keyPoints: string[];
  attendees: string[];
}

type MeetingMinutesInput = {
  notes: string;
};

/**
 * Cue phrases for detecting decisions
 */
const DECISION_CUES = [
  'decided',
  'decision',
  'agree',
  'agreed',
  'consensus',
  'conclude',
  'concluded',
  'resolution',
  'resolved',
  'will',
  'going to',
];

/**
 * Cue phrases for detecting action items
 */
const ACTION_CUES = [
  'action',
  'todo',
  'task',
  'owner',
  'responsible',
  'assign',
  'follow up',
  'needs to',
  'should',
  'must',
];

/**
 * Extracts attendees from notes (looks for "Attendees:", "Present:", etc.)
 */
function extractAttendees(notes: string): string[] {
  const lines = notes.split('\n');
  const attendees: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Match patterns like "Attendees: John, Jane" or "Present: John, Jane"
    const match = trimmed.match(/^(?:attendees?|present|participants?):\s*(.+)$/i);
    if (match?.[1]) {
      const names = match[1].split(/[,;]/).map((n) => n.trim());
      attendees.push(...names.filter((n) => n.length > 0));
    }
  }

  return attendees;
}

/**
 * Extracts decisions from notes using cue phrase detection
 */
function extractDecisions(notes: string): Decision[] {
  const lines = notes.split('\n');
  const decisions: Decision[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line contains decision cue phrases
    const lowerLine = trimmed.toLowerCase();
    const hasDecisionCue = DECISION_CUES.some((cue) => lowerLine.includes(cue));

    if (hasDecisionCue) {
      // Clean up bullet points and markers
      const cleaned = trimmed
        .replace(/^[-*•]\s*/, '')
        .replace(/^decision:\s*/i, '')
        .replace(/^decided:\s*/i, '');

      if (cleaned.length > 10) {
        decisions.push({ decision: cleaned });
      }
    }
  }

  return decisions;
}

/**
 * Extracts action items from notes using cue phrase detection
 */
function extractActionItems(notes: string): ActionItem[] {
  const lines = notes.split('\n');
  const actions: ActionItem[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line contains action cue phrases
    const lowerLine = trimmed.toLowerCase();
    const hasActionCue = ACTION_CUES.some((cue) => lowerLine.includes(cue));

    if (hasActionCue) {
      // Clean up bullet points and markers
      let cleaned = trimmed.replace(/^[-*•]\s*/, '').replace(/^action:\s*/i, '');

      // Try to extract owner (e.g., "@John" or "Owner: John" or "(John)")
      let owner: string | undefined;
      const ownerMatch =
        cleaned.match(/@(\w+)/i) ||
        cleaned.match(/owner:\s*(\w+)/i) ||
        cleaned.match(/\(([^)]+)\)/);

      if (ownerMatch?.[1]) {
        owner = ownerMatch[1];
        // Remove owner from action text
        cleaned = cleaned.replace(ownerMatch[0], '').trim();
      }

      // Try to extract due date (e.g., "by Friday" or "due 12/31")
      let dueDate: string | undefined;
      const dateMatch = cleaned.match(/by\s+(\w+)/i) || cleaned.match(/due\s+([^\s,]+)/i);

      if (dateMatch?.[1]) {
        dueDate = dateMatch[1];
        // Remove due date from action text
        cleaned = cleaned.replace(dateMatch[0], '').trim();
      }

      if (cleaned.length > 5) {
        actions.push({
          action: cleaned,
          owner,
          dueDate,
        });
      }
    }
  }

  return actions;
}

/**
 * Extracts key points that aren't decisions or actions
 */
function extractKeyPoints(notes: string, decisions: Decision[], actions: ActionItem[]): string[] {
  const lines = notes.split('\n');
  const keyPoints: string[] = [];
  const decisionTexts = new Set(decisions.map((d) => d.decision.toLowerCase()));
  const actionTexts = new Set(actions.map((a) => a.action.toLowerCase()));

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip header lines, attendee lists, etc.
    if (/^(attendees?|present|participants?|agenda|date|time|location):/i.test(trimmed)) {
      continue;
    }

    // Clean up bullet points
    const cleaned = trimmed.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '');

    // Skip if it's too short or already a decision/action
    if (cleaned.length < 10) continue;
    if (decisionTexts.has(cleaned.toLowerCase())) continue;
    if (actionTexts.has(cleaned.toLowerCase())) continue;

    // Add as key point if it looks substantive
    if (cleaned.length > 20 || /[.!?]$/.test(cleaned)) {
      keyPoints.push(cleaned);
    }
  }

  return keyPoints.slice(0, 10); // Limit to top 10 key points
}

/**
 * Generates a summary from the notes
 */
function generateSummary(
  decisions: Decision[],
  actions: ActionItem[],
  keyPoints: string[]
): string {
  const parts: string[] = [];

  if (decisions.length > 0) {
    parts.push(`${decisions.length} decision${decisions.length === 1 ? '' : 's'} made`);
  }

  if (actions.length > 0) {
    parts.push(`${actions.length} action item${actions.length === 1 ? '' : 's'}`);
  }

  if (keyPoints.length > 0) {
    parts.push(`${keyPoints.length} key point${keyPoints.length === 1 ? '' : 's'}`);
  }

  if (parts.length === 0) {
    return 'Meeting notes processed';
  }

  return `Meeting summary: ${parts.join(', ')}`;
}

/**
 * Meeting Minutes Format Tool
 * Parses raw meeting notes and extracts decisions, action items, and key points
 */
export const meetingMinutesFormatTool = tool({
  description:
    'Parse raw meeting notes and extract structured information including decisions, action items, and key points. Uses cue phrase detection to identify decisions (decided, agreed, consensus) and actions (action, todo, owner). Returns formatted meeting minutes with all extracted information.',
  inputSchema: jsonSchema<MeetingMinutesInput>({
    type: 'object',
    properties: {
      notes: {
        type: 'string',
        description: 'Raw meeting notes to parse and format',
      },
    },
    required: ['notes'],
    additionalProperties: false,
  }),
  async execute({ notes }): Promise<MeetingMinutes> {
    // Validate input
    if (!notes || typeof notes !== 'string') {
      throw new Error('notes is required and must be a string');
    }

    if (notes.trim().length === 0) {
      throw new Error('notes cannot be empty');
    }

    // Extract structured information
    const decisions = extractDecisions(notes);
    const actionItems = extractActionItems(notes);
    const attendees = extractAttendees(notes);
    const keyPoints = extractKeyPoints(notes, decisions, actionItems);
    const summary = generateSummary(decisions, actionItems, keyPoints);

    return {
      summary,
      decisions,
      actionItems,
      keyPoints,
      attendees,
    };
  },
});

export default meetingMinutesFormatTool;
