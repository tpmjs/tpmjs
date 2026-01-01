/**
 * ToS Readability Tool for TPMJS
 * Analyzes Terms of Service for readability, complexity, and consumer-friendliness
 */

import { jsonSchema, tool } from 'ai';

/**
 * Input interface for ToS readability analysis
 */
interface TOSReadabilityInput {
  tosText: string;
}

/**
 * Represents a problematic section in the ToS
 */
export interface ProblematicSection {
  text: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

/**
 * Readability metrics for the ToS
 */
export interface ReadabilityMetrics {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  averageSentenceLength: number;
  averageWordLength: number;
  complexWordPercentage: number;
}

/**
 * Output interface for ToS analysis
 */
export interface TOSAnalysis {
  metrics: ReadabilityMetrics;
  overallScore: number;
  readabilityLevel: 'excellent' | 'good' | 'fair' | 'poor' | 'very poor';
  estimatedReadingTimeMinutes: number;
  problematicSections: ProblematicSection[];
  recommendations: string[];
  summary: string;
}

/**
 * Calculates the Flesch Reading Ease score
 * Higher scores indicate easier readability (0-100 scale)
 */
// Domain rule: flesch_reading_ease - Readability measured by 206.835 - 1.015×ASL - 84.6×ASW formula
function calculateFleschReadingEase(
  totalSentences: number,
  totalWords: number,
  totalSyllables: number
): number {
  if (totalSentences === 0 || totalWords === 0) return 0;

  const avgSentenceLength = totalWords / totalSentences;
  const avgSyllablesPerWord = totalSyllables / totalWords;

  return 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
}

/**
 * Calculates the Flesch-Kincaid Grade Level
 * Indicates the US school grade level needed to understand the text
 */
// Domain rule: flesch_kincaid_grade - US grade level required = 0.39×ASL + 11.8×ASW - 15.59
function calculateFleschKincaidGrade(
  totalSentences: number,
  totalWords: number,
  totalSyllables: number
): number {
  if (totalSentences === 0 || totalWords === 0) return 0;

  const avgSentenceLength = totalWords / totalSentences;
  const avgSyllablesPerWord = totalSyllables / totalWords;

  return 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;
}

/**
 * Estimates syllable count for a word
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length <= 3) return 1;

  // Remove silent e at the end
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  // Count vowel groups
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

/**
 * Checks if a word is complex (3+ syllables)
 */
function isComplexWord(word: string): boolean {
  return countSyllables(word) >= 3;
}

/**
 * Identifies problematic sections in the ToS
 */
function identifyProblematicSections(text: string): ProblematicSection[] {
  const sections: ProblematicSection[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

  // Domain rule: sentence_length_threshold - Sentences over 40 words are considered excessively long and reduce readability
  // Check for excessively long sentences
  sentences.forEach((sentence) => {
    const words = sentence
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    if (words.length > 40) {
      sections.push({
        text: sentence.trim().substring(0, 200) + (sentence.length > 200 ? '...' : ''),
        issue: 'Excessively long sentence',
        severity: 'high',
        suggestion: 'Break this sentence into multiple shorter sentences for better clarity',
      });
    }
  });

  // Check for common problematic patterns
  const problematicPatterns = [
    {
      pattern: /\b(notwithstanding|aforementioned|hereinafter|thereof|wherein)\b/gi,
      issue: 'Legal jargon',
      severity: 'medium' as const,
      suggestion: 'Replace legal jargon with plain language',
    },
    {
      pattern: /\b(may|might|could)\s+(?:be\s+)?(?:deemed|considered|interpreted)/gi,
      issue: 'Vague or ambiguous language',
      severity: 'high' as const,
      suggestion: 'Use clear, definitive language instead of vague terms',
    },
    {
      pattern:
        /\b(?:we|company)\s+(?:reserve|retain)\s+the\s+right\s+to\s+(?:change|modify|alter)/gi,
      issue: 'Unilateral modification clause',
      severity: 'high' as const,
      suggestion: 'Specify conditions and notice requirements for changes',
    },
    {
      pattern: /\b(?:you\s+agree\s+to\s+waive|waiver\s+of)/gi,
      issue: 'Rights waiver',
      severity: 'high' as const,
      suggestion: 'Clearly explain what rights are being waived and why',
    },
  ];

  problematicPatterns.forEach(({ pattern, issue, severity, suggestion }) => {
    const matches = text.match(pattern);
    if (matches) {
      const context = text.substring(
        Math.max(0, text.indexOf(matches[0]) - 50),
        Math.min(text.length, text.indexOf(matches[0]) + 150)
      );

      sections.push({
        text: context,
        issue,
        severity,
        suggestion,
      });
    }
  });

  return sections.slice(0, 10); // Limit to top 10 issues
}

/**
 * Analyzes ToS text for readability and consumer-friendliness
 */
function analyzeToS(tosText: string): TOSAnalysis {
  if (!tosText || tosText.trim().length === 0) {
    throw new Error('ToS text cannot be empty');
  }

  // Clean and normalize text
  const cleanText = tosText.replace(/\s+/g, ' ').trim();

  // Extract sentences
  const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
  const totalSentences = sentences.length;

  // Extract words
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);
  const totalWords = words.length;

  // Count syllables and complex words
  let totalSyllables = 0;
  let complexWords = 0;

  words.forEach((word) => {
    const syllableCount = countSyllables(word);
    totalSyllables += syllableCount;
    if (isComplexWord(word)) {
      complexWords++;
    }
  });

  // Calculate metrics
  const fleschReadingEase = calculateFleschReadingEase(totalSentences, totalWords, totalSyllables);
  const fleschKincaidGrade = calculateFleschKincaidGrade(
    totalSentences,
    totalWords,
    totalSyllables
  );
  const averageSentenceLength = totalWords / totalSentences;
  const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / totalWords;
  const complexWordPercentage = (complexWords / totalWords) * 100;

  // Determine readability level
  let readabilityLevel: TOSAnalysis['readabilityLevel'];
  if (fleschReadingEase >= 70) readabilityLevel = 'excellent';
  else if (fleschReadingEase >= 60) readabilityLevel = 'good';
  else if (fleschReadingEase >= 50) readabilityLevel = 'fair';
  else if (fleschReadingEase >= 30) readabilityLevel = 'poor';
  else readabilityLevel = 'very poor';

  // Calculate overall score (0-100)
  const overallScore = Math.max(
    0,
    Math.min(100, (fleschReadingEase + (100 - fleschKincaidGrade * 5)) / 2)
  );

  // Estimate reading time (average reading speed: 200 words/minute)
  const estimatedReadingTimeMinutes = Math.ceil(totalWords / 200);

  // Identify problematic sections
  const problematicSections = identifyProblematicSections(cleanText);

  // Generate recommendations
  const recommendations: string[] = [];

  if (fleschKincaidGrade > 12) {
    recommendations.push(
      'Simplify language to reduce the required reading grade level (currently college-level)'
    );
  }

  if (averageSentenceLength > 25) {
    recommendations.push(
      'Reduce sentence length for better readability (current average: ' +
        Math.round(averageSentenceLength) +
        ' words)'
    );
  }

  if (complexWordPercentage > 20) {
    recommendations.push(
      'Reduce use of complex words (currently ' + complexWordPercentage.toFixed(1) + '% of text)'
    );
  }

  if (problematicSections.length > 0) {
    recommendations.push(
      'Address ' + problematicSections.length + ' identified problematic sections'
    );
  }

  if (totalWords > 5000) {
    recommendations.push(
      'Consider condensing the document (currently ' +
        totalWords +
        ' words, ' +
        estimatedReadingTimeMinutes +
        ' min read)'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('ToS is generally well-written and consumer-friendly');
  }

  // Generate summary
  const summary = `This Terms of Service document has a Flesch Reading Ease score of ${fleschReadingEase.toFixed(1)} (${readabilityLevel}) and requires a ${fleschKincaidGrade.toFixed(1)} grade reading level. The document contains ${totalWords} words with an estimated reading time of ${estimatedReadingTimeMinutes} minutes. ${problematicSections.length} potentially problematic sections were identified.`;

  return {
    metrics: {
      fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
      fleschKincaidGrade: Math.round(fleschKincaidGrade * 10) / 10,
      averageSentenceLength: Math.round(averageSentenceLength * 10) / 10,
      averageWordLength: Math.round(averageWordLength * 10) / 10,
      complexWordPercentage: Math.round(complexWordPercentage * 10) / 10,
    },
    overallScore: Math.round(overallScore),
    readabilityLevel,
    estimatedReadingTimeMinutes,
    problematicSections,
    recommendations,
    summary,
  };
}

/**
 * ToS Readability Tool
 * Analyzes Terms of Service for readability, complexity, and consumer-friendliness
 */
export const tosReadabilityTool = tool({
  description:
    'Analyzes Terms of Service documents for readability, complexity, and consumer-friendliness. Calculates Flesch Reading Ease score, Flesch-Kincaid Grade Level, and other readability metrics. Identifies problematic sections such as legal jargon, vague language, unilateral modification clauses, and rights waivers. Returns detailed analysis with recommendations for improving clarity and accessibility.',
  inputSchema: jsonSchema<TOSReadabilityInput>({
    type: 'object',
    properties: {
      tosText: {
        type: 'string',
        description: 'The full Terms of Service text to analyze',
      },
    },
    required: ['tosText'],
    additionalProperties: false,
  }),
  execute: async ({ tosText }): Promise<TOSAnalysis> => {
    // Validate input
    if (typeof tosText !== 'string') {
      throw new Error('ToS text must be a string');
    }

    if (tosText.trim().length === 0) {
      throw new Error('ToS text cannot be empty');
    }

    try {
      return analyzeToS(tosText);
    } catch (error) {
      throw new Error(
        `Failed to analyze ToS readability: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

export default tosReadabilityTool;
