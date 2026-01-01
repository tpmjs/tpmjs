/**
 * Bank Transaction Reconciliation Tool for TPMJS
 * Matches bank transactions to ledger entries with confidence scoring
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 * Uses jsonSchema() to avoid Zod 4 JSON Schema conversion issues with OpenAI
 */

import { jsonSchema, tool } from 'ai';

export interface BankTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  amount: number;
  description: string;
}

export interface Match {
  bankTransaction: BankTransaction;
  ledgerEntry: LedgerEntry;
  confidence: number;
  matchReasons: string[];
}

export interface ReconciliationMatches {
  matches: Match[];
  unmatchedBankTransactions: BankTransaction[];
  unmatchedLedgerEntries: LedgerEntry[];
  summary: {
    totalBankTransactions: number;
    totalLedgerEntries: number;
    matchedCount: number;
    matchRate: number;
  };
}

/**
 * Input type for Reconciliation Match Tool
 */
type ReconciliationMatchInput = {
  bankTransactions: BankTransaction[];
  ledgerEntries: LedgerEntry[];
};

/**
 * Calculates string similarity using Levenshtein distance
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const matrix: number[][] = Array.from({ length: s2.length + 1 }, () =>
    Array(s1.length + 1).fill(0)
  );

  for (let i = 0; i <= s2.length; i++) {
    matrix[i]![0] = i;
  }

  for (let j = 0; j <= s1.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1,
          matrix[i]![j - 1]! + 1,
          matrix[i - 1]![j]! + 1
        );
      }
    }
  }

  const maxLength = Math.max(s1.length, s2.length);
  return 1 - matrix[s2.length]![s1.length]! / maxLength;
}

/**
 * Calculates date proximity score (1.0 = same day, decreases with distance)
 */
function dateProximityScore(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffDays = Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays === 0) return 1.0;
  if (diffDays <= 1) return 0.9;
  if (diffDays <= 2) return 0.7;
  if (diffDays <= 3) return 0.5;
  if (diffDays <= 7) return 0.3;
  return 0;
}

/**
 * Calculates match confidence score
 */
function calculateMatchScore(
  bankTx: BankTransaction,
  ledgerEntry: LedgerEntry
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Amount match (most important - 60% weight)
  if (Math.abs(bankTx.amount - ledgerEntry.amount) < 0.01) {
    score += 0.6;
    reasons.push('Exact amount match');
  } else {
    return { score: 0, reasons: ['Amount mismatch'] };
  }

  // Date proximity (25% weight)
  const dateScore = dateProximityScore(bankTx.date, ledgerEntry.date);
  score += dateScore * 0.25;
  if (dateScore >= 0.9) {
    reasons.push('Same or next day');
  } else if (dateScore >= 0.5) {
    reasons.push(`Within ${Math.round((1 - dateScore) / 0.1 + 1)} days`);
  }

  // Description similarity (15% weight)
  const descScore = stringSimilarity(bankTx.description, ledgerEntry.description);
  score += descScore * 0.15;
  if (descScore >= 0.8) {
    reasons.push('Very similar descriptions');
  } else if (descScore >= 0.5) {
    reasons.push('Moderately similar descriptions');
  }

  return { score, reasons };
}

/**
 * Reconciliation Match Tool
 * Matches bank transactions to ledger entries
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const reconciliationMatchTool = tool({
  description:
    'Matches bank transactions to ledger entries for reconciliation. Uses amount, date proximity, and description similarity to identify matches with confidence scoring.',
  inputSchema: jsonSchema<ReconciliationMatchInput>({
    type: 'object',
    properties: {
      bankTransactions: {
        type: 'array',
        description: 'Bank transactions with id, date, amount, and description',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Transaction ID' },
            date: { type: 'string', description: 'Transaction date (ISO format)' },
            amount: { type: 'number', description: 'Transaction amount' },
            description: { type: 'string', description: 'Transaction description' },
          },
          required: ['id', 'date', 'amount', 'description'],
        },
      },
      ledgerEntries: {
        type: 'array',
        description: 'Ledger entries to match against',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Entry ID' },
            date: { type: 'string', description: 'Entry date (ISO format)' },
            amount: { type: 'number', description: 'Entry amount' },
            description: { type: 'string', description: 'Entry description' },
          },
          required: ['id', 'date', 'amount', 'description'],
        },
      },
    },
    required: ['bankTransactions', 'ledgerEntries'],
    additionalProperties: false,
  }),
  async execute({ bankTransactions, ledgerEntries }) {
    // Validate inputs
    if (!Array.isArray(bankTransactions) || bankTransactions.length === 0) {
      throw new Error('bankTransactions must be a non-empty array');
    }

    if (!Array.isArray(ledgerEntries) || ledgerEntries.length === 0) {
      throw new Error('ledgerEntries must be a non-empty array');
    }

    // Track matched items
    const matches: Match[] = [];
    const matchedBankIds = new Set<string>();
    const matchedLedgerIds = new Set<string>();

    // Find best matches
    for (const bankTx of bankTransactions) {
      let bestMatch: { entry: LedgerEntry; score: number; reasons: string[] } | null = null;

      for (const ledgerEntry of ledgerEntries) {
        if (matchedLedgerIds.has(ledgerEntry.id)) continue;

        const { score, reasons } = calculateMatchScore(bankTx, ledgerEntry);

        if (score >= 0.7 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { entry: ledgerEntry, score, reasons };
        }
      }

      if (bestMatch) {
        matches.push({
          bankTransaction: bankTx,
          ledgerEntry: bestMatch.entry,
          confidence: bestMatch.score,
          matchReasons: bestMatch.reasons,
        });
        matchedBankIds.add(bankTx.id);
        matchedLedgerIds.add(bestMatch.entry.id);
      }
    }

    // Identify unmatched items
    const unmatchedBankTransactions = bankTransactions.filter((tx) => !matchedBankIds.has(tx.id));
    const unmatchedLedgerEntries = ledgerEntries.filter((entry) => !matchedLedgerIds.has(entry.id));

    // Calculate summary
    const matchRate = bankTransactions.length > 0 ? matches.length / bankTransactions.length : 0;

    return {
      matches,
      unmatchedBankTransactions,
      unmatchedLedgerEntries,
      summary: {
        totalBankTransactions: bankTransactions.length,
        totalLedgerEntries: ledgerEntries.length,
        matchedCount: matches.length,
        matchRate: Math.round(matchRate * 100) / 100,
      },
    };
  },
});

/**
 * Export default for convenience
 */
export default reconciliationMatchTool;
