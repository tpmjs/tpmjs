import { describe, expect, it } from 'vitest';
import { buildToolSurfaces, TOOL_SURFACE_IDS } from './tool-surfaces';

const packageName = '@example/agent-tools';
const toolName = 'search-web';
const surfaces = buildToolSurfaces({ packageName, toolName });

function surface(id: (typeof TOOL_SURFACE_IDS)[number]) {
  const match = surfaces.find((candidate) => candidate.id === id);
  if (!match) throw new Error(`Missing ${id} surface`);
  return match;
}

describe('buildToolSurfaces', () => {
  it('returns each product surface exactly once in activation order', () => {
    expect(surfaces.map(({ id }) => id)).toEqual(TOOL_SURFACE_IDS);
    expect(new Set(surfaces.map(({ id }) => id)).size).toBe(5);
  });

  it('uses the canonical tool ID for CLI and REST execution', () => {
    expect(surface('cli').snippets[1]?.code).toContain(
      "tpm tool execute '@example/agent-tools::search-web'"
    );
    expect(surface('rest').snippets[0]?.code).toContain(
      `'${JSON.stringify({ toolId: '@example/agent-tools::search-web', params: {} })}'`
    );
  });

  it('renders the actual MCP execute_tool argument schema and authenticated setup', () => {
    expect(surface('mcp').snippets[0]?.code).toContain('claude mcp add --transport http');
    expect(surface('mcp').snippets[0]?.code).toContain('Authorization: Bearer $TPMJS_API_KEY');
    expect(JSON.parse(surface('mcp').snippets[1]?.code ?? '{}')).toEqual({
      packageName,
      toolName,
      arguments: {},
    });
  });

  it('loads arbitrary export names safely through the registry SDK adapter', () => {
    const sdkCode = surface('sdk').snippets[1]?.code;
    expect(sdkCode).toContain("fromRegistry('@example/agent-tools::search-web')");
    expect(sdkCode).not.toContain('import { search-web }');
  });

  it('points portable skills at the markdown artifact, not the conversational endpoint', () => {
    expect(surface('skill').snippets[0]?.code).toBe(
      'https://tpmjs.com/@<user>/collections/<slug>/skills.md'
    );
  });
});
