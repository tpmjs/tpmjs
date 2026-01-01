/**
 * Email Subject Score Tool for TPMJS
 * Scores email subject lines for open rate potential
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 * Uses jsonSchema() to avoid Zod 4 JSON Schema conversion issues with OpenAI
 */

import { jsonSchema, tool } from 'ai';

export interface SubjectScore {
  subject: string;
  overallScore: number;
  scores: {
    length: { score: number; ideal: string; current: number };
    clarity: { score: number; reason: string };
    urgency: { score: number; reason: string };
    curiosity: { score: number; reason: string };
    personalization: { score: number; reason: string };
  };
  suggestions: string[];
  predictedOpenRate: 'low' | 'medium' | 'high';
}

export interface SubjectScores {
  scores: SubjectScore[];
  bestSubject: string;
  averageScore: number;
}

/**
 * Input type for Email Subject Score Tool
 */
type EmailSubjectScoreInput = {
  subjects: string[];
};

/**
 * Score subject line length (optimal: 40-60 characters)
 */
function scoreLengthCriterion(subject: string): { score: number; ideal: string; current: number } {
  const length = subject.length;

  // Domain rule: email_subject_length - Optimal length 40-60 chars based on email client truncation and engagement data
  if (length >= 40 && length <= 60) {
    return { score: 1.0, ideal: '40-60 chars (optimal)', current: length };
  } else if (length >= 30 && length < 40) {
    return { score: 0.8, ideal: '40-60 chars (optimal)', current: length };
  } else if (length > 60 && length <= 70) {
    return { score: 0.7, ideal: '40-60 chars (optimal)', current: length };
  } else if (length < 30) {
    return { score: 0.5, ideal: '40-60 chars (optimal)', current: length };
  } else {
    return { score: 0.4, ideal: '40-60 chars (optimal)', current: length };
  }
}

/**
 * Score clarity (clear, specific language)
 */
function scoreClarityCriterion(subject: string): { score: number; reason: string } {
  let score = 0.7; // base score
  const reasons: string[] = [];

  // Check for vague words
  const vagueWords = ['thing', 'stuff', 'something', 'various', 'some'];
  const hasVagueWords = vagueWords.some((word) => subject.toLowerCase().includes(word));

  if (hasVagueWords) {
    score -= 0.3;
    reasons.push('Contains vague language');
  } else {
    reasons.push('Uses specific language');
  }

  // Check for numbers (specific)
  if (/\d+/.test(subject)) {
    score += 0.2;
    reasons.push('Includes specific numbers');
  }

  // Check for excessive punctuation
  if (/[!?]{2,}/.test(subject)) {
    score -= 0.2;
    reasons.push('Excessive punctuation reduces clarity');
  }

  // Check for all caps (reduces clarity)
  if (subject === subject.toUpperCase() && subject.length > 5) {
    score -= 0.3;
    reasons.push('All caps reduces readability');
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    reason: reasons.join('; '),
  };
}

/**
 * Score urgency (time-sensitive language)
 */
function scoreUrgencyCriterion(subject: string): { score: number; reason: string } {
  const urgencyWords = [
    'today',
    'now',
    'urgent',
    'limited',
    'expires',
    'deadline',
    'last chance',
    'ending soon',
    'hurry',
    'final',
    'hours left',
    'ends tonight',
  ];

  const lowerSubject = subject.toLowerCase();
  const urgencyCount = urgencyWords.filter((word) => lowerSubject.includes(word)).length;

  if (urgencyCount === 0) {
    return { score: 0.3, reason: 'No urgency indicators' };
  } else if (urgencyCount === 1) {
    return { score: 0.8, reason: 'Moderate urgency' };
  } else {
    // Too much urgency can seem spammy
    return { score: 0.6, reason: 'High urgency (may seem pushy)' };
  }
}

/**
 * Score curiosity (intrigue, question, benefit)
 */
function scoreCuriosityCriterion(subject: string): { score: number; reason: string } {
  let score = 0.5; // base score
  const reasons: string[] = [];

  // Check for questions
  if (subject.includes('?')) {
    score += 0.3;
    reasons.push('Question creates curiosity');
  }

  // Check for curiosity words
  const curiosityWords = [
    'secret',
    'reveal',
    'discover',
    'unlock',
    'insider',
    'exclusive',
    'surprising',
    "you won't believe",
    'what',
    'why',
    'how',
  ];

  const curiosityCount = curiosityWords.filter((word) =>
    subject.toLowerCase().includes(word)
  ).length;

  if (curiosityCount > 0) {
    score += 0.2 * Math.min(curiosityCount, 2);
    reasons.push('Uses curiosity-inducing language');
  }

  // Check for benefit words
  const benefitWords = ['free', 'save', 'bonus', 'gift', 'win', 'earn'];
  const hasBenefit = benefitWords.some((word) => subject.toLowerCase().includes(word));

  if (hasBenefit) {
    score += 0.2;
    reasons.push('Highlights clear benefit');
  }

  if (reasons.length === 0) {
    reasons.push('Could be more intriguing');
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    reason: reasons.join('; '),
  };
}

/**
 * Score personalization (name, custom fields, you/your)
 */
function scorePersonalizationCriterion(subject: string): { score: number; reason: string } {
  let score = 0.4; // base score
  const reasons: string[] = [];

  // Check for personalization tokens
  const hasPersonalizationToken = /\{|\[|%/.test(subject);
  if (hasPersonalizationToken) {
    score += 0.4;
    reasons.push('Uses personalization tokens');
  }

  // Check for "you" or "your"
  const hasYou = /\b(you|your)\b/i.test(subject);
  if (hasYou) {
    score += 0.3;
    reasons.push('Direct personal address');
  }

  // Check for first name indicators
  const hasNamePlaceholder = /\{(first_?name|name)\}/i.test(subject);
  if (hasNamePlaceholder) {
    score += 0.3;
    reasons.push('Includes name placeholder');
  }

  if (reasons.length === 0) {
    reasons.push('No personalization detected');
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    reason: reasons.join('; '),
  };
}

/**
 * Generate improvement suggestions
 */
function generateSuggestions(subject: string, scores: SubjectScore['scores']): string[] {
  const suggestions: string[] = [];

  // Length suggestions
  if (scores.length.current < 30) {
    suggestions.push('Add more context - subject is too short');
  } else if (scores.length.current > 70) {
    suggestions.push('Shorten subject line - may get truncated on mobile');
  }

  // Clarity suggestions
  if (scores.clarity.score < 0.6) {
    suggestions.push('Use more specific, concrete language');
  }

  // Urgency suggestions
  if (scores.urgency.score < 0.5) {
    suggestions.push('Consider adding time-sensitive language if appropriate');
  }

  // Curiosity suggestions
  if (scores.curiosity.score < 0.5) {
    suggestions.push('Add intrigue or highlight a benefit to spark curiosity');
  }

  // Personalization suggestions
  if (scores.personalization.score < 0.6) {
    suggestions.push('Add personalization tokens like {firstName} or use "you/your"');
  }

  // Spam words check
  const spamWords = ['free', 'click here', 'act now', 'limited time', 'buy now', '!!!', '100%'];
  const hasSpamWords = spamWords.some((word) => subject.toLowerCase().includes(word));
  if (hasSpamWords) {
    suggestions.push('Reduce spam-trigger words to avoid spam filters');
  }

  // Emoji check
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(subject);
  if (!hasEmoji) {
    suggestions.push('Consider adding a relevant emoji for visual appeal (test first)');
  }

  return suggestions;
}

/**
 * Calculate overall score and predict open rate
 */
function calculateOverallScore(scores: SubjectScore['scores']): {
  overall: number;
  openRate: 'low' | 'medium' | 'high';
} {
  const weights = {
    length: 0.2,
    clarity: 0.25,
    urgency: 0.15,
    curiosity: 0.25,
    personalization: 0.15,
  };

  const overall =
    scores.length.score * weights.length +
    scores.clarity.score * weights.clarity +
    scores.urgency.score * weights.urgency +
    scores.curiosity.score * weights.curiosity +
    scores.personalization.score * weights.personalization;

  let openRate: 'low' | 'medium' | 'high';
  if (overall >= 0.75) {
    openRate = 'high';
  } else if (overall >= 0.55) {
    openRate = 'medium';
  } else {
    openRate = 'low';
  }

  return { overall, openRate };
}

/**
 * Score a single subject line
 */
function scoreSubject(subject: string): SubjectScore {
  const length = scoreLengthCriterion(subject);
  const clarity = scoreClarityCriterion(subject);
  const urgency = scoreUrgencyCriterion(subject);
  const curiosity = scoreCuriosityCriterion(subject);
  const personalization = scorePersonalizationCriterion(subject);

  const scores = {
    length,
    clarity,
    urgency,
    curiosity,
    personalization,
  };

  const { overall, openRate } = calculateOverallScore(scores);
  const suggestions = generateSuggestions(subject, scores);

  return {
    subject,
    overallScore: Math.round(overall * 100) / 100,
    scores,
    suggestions,
    predictedOpenRate: openRate,
  };
}

/**
 * Email Subject Score Tool
 * Scores email subject lines for open rate potential
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const emailSubjectScoreTool = tool({
  description:
    'Scores email subject lines for open rate potential based on length, clarity, urgency, curiosity, and personalization. Provides detailed feedback and improvement suggestions for each subject line.',
  inputSchema: jsonSchema<EmailSubjectScoreInput>({
    type: 'object',
    properties: {
      subjects: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of email subject lines to evaluate',
        minItems: 1,
      },
    },
    required: ['subjects'],
    additionalProperties: false,
  }),
  async execute({ subjects }) {
    // Validate required fields
    if (!subjects || subjects.length === 0) {
      throw new Error('At least one subject line is required');
    }

    if (subjects.some((s) => !s || s.trim().length === 0)) {
      throw new Error('All subject lines must be non-empty strings');
    }

    // Score each subject
    const scoredSubjects = subjects.map(scoreSubject);

    // Calculate average score
    const averageScore =
      scoredSubjects.reduce((sum, s) => sum + s.overallScore, 0) / scoredSubjects.length;

    // Find best subject
    const bestSubject = scoredSubjects.reduce((best, current) =>
      current.overallScore > best.overallScore ? current : best
    ).subject;

    return {
      scores: scoredSubjects,
      bestSubject,
      averageScore: Math.round(averageScore * 100) / 100,
    };
  },
});

/**
 * Export default for convenience
 */
export default emailSubjectScoreTool;
