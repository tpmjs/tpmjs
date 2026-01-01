/**
 * Trademark Check Tool for TPMJS
 * Checks proposed names against common trademark patterns and suggests conflicts
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 * Uses jsonSchema() to avoid Zod 4 JSON Schema conversion issues with OpenAI
 */

import { jsonSchema, tool } from 'ai';

/**
 * Risk level for trademark conflict
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Similarity type
 */
export type SimilarityType = 'phonetic' | 'visual' | 'conceptual' | 'exact';

/**
 * Potential trademark conflict
 */
export interface PotentialConflict {
  name: string;
  industry: string;
  similarityType: SimilarityType[];
  similarityScore: number;
  riskLevel: RiskLevel;
  explanation: string;
}

/**
 * Nice Classification (International Trademark Classes)
 */
export interface TrademarkClass {
  classNumber: number;
  description: string;
  relevant: boolean;
}

/**
 * Trademark check result
 */
export interface TrademarkCheck {
  proposedName: string;
  industry: string;
  overallRisk: RiskLevel;
  potentialConflicts: PotentialConflict[];
  recommendedClasses: TrademarkClass[];
  recommendations: string[];
  searchSuggestions: string[];
  legalDisclaimer: string;
}

/**
 * Input type for Trademark Check Tool
 */
type TrademarkCheckInput = {
  proposedName: string;
  industry: string;
  description?: string;
};

/**
 * Common trademark patterns by industry
 * This is a simplified heuristic database - real trademark checks require USPTO/WIPO searches
 */
const COMMON_TRADEMARKS: Record<string, { name: string; variations: string[] }[]> = {
  technology: [
    { name: 'Apple', variations: ['appl', 'aple'] },
    { name: 'Microsoft', variations: ['microsft', 'micro soft'] },
    { name: 'Google', variations: ['googl', 'gogle'] },
    { name: 'Amazon', variations: ['amazn'] },
    { name: 'Meta', variations: ['facebook', 'fb'] },
    { name: 'Oracle', variations: ['oracl'] },
    { name: 'Intel', variations: ['intl'] },
    { name: 'Samsung', variations: ['samsg'] },
  ],
  software: [
    { name: 'Adobe', variations: ['adob'] },
    { name: 'Salesforce', variations: ['sales force'] },
    { name: 'SAP', variations: [] },
    { name: 'GitHub', variations: ['git hub'] },
    { name: 'GitLab', variations: ['git lab'] },
  ],
  ecommerce: [
    { name: 'Shopify', variations: ['shop ify'] },
    { name: 'eBay', variations: ['e bay'] },
    { name: 'Etsy', variations: [] },
  ],
  finance: [
    { name: 'Visa', variations: [] },
    { name: 'Mastercard', variations: ['master card'] },
    { name: 'PayPal', variations: ['pay pal'] },
    { name: 'Stripe', variations: [] },
    { name: 'Square', variations: [] },
  ],
};

/**
 * Nice Classification - International Trademark Classes
 */
const NICE_CLASSES: Record<string, number[]> = {
  technology: [9, 42], // Computer hardware, software services
  software: [9, 42], // Software, IT services
  ecommerce: [35, 42], // Retail services, online services
  finance: [36, 42], // Financial services, insurance
  healthcare: [5, 10, 44], // Pharmaceuticals, medical devices, medical services
  food: [29, 30, 43], // Meat/dairy, coffee/bread, restaurant services
  clothing: [25, 35], // Clothing, retail
  media: [38, 41], // Telecommunications, education/entertainment
  consulting: [35, 42], // Business services, professional services
};

/**
 * Calculate phonetic similarity (simplified Soundex-like algorithm)
 */
// Domain rule: phonetic_similarity - Trademarks that sound alike may cause confusion regardless of spelling
function phoneticSimilarity(str1: string, str2: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[aeiou]/g, '0')
      .replace(/[bp]/g, '1')
      .replace(/[ckq]/g, '2')
      .replace(/[dt]/g, '3')
      .replace(/[lr]/g, '4')
      .replace(/[mn]/g, '5')
      .replace(/[gj]/g, '6')
      .replace(/[fv]/g, '7')
      .replace(/[sz]/g, '8')
      .replace(/[^0-9]/g, '');

  const code1 = normalize(str1);
  const code2 = normalize(str2);

  if (code1 === code2) return 1.0;

  // Calculate Levenshtein distance on phonetic codes
  const maxLen = Math.max(code1.length, code2.length);
  if (maxLen === 0) return 1.0;

  let distance = 0;
  for (let i = 0; i < maxLen; i++) {
    if (code1[i] !== code2[i]) distance++;
  }

  return 1 - distance / maxLen;
}

/**
 * Calculate visual similarity (character overlap)
 */
function visualSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Check for exact substring
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // Calculate character overlap
  const set1 = new Set(s1);
  const set2 = new Set(s2);
  const intersection = new Set([...set1].filter((x) => set2.has(x)));

  const unionSize = set1.size + set2.size - intersection.size;
  return intersection.size / unionSize;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    if (matrix[0]) {
      matrix[0][j] = j;
    }
  }

  for (let i = 1; i <= len1; i++) {
    const row = matrix[i];
    if (!row) continue;
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      row[j] = Math.min(
        (matrix[i - 1]?.[j] ?? 0) + 1,
        (row[j - 1] ?? 0) + 1,
        (matrix[i - 1]?.[j - 1] ?? 0) + cost
      );
    }
  }

  return matrix[len1]?.[len2] ?? 0;
}

/**
 * Check similarity between proposed name and existing trademark
 */
function checkSimilarity(
  proposedName: string,
  existingName: string
): {
  types: SimilarityType[];
  score: number;
} {
  const proposed = proposedName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const existing = existingName.toLowerCase().replace(/[^a-z0-9]/g, '');

  const types: SimilarityType[] = [];
  let maxScore = 0;

  // Exact match
  if (proposed === existing) {
    types.push('exact');
    return { types, score: 1.0 };
  }

  // Phonetic similarity
  const phoneticScore = phoneticSimilarity(proposed, existing);
  if (phoneticScore > 0.8) {
    types.push('phonetic');
    maxScore = Math.max(maxScore, phoneticScore);
  }

  // Visual similarity
  const visualScore = visualSimilarity(proposed, existing);
  if (visualScore > 0.7) {
    types.push('visual');
    maxScore = Math.max(maxScore, visualScore);
  }

  // Levenshtein similarity
  const distance = levenshteinDistance(proposed, existing);
  const levenScore = 1 - distance / Math.max(proposed.length, existing.length);
  if (levenScore > 0.7) {
    if (!types.includes('visual')) types.push('visual');
    maxScore = Math.max(maxScore, levenScore);
  }

  // Conceptual similarity (substring match)
  if ((proposed.includes(existing) || existing.includes(proposed)) && !types.includes('visual')) {
    types.push('conceptual');
    maxScore = Math.max(maxScore, 0.75);
  }

  return { types, score: maxScore };
}

/**
 * Assess risk level based on similarity score and industry overlap
 */
// Domain rule: trademark_confusion - Risk increases with similarity score and same-industry overlap
function assessRisk(similarityScore: number, sameIndustry: boolean): RiskLevel {
  if (similarityScore >= 0.9) return 'critical';
  if (similarityScore >= 0.8 && sameIndustry) return 'high';
  if (similarityScore >= 0.7) return 'high';
  if (similarityScore >= 0.6 && sameIndustry) return 'medium';
  if (similarityScore >= 0.5) return 'medium';
  return 'low';
}

/**
 * Get relevant Nice Classification classes for industry
 */
function getRelevantClasses(industry: string): TrademarkClass[] {
  const industryKey = industry.toLowerCase();
  const classNumbers = NICE_CLASSES[industryKey] || [42]; // Default to IT services

  const classDescriptions: Record<number, string> = {
    5: 'Pharmaceuticals, medical preparations',
    9: 'Computer software, hardware, electronics',
    10: 'Medical devices and apparatus',
    25: 'Clothing, footwear, headgear',
    29: 'Meat, fish, poultry, dairy products',
    30: 'Coffee, tea, bread, pastry',
    35: 'Advertising, business management, retail services',
    36: 'Insurance, financial affairs, real estate',
    38: 'Telecommunications',
    41: 'Education, entertainment, sporting activities',
    42: 'Scientific and technological services, IT services',
    43: 'Services for providing food and drink',
    44: 'Medical services, veterinary services',
  };

  return classNumbers.map((num) => ({
    classNumber: num,
    description: classDescriptions[num] || 'Other services',
    relevant: true,
  }));
}

/**
 * Generate search suggestions for professional trademark search
 */
function generateSearchSuggestions(proposedName: string, industry: string): string[] {
  return [
    `Search USPTO TESS database: https://tmsearch.uspto.gov/`,
    `Search WIPO Global Brand Database: https://www.wipo.int/branddb/`,
    `Search for "${proposedName}" in Nice Classes: ${NICE_CLASSES[industry.toLowerCase()]?.join(', ') || '42'}`,
    `Consider hiring a trademark attorney for comprehensive search`,
    `Check domain name availability: ${proposedName.toLowerCase()}.com`,
    `Search for similar phonetic spellings and common misspellings`,
    `Review state trademark databases in your jurisdiction`,
  ];
}

/**
 * Generate recommendations based on risk assessment
 */
function generateRecommendations(overallRisk: RiskLevel, conflicts: PotentialConflict[]): string[] {
  const recommendations: string[] = [];

  if (overallRisk === 'critical' || overallRisk === 'high') {
    recommendations.push(
      'STRONGLY RECOMMENDED: Choose a different name to avoid potential trademark infringement',
      'Consult with a trademark attorney before proceeding with this name',
      'Consider significant modifications to make the name more distinctive'
    );
  }

  if (overallRisk === 'medium') {
    recommendations.push(
      'Exercise caution: Further professional trademark search recommended',
      'Consider modifications to increase distinctiveness',
      'Consult with a trademark attorney to assess actual risk'
    );
  }

  if (conflicts.length > 0) {
    recommendations.push(
      'Conduct comprehensive trademark search through USPTO TESS and WIPO databases',
      'Review identified potential conflicts in detail',
      'Consider alternative name variations or completely different names'
    );
  }

  recommendations.push(
    'Ensure your name is distinctive and not merely descriptive',
    'Check for similar trademarks in related industries that could cause confusion',
    'Consider registering your trademark once cleared',
    'Monitor trademark databases regularly after registration'
  );

  return recommendations;
}

/**
 * Trademark Check Tool
 * Checks proposed names against common trademark patterns and suggests conflicts
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const trademarkCheckTool = tool({
  description:
    'Performs preliminary trademark conflict check for proposed names. Analyzes phonetic, visual, and conceptual similarity to known trademarks. Provides risk assessment, identifies potential conflicts, and recommends trademark classes. This is a heuristic screening tool - not a substitute for professional trademark search.',
  inputSchema: jsonSchema<TrademarkCheckInput>({
    type: 'object',
    properties: {
      proposedName: {
        type: 'string',
        description: 'Proposed name or trademark to check',
      },
      industry: {
        type: 'string',
        description:
          'Industry or business sector (e.g., technology, software, finance, healthcare)',
      },
      description: {
        type: 'string',
        description: 'Optional description of the product/service for better classification',
      },
    },
    required: ['proposedName', 'industry'],
    additionalProperties: false,
  }),
  async execute({ proposedName, industry, description: _description }) {
    // Validate input
    if (!proposedName || proposedName.trim().length === 0) {
      throw new Error('Proposed name is required');
    }

    if (!industry || industry.trim().length === 0) {
      throw new Error('Industry is required');
    }

    const industryKey = industry.toLowerCase();
    const potentialConflicts: PotentialConflict[] = [];

    // Check all industries for broader conflicts
    const allIndustries = Object.keys(COMMON_TRADEMARKS);
    for (const industryName of allIndustries) {
      const trademarks = COMMON_TRADEMARKS[industryName];
      if (!trademarks) continue;

      for (const trademark of trademarks) {
        // Check main name
        const mainCheck = checkSimilarity(proposedName, trademark.name);

        if (mainCheck.score > 0.5) {
          const sameIndustry = industryName === industryKey;
          const risk = assessRisk(mainCheck.score, sameIndustry);

          potentialConflicts.push({
            name: trademark.name,
            industry: industryName,
            similarityType: mainCheck.types,
            similarityScore: mainCheck.score,
            riskLevel: risk,
            explanation: `${Math.round(mainCheck.score * 100)}% similarity (${mainCheck.types.join(', ')}) to existing trademark${sameIndustry ? ' in same industry' : ''}`,
          });
        }

        // Check variations
        for (const variation of trademark.variations) {
          const varCheck = checkSimilarity(proposedName, variation);
          if (varCheck.score > 0.6) {
            const sameIndustry = industryName === industryKey;
            const risk = assessRisk(varCheck.score, sameIndustry);

            potentialConflicts.push({
              name: `${trademark.name} (variation: ${variation})`,
              industry: industryName,
              similarityType: varCheck.types,
              similarityScore: varCheck.score,
              riskLevel: risk,
              explanation: `${Math.round(varCheck.score * 100)}% similarity to trademark variation${sameIndustry ? ' in same industry' : ''}`,
            });
          }
        }
      }
    }

    // Sort conflicts by risk and similarity
    potentialConflicts.sort((a, b) => {
      const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const riskDiff = riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      if (riskDiff !== 0) return riskDiff;
      return b.similarityScore - a.similarityScore;
    });

    // Determine overall risk
    let overallRisk: RiskLevel = 'low';
    if (potentialConflicts.some((c) => c.riskLevel === 'critical')) {
      overallRisk = 'critical';
    } else if (potentialConflicts.some((c) => c.riskLevel === 'high')) {
      overallRisk = 'high';
    } else if (potentialConflicts.some((c) => c.riskLevel === 'medium')) {
      overallRisk = 'medium';
    }

    // Get recommended trademark classes
    const recommendedClasses = getRelevantClasses(industry);

    // Generate recommendations
    const recommendations = generateRecommendations(overallRisk, potentialConflicts);

    // Generate search suggestions
    const searchSuggestions = generateSearchSuggestions(proposedName, industry);

    return {
      proposedName,
      industry,
      overallRisk,
      potentialConflicts: potentialConflicts.slice(0, 10), // Limit to top 10
      recommendedClasses,
      recommendations,
      searchSuggestions,
      legalDisclaimer:
        'IMPORTANT: This is a preliminary heuristic screening tool only. It does not replace professional trademark search and legal advice. Always consult with a qualified trademark attorney and conduct comprehensive searches through USPTO, WIPO, and other relevant trademark databases before adopting a trademark.',
    };
  },
});

/**
 * Export default for convenience
 */
export default trademarkCheckTool;
