import { jsonSchema, tool } from 'ai';

export interface Timeline {
  originalText: string;
  events: Array<{
    date: string; // ISO format
    description: string;
    confidence: number; // 0.0 to 1.0
    originalMention: string;
  }>;
  dateRange?: {
    earliest: string;
    latest: string;
  };
}

type TimelineFromTextInput = {
  text: string;
};

export const timelineFromTextTool = tool({
  description:
    'Extract dated events from text and return a normalized timeline with confidence scores per event',
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
    // TODO: Implement with:
    // 1. Use chrono-node to parse dates from text
    // 2. Extract sentence context around each date
    // 3. Normalize dates to ISO format
    // 4. Assign confidence based on date specificity

    return {
      originalText: text,
      events: [],
      dateRange: undefined,
    };
  },
});

export default timelineFromTextTool;
