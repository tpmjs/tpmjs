/**
 * Exit Interview Summarize Tool for TPMJS
 * Summarizes exit interview responses into themes and retention insights
 */

import { jsonSchema, tool } from 'ai';

/**
 * Departure reason category
 */
type DepartureReason =
  | 'compensation'
  | 'career-growth'
  | 'management'
  | 'work-life-balance'
  | 'culture'
  | 'relocation'
  | 'personal'
  | 'other';

/**
 * Theme from exit interview
 */
interface ExitTheme {
  category: DepartureReason;
  description: string;
  sentiment: 'negative' | 'neutral' | 'positive';
  mentions: number;
  quotes: string[];
}

/**
 * Retention insight
 */
interface RetentionInsight {
  area: string;
  issue: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  urgency: 'immediate' | 'short-term' | 'long-term';
}

/**
 * Exit interview response data
 */
interface ExitInterviewResponses {
  employeeId?: string;
  employeeName?: string;
  department?: string;
  tenure?: number; // Years at company
  role?: string;
  reasonForLeaving?: string;
  wouldRehire?: boolean;
  wouldRecommend?: boolean;
  responses: Record<string, string>; // Question -> Answer mapping
}

/**
 * Input interface for exit interview summarization
 */
interface ExitInterviewSummarizeInput {
  responses: ExitInterviewResponses;
}

/**
 * Exit interview summary output
 */
export interface ExitInterviewSummary {
  primaryReason: DepartureReason;
  themes: ExitTheme[];
  retentionInsights: RetentionInsight[];
  keyTakeaways: string[];
  riskLevel: 'high' | 'medium' | 'low'; // Risk of similar departures
  positiveAspects: string[];
  areasForImprovement: string[];
  summary: string;
  metadata: {
    department?: string;
    tenure?: number;
    wouldRehire?: boolean;
    wouldRecommend?: boolean;
  };
}

/**
 * Exit Interview Summarize Tool
 * Summarizes exit interview responses into themes and retention insights
 */
export const exitInterviewSummarizeTool = tool({
  description:
    'Summarizes exit interview responses to extract departure reasons, key themes, and retention insights. Analyzes interview data to identify patterns, assess organizational risks, and suggest improvements to reduce future turnover.',
  inputSchema: jsonSchema<ExitInterviewSummarizeInput>({
    type: 'object',
    properties: {
      responses: {
        type: 'object',
        properties: {
          employeeId: { type: 'string', description: 'Employee identifier' },
          employeeName: { type: 'string', description: 'Employee name' },
          department: { type: 'string', description: 'Department name' },
          tenure: { type: 'number', description: 'Years at company' },
          role: { type: 'string', description: 'Job title' },
          reasonForLeaving: { type: 'string', description: 'Primary reason for departure' },
          wouldRehire: {
            type: 'boolean',
            description: 'Whether company would rehire employee',
          },
          wouldRecommend: {
            type: 'boolean',
            description: 'Whether employee would recommend company',
          },
          responses: {
            type: 'object',
            additionalProperties: { type: 'string' },
            description: 'Question and answer pairs from exit interview',
          },
        },
        required: ['responses'],
        description: 'Exit interview response data',
      },
    },
    required: ['responses'],
    additionalProperties: false,
  }),
  execute: async ({ responses }): Promise<ExitInterviewSummary> => {
    // Validate inputs
    if (!responses || typeof responses !== 'object') {
      throw new Error('Responses must be an object');
    }

    if (!responses.responses || typeof responses.responses !== 'object') {
      throw new Error('Responses must contain a responses field with question-answer pairs');
    }

    const questionAnswers = Object.entries(responses.responses);
    if (questionAnswers.length === 0) {
      throw new Error('Exit interview must contain at least one question-answer pair');
    }

    try {
      // Combine all response text for analysis
      const allText = [responses.reasonForLeaving, ...questionAnswers.map(([, a]) => a)]
        .filter(Boolean)
        .join(' ');

      // Analyze departure reason
      const primaryReason = analyzePrimaryReason(allText, responses.reasonForLeaving);

      // Extract themes
      const themes = extractExitThemes(questionAnswers, primaryReason);

      // Assess risk level
      const riskLevel = assessRiskLevel(themes, responses);

      // Generate retention insights
      const retentionInsights = generateRetentionInsights(themes, responses);

      // Extract positive and negative aspects
      const positiveAspects = extractPositiveAspects(questionAnswers);
      const areasForImprovement = extractAreasForImprovement(themes);

      // Generate key takeaways
      const keyTakeaways = generateKeyTakeaways(themes, retentionInsights, responses);

      // Generate summary
      const summary = generateExitSummary(
        primaryReason,
        themes,
        retentionInsights,
        riskLevel,
        responses
      );

      return {
        primaryReason,
        themes,
        retentionInsights,
        keyTakeaways,
        riskLevel,
        positiveAspects,
        areasForImprovement,
        summary,
        metadata: {
          department: responses.department,
          tenure: responses.tenure,
          wouldRehire: responses.wouldRehire,
          wouldRecommend: responses.wouldRecommend,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to summarize exit interview: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

/**
 * Analyze primary reason for departure
 */
function analyzePrimaryReason(text: string, explicitReason?: string): DepartureReason {
  const lowerText = text.toLowerCase();

  // Domain rule: departure_classification - Departure reasons categorized by keyword patterns from exit interview research
  const reasonPatterns: Record<DepartureReason, string[]> = {
    compensation: ['salary', 'pay', 'compensation', 'money', 'benefits', 'underpaid'],
    'career-growth': ['growth', 'promotion', 'career', 'advancement', 'opportunity', 'development'],
    management: ['manager', 'leadership', 'supervisor', 'boss', 'micromanage'],
    'work-life-balance': ['balance', 'hours', 'overtime', 'stress', 'burnout', 'flexible'],
    culture: ['culture', 'environment', 'toxic', 'values', 'fit', 'team'],
    relocation: ['relocate', 'move', 'location', 'remote', 'commute'],
    personal: ['personal', 'family', 'health', 'spouse', 'partner'],
    other: [],
  };

  const scores: Record<DepartureReason, number> = {
    compensation: 0,
    'career-growth': 0,
    management: 0,
    'work-life-balance': 0,
    culture: 0,
    relocation: 0,
    personal: 0,
    other: 0,
  };

  for (const [reason, patterns] of Object.entries(reasonPatterns)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        scores[reason as DepartureReason]++;
      }
    }
  }

  // Check explicit reason first
  if (explicitReason) {
    const lowerExplicit = explicitReason.toLowerCase();
    for (const [reason, patterns] of Object.entries(reasonPatterns)) {
      for (const pattern of patterns) {
        if (lowerExplicit.includes(pattern)) {
          return reason as DepartureReason;
        }
      }
    }
  }

  // Find highest scoring reason
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'other';

  return (Object.entries(scores).find(([, score]) => score === maxScore)?.[0] ||
    'other') as DepartureReason;
}

/**
 * Extract themes from exit interview
 */
function extractExitThemes(
  questionAnswers: [string, string][],
  primaryReason: DepartureReason
): ExitTheme[] {
  const themes: ExitTheme[] = [];

  const themeCategories: DepartureReason[] = [
    'compensation',
    'career-growth',
    'management',
    'work-life-balance',
    'culture',
  ];

  for (const category of themeCategories) {
    const relevantAnswers: string[] = [];
    let mentions = 0;

    for (const [question, answer] of questionAnswers) {
      const text = `${question} ${answer}`.toLowerCase();
      const isRelevant = isTextRelevantToCategory(text, category);

      if (isRelevant) {
        mentions++;
        if (relevantAnswers.length < 2) {
          relevantAnswers.push(answer.substring(0, 150) + (answer.length > 150 ? '...' : ''));
        }
      }
    }

    if (mentions > 0 || category === primaryReason) {
      const sentiment = determineSentiment(relevantAnswers.join(' '));

      themes.push({
        category,
        description: getCategoryDescription(category),
        sentiment,
        mentions: Math.max(mentions, category === primaryReason ? 1 : 0),
        quotes: relevantAnswers,
      });
    }
  }

  return themes.sort((a, b) => b.mentions - a.mentions);
}

/**
 * Check if text is relevant to a category
 */
function isTextRelevantToCategory(text: string, category: DepartureReason): boolean {
  const keywords: Record<DepartureReason, string[]> = {
    compensation: ['salary', 'pay', 'compensation', 'benefits', 'bonus'],
    'career-growth': ['growth', 'promotion', 'career', 'development'],
    management: ['manager', 'leadership', 'supervisor'],
    'work-life-balance': ['balance', 'hours', 'overtime', 'stress'],
    culture: ['culture', 'environment', 'team', 'values'],
    relocation: ['location', 'remote', 'relocate'],
    personal: ['personal', 'family', 'health'],
    other: [],
  };

  return keywords[category]?.some((kw) => text.includes(kw)) || false;
}

/**
 * Get category description
 */
function getCategoryDescription(category: DepartureReason): string {
  const descriptions: Record<DepartureReason, string> = {
    compensation: 'Compensation and benefits related concerns',
    'career-growth': 'Career development and advancement opportunities',
    management: 'Management and leadership issues',
    'work-life-balance': 'Work-life balance and workload concerns',
    culture: 'Company culture and work environment',
    relocation: 'Location and relocation factors',
    personal: 'Personal and family reasons',
    other: 'Other unspecified reasons',
  };

  return descriptions[category];
}

/**
 * Determine sentiment of text
 */
function determineSentiment(text: string): 'negative' | 'neutral' | 'positive' {
  const lowerText = text.toLowerCase();
  const positive = ['good', 'great', 'appreciate', 'enjoyed', 'positive', 'happy'];
  const negative = ['bad', 'poor', 'disappointed', 'frustrated', 'lack', 'never', 'no'];

  const posCount = positive.filter((w) => lowerText.includes(w)).length;
  const negCount = negative.filter((w) => lowerText.includes(w)).length;

  if (negCount > posCount + 1) return 'negative';
  if (posCount > negCount + 1) return 'positive';
  return 'neutral';
}

/**
 * Assess risk level of similar departures
 */
function assessRiskLevel(
  themes: ExitTheme[],
  responses: ExitInterviewResponses
): 'high' | 'medium' | 'low' {
  const negativeThemes = themes.filter((t) => t.sentiment === 'negative').length;
  const wouldNotRecommend = responses.wouldRecommend === false;
  const shortTenure = responses.tenure !== undefined && responses.tenure < 1;

  if ((negativeThemes >= 3 || wouldNotRecommend) && shortTenure) return 'high';
  if (negativeThemes >= 2 || wouldNotRecommend) return 'medium';
  return 'low';
}

/**
 * Generate retention insights
 */
function generateRetentionInsights(
  themes: ExitTheme[],
  responses: ExitInterviewResponses
): RetentionInsight[] {
  const insights: RetentionInsight[] = [];

  for (const theme of themes) {
    if (theme.sentiment === 'negative' && theme.mentions >= 1) {
      const insight = createRetentionInsight(theme, responses);
      if (insight) insights.push(insight);
    }
  }

  return insights;
}

/**
 * Create retention insight from theme
 */
function createRetentionInsight(
  theme: ExitTheme,
  _responses: ExitInterviewResponses
): RetentionInsight | null {
  const recommendations: Record<DepartureReason, string> = {
    compensation: 'Review compensation bands and conduct market analysis',
    'career-growth': 'Implement clear career progression frameworks and development programs',
    management: 'Provide management training and implement regular 360-degree feedback',
    'work-life-balance': 'Review workload distribution and consider flexible work arrangements',
    culture: 'Conduct culture assessment and address identified gaps',
    relocation: 'Consider remote work policies or relocation assistance',
    personal: 'Ensure adequate personal leave policies and support programs',
    other: 'Investigate specific circumstances and gather more data',
  };

  return {
    area: theme.category.replace('-', ' '),
    issue: theme.description,
    impact: theme.mentions >= 2 ? 'high' : 'medium',
    recommendation: recommendations[theme.category],
    urgency: theme.mentions >= 2 ? 'immediate' : 'short-term',
  };
}

/**
 * Extract positive aspects
 */
function extractPositiveAspects(questionAnswers: [string, string][]): string[] {
  const positives: string[] = [];

  for (const [question, answer] of questionAnswers) {
    if (
      question.toLowerCase().includes('positive') ||
      question.toLowerCase().includes('enjoyed') ||
      question.toLowerCase().includes('liked')
    ) {
      if (answer && answer.length > 10) {
        positives.push(answer.substring(0, 200) + (answer.length > 200 ? '...' : ''));
      }
    }
  }

  return positives;
}

/**
 * Extract areas for improvement
 */
function extractAreasForImprovement(themes: ExitTheme[]): string[] {
  return themes
    .filter((t) => t.sentiment === 'negative')
    .map((t) => t.category.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase()));
}

/**
 * Generate key takeaways
 */
function generateKeyTakeaways(
  themes: ExitTheme[],
  insights: RetentionInsight[],
  responses: ExitInterviewResponses
): string[] {
  const takeaways: string[] = [];

  const primaryTheme = themes[0];
  if (primaryTheme) {
    takeaways.push(
      `Primary departure driver: ${primaryTheme.category.replace('-', ' ')} (${primaryTheme.sentiment} sentiment)`
    );
  }

  const highImpactInsights = insights.filter((i) => i.impact === 'high');
  if (highImpactInsights.length > 0) {
    takeaways.push(`${highImpactInsights.length} high-impact retention issues identified`);
  }

  if (responses.wouldRecommend === false) {
    takeaways.push('Employee would not recommend company to others (retention risk)');
  }

  if (responses.tenure && responses.tenure < 1) {
    takeaways.push('Short tenure departure (< 1 year) - potential onboarding issue');
  }

  return takeaways;
}

/**
 * Generate exit summary
 */
function generateExitSummary(
  primaryReason: DepartureReason,
  themes: ExitTheme[],
  insights: RetentionInsight[],
  riskLevel: 'high' | 'medium' | 'low',
  responses: ExitInterviewResponses
): string {
  const reasonText = primaryReason.replace('-', ' ');
  const themeCount = themes.length;
  const negativeThemes = themes.filter((t) => t.sentiment === 'negative').length;

  let summary = `Exit interview analysis: Primary departure reason is ${reasonText}. `;
  summary += `${themeCount} themes identified (${negativeThemes} negative). `;
  summary += `Retention risk level: ${riskLevel}. `;
  summary += `${insights.length} actionable insights generated.`;

  if (responses.wouldRecommend === false) {
    summary += ' Employee would not recommend company.';
  }

  return summary;
}

export default exitInterviewSummarizeTool;
