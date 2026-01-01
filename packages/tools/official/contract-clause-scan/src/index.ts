/**
 * Contract Clause Scan Tool for TPMJS
 * Scans contract text to identify and categorize key clauses
 */

import { jsonSchema, tool } from 'ai';

/**
 * Types of clauses commonly found in contracts
 */
type ClauseType =
  | 'termination'
  | 'liability'
  | 'intellectual_property'
  | 'confidentiality'
  | 'indemnification'
  | 'payment'
  | 'jurisdiction'
  | 'dispute_resolution'
  | 'force_majeure'
  | 'assignment'
  | 'notice'
  | 'amendment'
  | 'severability'
  | 'entire_agreement'
  | 'warranty'
  | 'non_compete'
  | 'auto_renewal'
  | 'other';

/**
 * Represents a single identified clause
 */
export interface Clause {
  type: ClauseType;
  text: string;
  location: {
    startIndex: number;
    endIndex: number;
    paragraph?: number;
  };
  confidence: number;
  summary: string;
}

/**
 * Input interface for contract clause scanning
 */
interface ContractClauseScanInput {
  contractText: string;
}

/**
 * Output interface for contract clause scan result
 */
export interface ContractClauses {
  clauses: Clause[];
  clauseCount: number;
  clausesByType: Record<ClauseType, number>;
  summary: string;
}

/**
 * Pattern matching rules for common clause types
 */
const CLAUSE_PATTERNS: Record<ClauseType, { keywords: string[]; contextKeywords?: string[] }> = {
  termination: {
    keywords: ['terminat', 'cancel', 'end this agreement', 'cease'],
    contextKeywords: ['notice', 'cause', 'convenience'],
  },
  liability: {
    keywords: ['liab', 'damages', 'loss', 'responsible for'],
    contextKeywords: ['limit', 'exclude', 'consequential', 'incidental'],
  },
  intellectual_property: {
    keywords: ['intellectual property', 'copyright', 'patent', 'trademark', 'IP rights'],
    contextKeywords: ['ownership', 'license', 'proprietary'],
  },
  confidentiality: {
    keywords: ['confidential', 'proprietary information', 'non-disclosure'],
    contextKeywords: ['secret', 'disclose', 'protect'],
  },
  indemnification: {
    keywords: ['indemnif', 'hold harmless', 'defend'],
    contextKeywords: ['claims', 'losses', 'expenses'],
  },
  payment: {
    keywords: ['payment', 'fee', 'compensation', 'invoice', 'price'],
    contextKeywords: ['due', 'terms', 'installment'],
  },
  jurisdiction: {
    keywords: ['jurisdiction', 'governing law', 'venue'],
    contextKeywords: ['state', 'court', 'laws of'],
  },
  dispute_resolution: {
    keywords: ['arbitration', 'mediation', 'dispute resolution'],
    contextKeywords: ['conflict', 'disagreement', 'binding'],
  },
  force_majeure: {
    keywords: ['force majeure', 'act of god', 'beyond reasonable control'],
    contextKeywords: ['excused', 'delay', 'natural disaster'],
  },
  assignment: {
    keywords: ['assign', 'transfer', 'successor'],
    contextKeywords: ['consent', 'bind', 'delegate'],
  },
  notice: {
    keywords: ['notice', 'notification', 'written communication'],
    contextKeywords: ['address', 'email', 'registered mail'],
  },
  amendment: {
    keywords: ['amend', 'modif', 'change this agreement'],
    contextKeywords: ['writing', 'signed', 'mutually'],
  },
  severability: {
    keywords: ['severab', 'invalid', 'unenforceable'],
    contextKeywords: ['provision', 'remainder', 'effect'],
  },
  entire_agreement: {
    keywords: ['entire agreement', 'integration', 'supersede'],
    contextKeywords: ['previous', 'prior', 'complete'],
  },
  warranty: {
    keywords: ['warrant', 'represent', 'guarantee'],
    contextKeywords: ['assure', 'promise', 'covenant'],
  },
  non_compete: {
    keywords: ['non-compete', 'non compete', 'competitive'],
    contextKeywords: ['restrict', 'prohibit', 'during term'],
  },
  auto_renewal: {
    keywords: ['auto-renew', 'automatic renewal', 'renew automatically'],
    contextKeywords: ['unless', 'notice', 'term'],
  },
  other: {
    keywords: [],
  },
};

/**
 * Analyzes contract text to identify and categorize clauses
 */
function analyzeContract(contractText: string): ContractClauses {
  if (!contractText || contractText.trim().length === 0) {
    throw new Error('Contract text cannot be empty');
  }

  // Domain rule: paragraph_segmentation - Contracts are segmented by double newlines to identify logical sections
  const paragraphs = contractText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const clauses: Clause[] = [];
  const clausesByType: Record<ClauseType, number> = {} as Record<ClauseType, number>;

  // Initialize counts
  Object.keys(CLAUSE_PATTERNS).forEach((type) => {
    clausesByType[type as ClauseType] = 0;
  });

  // Analyze each paragraph
  paragraphs.forEach((paragraph, paraIndex) => {
    const paraText = paragraph.trim();
    const normalizedPara = paraText.toLowerCase();
    const startIndex = contractText.indexOf(paraText);

    // Domain rule: keyword_matching - Contract clauses are identified by matching legal terminology patterns
    // Check against each clause type pattern
    for (const [type, pattern] of Object.entries(CLAUSE_PATTERNS)) {
      if (type === 'other') continue;

      const keywordMatches = pattern.keywords.some((keyword) =>
        normalizedPara.includes(keyword.toLowerCase())
      );

      if (keywordMatches) {
        // Domain rule: confidence_scoring - Clause confidence increases with keyword + context match density
        // Calculate confidence based on keyword and context matches
        let confidence = 0.6;

        if (pattern.contextKeywords) {
          const contextMatches = pattern.contextKeywords.filter((keyword) =>
            normalizedPara.includes(keyword.toLowerCase())
          ).length;

          confidence += (contextMatches / pattern.contextKeywords.length) * 0.4;
        } else {
          confidence = 0.8;
        }

        // Generate summary (first sentence or first 150 chars)
        const sentences = paraText.split(/[.!?]+/);
        const summary =
          sentences[0]?.trim() ||
          (paraText.length > 150 ? `${paraText.substring(0, 150)}...` : paraText);

        const clause: Clause = {
          type: type as ClauseType,
          text: paraText,
          location: {
            startIndex,
            endIndex: startIndex + paraText.length,
            paragraph: paraIndex + 1,
          },
          confidence: Math.min(confidence, 1.0),
          summary,
        };

        clauses.push(clause);
        clausesByType[type as ClauseType]++;

        // Don't match multiple types for the same paragraph (use highest priority match)
        break;
      }
    }
  });

  // Generate overall summary
  const topClauseTypes = Object.entries(clausesByType)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type]) => type.replace(/_/g, ' '));

  const summary =
    clauses.length > 0
      ? `Found ${clauses.length} clauses across ${paragraphs.length} paragraphs. Primary clause types: ${topClauseTypes.join(', ')}.`
      : 'No standard clauses identified in the provided text.';

  return {
    clauses: clauses.sort((a, b) => b.confidence - a.confidence),
    clauseCount: clauses.length,
    clausesByType,
    summary,
  };
}

/**
 * Contract Clause Scan Tool
 * Scans contract text to identify and categorize key clauses
 */
export const contractClauseScanTool = tool({
  description:
    'Scans contract text to identify and categorize key clauses such as termination, liability, intellectual property, confidentiality, indemnification, payment terms, jurisdiction, dispute resolution, and more. Returns identified clauses with their locations in the document and confidence scores.',
  inputSchema: jsonSchema<ContractClauseScanInput>({
    type: 'object',
    properties: {
      contractText: {
        type: 'string',
        description: 'The full contract text to analyze for clause identification',
      },
    },
    required: ['contractText'],
    additionalProperties: false,
  }),
  execute: async ({ contractText }): Promise<ContractClauses> => {
    // Validate input
    if (typeof contractText !== 'string') {
      throw new Error('Contract text must be a string');
    }

    if (contractText.trim().length === 0) {
      throw new Error('Contract text cannot be empty');
    }

    try {
      return analyzeContract(contractText);
    } catch (error) {
      throw new Error(
        `Failed to scan contract clauses: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

export default contractClauseScanTool;
