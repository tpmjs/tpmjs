import { beforeEach, describe, expect, it, vi } from 'vitest';

const aiMocks = vi.hoisted(() => ({
  generateText: vi.fn(),
}));

vi.mock('ai', () => ({
  generateText: aiMocks.generateText,
  tool: vi.fn((definition) => definition),
}));

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => ({ provider: 'test' })),
}));

import { generateSkillsSummary } from './skills-summary-generator';
import { generateToolSkillsBatch } from './tool-skills-generator';

beforeEach(() => {
  aiMocks.generateText.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('skills generators', () => {
  it('returns useful registry documentation when per-tool AI generation fails', async () => {
    aiMocks.generateText.mockRejectedValue(new Error('quota exceeded'));

    const result = await generateToolSkillsBatch(
      [
        {
          id: 'tool-1',
          name: 'parseDocument',
          description: 'Parses a document.',
          packageName: '@example/doc-tools',
          packageVersion: '1.4.0',
          inputSchema: { type: 'object', properties: { text: { type: 'string' } } },
        },
      ],
      new Map()
    );

    expect(result.get('tool-1')).toMatchObject({ generationMode: 'registry-fallback' });
    expect(result.get('tool-1')?.markdown).toContain('`@example/doc-tools@1.4.0`');
    expect(result.get('tool-1')?.markdown).toContain('"text"');
    expect(result.get('tool-1')?.markdown).not.toContain('Please retry');
  });

  it('returns a registry summary when enhanced summary generation fails', async () => {
    aiMocks.generateText.mockRejectedValue(new Error('quota exceeded'));

    const summary = await generateSkillsSummary(
      {
        id: 'collection-1',
        name: 'Documents',
        slug: 'documents',
        description: 'Document tools.',
        username: 'alice',
      },
      ['### Skill: parseDocument'],
      {
        http: 'https://tpmjs.com/api/mcp/alice/documents/http',
        sse: 'https://tpmjs.com/api/mcp/alice/documents/sse',
      },
      ['@example/doc-tools']
    );

    expect(summary.generationMode).toBe('registry-fallback');
    expect(summary.intro).toContain('derived directly from TPMJS registry metadata');
  });

  it('accepts only the Zod-validated summary tool call on the enhanced path', async () => {
    aiMocks.generateText.mockResolvedValue({
      toolCalls: [
        {
          toolName: 'submitSummary',
          input: {
            intro: 'Verified introduction.',
            workflows: 'Verified workflows.',
            summary: 'Verified limitations.',
          },
        },
      ],
    });

    const summary = await generateSkillsSummary(
      {
        id: 'collection-1',
        name: 'Documents',
        slug: 'documents',
        description: null,
        username: 'alice',
      },
      ['### Skill: parseDocument'],
      {
        http: 'https://tpmjs.com/api/mcp/alice/documents/http',
        sse: 'https://tpmjs.com/api/mcp/alice/documents/sse',
      },
      ['@example/doc-tools']
    );

    expect(summary).toEqual({
      intro: 'Verified introduction.',
      workflows: 'Verified workflows.',
      summary: 'Verified limitations.',
      generationMode: 'ai',
    });
    expect(aiMocks.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        toolChoice: 'required',
        tools: expect.objectContaining({ submitSummary: expect.anything() }),
      })
    );
  });

  it('falls back when a provider returns a malformed summary tool call', async () => {
    aiMocks.generateText.mockResolvedValue({
      toolCalls: [
        {
          toolName: 'submitSummary',
          input: { intro: 'Missing required fields.' },
        },
      ],
    });

    const summary = await generateSkillsSummary(
      {
        id: 'collection-1',
        name: 'Documents',
        slug: 'documents',
        description: 'Document tools.',
        username: 'alice',
      },
      ['### Skill: parseDocument'],
      {
        http: 'https://tpmjs.com/api/mcp/alice/documents/http',
        sse: 'https://tpmjs.com/api/mcp/alice/documents/sse',
      },
      ['@example/doc-tools']
    );

    expect(summary.generationMode).toBe('registry-fallback');
  });
});
