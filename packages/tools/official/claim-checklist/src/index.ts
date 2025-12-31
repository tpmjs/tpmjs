import { jsonSchema, tool } from 'ai';

export interface ClaimChecklist {
  originalText: string;
  claims: Array<{
    claim: string;
    needsCitation: boolean;
    evidenceType: 'statistic' | 'fact' | 'quote' | 'opinion' | 'common-knowledge';
    suggestedEvidence: string;
    sentenceIndex: number;
  }>;
  summary: {
    totalClaims: number;
    needingCitation: number;
    verified: number;
  };
}

type ClaimChecklistInput = {
  text: string;
};

export const claimChecklistTool = tool({
  description:
    'Extract checkable factual claims from text, mark what needs citations, and suggest what evidence would support each claim',
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
    // TODO: Implement with:
    // 1. Split text into sentences with sbd
    // 2. Rule-based claim extraction (numbers, dates, proper nouns)
    // 3. Classify claim types
    // 4. Determine if citation needed based on type

    return {
      originalText: text,
      claims: [],
      summary: {
        totalClaims: 0,
        needingCitation: 0,
        verified: 0,
      },
    };
  },
});

export default claimChecklistTool;
