/**
 * Content Calendar Plan Tool for TPMJS
 * Generates content calendar structure with themes, topics, and posting schedule
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 * Uses jsonSchema() to avoid Zod 4 JSON Schema conversion issues with OpenAI
 */

import { jsonSchema, tool } from 'ai';

export interface ContentItem {
  date: string;
  channel: string;
  contentType: string;
  theme?: string;
  topic: string;
  objective: string;
  suggestedFormat?: string;
}

export interface ContentCalendar {
  duration: string;
  startDate: string;
  endDate: string;
  channels: string[];
  themes: string[];
  items: ContentItem[];
  summary: {
    totalPosts: number;
    postsByChannel: Record<string, number>;
    postsByTheme: Record<string, number>;
    averagePostsPerWeek: number;
  };
}

/**
 * Input type for Content Calendar Plan Tool
 */
type ContentCalendarPlanInput = {
  duration: string;
  channels: string[];
  themes?: string[];
};

/**
 * Calculate date range based on duration
 */
function calculateDateRange(duration: string): { startDate: Date; endDate: Date; weeks: number } {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  let weeks = 1;

  const durationLower = duration.toLowerCase();

  if (durationLower.includes('week')) {
    const weekMatch = durationLower.match(/(\d+)\s*week/);
    weeks = weekMatch?.[1] ? Number.parseInt(weekMatch[1]) : 1;
    endDate.setDate(endDate.getDate() + weeks * 7);
  } else if (durationLower.includes('month')) {
    const monthMatch = durationLower.match(/(\d+)\s*month/);
    const months = monthMatch?.[1] ? Number.parseInt(monthMatch[1]) : 1;
    endDate.setMonth(endDate.getMonth() + months);
    weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  } else if (durationLower.includes('quarter')) {
    endDate.setMonth(endDate.getMonth() + 3);
    weeks = 13;
  } else {
    // Default to 1 week
    endDate.setDate(endDate.getDate() + 7);
    weeks = 1;
  }

  return { startDate, endDate, weeks };
}

/**
 * Get posting frequency per week for each channel
 */
function getChannelFrequency(channel: string): number {
  // Domain rule: content_frequency - Optimal posting frequency varies by social platform
  const frequencies: Record<string, number> = {
    twitter: 7, // Daily
    instagram: 5, // 5 times per week
    linkedin: 3, // 3 times per week
    facebook: 5, // 5 times per week
    blog: 2, // 2 times per week
    youtube: 1, // Weekly
    tiktok: 7, // Daily
    email: 1, // Weekly
    newsletter: 1, // Weekly
    podcast: 1, // Weekly
  };

  const channelLower = channel.toLowerCase();
  for (const [key, freq] of Object.entries(frequencies)) {
    if (channelLower.includes(key)) {
      return freq;
    }
  }

  // Default frequency
  return 3;
}

/**
 * Get content types for each channel
 */
function getContentTypes(channel: string): string[] {
  const contentTypes: Record<string, string[]> = {
    twitter: ['tweet', 'thread', 'poll', 'quote tweet'],
    instagram: ['post', 'reel', 'story', 'carousel'],
    linkedin: ['article', 'post', 'poll', 'document'],
    facebook: ['post', 'video', 'live stream', 'poll'],
    blog: ['article', 'tutorial', 'case study', 'listicle'],
    youtube: ['video', 'short', 'live stream'],
    tiktok: ['video', 'duet', 'stitch'],
    email: ['newsletter', 'promotional', 'educational'],
    newsletter: ['digest', 'featured article', 'roundup'],
    podcast: ['episode', 'interview', 'solo show'],
  };

  const channelLower = channel.toLowerCase();
  for (const [key, types] of Object.entries(contentTypes)) {
    if (channelLower.includes(key)) {
      return types;
    }
  }

  return ['post', 'article', 'video'];
}

/**
 * Generate default themes if none provided
 */
function generateDefaultThemes(): string[] {
  return ['Educational', 'Promotional', 'Inspirational', 'Engagement', 'Behind-the-scenes'];
}

/**
 * Get content objective based on theme
 */
function getObjective(theme: string): string {
  const objectives: Record<string, string> = {
    educational: 'Provide valuable information and insights',
    promotional: 'Drive conversions and sales',
    inspirational: 'Inspire and motivate audience',
    engagement: 'Encourage interaction and community building',
    'behind-the-scenes': 'Build trust and transparency',
    awareness: 'Increase brand visibility',
    entertainment: 'Entertain and delight audience',
    'user-generated': 'Showcase community content',
  };

  const themeLower = theme.toLowerCase();
  for (const [key, objective] of Object.entries(objectives)) {
    if (themeLower.includes(key)) {
      return objective;
    }
  }

  return 'Engage and inform audience';
}

/**
 * Generate topic based on theme and channel
 */
function generateTopic(theme: string, _channel: string, index: number): string {
  const topics: Record<string, string[]> = {
    educational: [
      'How-to guide',
      'Industry insights',
      'Best practices',
      'Tips and tricks',
      'Common mistakes',
      'Beginner tutorial',
      'Advanced techniques',
      'Explainer content',
    ],
    promotional: [
      'Product showcase',
      'Feature highlight',
      'Customer testimonial',
      'Limited offer',
      'New release',
      'Product comparison',
      'Success story',
    ],
    inspirational: [
      'Success story',
      'Motivational quote',
      'Transformation story',
      'Industry leader spotlight',
      'Achievement celebration',
    ],
    engagement: [
      'Poll question',
      'Ask Me Anything',
      'Caption contest',
      'Community spotlight',
      'Discussion prompt',
      'Quiz',
    ],
    'behind-the-scenes': [
      'Team introduction',
      'Office tour',
      'Process reveal',
      'Day in the life',
      'Product development',
    ],
  };

  const themeLower = theme.toLowerCase();
  for (const [key, topicList] of Object.entries(topics)) {
    if (themeLower.includes(key)) {
      return topicList[index % topicList.length] || topicList[0] || 'Content topic';
    }
  }

  return `Content topic ${index + 1}`;
}

/**
 * Generate content calendar items
 */
function generateContentItems(
  startDate: Date,
  endDate: Date,
  channels: string[],
  themes: string[]
): ContentItem[] {
  const items: ContentItem[] = [];
  let themeIndex = 0;

  for (const channel of channels) {
    const frequency = getChannelFrequency(channel);
    const contentTypes = getContentTypes(channel);

    // Calculate posting dates for this channel
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const totalPosts = Math.ceil((totalDays / 7) * frequency);
    const daysBetweenPosts = Math.floor(totalDays / totalPosts);

    for (let i = 0; i < totalPosts; i++) {
      const postDate = new Date(startDate);
      postDate.setDate(postDate.getDate() + i * daysBetweenPosts);

      if (postDate > endDate) break;

      const theme = themes[themeIndex % themes.length] ?? '';
      const contentType = contentTypes[i % contentTypes.length] ?? 'post';
      const topic = generateTopic(theme, channel, i);
      const objective = getObjective(theme);

      const formattedDate = postDate.toISOString().split('T')[0];
      if (formattedDate) {
        items.push({
          date: formattedDate,
          channel,
          contentType,
          theme,
          topic,
          objective,
          suggestedFormat: contentType,
        });
      }

      themeIndex++;
    }
  }

  // Sort by date
  items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return items;
}

/**
 * Calculate summary statistics
 */
function calculateSummary(
  items: ContentItem[],
  channels: string[],
  themes: string[],
  weeks: number
): ContentCalendar['summary'] {
  const postsByChannel: Record<string, number> = {};
  const postsByTheme: Record<string, number> = {};

  for (const channel of channels) {
    postsByChannel[channel] = 0;
  }

  for (const theme of themes) {
    postsByTheme[theme] = 0;
  }

  for (const item of items) {
    postsByChannel[item.channel] = (postsByChannel[item.channel] || 0) + 1;
    if (item.theme) {
      postsByTheme[item.theme] = (postsByTheme[item.theme] || 0) + 1;
    }
  }

  return {
    totalPosts: items.length,
    postsByChannel,
    postsByTheme,
    averagePostsPerWeek: Math.round((items.length / weeks) * 10) / 10,
  };
}

/**
 * Content Calendar Plan Tool
 * Generates content calendar structure with themes, topics, and posting schedule
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const contentCalendarPlanTool = tool({
  description:
    'Generates a structured content calendar with posting schedule, themes, topics, and content types. Organizes content by date, channel, and theme while maintaining consistent posting frequency.',
  inputSchema: jsonSchema<ContentCalendarPlanInput>({
    type: 'object',
    properties: {
      duration: {
        type: 'string',
        description: 'Calendar duration (e.g., "1 week", "1 month", "quarter")',
      },
      channels: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Content channels to plan for (e.g., ["Twitter", "Instagram", "Blog", "LinkedIn"])',
        minItems: 1,
      },
      themes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Content themes or pillars (optional, defaults will be generated)',
      },
    },
    required: ['duration', 'channels'],
    additionalProperties: false,
  }),
  async execute({ duration, channels, themes }) {
    // Validate required fields
    if (!duration || duration.trim().length === 0) {
      throw new Error('Duration is required');
    }

    if (!channels || channels.length === 0) {
      throw new Error('At least one channel is required');
    }

    // Calculate date range
    const { startDate, endDate, weeks } = calculateDateRange(duration);

    // Use provided themes or generate defaults
    const finalThemes = themes && themes.length > 0 ? themes : generateDefaultThemes();

    // Generate content items
    const items = generateContentItems(startDate, endDate, channels, finalThemes);

    // Calculate summary
    const summary = calculateSummary(items, channels, finalThemes, weeks);

    return {
      duration,
      startDate: startDate.toISOString().split('T')[0] || '',
      endDate: endDate.toISOString().split('T')[0] || '',
      channels,
      themes: finalThemes,
      items,
      summary,
    };
  },
});

/**
 * Export default for convenience
 */
export default contentCalendarPlanTool;
