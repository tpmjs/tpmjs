export const TOOL_SURFACE_IDS = ['cli', 'mcp', 'rest', 'sdk', 'skill'] as const;

export type ToolSurfaceId = (typeof TOOL_SURFACE_IDS)[number];

export interface ToolSurfaceSnippet {
  label: string;
  language: 'bash' | 'json' | 'typescript';
  code: string;
}

export interface ToolSurfaceDefinition {
  id: ToolSurfaceId;
  label: string;
  bestFor: string;
  description: string;
  snippets: ToolSurfaceSnippet[];
  note?: string;
}

export interface ToolSurfaceInput {
  packageName: string;
  toolName: string;
}

/**
 * Build the copy-paste contract for every supported TPMJS access surface.
 *
 * Keep this data-only: the same definitions can be tested without a browser and
 * rendered by any future tool-detail experience.
 */
export function buildToolSurfaces({
  packageName,
  toolName,
}: ToolSurfaceInput): ToolSurfaceDefinition[] {
  const toolId = `${packageName}::${toolName}`;

  return [
    {
      id: 'cli',
      label: 'CLI',
      bestFor: 'Terminal agents and local automation',
      description: 'Execute the canonical registry tool ID from any shell.',
      snippets: [
        {
          label: 'Install once',
          language: 'bash',
          code: 'npm install --global @tpmjs/cli',
        },
        {
          label: 'Execute',
          language: 'bash',
          code: `tpm tool execute '${toolId}' --input '{}'`,
        },
      ],
      note: 'Public tools can be executed without signing in, subject to the public rate limit.',
    },
    {
      id: 'mcp',
      label: 'MCP',
      bestFor: 'Long-lived agents and MCP clients',
      description: 'Connect once, then discover and execute registry tools through two meta-tools.',
      snippets: [
        {
          label: 'Connect with Claude Code',
          language: 'bash',
          code: `claude mcp add --transport http tpmjs-registry \\
  https://tpmjs.com/api/mcp/registry/http \\
  --header "Authorization: Bearer $TPMJS_API_KEY"`,
        },
        {
          label: 'execute_tool arguments',
          language: 'json',
          code: JSON.stringify(
            {
              packageName,
              toolName,
              arguments: {},
            },
            null,
            2
          ),
        },
      ],
      note: 'Execution requires a TPMJS API key with the mcp:execute scope; discovery remains public.',
    },
    {
      id: 'rest',
      label: 'REST',
      bestFor: 'Services in any language',
      description: 'Call the hosted executor over plain HTTP with no TPMJS SDK.',
      snippets: [
        {
          label: 'POST /api/registry/execute',
          language: 'bash',
          code: `curl --silent --show-error https://tpmjs.com/api/registry/execute \\
  --header 'content-type: application/json' \\
  --data '${JSON.stringify({ toolId, params: {} })}'`,
        },
      ],
      note: 'Authentication is optional for public tools and raises the execution rate limit.',
    },
    {
      id: 'sdk',
      label: 'SDK',
      bestFor: 'TypeScript agent applications',
      description: 'Resolve an AI SDK-compatible tool from the registry at runtime.',
      snippets: [
        {
          label: 'Install',
          language: 'bash',
          code: 'pnpm add @tpmjs/compose ai',
        },
        {
          label: 'Load from the registry',
          language: 'typescript',
          code: `import { fromRegistry } from '@tpmjs/compose/adapters/registry';

const tool = await fromRegistry('${toolId}');`,
        },
      ],
      note: "The adapter preserves the registry schema and executes in TPMJS's isolated executor.",
    },
    {
      id: 'skill',
      label: 'Skill',
      bestFor: 'Portable agent context',
      description: 'Add the tool to a collection, then give an agent its generated skill document.',
      snippets: [
        {
          label: 'Collection skill document',
          language: 'bash',
          code: 'https://tpmjs.com/@<user>/collections/<slug>/skills.md',
        },
      ],
      note: 'Skills are collection-level: they teach when and how tools work together, not only how to call one export.',
    },
  ];
}
