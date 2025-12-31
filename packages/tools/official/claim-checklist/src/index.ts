/**
 * Claim Checklist Tool for TPMJS
 * Extracts factual claims from text and identifies which ones need citations.
 */

import { jsonSchema, tool } from 'ai';
import sbd from 'sbd';

/**
 * Type of evidence needed for a claim
 */
export type EvidenceType =
  | 'statistic'
  | 'fact'
  | 'quote'
  | 'historical'
  | 'scientific'
  | 'common-knowledge';

/**
 * Priority level for getting citation
 */
export type Priority = 'high' | 'medium' | 'low';

/**
 * Individual claim with analysis
 */
export interface Claim {
  claim: string;
  needsCitation: boolean;
  evidenceType: EvidenceType;
  priority: Priority;
  reason: string;
  suggestedEvidence: string;
  sentenceIndex: number;
}

/**
 * Output interface for claim checklist
 */
export interface ClaimChecklist {
  originalText: string;
  claims: Claim[];
  summary: {
    totalSentences: number;
    totalClaims: number;
    needingCitation: number;
    byPriority: {
      high: number;
      medium: number;
      low: number;
    };
    byType: Record<EvidenceType, number>;
  };
  metadata: {
    analyzedAt: string;
    wordCount: number;
  };
}

type ClaimChecklistInput = {
  text: string;
};

/**
 * Patterns for detecting different claim types
 */
const CLAIM_PATTERNS = {
  statistic: [
    /\d+(\.\d+)?%/,
    /\d+\s*(million|billion|thousand|trillion)/i,
    /\b(doubled|tripled|quadrupled|halved)\b/i,
    /\b(majority|minority)\s+(of|in)/i,
    /\b(most|many|few|some|all|none)\s+\w+\s+(are|is|have|has)/i,
    /\b(increased|decreased|grew|shrunk|rose|fell)\s+by/i,
    /\b(average|median|mean)\b/i,
  ],
  quote: [
    /"[^"]{10,}"/,
    /'[^']{10,}'/,
    /according to\s+[A-Z]/i,
    /\bsaid\s+that\b/i,
    /\bstated\s+that\b/i,
    /\bclaimed\s+that\b/i,
  ],
  historical: [
    /\b(in|since|during|after|before)\s+(19|20)\d{2}\b/i,
    /\b(founded|established|created|invented|discovered)\s+in/i,
    /\b(first|last|oldest|newest|earliest|latest)\b/i,
    /\bhistorically\b/i,
  ],
  scientific: [
    /\b(study|research|experiment|trial|analysis)\s+(shows?|found|reveals?|demonstrates?)/i,
    /\b(scientists?|researchers?|experts?)\s+(say|believe|found|discovered)/i,
    /\b(proven|evidence|data)\s+(shows?|suggests?|indicates?)/i,
    /\bcauses?\b.*\b(disease|condition|effect)/i,
  ],
  fact: [
    /\bis\s+(the\s+)?(largest|smallest|fastest|slowest|highest|lowest|best|worst)/i,
    /\b(always|never|every|all|none)\b/i,
    /\b(must|will|cannot|impossible)\b/i,
    /\b(only|unique|first|sole)\b/i,
  ],
};

/**
 * Common knowledge patterns (usually don't need citation)
 */
const COMMON_KNOWLEDGE_PATTERNS = [
  /\bthe\s+sun\s+/i,
  /\bwater\s+(is|freezes|boils)\b/i,
  /\bEarth\s+(is|has|orbits)\b/i,
  /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i,
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i,
];

/**
 * Determine evidence type for a sentence
 */
function determineEvidenceType(sentence: string): EvidenceType {
  // Check for common knowledge first
  if (COMMON_KNOWLEDGE_PATTERNS.some((p) => p.test(sentence))) {
    return 'common-knowledge';
  }

  // Check each claim type
  if (CLAIM_PATTERNS.statistic.some((p) => p.test(sentence))) {
    return 'statistic';
  }
  if (CLAIM_PATTERNS.quote.some((p) => p.test(sentence))) {
    return 'quote';
  }
  if (CLAIM_PATTERNS.scientific.some((p) => p.test(sentence))) {
    return 'scientific';
  }
  if (CLAIM_PATTERNS.historical.some((p) => p.test(sentence))) {
    return 'historical';
  }
  if (CLAIM_PATTERNS.fact.some((p) => p.test(sentence))) {
    return 'fact';
  }

  return 'fact';
}

/**
 * Determine if a sentence is a claim that needs citation
 */
function isClaim(sentence: string): boolean {
  // Skip very short sentences
  if (sentence.length < 20) return false;

  // Skip questions
  if (sentence.endsWith('?')) return false;

  // Skip imperative sentences (commands)
  if (/^(please|let's|do|don't|try|make|be sure)/i.test(sentence)) {
    return false;
  }

  // Skip common knowledge
  if (COMMON_KNOWLEDGE_PATTERNS.some((p) => p.test(sentence))) {
    return false;
  }

  // Check if matches any claim pattern
  for (const patterns of Object.values(CLAIM_PATTERNS)) {
    if (patterns.some((p) => p.test(sentence))) {
      return true;
    }
  }

  return false;
}

/**
 * Determine priority based on claim type and language
 */
function determinePriority(sentence: string, evidenceType: EvidenceType): Priority {
  // Statistics and scientific claims are highest priority
  if (evidenceType === 'statistic' || evidenceType === 'scientific') {
    return 'high';
  }

  // Absolute claims are high priority
  if (/\b(always|never|all|none|must|impossible|proven)\b/i.test(sentence)) {
    return 'high';
  }

  // Quotes need verification
  if (evidenceType === 'quote') {
    return 'high';
  }

  // Historical claims are medium
  if (evidenceType === 'historical') {
    return 'medium';
  }

  // General facts are low-medium
  return 'medium';
}

/**
 * Generate reason for why citation is needed
 */
function generateReason(sentence: string, evidenceType: EvidenceType): string {
  switch (evidenceType) {
    case 'statistic':
      return 'Contains specific numbers or statistics that need a source';
    case 'quote':
      return 'Contains a quote or attribution that should be verified';
    case 'scientific':
      return 'Makes scientific or research-based claims requiring evidence';
    case 'historical':
      return 'Contains historical dates or events that should be verified';
    case 'fact':
      if (/\b(always|never|all|none)\b/i.test(sentence)) {
        return 'Makes absolute claims that are difficult to prove universally';
      }
      if (/\b(largest|smallest|first|only)\b/i.test(sentence)) {
        return 'Makes superlative claims that need verification';
      }
      return 'States facts that may need supporting evidence';
    default:
      return 'May require verification';
  }
}

/**
 * Suggest what evidence would support the claim
 */
function suggestEvidence(_sentence: string, evidenceType: EvidenceType): string {
  switch (evidenceType) {
    case 'statistic':
      return 'Link to original study, government statistics, or research paper';
    case 'quote':
      return 'Link to original speech, interview, or publication';
    case 'scientific':
      return 'Peer-reviewed study, meta-analysis, or official research publication';
    case 'historical':
      return 'Historical records, reputable encyclopedia, or primary source';
    case 'fact':
      return 'Authoritative source such as official documentation or expert reference';
    default:
      return 'Credible source supporting this claim';
  }
}

/**
 * Claim Checklist Tool
 * Extracts and analyzes claims from text
 */
export const claimChecklistTool = tool({
  description:
    'Extract checkable factual claims from text, identify which ones need citations, and suggest what evidence would support each claim. Useful for fact-checking and improving content credibility.',
  inputSchema: jsonSchema<ClaimChecklistInput>({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to analyze for factual claims',
      },
    },
    required: ['text'],
    additionalProperties: false,
  }),
  async execute({ text }): Promise<ClaimChecklist> {
    // Validate input
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required and must be a string');
    }

    if (text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    try {
      // Split into sentences
      const sentences: string[] = sbd.sentences(text, {
        newline_boundaries: true,
        preserve_whitespace: false,
      });

      const cleanSentences = sentences
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);

      // Analyze each sentence for claims
      const claims: Claim[] = [];
      const typeCounts: Record<EvidenceType, number> = {
        statistic: 0,
        fact: 0,
        quote: 0,
        historical: 0,
        scientific: 0,
        'common-knowledge': 0,
      };

      for (let i = 0; i < cleanSentences.length; i++) {
        const sentence = cleanSentences[i];
        if (!sentence) continue;

        if (isClaim(sentence)) {
          const evidenceType = determineEvidenceType(sentence);
          const needsCitation = evidenceType !== 'common-knowledge';
          const priority = needsCitation ? determinePriority(sentence, evidenceType) : 'low';

          typeCounts[evidenceType]++;

          claims.push({
            claim: sentence,
            needsCitation,
            evidenceType,
            priority,
            reason: needsCitation
              ? generateReason(sentence, evidenceType)
              : 'Common knowledge - no citation needed',
            suggestedEvidence: needsCitation ? suggestEvidence(sentence, evidenceType) : '',
            sentenceIndex: i,
          });
        }
      }

      // Calculate summary statistics
      const needingCitation = claims.filter((c) => c.needsCitation).length;
      const priorityCounts = {
        high: claims.filter((c) => c.priority === 'high').length,
        medium: claims.filter((c) => c.priority === 'medium').length,
        low: claims.filter((c) => c.priority === 'low').length,
      };

      const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

      return {
        originalText: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
        claims,
        summary: {
          totalSentences: cleanSentences.length,
          totalClaims: claims.length,
          needingCitation,
          byPriority: priorityCounts,
          byType: typeCounts,
        },
        metadata: {
          analyzedAt: new Date().toISOString(),
          wordCount,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to analyze text for claims: ${message}`);
    }
  },
});

export default claimChecklistTool;
