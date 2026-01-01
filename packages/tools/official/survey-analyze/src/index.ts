/**
 * Survey Analyze Tool for TPMJS
 * Analyzes employee survey responses to extract themes, sentiment, and action items
 */

import { jsonSchema, tool } from 'ai';

/**
 * Sentiment score and analysis
 */
interface SentimentScore {
  overall: number; // -1 to 1 scale
  label: 'negative' | 'neutral' | 'positive';
  confidence: number; // 0 to 1
}

/**
 * Theme extracted from survey responses
 */
interface Theme {
  name: string;
  description: string;
  frequency: number; // Number of responses mentioning this theme
  sentiment: number; // -1 to 1 scale
  examples: string[]; // Sample quotes
}

/**
 * Action item suggested based on survey
 */
interface ActionItem {
  priority: 'high' | 'medium' | 'low';
  category: string;
  recommendation: string;
  rationale: string;
}

/**
 * Per-question analysis
 */
interface QuestionAnalysis {
  question: string;
  sentiment: SentimentScore;
  topThemes: string[];
  responseCount: number;
}

/**
 * Input interface for survey analysis
 */
interface SurveyAnalyzeInput {
  responses: string[];
  questions: string[];
}

/**
 * Survey analysis output
 */
export interface SurveyAnalysis {
  overallSentiment: SentimentScore;
  themes: Theme[];
  actionItems: ActionItem[];
  questionAnalysis: QuestionAnalysis[];
  summary: string;
  participationRate?: number;
}

/**
 * Survey Analyze Tool
 * Analyzes employee survey responses to extract themes, sentiment, and action items
 */
export const surveyAnalyzeTool = tool({
  description:
    'Analyzes employee survey responses to extract key themes, assess sentiment (overall and per-question), and suggest actionable recommendations. Processes both structured and open-ended survey responses to provide comprehensive insights.',
  inputSchema: jsonSchema<SurveyAnalyzeInput>({
    type: 'object',
    properties: {
      responses: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of survey responses from employees',
        minItems: 1,
      },
      questions: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of survey questions that were asked',
        minItems: 1,
      },
    },
    required: ['responses', 'questions'],
    additionalProperties: false,
  }),
  execute: async ({ responses, questions }): Promise<SurveyAnalysis> => {
    // Validate inputs
    if (!Array.isArray(responses) || responses.length === 0) {
      throw new Error('Responses must be a non-empty array');
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Questions must be a non-empty array');
    }

    if (responses.some((r) => typeof r !== 'string')) {
      throw new Error('All responses must be strings');
    }

    if (questions.some((q) => typeof q !== 'string')) {
      throw new Error('All questions must be strings');
    }

    try {
      // Analyze sentiment across all responses
      const overallSentiment = analyzeSentiment(responses);

      // Extract themes from responses
      const themes = extractThemes(responses);

      // Generate action items based on themes and sentiment
      const actionItems = generateActionItems(themes, overallSentiment);

      // Analyze each question individually
      const questionAnalysis = questions.map((question, idx) => {
        const questionResponses = responses.filter((_, i) => i % questions.length === idx);
        const sentiment = analyzeSentiment(questionResponses);
        const topThemes = extractThemes(questionResponses)
          .slice(0, 3)
          .map((t) => t.name);

        return {
          question,
          sentiment,
          topThemes,
          responseCount: questionResponses.length,
        };
      });

      // Generate summary
      const summary = generateSummary(overallSentiment, themes, actionItems);

      return {
        overallSentiment,
        themes,
        actionItems,
        questionAnalysis,
        summary,
        participationRate: undefined, // Requires additional context
      };
    } catch (error) {
      throw new Error(
        `Failed to analyze survey: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

/**
 * Analyze sentiment of text responses
 */
function analyzeSentiment(texts: string[]): SentimentScore {
  // Simple keyword-based sentiment analysis
  const positiveWords = [
    'good',
    'great',
    'excellent',
    'love',
    'amazing',
    'fantastic',
    'happy',
    'satisfied',
    'appreciate',
  ];
  const negativeWords = [
    'bad',
    'poor',
    'terrible',
    'hate',
    'awful',
    'disappointed',
    'frustrated',
    'unhappy',
    'dissatisfied',
  ];

  let positiveCount = 0;
  let negativeCount = 0;
  let totalWords = 0;

  for (const text of texts) {
    const words = text.toLowerCase().split(/\s+/);
    totalWords += words.length;

    for (const word of words) {
      if (positiveWords.some((pw) => word.includes(pw))) positiveCount++;
      if (negativeWords.some((nw) => word.includes(nw))) negativeCount++;
    }
  }

  const score = (positiveCount - negativeCount) / Math.max(totalWords / 10, 1);
  const normalizedScore = Math.max(-1, Math.min(1, score));

  let label: 'negative' | 'neutral' | 'positive';
  if (normalizedScore < -0.2) label = 'negative';
  else if (normalizedScore > 0.2) label = 'positive';
  else label = 'neutral';

  const confidence = Math.min(1, Math.abs(normalizedScore) + 0.3);

  return {
    overall: normalizedScore,
    label,
    confidence,
  };
}

/**
 * Extract themes from responses
 */
function extractThemes(responses: string[]): Theme[] {
  // Simple theme extraction based on common topics
  const themeKeywords: Record<string, string[]> = {
    'Work-Life Balance': ['balance', 'hours', 'overtime', 'flexible', 'remote', 'workload'],
    Compensation: ['salary', 'pay', 'compensation', 'bonus', 'benefits', 'equity'],
    Management: ['manager', 'leadership', 'supervisor', 'boss', 'management'],
    'Career Growth': ['growth', 'promotion', 'career', 'development', 'learning', 'training'],
    Culture: ['culture', 'environment', 'team', 'collaboration', 'values', 'diversity'],
    'Tools & Resources': ['tools', 'resources', 'equipment', 'software', 'technology'],
    Communication: ['communication', 'transparency', 'feedback', 'updates', 'meetings'],
  };

  const themes: Theme[] = [];

  for (const [themeName, keywords] of Object.entries(themeKeywords)) {
    let frequency = 0;
    const examples: string[] = [];
    let sentimentSum = 0;

    for (const response of responses) {
      const lowerResponse = response.toLowerCase();
      const hasKeyword = keywords.some((kw) => lowerResponse.includes(kw));

      if (hasKeyword) {
        frequency++;
        if (examples.length < 3) {
          examples.push(response.substring(0, 100) + (response.length > 100 ? '...' : ''));
        }
        const responseSentiment = analyzeSentiment([response]);
        sentimentSum += responseSentiment.overall;
      }
    }

    if (frequency > 0) {
      themes.push({
        name: themeName,
        description: `Theme related to ${themeName.toLowerCase()}`,
        frequency,
        sentiment: sentimentSum / frequency,
        examples,
      });
    }
  }

  // Sort by frequency
  return themes.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Generate action items based on themes and sentiment
 */
function generateActionItems(themes: Theme[], sentiment: SentimentScore): ActionItem[] {
  const actionItems: ActionItem[] = [];

  // Generate actions for negative themes
  for (const theme of themes) {
    if (theme.sentiment < -0.2 && theme.frequency >= 3) {
      actionItems.push({
        priority: theme.frequency > 10 ? 'high' : theme.frequency > 5 ? 'medium' : 'low',
        category: theme.name,
        recommendation: `Address concerns related to ${theme.name.toLowerCase()}`,
        rationale: `${theme.frequency} responses mentioned ${theme.name.toLowerCase()} with negative sentiment (${theme.sentiment.toFixed(2)})`,
      });
    }
  }

  // Overall negative sentiment action
  if (sentiment.overall < -0.3) {
    actionItems.unshift({
      priority: 'high',
      category: 'Overall Satisfaction',
      recommendation: 'Conduct immediate follow-up to address widespread dissatisfaction',
      rationale: `Overall sentiment is negative (${sentiment.overall.toFixed(2)})`,
    });
  }

  // If no specific actions, suggest general improvement
  if (actionItems.length === 0) {
    actionItems.push({
      priority: 'medium',
      category: 'Continuous Improvement',
      recommendation: 'Continue monitoring employee satisfaction trends',
      rationale: 'No major issues identified, maintain current practices',
    });
  }

  return actionItems;
}

/**
 * Generate summary of survey analysis
 */
function generateSummary(
  sentiment: SentimentScore,
  themes: Theme[],
  actionItems: ActionItem[]
): string {
  const sentimentDesc =
    sentiment.label === 'positive'
      ? 'positive'
      : sentiment.label === 'negative'
        ? 'negative'
        : 'neutral';

  const topThemes = themes.slice(0, 3).map((t) => t.name);
  const highPriorityActions = actionItems.filter((a) => a.priority === 'high').length;

  return `Survey analysis reveals ${sentimentDesc} overall sentiment (${sentiment.overall.toFixed(2)}). Top themes: ${topThemes.join(', ')}. ${highPriorityActions} high-priority action items identified.`;
}

export default surveyAnalyzeTool;
