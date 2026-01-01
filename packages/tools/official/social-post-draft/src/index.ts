/**
 * Social Post Draft Tool for TPMJS
 * Drafts platform-optimized social media posts with hashtags and CTAs
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 * Uses jsonSchema() to avoid Zod 4 JSON Schema conversion issues with OpenAI
 */

import { jsonSchema, tool } from 'ai';

export interface SocialPost {
  platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook';
  content: string;
  hashtags: string[];
  characterCount: number;
  characterLimit: number;
  withinLimit: boolean;
  suggestions: string[];
  cta?: string;
}

/**
 * Input type for Social Post Draft Tool
 */
type SocialPostDraftInput = {
  message: string;
  platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook';
  tone?: string;
};

/**
 * Platform character limits and best practices
 */
const PLATFORM_LIMITS = {
  // Domain rule: platform_constraints - Twitter limits and best practices based on platform engagement data
  twitter: {
    limit: 280,
    hashtagCount: 2,
    hashtagStyle: 'concise',
    bestPractices: [
      'Keep tweets under 280 characters',
      'Use 1-2 hashtags for better engagement',
      'Include visual elements when possible',
      'Ask questions to encourage replies',
    ],
  },
  linkedin: {
    limit: 3000,
    hashtagCount: 5,
    hashtagStyle: 'professional',
    bestPractices: [
      'First 2-3 lines are most important (preview)',
      'Use 3-5 relevant hashtags',
      'Include a clear call-to-action',
      'Professional tone works best',
    ],
  },
  instagram: {
    limit: 2200,
    hashtagCount: 10,
    hashtagStyle: 'diverse',
    bestPractices: [
      'Use 8-11 hashtags for maximum reach',
      'Mix popular and niche hashtags',
      'Include emoji for visual appeal',
      'Tell a story in the caption',
    ],
  },
  facebook: {
    limit: 63206,
    hashtagCount: 3,
    hashtagStyle: 'minimal',
    bestPractices: [
      'Shorter posts (40-80 chars) get more engagement',
      'Use 1-3 hashtags sparingly',
      'Questions and polls drive engagement',
      'Post when your audience is active',
    ],
  },
};

/**
 * Extract or generate hashtags from message
 */
function generateHashtags(
  message: string,
  _platform: keyof typeof PLATFORM_LIMITS,
  count: number
): string[] {
  const existingHashtags = message.match(/#\w+/g) || [];

  if (existingHashtags.length >= count) {
    return existingHashtags.slice(0, count);
  }

  // Extract keywords from message for hashtag generation
  const keywords = message
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3 && word.length < 20)
    .filter(
      (word) => !['that', 'this', 'with', 'from', 'have', 'been', 'were', 'their'].includes(word)
    );

  const generatedHashtags = keywords
    .slice(0, count - existingHashtags.length)
    .map((word) => `#${word.charAt(0).toUpperCase() + word.slice(1)}`);

  return [...existingHashtags, ...generatedHashtags].slice(0, count);
}

/**
 * Extract or generate CTA (Call-to-Action)
 */
function extractCTA(message: string, platform: keyof typeof PLATFORM_LIMITS): string | undefined {
  const ctaPatterns = [
    /learn more/i,
    /click link/i,
    /check out/i,
    /visit/i,
    /sign up/i,
    /download/i,
    /get started/i,
    /join us/i,
    /register/i,
  ];

  for (const pattern of ctaPatterns) {
    if (pattern.test(message)) {
      return message.match(pattern)?.[0];
    }
  }

  // Platform-specific default CTAs
  const defaultCTAs: Record<string, string> = {
    twitter: 'Learn more ⬇️',
    linkedin: 'Read more in the comments',
    instagram: 'Link in bio',
    facebook: 'Learn more',
  };

  return defaultCTAs[platform];
}

/**
 * Format post content for platform
 */
function formatPostContent(
  message: string,
  platform: keyof typeof PLATFORM_LIMITS,
  tone?: string
): string {
  let content = message.trim();

  // Apply tone adjustments
  if (tone) {
    switch (tone.toLowerCase()) {
      case 'professional':
        content = content.replace(/!/g, '.').replace(/😊|😃|🎉/g, '');
        break;
      case 'casual':
        if (!content.includes('!') && !content.includes('?')) {
          content = content + '!';
        }
        break;
      case 'friendly':
        if (!content.match(/[!?😊😃🎉]/u)) {
          content = content + ' 😊';
        }
        break;
    }
  }

  // Platform-specific formatting
  switch (platform) {
    case 'twitter':
      // Twitter prefers concise, punchy content
      if (content.length > 240) {
        content = content.substring(0, 237) + '...';
      }
      break;
    case 'linkedin':
      // LinkedIn shows preview of first few lines
      if (!content.includes('\n\n') && content.length > 150) {
        const firstSentence = content.match(/^[^.!?]+[.!?]/)?.[0];
        if (firstSentence) {
          content = firstSentence + '\n\n' + content.substring(firstSentence.length);
        }
      }
      break;
    case 'instagram':
      // Instagram benefits from line breaks for readability
      if (content.length > 200 && !content.includes('\n')) {
        content = content.replace(/\. /g, '.\n');
      }
      break;
  }

  return content;
}

/**
 * Generate platform-specific suggestions
 */
function generateSuggestions(
  post: string,
  platform: keyof typeof PLATFORM_LIMITS,
  withinLimit: boolean
): string[] {
  const suggestions: string[] = [];
  const config = PLATFORM_LIMITS[platform];

  if (!withinLimit) {
    suggestions.push(`Content exceeds ${platform} character limit. Consider shortening.`);
  }

  if (post.length < 50) {
    suggestions.push('Consider adding more context or detail to improve engagement.');
  }

  if (!post.match(/[?!]/)) {
    suggestions.push('Add a question or exclamation to increase engagement.');
  }

  const urlCount = (post.match(/https?:\/\/\S+/g) || []).length;
  if (platform === 'twitter' && urlCount === 0) {
    suggestions.push('Consider adding a link for more information.');
  }

  if (platform === 'instagram' && !post.match(/[\u{1F600}-\u{1F64F}]/u)) {
    suggestions.push('Instagram posts with emojis typically get better engagement.');
  }

  if (platform === 'linkedin' && post.split('\n\n').length === 1 && post.length > 300) {
    suggestions.push('Break content into paragraphs for better readability.');
  }

  // Add platform best practices
  suggestions.push(...config.bestPractices);

  return suggestions;
}

/**
 * Social Post Draft Tool
 * Drafts platform-optimized social media posts with hashtags and CTAs
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const socialPostDraftTool = tool({
  description:
    'Drafts social media posts optimized for specific platforms (Twitter, LinkedIn, Instagram, Facebook) with appropriate hashtags, CTAs, and platform-specific best practices. Respects character limits and engagement patterns.',
  inputSchema: jsonSchema<SocialPostDraftInput>({
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'Core message to communicate in the social post',
      },
      platform: {
        type: 'string',
        enum: ['twitter', 'linkedin', 'instagram', 'facebook'],
        description: 'Target social media platform',
      },
      tone: {
        type: 'string',
        description: 'Desired tone (professional, casual, friendly, etc.)',
      },
    },
    required: ['message', 'platform'],
    additionalProperties: false,
  }),
  async execute({ message, platform, tone }) {
    // Validate required fields
    if (!message || message.trim().length === 0) {
      throw new Error('Message is required');
    }

    if (!platform) {
      throw new Error('Platform is required');
    }

    const platformConfig = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS];
    if (!platformConfig) {
      throw new Error(`Invalid platform: ${platform}`);
    }

    // Format content for platform
    const formattedContent = formatPostContent(message, platform, tone);

    // Generate hashtags
    const hashtags = generateHashtags(formattedContent, platform, platformConfig.hashtagCount);

    // Extract or generate CTA
    const cta = extractCTA(formattedContent, platform);

    // Build final post
    let finalPost = formattedContent;

    // Add CTA if not already in content
    if (cta && !formattedContent.toLowerCase().includes(cta.toLowerCase())) {
      finalPost += '\n\n' + cta;
    }

    // Add hashtags at the end
    if (hashtags.length > 0) {
      finalPost += '\n\n' + hashtags.join(' ');
    }

    const characterCount = finalPost.length;
    const withinLimit = characterCount <= platformConfig.limit;

    // Generate suggestions
    const suggestions = generateSuggestions(finalPost, platform, withinLimit);

    return {
      platform,
      content: finalPost,
      hashtags,
      characterCount,
      characterLimit: platformConfig.limit,
      withinLimit,
      suggestions,
      cta,
    };
  },
});

/**
 * Export default for convenience
 */
export default socialPostDraftTool;
