/**
 * Meeting Minutes Format Tool for TPMJS
 * Formats meeting minutes from structured input into professional markdown format.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Meeting agenda item
 */
export interface MeetingItem {
  topic: string;
  discussion: string;
  action?: string;
}

/**
 * Action item extracted from meeting
 */
export interface ActionItem {
  topic: string;
  action: string;
}

/**
 * Output interface for meeting minutes
 */
export interface MeetingMinutesResult {
  minutes: string;
  actionItems: ActionItem[];
  attendeeCount: number;
}

type MeetingMinutesInput = {
  title: string;
  date: string;
  attendees: string[];
  items: MeetingItem[];
};

/**
 * Formats a single meeting item as markdown
 */
function formatMeetingItem(item: MeetingItem, index: number): string {
  let markdown = `### ${index + 1}. ${item.topic}\n\n`;
  markdown += `${item.discussion}\n\n`;

  if (item.action) {
    markdown += `**Action:** ${item.action}\n\n`;
  }

  return markdown;
}

/**
 * Formats the complete meeting minutes as markdown
 */
function formatMinutes(input: MeetingMinutesInput): string {
  let markdown = `# ${input.title}\n\n`;
  markdown += `**Date:** ${input.date}\n\n`;
  markdown += `**Attendees:** ${input.attendees.join(', ')}\n\n`;
  markdown += '---\n\n';

  markdown += '## Discussion\n\n';

  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i];
    if (item) {
      markdown += formatMeetingItem(item, i);
    }
  }

  return markdown.trim();
}

/**
 * Extracts action items from meeting items
 */
function extractActionItems(items: MeetingItem[]): ActionItem[] {
  return items
    .filter((item) => item.action)
    .map((item) => ({
      topic: item.topic,
      action: item.action as string,
    }));
}

/**
 * Meeting Minutes Format Tool
 * Converts structured meeting data into formatted markdown minutes
 */
export const meetingMinutesFormatTool = tool({
  description:
    'Formats meeting minutes from structured input into professional markdown. Takes a meeting title, date, list of attendees, and discussion items with optional action items. Returns formatted minutes in markdown, extracted action items, and attendee count.',
  inputSchema: jsonSchema<MeetingMinutesInput>({
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The title of the meeting',
      },
      date: {
        type: 'string',
        description: 'The date of the meeting (any format)',
      },
      attendees: {
        type: 'array',
        description: 'List of attendee names',
        items: {
          type: 'string',
        },
      },
      items: {
        type: 'array',
        description: 'Meeting agenda items with discussion and optional actions',
        items: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'The topic or agenda item',
            },
            discussion: {
              type: 'string',
              description: 'Discussion notes for this topic',
            },
            action: {
              type: 'string',
              description: 'Optional action item or next step',
            },
          },
          required: ['topic', 'discussion'],
        },
      },
    },
    required: ['title', 'date', 'attendees', 'items'],
    additionalProperties: false,
  }),
  async execute({ title, date, attendees, items }): Promise<MeetingMinutesResult> {
    // Validate inputs
    if (!title || typeof title !== 'string') {
      throw new Error('title is required and must be a string');
    }

    if (!date || typeof date !== 'string') {
      throw new Error('date is required and must be a string');
    }

    if (!Array.isArray(attendees) || attendees.length === 0) {
      throw new Error('attendees is required and must be a non-empty array');
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('items is required and must be a non-empty array');
    }

    // Validate each item
    for (const item of items) {
      if (!item.topic || !item.discussion) {
        throw new Error('Each item must have both topic and discussion');
      }
    }

    const minutes = formatMinutes({ title, date, attendees, items });
    const actionItems = extractActionItems(items);

    return {
      minutes,
      actionItems,
      attendeeCount: attendees.length,
    };
  },
});

export default meetingMinutesFormatTool;
