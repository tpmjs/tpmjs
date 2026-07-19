/**
 * Per-tool skills documentation generator
 * Generates markdown section for a single tool, designed for batched processing
 */

import { generateText } from 'ai';
import type { PackageSource } from './package-source-fetcher';
import { textModel } from './provider';
import { generateRegistryToolSkills, generationErrorMessage } from './skills-fallback-generator';

export interface ToolData {
  id: string;
  name: string;
  description: string;
  packageName: string;
  packageVersion: string;
  inputSchema: unknown | null;
}

export interface ToolSkillsGenerationResult {
  markdown: string;
  generationMode: 'ai' | 'registry-fallback';
}

const TOOL_SKILLS_SYSTEM_PROMPT = `You are an expert technical writer generating skills documentation for a single tool.

Your task is to analyze the source code and generate a comprehensive skills section for this tool that can be used by AI agents.

Guidelines:
1. **Accuracy First**: Only document capabilities you can verify from the source code
2. **Real Examples**: Generate code examples based on actual function signatures
3. **Input/Output Schemas**: Extract exact TypeScript types when available
4. **Source Analysis**: Provide insights about implementation details
5. **Concise**: Focus on what's useful for tool invocation

Output clean, well-organized Markdown.`;

function buildToolPrompt(tool: ToolData, packageSource: PackageSource | null): string {
  const sourceContext = packageSource
    ? packageSource.files
        .map((f) => `### ${f.path}\n\`\`\`typescript\n${f.content.slice(0, 4000)}\n\`\`\``)
        .join('\n\n')
    : 'Source code not available';

  return `Generate a skills section for this tool.

## Tool Info
- **Name:** ${tool.name}
- **Package:** ${tool.packageName}@${tool.packageVersion}
- **Description:** ${tool.description}

## Input Schema
${tool.inputSchema ? JSON.stringify(tool.inputSchema, null, 2) : 'Not available'}

## Package Source Code
${sourceContext}

---

Generate a markdown section following this structure:

### Skill: ${tool.name}
**Package:** \`${tool.packageName}\`
**Description:** ${tool.description}

**Input Schema:**
\`\`\`typescript
[Extract from source code or input schema]
\`\`\`

**Output Format:** [Analyze from source]

**Source Analysis:**
[AI-generated insights from reading actual code - what does this tool actually do internally?]

**Example Usage:**
\`\`\`typescript
[Real example based on source code patterns]
\`\`\`

**Constraints:**
- [What this tool can and cannot do]
`;
}

/**
 * Generate skills markdown section for a single tool
 */
export async function generateToolSkills(
  tool: ToolData,
  packageSource: PackageSource | null
): Promise<string> {
  const prompt = buildToolPrompt(tool, packageSource);

  const { text } = await generateText({
    model: textModel(),
    system: TOOL_SKILLS_SYSTEM_PROMPT,
    prompt,
    temperature: 0.3,
  });

  return text;
}

/**
 * Generate skills markdown for a batch of tools in parallel
 * Returns a map of toolId -> markdown
 */
export async function generateToolSkillsBatch(
  tools: ToolData[],
  packageSources: Map<string, PackageSource>
): Promise<Map<string, ToolSkillsGenerationResult>> {
  const results = new Map<string, ToolSkillsGenerationResult>();

  // Process tools in parallel (10 at a time is reasonable for API limits)
  const promises = tools.map(async (tool) => {
    try {
      const packageSource = packageSources.get(tool.packageName) || null;
      const markdown = await generateToolSkills(tool, packageSource);
      return { toolId: tool.id, markdown, generationMode: 'ai' as const };
    } catch (error) {
      console.warn(
        `[ToolSkillsGenerator] Enhanced generation unavailable for ${tool.name}; using registry metadata: ${generationErrorMessage(error)}`
      );
      return {
        toolId: tool.id,
        markdown: generateRegistryToolSkills(tool),
        generationMode: 'registry-fallback' as const,
      };
    }
  });

  const settledResults = await Promise.allSettled(promises);

  for (const result of settledResults) {
    if (result.status === 'fulfilled') {
      results.set(result.value.toolId, {
        markdown: result.value.markdown,
        generationMode: result.value.generationMode,
      });
    }
  }

  return results;
}
