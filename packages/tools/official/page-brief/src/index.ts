import { jsonSchema, tool } from 'ai';

export interface PageBrief {
  url: string;
  title: string;
  summary: string;
  keyPoints: string[];
  claimsNeedingCitation: Array<{
    claim: string;
    suggestedEvidence: string;
  }>;
}

type PageBriefInput = {
  url: string;
};

export const pageBriefTool = tool({
  description:
    'Fetch a URL, extract main content using readability, and return a brief with summary, key points, and claims that need citations',
  inputSchema: jsonSchema<PageBriefInput>({
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch and analyze',
      },
    },
    required: ['url'],
    additionalProperties: false,
  }),
  async execute({ url }): Promise<PageBrief> {
    // TODO: Implement with fetch + @mozilla/readability + jsdom + sbd
    // 1. Fetch the URL
    // 2. Parse HTML with jsdom
    // 3. Extract main content with Readability
    // 4. Split into sentences with sbd
    // 5. Identify claims that need citations

    return {
      url,
      title: 'Not implemented',
      summary: 'This is a stub implementation. Real implementation will use @mozilla/readability.',
      keyPoints: [],
      claimsNeedingCitation: [],
    };
  },
});

export default pageBriefTool;
