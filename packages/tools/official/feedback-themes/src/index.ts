/**
 * Feedback Themes Extraction Tool for TPMJS
 * Extracts themes and sentiment from customer feedback
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 * Uses jsonSchema() to avoid Zod 4 JSON Schema conversion issues with OpenAI
 */

import { jsonSchema, tool } from 'ai';

export interface Theme {
  name: string;
  frequency: number;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  sentimentScore: number;
  examples: string[];
}

export interface FeedbackThemes {
  themes: Theme[];
  overallSentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  totalFeedback: number;
  summary: {
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
  };
}

/**
 * Input type for Feedback Themes Tool
 */
type FeedbackThemesInput = {
  feedback: string[];
};

/**
 * Keyword-based sentiment analyzer
 */
function analyzeSentiment(text: string): {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
} {
  const lowerText = text.toLowerCase();

  const positiveKeywords = [
    'great',
    'excellent',
    'amazing',
    'fantastic',
    'love',
    'perfect',
    'wonderful',
    'awesome',
    'best',
    'good',
    'helpful',
    'easy',
    'fast',
    'impressed',
    'thank',
    'appreciate',
    'satisfied',
  ];

  const negativeKeywords = [
    'bad',
    'terrible',
    'awful',
    'horrible',
    'worst',
    'hate',
    'disappointing',
    'poor',
    'slow',
    'difficult',
    'confusing',
    'frustrated',
    'bug',
    'broken',
    'issue',
    'problem',
    'error',
    'crash',
    'fail',
  ];

  let positiveScore = 0;
  let negativeScore = 0;

  for (const keyword of positiveKeywords) {
    if (lowerText.includes(keyword)) {
      positiveScore++;
    }
  }

  for (const keyword of negativeKeywords) {
    if (lowerText.includes(keyword)) {
      negativeScore++;
    }
  }

  const totalScore = positiveScore - negativeScore;
  const normalizedScore = Math.max(-1, Math.min(1, totalScore / 3));

  if (normalizedScore > 0.2) {
    return { sentiment: 'positive', score: normalizedScore };
  }
  if (normalizedScore < -0.2) {
    return { sentiment: 'negative', score: normalizedScore };
  }
  return { sentiment: 'neutral', score: normalizedScore };
}

/**
 * Extract common words and phrases as themes
 */
function extractThemes(feedbackList: string[]): Map<string, string[]> {
  const themeMap = new Map<string, string[]>();

  // Common theme keywords
  const themeKeywords = [
    { name: 'Performance', keywords: ['slow', 'fast', 'speed', 'performance', 'lag', 'quick'] },
    { name: 'User Interface', keywords: ['ui', 'interface', 'design', 'layout', 'look', 'visual'] },
    {
      name: 'Ease of Use',
      keywords: ['easy', 'difficult', 'simple', 'complex', 'intuitive', 'confusing'],
    },
    { name: 'Features', keywords: ['feature', 'functionality', 'capability', 'option', 'tool'] },
    {
      name: 'Support',
      keywords: ['support', 'help', 'customer service', 'response', 'assistance'],
    },
    { name: 'Bugs', keywords: ['bug', 'error', 'crash', 'broken', 'issue', 'problem'] },
    { name: 'Documentation', keywords: ['documentation', 'docs', 'guide', 'tutorial', 'help'] },
    { name: 'Pricing', keywords: ['price', 'cost', 'expensive', 'cheap', 'value', 'pricing'] },
    { name: 'Integration', keywords: ['integration', 'integrate', 'api', 'connect', 'compatible'] },
    { name: 'Mobile', keywords: ['mobile', 'app', 'ios', 'android', 'phone', 'tablet'] },
  ];

  for (const feedback of feedbackList) {
    const lowerFeedback = feedback.toLowerCase();

    for (const { name, keywords } of themeKeywords) {
      if (keywords.some((keyword) => lowerFeedback.includes(keyword))) {
        if (!themeMap.has(name)) {
          themeMap.set(name, []);
        }
        themeMap.get(name)?.push(feedback);
      }
    }
  }

  return themeMap;
}

/**
 * Determines overall sentiment from individual sentiments
 */
function determineOverallSentiment(
  sentiments: Array<'positive' | 'negative' | 'neutral'>
): 'positive' | 'negative' | 'neutral' | 'mixed' {
  const counts = {
    positive: sentiments.filter((s) => s === 'positive').length,
    negative: sentiments.filter((s) => s === 'negative').length,
    neutral: sentiments.filter((s) => s === 'neutral').length,
  };

  const total = sentiments.length;
  const positiveRatio = counts.positive / total;
  const negativeRatio = counts.negative / total;

  if (positiveRatio > 0.6) return 'positive';
  if (negativeRatio > 0.6) return 'negative';
  if (positiveRatio > 0.3 && negativeRatio > 0.3) return 'mixed';
  return 'neutral';
}

/**
 * Feedback Themes Tool
 * Extracts themes and sentiment from customer feedback
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const feedbackThemesTool = tool({
  description:
    'Extracts themes and sentiment from customer feedback text. Identifies recurring themes, scores sentiment per theme, and provides frequency counts.',
  inputSchema: jsonSchema<FeedbackThemesInput>({
    type: 'object',
    properties: {
      feedback: {
        type: 'array',
        description: 'Array of customer feedback entries (comments, reviews, survey responses)',
        items: {
          type: 'string',
          description: 'Individual feedback text',
        },
      },
    },
    required: ['feedback'],
    additionalProperties: false,
  }),
  async execute({ feedback }) {
    // Validate inputs
    if (!Array.isArray(feedback) || feedback.length === 0) {
      throw new Error('feedback must be a non-empty array');
    }

    // Filter out empty feedback
    const validFeedback = feedback.filter((f) => f && f.trim().length > 0);

    if (validFeedback.length === 0) {
      throw new Error('No valid feedback entries provided');
    }

    // Extract themes
    const themeMap = extractThemes(validFeedback);
    const themes: Theme[] = [];

    for (const [themeName, examples] of themeMap.entries()) {
      // Analyze sentiment for this theme
      const sentiments = examples.map((ex) => analyzeSentiment(ex));
      const avgScore = sentiments.reduce((sum, { score }) => sum + score, 0) / sentiments.length;

      let themeSentiment: 'positive' | 'negative' | 'neutral' | 'mixed' = 'neutral';
      const posCount = sentiments.filter((s) => s.sentiment === 'positive').length;
      const negCount = sentiments.filter((s) => s.sentiment === 'negative').length;
      const ratio = posCount / sentiments.length;

      if (ratio > 0.6) {
        themeSentiment = 'positive';
      } else if (negCount / sentiments.length > 0.6) {
        themeSentiment = 'negative';
      } else if (posCount > 0 && negCount > 0) {
        themeSentiment = 'mixed';
      }

      themes.push({
        name: themeName,
        frequency: examples.length,
        sentiment: themeSentiment,
        sentimentScore: Math.round(avgScore * 100) / 100,
        examples: examples.slice(0, 3), // Top 3 examples
      });
    }

    // Sort themes by frequency
    themes.sort((a, b) => b.frequency - a.frequency);

    // Calculate overall sentiment
    const allSentiments = validFeedback.map((f) => analyzeSentiment(f).sentiment);
    const overallSentiment = determineOverallSentiment(allSentiments);

    const summary = {
      positiveCount: allSentiments.filter((s) => s === 'positive').length,
      negativeCount: allSentiments.filter((s) => s === 'negative').length,
      neutralCount: allSentiments.filter((s) => s === 'neutral').length,
    };

    return {
      themes,
      overallSentiment,
      totalFeedback: validFeedback.length,
      summary,
    };
  },
});

/**
 * Export default for convenience
 */
export default feedbackThemesTool;
