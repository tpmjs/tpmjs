/**
 * Postmortem Draft Tool for TPMJS
 * Drafts postmortem documents from incident details with timeline and action items.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Input interface for timeline event
 */
export interface TimelineEvent {
  time: string;
  event: string;
}

/**
 * Input interface for postmortem draft
 */
export interface PostmortemDraftInput {
  title: string;
  timeline: TimelineEvent[];
  rootCause: string;
  actionItems: string[];
}

/**
 * Output interface for postmortem draft
 */
export interface PostmortemDraft {
  postmortem: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: string | null;
}

/**
 * Calculates incident duration from timeline
 *
 * Domain rule: time_calculation - Parses ISO timestamps, calculates duration in minutes/hours/days
 */
function calculateDuration(timeline: TimelineEvent[]): string | null {
  if (timeline.length < 2) return null;

  try {
    const firstEvent = timeline[0];
    const lastEvent = timeline[timeline.length - 1];
    if (!firstEvent || !lastEvent) return null;

    const firstTime = new Date(firstEvent.time);
    const lastTime = new Date(lastEvent.time);

    if (Number.isNaN(firstTime.getTime()) || Number.isNaN(lastTime.getTime())) {
      return null;
    }

    const durationMs = lastTime.getTime() - firstTime.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);

    if (durationMinutes < 60) {
      return `${durationMinutes} minutes`;
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours < 24) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} days`;
  } catch {
    return null;
  }
}

/**
 * Assesses severity based on timeline and root cause
 *
 * Domain rule: severity_heuristic - Uses keyword matching (outage, failure, data loss) and event count to classify severity
 */
function assessSeverity(
  timeline: TimelineEvent[],
  rootCause: string
): 'low' | 'medium' | 'high' | 'critical' {
  const timelineText = timeline.map((e) => e.event.toLowerCase()).join(' ');
  const rootCauseText = rootCause.toLowerCase();
  const combinedText = `${timelineText} ${rootCauseText}`;

  // Critical indicators
  if (
    combinedText.includes('complete outage') ||
    combinedText.includes('total failure') ||
    combinedText.includes('data loss') ||
    combinedText.includes('security breach')
  ) {
    return 'critical';
  }

  // High severity indicators
  if (
    combinedText.includes('major outage') ||
    combinedText.includes('service down') ||
    combinedText.includes('customer impact') ||
    combinedText.includes('production down') ||
    timeline.length > 10
  ) {
    return 'high';
  }

  // Medium severity indicators
  if (
    combinedText.includes('degraded') ||
    combinedText.includes('slow') ||
    combinedText.includes('partial outage') ||
    timeline.length > 5
  ) {
    return 'medium';
  }

  // Default to low
  return 'low';
}

/**
 * Converts text to use blameless language focusing on systems not people
 *
 * Domain rule: blameless_language - Uses regex to replace blame-focused phrases (failed, broke, user error) with system-focused language (system experienced, process gap)
 */
function toBlamelessLanguage(text: string): string {
  // Replace blame-focused phrases with system-focused phrases
  return text
    .replace(
      /\b(who|whoever|someone|somebody|person|people|team|engineer|developer)s?\s+(broke|failed|caused|didn't|forgot|missed|screwed up|messed up|fucked up)/gi,
      'the system experienced'
    )
    .replace(/\b(mistake|error|fault|blame|failure)\s+(by|from|of)\s+\w+/gi, 'system issue')
    .replace(
      /\b(john|jane|bob|alice|team\s+\w+)\s+(broke|failed|caused)/gi,
      'the system experienced'
    )
    .replace(/\b(user error|human error|manual error)/gi, 'process gap')
    .replace(/\bfailed to\b/gi, 'did not')
    .replace(/\bshould have\b/gi, 'could have')
    .replace(/\bneglected to\b/gi, 'did not');
}

/**
 * Generates the postmortem markdown
 *
 * Domain rule: doc_sections - Follows postmortem pattern: Header -> Summary -> Timeline -> Root Cause -> Action Items -> Lessons Learned
 * Domain rule: markdown_template - Uses # for title, ## for sections, blockquote (>) for blameless notice
 * Domain rule: blameless_language - Transforms all user content through toBlamelessLanguage() before rendering
 */
function generatePostmortem(
  title: string,
  timeline: TimelineEvent[],
  rootCause: string,
  actionItems: string[]
): string {
  const lines: string[] = [];

  // Apply blameless language transformation to all user-provided content
  const blamelessTitle = toBlamelessLanguage(title);
  const blamelessRootCause = toBlamelessLanguage(rootCause);
  const blamelessTimeline = timeline.map((event) => ({
    time: event.time,
    event: toBlamelessLanguage(event.event),
  }));
  const blamelessActionItems = actionItems.map((item) => toBlamelessLanguage(item));

  // Header
  lines.push(`# Postmortem: ${blamelessTitle}`);
  lines.push('');
  lines.push(
    '> This postmortem follows blameless principles, focusing on systems and processes rather than individuals.'
  );
  lines.push('');

  // Metadata
  const duration = calculateDuration(timeline);
  const severity = assessSeverity(timeline, rootCause);

  lines.push('## Incident Summary');
  lines.push('');
  lines.push(`**Severity:** ${severity.toUpperCase()}`);
  if (duration) {
    lines.push(`**Duration:** ${duration}`);
  }
  const firstEvent = blamelessTimeline[0];
  const lastEvent = blamelessTimeline[blamelessTimeline.length - 1];
  if (firstEvent) {
    lines.push(`**Start Time:** ${firstEvent.time}`);
    if (blamelessTimeline.length > 1 && lastEvent) {
      lines.push(`**End Time:** ${lastEvent.time}`);
    }
  }
  lines.push('');

  // Timeline
  lines.push('## Timeline');
  lines.push('');
  for (const event of blamelessTimeline) {
    lines.push(`- **${event.time}** - ${event.event}`);
  }
  lines.push('');

  // Root Cause
  lines.push('## Root Cause Analysis');
  lines.push('');
  lines.push(blamelessRootCause);
  lines.push('');

  // Action Items
  lines.push('## Action Items');
  lines.push('');
  for (let i = 0; i < blamelessActionItems.length; i++) {
    lines.push(`${i + 1}. ${blamelessActionItems[i]}`);
  }
  lines.push('');

  // What Went Well
  lines.push('## What Went Well');
  lines.push('');
  lines.push(
    '- [To be filled in during review - focus on system responses and team collaboration]'
  );
  lines.push('');

  // What Could Be Improved
  lines.push('## What Could Be Improved');
  lines.push('');
  lines.push('- [To be filled in during review - focus on system gaps and process improvements]');
  lines.push('');

  // Lessons Learned
  lines.push('## Lessons Learned');
  lines.push('');
  lines.push('- [To be filled in during review - focus on system behaviors and detection methods]');
  lines.push('');

  // Footer
  lines.push('---');
  lines.push('');
  lines.push(`*Generated: ${new Date().toISOString()}*`);

  return lines.join('\n');
}

/**
 * Postmortem Draft Tool
 * Drafts postmortem documents from incident details
 */
export const postmortemDraftTool = tool({
  description:
    'Draft postmortem documents from incident details with timeline and action items. Creates structured incident analysis documentation following SRE best practices.',
  inputSchema: jsonSchema<PostmortemDraftInput>({
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Title of the incident',
      },
      timeline: {
        type: 'array',
        description: 'Array of timeline events',
        items: {
          type: 'object',
          properties: {
            time: {
              type: 'string',
              description: 'Timestamp of the event (ISO 8601 format recommended)',
            },
            event: {
              type: 'string',
              description: 'Description of what happened',
            },
          },
          required: ['time', 'event'],
          additionalProperties: false,
        },
      },
      rootCause: {
        type: 'string',
        description: 'Root cause analysis of the incident',
      },
      actionItems: {
        type: 'array',
        description: 'Array of action items to prevent recurrence',
        items: {
          type: 'string',
        },
      },
    },
    required: ['title', 'timeline', 'rootCause', 'actionItems'],
    additionalProperties: false,
  }),
  async execute({ title, timeline, rootCause, actionItems }): Promise<PostmortemDraft> {
    // Domain rule: input_validation - Validates required fields (title, timeline, rootCause, actionItems), types, and non-empty constraints
    // Validate inputs
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Title is required and must be a non-empty string');
    }

    if (!Array.isArray(timeline) || timeline.length === 0) {
      throw new Error('Timeline must be a non-empty array');
    }

    // Validate each timeline event
    for (let i = 0; i < timeline.length; i++) {
      const event = timeline[i];
      if (!event || typeof event !== 'object') {
        throw new Error(`Timeline event ${i + 1} must be an object`);
      }
      if (!event.time || typeof event.time !== 'string' || event.time.trim().length === 0) {
        throw new Error(`Timeline event ${i + 1} must have a non-empty time`);
      }
      if (!event.event || typeof event.event !== 'string' || event.event.trim().length === 0) {
        throw new Error(`Timeline event ${i + 1} must have a non-empty event description`);
      }
    }

    if (!rootCause || typeof rootCause !== 'string' || rootCause.trim().length === 0) {
      throw new Error('Root cause is required and must be a non-empty string');
    }

    if (!Array.isArray(actionItems) || actionItems.length === 0) {
      throw new Error('Action items must be a non-empty array');
    }

    // Validate each action item
    for (let i = 0; i < actionItems.length; i++) {
      const item = actionItems[i];
      if (!item || typeof item !== 'string' || item.trim().length === 0) {
        throw new Error(`Action item ${i + 1} must be a non-empty string`);
      }
    }

    // Generate the postmortem
    const postmortem = generatePostmortem(title, timeline, rootCause, actionItems);
    const severity = assessSeverity(timeline, rootCause);
    const duration = calculateDuration(timeline);

    return {
      postmortem,
      severity,
      duration,
    };
  },
});

export default postmortemDraftTool;
