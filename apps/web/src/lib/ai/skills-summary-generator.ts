/**
 * Skills Summary Generator (Second Pass)
 * Analyzes all tool sections and generates cohesive intro, workflows, and summary
 */

import { generateText, tool } from 'ai';
import { z } from 'zod';
import { textModel } from './provider';

import { generateRegistrySkillsSummary, generationErrorMessage } from './skills-fallback-generator';

export interface CollectionData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  username: string;
}

export interface McpUrls {
  http: string;
  sse: string;
}

export interface SkillsSummary {
  intro: string;
  workflows: string;
  summary: string;
  generationMode: 'ai' | 'registry-fallback';
}

const SkillsSummarySchema = z.object({
  intro: z.string().describe('Two or three concise paragraphs describing the collection.'),
  workflows: z.string().describe('Markdown for two or three realistic multi-tool workflows.'),
  summary: z
    .string()
    .describe('Markdown covering limitations, authentication, rate limits, and versioning.'),
});

const SUMMARY_SYSTEM_PROMPT = `You are an expert technical writer creating cohesive documentation from individual tool sections.

Your task is to analyze all tool documentation sections and generate:
1. An introduction that describes the collection's overall capabilities
2. Multi-tool workflow examples showing how tools work together
3. A summary with constraints and safety considerations

Guidelines:
- Be concise and focused on practical usage
- Identify synergies between tools
- Generate realistic workflow examples
- Document limitations based on tool analysis

Output clean, well-organized Markdown sections.`;

function buildSummaryPrompt(
  collection: CollectionData,
  toolSections: string[],
  mcpUrls: McpUrls,
  packageNames: string[]
): string {
  const baseUrl = mcpUrls.http.replace(/\/api\/mcp\/.*$/, '');
  const collectionUrl = `${baseUrl}/${collection.username}/collections/${collection.slug}`;

  return `Analyze these tool documentation sections and submit structured summary content for the skills.md document.

## Collection Info
- **Name:** ${collection.name}
- **Owner:** @${collection.username}
- **Slug:** ${collection.slug}
- **Description:** ${collection.description || 'No description'}
- **Collection URL:** ${collectionUrl}
- **Tool Count:** ${toolSections.length} tools from ${new Set(packageNames).size} packages

## MCP Endpoints
- **HTTP:** ${mcpUrls.http}
- **SSE:** ${mcpUrls.sse}

## Individual Tool Sections
${toolSections.join('\n\n---\n\n')}

---

Use the submitSummary tool. Keep the introduction to two or three paragraphs. Include two or three realistic workflow examples in Markdown. The summary must distinguish verified limitations from assumptions.`;
}

/**
 * Generate skills summary by analyzing all tool sections
 */
export async function generateSkillsSummary(
  collection: CollectionData,
  toolSections: string[],
  mcpUrls: McpUrls,
  packageNames: string[]
): Promise<SkillsSummary> {
  if (toolSections.length === 0) {
    return {
      intro: 'This collection has no tools.',
      workflows: '',
      summary: '',
      generationMode: 'registry-fallback',
    };
  }

  const prompt = buildSummaryPrompt(collection, toolSections, mcpUrls, packageNames);

  try {
    const result = await generateText({
      model: textModel(),
      system: SUMMARY_SYSTEM_PROMPT,
      prompt,
      temperature: 0.3,
      toolChoice: 'required',
      tools: {
        submitSummary: tool({
          description: 'Submit the validated collection skills summary.',
          inputSchema: SkillsSummarySchema,
        }),
      },
    });

    const submitted = result.toolCalls.find((call) => call.toolName === 'submitSummary');
    if (!submitted) {
      throw new Error('The model did not submit a skills summary');
    }

    const parsedSummary = SkillsSummarySchema.safeParse(submitted.input);
    if (!parsedSummary.success) {
      throw new Error('The model submitted an invalid skills summary');
    }

    return {
      ...parsedSummary.data,
      generationMode: 'ai',
    };
  } catch (error) {
    console.warn(
      `[SkillsSummaryGenerator] Enhanced generation unavailable; using registry metadata: ${generationErrorMessage(error)}`
    );
    return generateRegistrySkillsSummary(collection, toolSections.length, packageNames);
  }
}

/**
 * Assemble the final skills.md document from individual sections
 */
export function assembleSkillsDocument(
  collection: CollectionData,
  toolSections: string[],
  summary: SkillsSummary,
  mcpUrls: McpUrls,
  packageNames: string[]
): string {
  const baseUrl = mcpUrls.http.replace(/\/api\/mcp\/.*$/, '');
  const collectionUrl = `${baseUrl}/${collection.username}/collections/${collection.slug}`;
  const uniquePackages = new Set(packageNames).size;
  const timestamp = new Date().toISOString();

  return `# Agent Skills Declaration: ${collection.name}

> Machine-consumable capability contract for AI agents (Claude Code, MCP clients, tool routers)

## 1. Agent Identity

**Collection:** ${collection.name}
**Owner:** @${collection.username}
**Description:** ${collection.description || 'No description'}
**Tool Count:** ${toolSections.length} tools from ${uniquePackages} packages

${summary.intro}

---

## 2. Core Skills

${toolSections.join('\n\n---\n\n')}

---

## 3. Multi-Tool Workflows

${summary.workflows || '*No workflow examples generated.*'}

---

## 4. Agent Integration Methods

### 4.1 CLI (\`tpm run\`)

Install CLI:
\`\`\`bash
npm install -g @tpmjs/cli
\`\`\`

Run a tool:
\`\`\`bash
tpm run --collection ${collection.username}/${collection.slug} --tool [tool-name] --args '{"key": "value"}'
\`\`\`

### 4.2 REST API (JSON-RPC 2.0)

**Endpoint:** \`POST ${mcpUrls.http}\`

\`\`\`bash
curl -X POST ${mcpUrls.http} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "[tool-name]",
      "arguments": { ... }
    }
  }'
\`\`\`

**List available tools:**
\`\`\`bash
curl -X POST ${mcpUrls.http} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
\`\`\`

### 4.3 MCP Server

**URLs:**
- HTTP: \`${mcpUrls.http}\`
- SSE: \`${mcpUrls.sse}\`

**Claude Desktop Config (\`claude_desktop_config.json\`):**
\`\`\`json
{
  "mcpServers": {
    "${collection.slug}": {
      "url": "${mcpUrls.sse}",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
\`\`\`

**Local MCP Server (via CLI):**
\`\`\`bash
tpm mcp serve ${collection.username}/${collection.slug}
\`\`\`

---

## 5. Constraints & Safety

${
  summary.summary ||
  `**Rate Limits:**
- Free tier: 100 requests/hour
- Authenticated: 1000 requests/hour

**Authentication:**
- Public collections: No auth required for read
- Tool execution: API key required`
}

---

## 6. Versioning

**Skills Version:** 1.0.0
**Generated:** ${timestamp}
**Collection Page:** ${collectionUrl}

---

## 7. Usage Examples

For real-world usage patterns and tested scenarios, see the usage documentation:

**Usage Guide:** ${baseUrl}/${collection.username}/collections/${collection.slug}/usage.md

This document contains ${toolSections.length > 0 ? 'tested scenarios demonstrating common usage patterns' : 'usage examples once scenarios are created'}.

---

## 8. Canonical References

- TPMJS: https://tpmjs.com
- MCP Protocol: https://modelcontextprotocol.io
- Collection Page: ${collectionUrl}
- Usage Examples: ${baseUrl}/${collection.username}/collections/${collection.slug}/usage.md
`;
}
