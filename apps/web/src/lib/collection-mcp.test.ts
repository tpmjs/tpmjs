import { describe, expect, it } from 'vitest';
import {
  buildClaudeCodeCollectionCommand,
  buildClaudeDesktopCollectionConfig,
  buildCollectionMcpServerName,
  buildCollectionMcpUrl,
} from './collection-mcp';

const target = { username: '@Ajax', slug: 'Research Tools' };

describe('collection MCP activation contract', () => {
  it('builds the canonical pretty HTTP endpoint and safely encodes dynamic segments', () => {
    expect(buildCollectionMcpUrl(target)).toBe(
      'https://tpmjs.com/@Ajax/collections/Research%20Tools/mcp'
    );
    expect(buildCollectionMcpUrl(target, 'http://localhost:3000/ignored')).toBe(
      'http://localhost:3000/@Ajax/collections/Research%20Tools/mcp'
    );
  });

  it('derives a bounded Claude-compatible server name without semantic mappings', () => {
    expect(buildCollectionMcpServerName('  Crème & Research / Tools  ')).toBe(
      'tpmjs-creme-research-tools'
    );
  });

  it('puts the HTTP transport before positional arguments and keeps public setup token-free', () => {
    const command = buildClaudeCodeCollectionCommand(target);

    expect(command).toBe(
      'claude mcp add --transport http tpmjs-research-tools https://tpmjs.com/@Ajax/collections/Research%20Tools/mcp'
    );
    expect(command).not.toContain('Authorization');
    expect(command).not.toContain('/sse');
  });

  it('adds owner authentication only when explicitly requested', () => {
    expect(buildClaudeCodeCollectionCommand(target, { bearerToken: '$TPMJS_API_KEY' })).toContain(
      '--header "Authorization: Bearer $TPMJS_API_KEY"'
    );

    expect(JSON.parse(buildClaudeDesktopCollectionConfig(target))).toEqual({
      mcpServers: {
        'tpmjs-research-tools': {
          type: 'http',
          url: 'https://tpmjs.com/@Ajax/collections/Research%20Tools/mcp',
        },
      },
    });
    expect(
      JSON.parse(buildClaudeDesktopCollectionConfig(target, { bearerToken: 'YOUR_TPMJS_API_KEY' }))
        .mcpServers['tpmjs-research-tools'].headers
    ).toEqual({ Authorization: 'Bearer YOUR_TPMJS_API_KEY' });
  });

  it('rejects missing collection identity instead of generating a broken command', () => {
    expect(() => buildCollectionMcpUrl({ username: '@', slug: 'tools' })).toThrow(
      'Collection username is required'
    );
    expect(() => buildCollectionMcpServerName('   ')).toThrow('Collection slug is required');
  });
});
