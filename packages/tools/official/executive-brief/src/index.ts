/**
 * Executive Brief Tool for TPMJS
 * Formats content into executive summary style with key bullets and concise overview
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for the executive brief
 */
export interface ExecutiveBrief {
  brief: string;
  bulletCount: number;
  wordCount: number;
}

type ExecutiveBriefInput = {
  content: string;
  maxBullets?: number;
};

/**
 * Counts words in a string
 */
function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

/**
 * Extracts key sentences from content that would make good bullet points
 */
function extractKeyBullets(content: string, maxBullets: number): string[] {
  // Split into sentences (simple split on periods, question marks, exclamation points)
  const sentences = content
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const bullets: string[] = [];
  const seenKeywords = new Set<string>();

  for (const sentence of sentences) {
    if (bullets.length >= maxBullets) break;

    // Skip if too long (likely a compound sentence)
    if (sentence.length > 200) continue;

    // Get first few words as deduplication key
    const keywords = sentence.toLowerCase().split(/\s+/).slice(0, 5).join(' ');

    if (seenKeywords.has(keywords)) continue;
    seenKeywords.add(keywords);

    // Prefer sentences with action words or key indicators
    const hasKeyIndicator =
      /\b(will|must|should|key|critical|important|main|primary|essential|significant|major)\b/i.test(
        sentence
      );

    const hasNumbers = /\d+%?|\$\d+|#\d+/.test(sentence);
    const startsWithCapital = /^[A-Z]/.test(sentence);

    if ((hasKeyIndicator || hasNumbers) && startsWithCapital) {
      bullets.push(sentence);
    }
  }

  // If we don't have enough bullets with key indicators, add more general ones
  if (bullets.length < Math.min(3, maxBullets)) {
    for (const sentence of sentences) {
      if (bullets.length >= maxBullets) break;

      const keywords = sentence.toLowerCase().split(/\s+/).slice(0, 5).join(' ');

      if (!seenKeywords.has(keywords) && sentence.length < 200 && /^[A-Z]/.test(sentence)) {
        seenKeywords.add(keywords);
        bullets.push(sentence);
      }
    }
  }

  return bullets;
}

/**
 * Creates a brief summary from the first few sentences
 */
function createOverview(content: string): string {
  const sentences = content
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30);

  // Take first 2-3 sentences for overview
  const overview = sentences.slice(0, 3).join('. ');
  return overview.length > 0 ? `${overview}.` : 'No overview available.';
}

/**
 * Executive Brief Tool
 * Formats content into executive summary style with key bullets
 */
export const executiveBriefTool = tool({
  description:
    'Format content into an executive summary style with a concise overview and key bullet points. Ideal for distilling long documents into decision-maker friendly summaries.',
  inputSchema: jsonSchema<ExecutiveBriefInput>({
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'The content to format into an executive brief',
      },
      maxBullets: {
        type: 'number',
        description: 'Maximum number of bullet points to include (default: 5)',
        default: 5,
      },
    },
    required: ['content'],
    additionalProperties: false,
  }),
  async execute({ content, maxBullets = 5 }): Promise<ExecutiveBrief> {
    // Validate input
    if (!content || typeof content !== 'string') {
      throw new Error('Content is required and must be a string');
    }

    if (content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }

    if (maxBullets < 1 || maxBullets > 20) {
      throw new Error('maxBullets must be between 1 and 20');
    }

    // Generate the brief
    const overview = createOverview(content);
    const bullets = extractKeyBullets(content, maxBullets);

    // Format as markdown
    const briefMarkdown = `# Executive Brief

## Overview
${overview}

## Key Points
${bullets.map((bullet) => `- ${bullet}`).join('\n')}
`;

    const wordCount = countWords(briefMarkdown);

    return {
      brief: briefMarkdown,
      bulletCount: bullets.length,
      wordCount,
    };
  },
});

export default executiveBriefTool;
