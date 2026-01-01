/**
 * NPS Analysis Tool for TPMJS
 * Analyzes NPS survey responses and extracts themes
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 * Uses jsonSchema() to avoid Zod 4 JSON Schema conversion issues with OpenAI
 */

import { jsonSchema, tool } from 'ai';

export interface NPSResponse {
  score: number;
  comment?: string;
  respondentId?: string;
  date?: string;
}

export interface NPSCategory {
  category: 'promoter' | 'passive' | 'detractor';
  count: number;
  percentage: number;
  responses: NPSResponse[];
  themes: string[];
}

export interface NPSAnalysis {
  npsScore: number;
  totalResponses: number;
  distribution: {
    promoters: NPSCategory;
    passives: NPSCategory;
    detractors: NPSCategory;
  };
  topThemes: {
    promoterThemes: string[];
    detractorThemes: string[];
  };
  recommendations: string[];
  summary: string;
}

/**
 * Input type for NPS Analysis Tool
 */
type NPSAnalysisInput = {
  responses: NPSResponse[];
};

/**
 * Categorizes NPS score
 */
function categorizeScore(score: number): 'promoter' | 'passive' | 'detractor' {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

/**
 * Extracts themes from comments using keyword matching
 */
function extractThemesFromComments(comments: string[]): string[] {
  const themeKeywords: Record<string, string[]> = {
    'Easy to Use': ['easy', 'simple', 'intuitive', 'user-friendly', 'straightforward'],
    'Great Support': ['support', 'help', 'customer service', 'responsive', 'helpful'],
    'Feature Rich': ['features', 'functionality', 'capabilities', 'powerful', 'comprehensive'],
    'Good Value': ['value', 'price', 'worth', 'affordable', 'reasonable'],
    Reliable: ['reliable', 'stable', 'dependable', 'consistent', 'works well'],
    'Difficult to Use': ['difficult', 'hard', 'confusing', 'complicated', 'complex'],
    'Missing Features': ['missing', 'lack', 'need', 'want', 'wish', 'should have'],
    'Poor Performance': ['slow', 'lag', 'crash', 'freeze', 'performance'],
    Expensive: ['expensive', 'costly', 'overpriced', 'too much', 'price'],
    'Poor Support': ['bad support', 'slow response', 'unhelpful', 'poor service'],
    'Bugs/Issues': ['bug', 'broken', 'error', 'issue', 'problem', 'glitch'],
  };

  const themeCounts = new Map<string, number>();

  for (const comment of comments) {
    const lowerComment = comment.toLowerCase();

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some((keyword) => lowerComment.includes(keyword))) {
        themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
      }
    }
  }

  // Sort by frequency and return top themes
  return Array.from(themeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme);
}

/**
 * Generate recommendations based on NPS analysis
 */
function generateRecommendations(
  npsScore: number,
  detractorThemes: string[],
  promoterThemes: string[]
): string[] {
  const recommendations: string[] = [];

  if (npsScore < 0) {
    recommendations.push(
      'CRITICAL: NPS is negative - immediate action required to address customer dissatisfaction'
    );
  } else if (npsScore < 30) {
    recommendations.push('LOW: Focus on addressing detractor concerns to improve NPS');
  }

  // Address detractor themes
  if (detractorThemes.includes('Difficult to Use')) {
    recommendations.push('Invest in UX improvements and onboarding materials');
  }
  if (detractorThemes.includes('Missing Features')) {
    recommendations.push('Review feature requests and prioritize high-impact additions');
  }
  if (detractorThemes.includes('Poor Performance')) {
    recommendations.push('Prioritize performance optimization and infrastructure improvements');
  }
  if (detractorThemes.includes('Poor Support')) {
    recommendations.push('Improve support response times and training');
  }
  if (detractorThemes.includes('Expensive')) {
    recommendations.push('Review pricing strategy or add more value to justify current pricing');
  }
  if (detractorThemes.includes('Bugs/Issues')) {
    recommendations.push('Focus on stability and quality assurance');
  }

  // Leverage promoter themes
  if (promoterThemes.length > 0) {
    recommendations.push(
      `Amplify strengths in marketing: ${promoterThemes.slice(0, 2).join(', ')}`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain current service levels and continue monitoring feedback');
  }

  return recommendations;
}

/**
 * NPS Analysis Tool
 * Analyzes NPS survey responses and extracts themes
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const npsAnalysisTool = tool({
  description:
    'Analyzes NPS survey responses to categorize by promoter/passive/detractor and extract themes from comments. Provides NPS score, distribution, and actionable insights.',
  inputSchema: jsonSchema<NPSAnalysisInput>({
    type: 'object',
    properties: {
      responses: {
        type: 'array',
        description: 'NPS survey responses with score (0-10) and optional comment',
        items: {
          type: 'object',
          properties: {
            score: {
              type: 'number',
              description: 'NPS score from 0-10',
              minimum: 0,
              maximum: 10,
            },
            comment: {
              type: 'string',
              description: 'Optional comment from respondent',
            },
            respondentId: {
              type: 'string',
              description: 'Optional respondent identifier',
            },
            date: {
              type: 'string',
              description: 'Optional response date (ISO format)',
            },
          },
          required: ['score'],
        },
      },
    },
    required: ['responses'],
    additionalProperties: false,
  }),
  async execute({ responses }) {
    // Validate inputs
    if (!Array.isArray(responses) || responses.length === 0) {
      throw new Error('responses must be a non-empty array');
    }

    // Validate all scores are 0-10
    for (const response of responses) {
      if (response.score < 0 || response.score > 10) {
        throw new Error(`Invalid NPS score: ${response.score}. Must be between 0 and 10.`);
      }
    }

    // Categorize responses
    const promoters: NPSResponse[] = [];
    const passives: NPSResponse[] = [];
    const detractors: NPSResponse[] = [];

    for (const response of responses) {
      const category = categorizeScore(response.score);
      if (category === 'promoter') {
        promoters.push(response);
      } else if (category === 'passive') {
        passives.push(response);
      } else {
        detractors.push(response);
      }
    }

    // Calculate NPS score: (% promoters - % detractors)
    const totalResponses = responses.length;
    const promoterPercentage = (promoters.length / totalResponses) * 100;
    const detractorPercentage = (detractors.length / totalResponses) * 100;
    const npsScore = Math.round(promoterPercentage - detractorPercentage);

    // Extract themes from comments
    const promoterComments = promoters
      .map((r) => r.comment)
      .filter((c): c is string => !!c && c.trim().length > 0);
    const detractorComments = detractors
      .map((r) => r.comment)
      .filter((c): c is string => !!c && c.trim().length > 0);

    const promoterThemes = extractThemesFromComments(promoterComments);
    const detractorThemes = extractThemesFromComments(detractorComments);

    // Generate recommendations
    const recommendations = generateRecommendations(npsScore, detractorThemes, promoterThemes);

    // Create summary
    let summary = `NPS Score: ${npsScore}. `;
    summary += `${promoters.length} promoters (${Math.round(promoterPercentage)}%), `;
    summary += `${passives.length} passives (${Math.round((passives.length / totalResponses) * 100)}%), `;
    summary += `${detractors.length} detractors (${Math.round(detractorPercentage)}%). `;

    if (detractorThemes.length > 0) {
      summary += `Top detractor concerns: ${detractorThemes.slice(0, 2).join(', ')}.`;
    }

    return {
      npsScore,
      totalResponses,
      distribution: {
        promoters: {
          category: 'promoter' as const,
          count: promoters.length,
          percentage: Math.round(promoterPercentage * 100) / 100,
          responses: promoters,
          themes: promoterThemes,
        },
        passives: {
          category: 'passive' as const,
          count: passives.length,
          percentage: Math.round((passives.length / totalResponses) * 100 * 100) / 100,
          responses: passives,
          themes: [],
        },
        detractors: {
          category: 'detractor' as const,
          count: detractors.length,
          percentage: Math.round(detractorPercentage * 100) / 100,
          responses: detractors,
          themes: detractorThemes,
        },
      },
      topThemes: {
        promoterThemes,
        detractorThemes,
      },
      recommendations,
      summary,
    };
  },
});

/**
 * Export default for convenience
 */
export default npsAnalysisTool;
