/**
 * Timeline From Text Tool for TPMJS
 * Extracts dated events from unstructured text and returns a normalized timeline.
 */

import { jsonSchema, tool } from 'ai';
import * as chrono from 'chrono-node';
import sbd from 'sbd';

/**
 * Individual event in the timeline
 */
export interface TimelineEvent {
  date: string; // ISO format
  dateDisplay: string; // Human-readable format
  description: string;
  confidence: number; // 0.0 to 1.0
  originalMention: string;
  dateType: 'specific' | 'partial' | 'relative' | 'range';
}

/**
 * Output interface for timeline
 */
export interface Timeline {
  originalText: string;
  events: TimelineEvent[];
  dateRange: {
    earliest: string;
    latest: string;
  } | null;
  gaps: Array<{
    from: string;
    to: string;
    durationDays: number;
  }>;
  metadata: {
    extractedAt: string;
    totalEvents: number;
    datesCovered: number; // Number of distinct dates
  };
}

type TimelineFromTextInput = {
  text: string;
};

/**
 * Determine confidence based on date specificity
 */
function calculateConfidence(parsed: chrono.ParsedResult): number {
  const start = parsed.start;

  // Full date with day, month, year = highest confidence
  if (start.isCertain('day') && start.isCertain('month') && start.isCertain('year')) {
    return 0.95;
  }

  // Month and year = high confidence
  if (start.isCertain('month') && start.isCertain('year')) {
    return 0.8;
  }

  // Just year = medium confidence
  if (start.isCertain('year')) {
    return 0.6;
  }

  // Relative date (today, yesterday, last week) = lower confidence
  return 0.4;
}

/**
 * Determine date type based on parsing
 */
function determineDateType(parsed: chrono.ParsedResult): TimelineEvent['dateType'] {
  const start = parsed.start;

  if (parsed.end) {
    return 'range';
  }

  if (start.isCertain('day') && start.isCertain('month') && start.isCertain('year')) {
    return 'specific';
  }

  if (start.isCertain('year') && !start.isCertain('day')) {
    return 'partial';
  }

  return 'relative';
}

/**
 * Format date for display
 */
function formatDateDisplay(date: Date, dateType: TimelineEvent['dateType']): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
  };

  if (dateType === 'specific') {
    options.month = 'long';
    options.day = 'numeric';
  } else if (dateType === 'partial') {
    options.month = 'long';
  }

  return date.toLocaleDateString('en-US', options);
}

/**
 * Extract context around a date mention
 */
function extractContext(
  text: string,
  index: number,
  matchLength: number,
  sentences: string[]
): string {
  // Find which sentence contains this date
  let charCount = 0;
  for (const sentence of sentences) {
    const sentenceStart = charCount;
    const sentenceEnd = charCount + sentence.length;

    if (index >= sentenceStart && index < sentenceEnd) {
      return sentence.trim();
    }

    charCount = sentenceEnd + 1; // +1 for space/newline
  }

  // Fallback: extract surrounding text
  const contextStart = Math.max(0, index - 50);
  const contextEnd = Math.min(text.length, index + matchLength + 100);
  return text.substring(contextStart, contextEnd).trim();
}

/**
 * Calculate gaps between events
 */
function calculateGaps(
  events: TimelineEvent[]
): Array<{ from: string; to: string; durationDays: number }> {
  if (events.length < 2) return [];

  const gaps: Array<{ from: string; to: string; durationDays: number }> = [];

  for (let i = 0; i < events.length - 1; i++) {
    const current = events[i];
    const next = events[i + 1];

    if (!current || !next) continue;

    const currentDate = new Date(current.date);
    const nextDate = new Date(next.date);

    const diffMs = nextDate.getTime() - currentDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Only report gaps of more than 30 days
    if (diffDays > 30) {
      gaps.push({
        from: current.date,
        to: next.date,
        durationDays: diffDays,
      });
    }
  }

  return gaps;
}

/**
 * Timeline From Text Tool
 * Extracts dated events from text
 */
export const timelineFromTextTool = tool({
  description:
    'Extract dated events from unstructured text and return a normalized, chronologically sorted timeline with confidence scores. Supports various date formats including specific dates, partial dates, and relative references.',
  inputSchema: jsonSchema<TimelineFromTextInput>({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to extract timeline events from',
      },
    },
    required: ['text'],
    additionalProperties: false,
  }),
  async execute({ text }): Promise<Timeline> {
    // Validate input
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required and must be a string');
    }

    if (text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Split into sentences for context extraction
    const sentences: string[] = sbd.sentences(text, {
      newline_boundaries: true,
      preserve_whitespace: false,
    });

    // Parse dates from text using chrono-node
    const parsedDates = chrono.parse(text);

    // Convert to timeline events
    const events: TimelineEvent[] = [];
    const seenDates = new Set<string>();

    for (const parsed of parsedDates) {
      const date = parsed.start.date();
      const isoDate = date.toISOString().split('T')[0] || '';
      const dateType = determineDateType(parsed);
      const confidence = calculateConfidence(parsed);

      // Skip duplicate dates (keep first occurrence)
      if (seenDates.has(isoDate)) continue;
      seenDates.add(isoDate);

      // Extract context around the date mention
      const description = extractContext(text, parsed.index, parsed.text.length, sentences);

      events.push({
        date: isoDate,
        dateDisplay: formatDateDisplay(date, dateType),
        description,
        confidence,
        originalMention: parsed.text,
        dateType,
      });
    }

    // Sort chronologically
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate date range
    const dateRange =
      events.length >= 2
        ? {
            earliest: events[0]?.date || '',
            latest: events[events.length - 1]?.date || '',
          }
        : events.length === 1
          ? {
              earliest: events[0]?.date || '',
              latest: events[0]?.date || '',
            }
          : null;

    // Calculate gaps
    const gaps = calculateGaps(events);

    return {
      originalText: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
      events,
      dateRange,
      gaps,
      metadata: {
        extractedAt: new Date().toISOString(),
        totalEvents: events.length,
        datesCovered: seenDates.size,
      },
    };
  },
});

export default timelineFromTextTool;
