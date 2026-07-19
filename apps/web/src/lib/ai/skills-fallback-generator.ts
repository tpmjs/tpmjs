/**
 * Deterministic skills.md generation from TPMJS registry metadata.
 *
 * This is the availability path when enhanced model-backed source analysis is
 * unavailable. It deliberately avoids inferring behavior that is not present
 * in the registry's descriptions and JSON Schemas.
 */

export interface RegistryToolData {
  name: string;
  description: string;
  packageName: string;
  packageVersion?: string;
  inputSchema: unknown | null;
}

export interface RegistryCollectionData {
  name: string;
  description: string | null;
}

export interface RegistrySkillsSummary {
  intro: string;
  workflows: string;
  summary: string;
  generationMode: 'registry-fallback';
}

function renderInputSchema(inputSchema: unknown | null): string {
  if (inputSchema === null || inputSchema === undefined) {
    return '*No input schema was published for this tool.*';
  }

  return `\`\`\`json\n${JSON.stringify(inputSchema, null, 2)}\n\`\`\``;
}

export function generationErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return 'Unknown generation error';
}

/**
 * Render a truthful per-tool section without model or source-code inference.
 */
export function generateRegistryToolSkills(tool: RegistryToolData): string {
  const packageReference = tool.packageVersion
    ? `${tool.packageName}@${tool.packageVersion}`
    : tool.packageName;

  return `### Skill: ${tool.name}
**Package:** \`${packageReference}\`
**Description:** ${tool.description}

**Input Schema (JSON Schema):**
${renderInputSchema(tool.inputSchema)}

**Output Format:** The package does not publish an output contract in TPMJS registry metadata. Treat the result as tool-defined data and validate it at the call site.

**Invocation:** Pass a JSON object that conforms to the input schema above.

**Documentation Provenance:** Generated deterministically from TPMJS registry metadata. Enhanced source-code analysis was unavailable, so this section makes no inferred implementation claims.
`;
}

/**
 * Build non-speculative collection context for the final assembled document.
 */
export function generateRegistrySkillsSummary(
  collection: RegistryCollectionData,
  toolCount: number,
  packageNames: string[]
): RegistrySkillsSummary {
  const packageCount = new Set(packageNames).size;
  const description = collection.description || 'No collection description was published.';

  return {
    intro: `${description}\n\nThis availability document is derived directly from TPMJS registry metadata for ${toolCount} tools across ${packageCount} packages. Enhanced model-backed source analysis was unavailable, so capabilities are limited to the published descriptions and input schemas below.`,
    workflows: `### Discover, validate, and invoke

1. Call \`tools/list\` on the collection MCP endpoint.
2. Select tools using their published descriptions and input schemas.
3. Validate each argument object against the corresponding JSON Schema.
4. Call \`tools/call\` and inspect the tool-defined result before passing it to another tool.

No cross-tool workflow is asserted here because the registry metadata alone does not establish semantic compatibility between outputs and downstream inputs.`,
    summary: `**Known documentation limits:**
- Output schemas and implementation details are not declared by the registry metadata.
- Source-code-derived examples and inferred multi-tool workflows are omitted.
- Clients should validate inputs locally and handle tool-defined errors and result shapes.

**Authentication:**
- Public collection documentation can be read without authentication.
- Tool execution may require a TPMJS API key and package-specific environment variables.`,
    generationMode: 'registry-fallback',
  };
}
