/**
 * AI-powered skills documentation generator for tool collections
 * Uses AI SDK to analyze package source code and generate comprehensive skills.md
 *
 * This module provides the original monolithic generation function for backward compatibility.
 * For chunked generation of large collections, use the new modules:
 * - tool-skills-generator.ts: Per-tool skills generation
 * - skills-summary-generator.ts: Summary/intro generation
 */

import { generateText } from 'ai';
import type { PackageSource } from './package-source-fetcher';
import { textModel } from './provider';

export interface CollectionData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  username: string;
}

export interface ToolData {
  id: string;
  name: string;
  description: string;
  packageName: string;
  inputSchema: unknown | null;
}

export interface McpUrls {
  http: string;
  sse: string;
}

const SKILLS_SYSTEM_PROMPT = `You are an expert technical writer generating machine-consumable skills documentation for AI agents.

Your task is to analyze actual source code from npm packages and generate a comprehensive skills.md document that serves as a capability contract for AI agents like Claude Code, MCP clients, and tool routers.

Guidelines:
1. **Accuracy First**: Only document capabilities you can verify from the source code
2. **Real Examples**: Generate code examples based on actual function signatures and patterns in the source
3. **Input/Output Schemas**: Extract exact TypeScript types when available
4. **Source Analysis**: Provide insights about implementation details that help agents use tools correctly
5. **Integration Focus**: Show multiple ways to integrate (ESM, NPM, CLI, REST API, MCP)
6. **Constraints**: Document what tools can and cannot do based on code analysis

Format the output as clean, well-organized Markdown with proper code blocks and syntax highlighting.`;

function buildSkillsPrompt(
  collection: CollectionData,
  tools: ToolData[],
  packageSources: PackageSource[],
  mcpUrls: McpUrls
): string {
  const baseUrl = mcpUrls.http.replace(/\/api\/mcp\/.*$/, '');
  const collectionUrl = `${baseUrl}/${collection.username}/collections/${collection.slug}`;

  // Build package source context
  const sourceContext = packageSources
    .map((pkg) => {
      const filesContent = pkg.files
        .map((f) => `### ${f.path}\n\`\`\`typescript\n${f.content.slice(0, 5000)}\n\`\`\``)
        .join('\n\n');

      return `## Package: ${pkg.packageName}@${pkg.version}

**package.json exports:**
\`\`\`json
${JSON.stringify(
  {
    main: pkg.packageJson.main,
    module: pkg.packageJson.module,
    exports: pkg.packageJson.exports,
    types: pkg.packageJson.types,
  },
  null,
  2
)}
\`\`\`

**Source Files:**
${filesContent}`;
    })
    .join('\n\n---\n\n');

  // Build tools context
  const toolsContext = tools
    .map(
      (t) => `- **${t.name}** (${t.packageName})
  Description: ${t.description}
  Input Schema: ${t.inputSchema ? JSON.stringify(t.inputSchema, null, 2) : 'Not available'}`
    )
    .join('\n\n');

  return `Generate a skills.md document for this collection.

## Collection Info
- **Name:** ${collection.name}
- **Owner:** @${collection.username}
- **Slug:** ${collection.slug}
- **Description:** ${collection.description || 'No description'}
- **Collection URL:** ${collectionUrl}

## MCP Endpoints
- **HTTP:** ${mcpUrls.http}
- **SSE:** ${mcpUrls.sse}

## Tools in Collection (${tools.length} total)
${toolsContext}

## Package Source Code
Analyze the following source code to understand tool implementations:

${sourceContext}

---

Generate the skills.md document following this EXACT structure:

# Agent Skills Declaration: ${collection.name}

> Machine-consumable capability contract for AI agents (Claude Code, MCP clients, tool routers)

## 1. Agent Identity

**Collection:** ${collection.name}
**Owner:** @${collection.username}
**Primary Role:** [Derive from tools and description]
**Tool Count:** ${tools.length} tools from ${new Set(tools.map((t) => t.packageName)).size} packages

---

## 2. Core Skills

[For each tool, include:]
### Skill: [tool.name]
**Package:** \`[package.npmPackageName]\`
**Description:** [tool.description]

**Input Schema:**
\`\`\`typescript
[Extract from source code]
\`\`\`

**Output Format:** [Analyze from source]

**Source Analysis:**
[AI-generated insights from reading actual code - what does this tool actually do internally?]

**Example Usage:**
\`\`\`typescript
[Real example based on source code patterns]
\`\`\`

---

## 3. Direct Usage (Without MCP/CLI/REST)

### ESM Import (Browser/Deno)
\`\`\`typescript
[Generate real ESM import examples using esm.sh]
\`\`\`

### NPM Import (Node.js)
\`\`\`typescript
[Generate real NPM import examples]
\`\`\`

### Multi-Tool Workflow
\`\`\`typescript
[Generate a workflow example combining multiple tools]
\`\`\`

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

With environment variables:
\`\`\`bash
SOME_API_KEY=xxx tpm run --collection ${collection.username}/${collection.slug} --tool [tool-name]
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
      "name": "[mcp-tool-name]",
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

**This collection does NOT:**
[Generate based on tool analysis - what are the limitations?]

**Rate Limits:**
- Free tier: 100 requests/hour
- Authenticated: 1000 requests/hour

**Authentication:**
- Public collections: No auth required for read
- Tool execution: API key required

---

## 6. Versioning

**Skills Version:** 1.0.0
**Generated:** [Current timestamp]
**Collection Updated:** [Will be filled in]

---

## 7. Canonical References

- TPMJS: https://tpmjs.com
- MCP Protocol: https://modelcontextprotocol.io
- Collection Page: ${collectionUrl}`;
}

/**
 * Generate skills.md markdown for a collection
 */
export async function generateSkillsMarkdown(
  collection: CollectionData,
  tools: ToolData[],
  packageSources: PackageSource[],
  mcpUrls: McpUrls
): Promise<string> {
  if (tools.length === 0) {
    throw new Error('Collection must have at least one tool to generate skills documentation');
  }

  const prompt = buildSkillsPrompt(collection, tools, packageSources, mcpUrls);

  const { text } = await generateText({
    model: textModel(),
    system: SKILLS_SYSTEM_PROMPT,
    prompt,
    temperature: 0.3, // Lower temperature for more factual output
  });

  return text;
}
