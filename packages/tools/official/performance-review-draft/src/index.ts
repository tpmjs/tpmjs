/**
 * Performance Review Draft Tool for TPMJS
 * Structures performance review from achievements and feedback into formal review format
 */

import { jsonSchema, tool } from 'ai';

/**
 * Performance rating scale
 */
export type PerformanceRating =
  | 'exceeds-expectations'
  | 'meets-expectations'
  | 'needs-improvement'
  | 'unacceptable';

/**
 * Development goal structure
 */
export interface DevelopmentGoal {
  area: string;
  objective: string;
  timeline?: string;
}

/**
 * Performance review output structure
 */
export interface PerformanceReview {
  period: string;
  summary: string;
  achievements: string[];
  areasForGrowth: string[];
  developmentGoals: DevelopmentGoal[];
  rating?: PerformanceRating;
  formatted: string;
}

type PerformanceReviewDraftInput = {
  achievements: string[];
  feedback: string[];
  period: string;
  rating?: PerformanceRating;
};

/**
 * Validates that a string array has valid content
 */
function validateStringArray(arr: unknown, fieldName: string, minLength = 1): void {
  if (!Array.isArray(arr)) {
    throw new Error(`${fieldName} must be an array`);
  }
  if (arr.length < minLength) {
    throw new Error(`${fieldName} must contain at least ${minLength} item(s)`);
  }
  if (arr.some((item) => typeof item !== 'string' || item.trim().length === 0)) {
    throw new Error(`All items in ${fieldName} must be non-empty strings`);
  }
}

/**
 * Validates performance rating
 */
function validateRating(rating?: string): rating is PerformanceRating | undefined {
  if (!rating) return true;

  const validRatings: PerformanceRating[] = [
    'exceeds-expectations',
    'meets-expectations',
    'needs-improvement',
    'unacceptable',
  ];

  if (!validRatings.includes(rating as PerformanceRating)) {
    throw new Error(`Rating must be one of: ${validRatings.join(', ')}. Received: ${rating}`);
  }

  return true;
}

/**
 * Frames feedback constructively with positive language
 */
function frameConstructively(feedback: string): string {
  // Domain rule: constructive_feedback - Negative language replaced with growth-oriented alternatives per HR best practices
  // Replace negative framing with constructive alternatives
  const constructiveReplacements: Record<string, string> = {
    'bad at': 'has opportunity to improve in',
    poor: 'developing',
    weak: 'growing',
    'failed to': 'can further develop',
    lacks: 'would benefit from strengthening',
    never: 'rarely',
    'always makes mistakes': 'is working to improve accuracy',
  };

  let result = feedback;
  for (const [negative, constructive] of Object.entries(constructiveReplacements)) {
    const regex = new RegExp(negative, 'gi');
    result = result.replace(regex, constructive);
  }

  return result;
}

/**
 * Generates development goals from feedback
 */
function generateDevelopmentGoals(feedback: string[]): DevelopmentGoal[] {
  const goals: DevelopmentGoal[] = [];

  // Extract skill/area keywords from feedback
  const skillKeywords = [
    'communication',
    'leadership',
    'technical',
    'collaboration',
    'time management',
    'planning',
    'documentation',
    'testing',
    'code review',
    'mentoring',
  ];

  const mentionedSkills = new Set<string>();

  for (const item of feedback) {
    const lowerItem = item.toLowerCase();
    for (const skill of skillKeywords) {
      if (lowerItem.includes(skill)) {
        mentionedSkills.add(skill);
      }
    }
  }

  // Generate goals for mentioned skills
  for (const skill of Array.from(mentionedSkills).slice(0, 3)) {
    goals.push({
      area: skill,
      objective: `Strengthen ${skill} skills through focused practice and feedback`,
      timeline: 'Next review period',
    });
  }

  // Add a general growth goal if we have less than 2 specific ones
  if (goals.length < 2) {
    goals.push({
      area: 'Professional Development',
      objective: 'Continue developing expertise through learning and hands-on experience',
      timeline: 'Ongoing',
    });
  }

  return goals;
}

/**
 * Generates performance summary based on achievements and feedback
 */
function generateSummary(
  achievements: string[],
  feedback: string[],
  period: string,
  rating?: PerformanceRating
): string {
  const parts: string[] = [];

  // Opening based on rating
  if (rating === 'exceeds-expectations') {
    parts.push(
      `During ${period}, the employee demonstrated exceptional performance and exceeded expectations across multiple areas.`
    );
  } else if (rating === 'meets-expectations') {
    parts.push(
      `During ${period}, the employee consistently met performance expectations and made solid contributions to the team.`
    );
  } else if (rating === 'needs-improvement') {
    parts.push(
      `During ${period}, the employee showed effort but has clear opportunities to strengthen their performance.`
    );
  } else {
    parts.push(
      `During ${period}, the employee demonstrated both strengths and areas for continued growth.`
    );
  }

  // Achievement highlights
  if (achievements.length > 0) {
    parts.push(
      `Key achievements include ${achievements.length} significant contributions that positively impacted the team and organization.`
    );
  }

  // Growth opportunities
  if (feedback.length > 0) {
    parts.push(
      `Going forward, focusing on ${feedback.length} development areas will help maximize their potential and impact.`
    );
  }

  return parts.join(' ');
}

/**
 * Formats the complete performance review as markdown
 */
function formatPerformanceReview(
  period: string,
  summary: string,
  achievements: string[],
  areasForGrowth: string[],
  goals: DevelopmentGoal[],
  rating?: PerformanceRating
): string {
  const sections: string[] = [];

  sections.push(`# Performance Review - ${period}\n`);

  // Rating if provided
  if (rating) {
    const ratingDisplay = rating
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    sections.push(`**Overall Rating:** ${ratingDisplay}\n`);
  }

  // Summary
  sections.push(`## Executive Summary\n\n${summary}\n`);

  // Achievements
  sections.push('## Key Achievements\n');
  achievements.forEach((achievement, idx) => {
    sections.push(`${idx + 1}. ${achievement}`);
  });
  sections.push('');

  // Areas for growth
  sections.push('## Areas for Growth\n');
  areasForGrowth.forEach((area, idx) => {
    sections.push(`${idx + 1}. ${area}`);
  });
  sections.push('');

  // Development goals
  sections.push('## Development Goals\n');
  goals.forEach((goal, idx) => {
    sections.push(`### ${idx + 1}. ${goal.area}\n`);
    sections.push(`**Objective:** ${goal.objective}`);
    if (goal.timeline) {
      sections.push(`**Timeline:** ${goal.timeline}`);
    }
    sections.push('');
  });

  // Next steps
  sections.push('## Next Steps\n');
  sections.push(
    '- Schedule follow-up discussion to review this feedback\n' +
      '- Create action plan for development goals\n' +
      '- Set regular check-ins to track progress\n' +
      '- Document progress and celebrate wins along the way'
  );

  return sections.join('\n');
}

/**
 * Performance Review Draft Tool
 * Structures performance reviews with constructive framing
 */
export const performanceReviewDraftTool = tool({
  description:
    'Structures performance review from achievements and feedback into formal review format with constructive framing. Includes achievements, growth areas, development goals, and optional performance rating.',
  inputSchema: jsonSchema<PerformanceReviewDraftInput>({
    type: 'object',
    properties: {
      achievements: {
        type: 'array',
        description: 'Key achievements during the review period',
        items: { type: 'string' },
      },
      feedback: {
        type: 'array',
        description: 'Feedback points and areas for improvement',
        items: { type: 'string' },
      },
      period: {
        type: 'string',
        description: 'Review period (e.g., "Q4 2024", "Annual 2024", "H1 2025")',
      },
      rating: {
        type: 'string',
        description:
          'Performance rating (exceeds-expectations, meets-expectations, needs-improvement, unacceptable)',
        enum: ['exceeds-expectations', 'meets-expectations', 'needs-improvement', 'unacceptable'],
      },
    },
    required: ['achievements', 'feedback', 'period'],
    additionalProperties: false,
  }),
  async execute({ achievements, feedback, period, rating }): Promise<PerformanceReview> {
    // Validate achievements
    validateStringArray(achievements, 'achievements', 1);

    // Validate feedback
    validateStringArray(feedback, 'feedback', 1);

    // Validate period
    if (!period || typeof period !== 'string' || period.trim().length === 0) {
      throw new Error('Period is required and must be a non-empty string');
    }

    // Validate rating
    validateRating(rating);

    // Limit array sizes
    if (achievements.length > 20) {
      throw new Error('Achievements array cannot contain more than 20 items');
    }
    if (feedback.length > 20) {
      throw new Error('Feedback array cannot contain more than 20 items');
    }

    // Frame feedback constructively
    const areasForGrowth = feedback.map(frameConstructively);

    // Generate development goals
    const developmentGoals = generateDevelopmentGoals(feedback);

    // Generate summary
    const summary = generateSummary(achievements, feedback, period, rating);

    // Format the complete review
    const formatted = formatPerformanceReview(
      period,
      summary,
      achievements,
      areasForGrowth,
      developmentGoals,
      rating
    );

    return {
      period,
      summary,
      achievements,
      areasForGrowth,
      developmentGoals,
      rating,
      formatted,
    };
  },
});

export default performanceReviewDraftTool;
