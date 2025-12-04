/**
 * Sync Vercel AI Registry Tools
 *
 * Fetches tools from Vercel's AI SDK registry and adds new ones to manual-tools.ts
 * Uses OpenAI to intelligently convert Vercel's format to our ManualTool format.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import OpenAI from 'openai';
import { manualTools } from './manual-tools.js';
import type { ManualTool } from './manual-tools.js';

// Vercel registry structure (based on their TypeScript interface)
interface VercelTool {
  slug: string;
  name: string;
  description: string;
  packageName: string;
  tags?: string[];
  apiKeyEnvName?: string;
  installCommand?: {
    pnpm?: string;
    npm?: string;
    yarn?: string;
    bun?: string;
  };
  codeExample?: string;
  docsUrl?: string;
  apiKeyUrl?: string;
  websiteUrl?: string;
  npmUrl?: string;
}

const VERCEL_REGISTRY_URL =
  'https://raw.githubusercontent.com/vercel/ai/refs/heads/main/content/tools-registry/registry.ts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function fetchVercelRegistry(): Promise<VercelTool[]> {
  console.log('📥 Fetching Vercel AI registry...');
  console.log(`   URL: ${VERCEL_REGISTRY_URL}\n`);

  const response = await fetch(VERCEL_REGISTRY_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch registry: ${response.status} ${response.statusText}`);
  }

  const content = await response.text();
  console.log(`✅ Fetched registry (${content.length} bytes)\n`);

  // Parse TypeScript content to extract tools array
  // The registry.ts file exports: export const tools: Tool[] = [...]
  console.log('🔍 Parsing TypeScript registry...');

  // Extract the tools array using regex
  const toolsMatch = content.match(/export const tools[^=]*=\s*(\[[\s\S]*?\n\]);/);

  if (!toolsMatch) {
    throw new Error('Could not find tools array in registry');
  }

  const toolsArrayString = toolsMatch[1];
  console.log(`   Found tools array (${toolsArrayString.length} chars)\n`);

  // Convert TypeScript to JSON by:
  // 1. Remove trailing commas
  // 2. Quote unquoted keys
  // 3. Remove template literals
  const jsonString = toolsArrayString
    // Remove single-line comments
    .replace(/\/\/.*$/gm, '')
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Handle template literals (convert to strings)
    .replace(/`([^`]*)`/g, '"$1"')
    // Quote unquoted object keys
    .replace(/(\w+):/g, '"$1":')
    // Remove trailing commas before closing braces/brackets
    .replace(/,(\s*[}\]])/g, '$1');

  console.log('🔧 Converting to JSON...');

  try {
    const tools = JSON.parse(jsonString) as VercelTool[];
    console.log(`✅ Parsed ${tools.length} tools from registry\n`);
    return tools;
  } catch (error) {
    console.error('❌ Failed to parse JSON. Error:', error);
    console.error('Problematic JSON string preview:');
    console.error(jsonString.substring(0, 500));
    throw error;
  }
}

function findNewTools(vercelTools: VercelTool[]): VercelTool[] {
  console.log('🔍 Checking for new tools...');
  console.log(`   Existing manual tools: ${manualTools.length}`);
  console.log(`   Vercel registry tools: ${vercelTools.length}\n`);

  const existingPackages = new Set(manualTools.map((t) => t.npmPackageName));

  const newTools = vercelTools.filter((tool) => !existingPackages.has(tool.packageName));

  console.log(`✨ Found ${newTools.length} new tools:\n`);
  newTools.forEach((tool, idx) => {
    console.log(`   ${idx + 1}. ${tool.name} (${tool.packageName})`);
  });
  console.log();

  return newTools;
}

async function convertToolWithAI(vercelTool: VercelTool): Promise<ManualTool[]> {
  console.log(`🤖 Using OpenAI to convert: ${vercelTool.name}`);
  console.log(`   Package: ${vercelTool.packageName}`);

  const prompt = `You are converting a tool from Vercel's AI registry to TPMJS manual-tools format.

VERCEL TOOL DATA:
${JSON.stringify(vercelTool, null, 2)}

YOUR TASK:
Convert this Vercel tool to TPMJS ManualTool format(s). Important:

1. A single npm package can have MULTIPLE exports (tools). Each export needs its own ManualTool entry.
2. Analyze the codeExample to identify ALL exported tools/functions.
3. For EACH tool/function, create a separate ManualTool object.

MANUALTOOLS INTERFACE:
{
  npmPackageName: string;           // Use vercelTool.packageName
  npmVersion?: string;               // Omit - will fetch latest
  category: string;                  // Choose from: 'text-analysis', 'code-generation', 'data-processing', 'image-generation', 'audio-processing', 'search', 'integration', 'other'
  frameworks: Array<'vercel-ai' | 'langchain' | 'llamaindex' | 'other'>;
  exportName: string;                // The actual export name (e.g., 'webSearch', 'executeCode')
  description: string;               // Tool-specific description
  parameters?: Array<{               // Extract from codeExample if possible
    name: string;
    type: string;
    description: string;
    required: boolean;
    default?: string;
  }>;
  returns?: {
    type: string;
    description: string;
  };
  aiAgent?: {
    useCase: string;                 // When should AI agents use this?
    limitations?: string;
    examples?: string[];
  };
  env?: Array<{                      // Convert apiKeyEnvName to this format
    name: string;
    description: string;
    required: boolean;
  }>;
  tags?: string[];                   // Use vercelTool.tags
  docsUrl?: string;
  apiKeyUrl?: string;
  websiteUrl?: string;
}

EXAMPLES:

If codeExample shows:
\`\`\`ts
import { webSearch, financeSearch } from '@valyu/ai-sdk';
\`\`\`

Create TWO ManualTool entries:
1. { exportName: 'webSearch', ... }
2. { exportName: 'financeSearch', ... }

RESPONSE FORMAT:
Return ONLY a valid JSON array of ManualTool objects. No markdown, no explanation, just the JSON array.

Example response:
[
  {
    "npmPackageName": "@example/sdk",
    "category": "search",
    "frameworks": ["vercel-ai"],
    "exportName": "webSearch",
    "description": "...",
    "env": [{"name": "EXAMPLE_API_KEY", "description": "...", "required": true}],
    "tags": ["search"],
    "docsUrl": "...",
    "apiKeyUrl": "...",
    "websiteUrl": "..."
  }
]`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a tool metadata converter. You convert tool definitions from one format to another. Always return valid JSON arrays.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }

    console.log(`   ✅ Received OpenAI response (${responseText.length} chars)`);

    // Parse the response
    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch (error) {
      console.error('   ❌ Failed to parse OpenAI response as JSON');
      console.error('   Response:', responseText);
      throw error;
    }

    // Handle both array and object with array property
    let tools: ManualTool[];
    if (Array.isArray(parsed)) {
      tools = parsed;
    } else if (parsed.tools && Array.isArray(parsed.tools)) {
      tools = parsed.tools;
    } else if (parsed.manualTools && Array.isArray(parsed.manualTools)) {
      tools = parsed.manualTools;
    } else {
      // Assume single tool, wrap in array
      tools = [parsed];
    }

    console.log(`   ✨ Converted to ${tools.length} ManualTool(s):`);
    tools.forEach((tool, idx) => {
      console.log(`      ${idx + 1}. ${tool.exportName} - ${tool.description.substring(0, 60)}...`);
    });
    console.log();

    return tools;
  } catch (error) {
    console.error('   ❌ OpenAI conversion failed:', error);
    throw error;
  }
}

async function appendToManualTools(newTools: ManualTool[]): Promise<void> {
  if (newTools.length === 0) {
    console.log('✅ No new tools to add\n');
    return;
  }

  console.log(`📝 Adding ${newTools.length} new tools to manual-tools.ts...\n`);

  const filePath = path.join(process.cwd(), 'manual-tools.ts');

  // Read the current file
  const currentContent = await fs.readFile(filePath, 'utf-8');

  // Find the closing bracket of the manualTools array
  const lastBracketIndex = currentContent.lastIndexOf('];');

  if (lastBracketIndex === -1) {
    throw new Error('Could not find closing bracket of manualTools array');
  }

  // Generate TypeScript code for new tools
  const newToolsCode = newTools
    .map((tool) => {
      // Convert to properly formatted TypeScript
      const lines: string[] = ['  {'];

      // Required fields
      lines.push(`    npmPackageName: '${tool.npmPackageName}',`);
      lines.push(`    category: '${tool.category}',`);
      lines.push(`    frameworks: [${tool.frameworks.map((f) => `'${f}'`).join(', ')}],`);
      lines.push(`    exportName: '${tool.exportName}',`);
      lines.push(`    description: '${tool.description.replace(/'/g, "\\'")}',`);

      // Optional fields
      if (tool.tags && tool.tags.length > 0) {
        lines.push(`    tags: [${tool.tags.map((t) => `'${t}'`).join(', ')}],`);
      }

      if (tool.env && tool.env.length > 0) {
        lines.push('    env: [');
        tool.env.forEach((e, idx) => {
          lines.push('      {');
          lines.push(`        name: '${e.name}',`);
          lines.push(`        description: '${e.description.replace(/'/g, "\\'")}',`);
          lines.push(`        required: ${e.required},`);
          lines.push(`      }${idx < tool.env?.length - 1 ? ',' : ''}`);
        });
        lines.push('    ],');
      }

      if (tool.parameters && tool.parameters.length > 0) {
        lines.push('    parameters: [');
        tool.parameters.forEach((p, idx) => {
          lines.push('      {');
          lines.push(`        name: '${p.name}',`);
          lines.push(`        type: '${p.type}',`);
          lines.push(`        description: '${p.description.replace(/'/g, "\\'")}',`);
          lines.push(`        required: ${p.required},`);
          if (p.default) {
            lines.push(`        default: '${p.default}',`);
          }
          lines.push(`      }${idx < tool.parameters?.length - 1 ? ',' : ''}`);
        });
        lines.push('    ],');
      }

      if (tool.returns) {
        lines.push('    returns: {');
        lines.push(`      type: '${tool.returns.type}',`);
        lines.push(`      description: '${tool.returns.description.replace(/'/g, "\\'")}',`);
        lines.push('    },');
      }

      if (tool.aiAgent) {
        lines.push('    aiAgent: {');
        lines.push(`      useCase: '${tool.aiAgent.useCase.replace(/'/g, "\\'")}',`);
        if (tool.aiAgent.limitations) {
          lines.push(`      limitations: '${tool.aiAgent.limitations.replace(/'/g, "\\'")}',`);
        }
        if (tool.aiAgent.examples && tool.aiAgent.examples.length > 0) {
          lines.push(
            `      examples: [${tool.aiAgent.examples.map((e) => `'${e.replace(/'/g, "\\'")}'`).join(', ')}],`
          );
        }
        lines.push('    },');
      }

      if (tool.docsUrl) {
        lines.push(`    docsUrl: '${tool.docsUrl}',`);
      }

      if (tool.apiKeyUrl) {
        lines.push(`    apiKeyUrl: '${tool.apiKeyUrl}',`);
      }

      if (tool.websiteUrl) {
        lines.push(`    websiteUrl: '${tool.websiteUrl}',`);
      }

      lines.push('  },');

      return lines.join('\n');
    })
    .join('\n');

  // Insert new tools before the closing bracket
  const updatedContent = `${
    currentContent.slice(0, lastBracketIndex) + newToolsCode
  }\n${currentContent.slice(lastBracketIndex)}`;

  // Write back to file
  await fs.writeFile(filePath, updatedContent, 'utf-8');

  console.log('✅ Successfully updated manual-tools.ts\n');
}

async function main() {
  console.log('\n🚀 Starting Vercel AI Registry Sync\n');
  console.log('═══════════════════════════════════════\n');

  try {
    // Step 1: Fetch Vercel registry
    const vercelTools = await fetchVercelRegistry();

    // Step 2: Find new tools
    const newVercelTools = findNewTools(vercelTools);

    if (newVercelTools.length === 0) {
      console.log('✅ No new tools found. Manual tools are up to date!\n');
      return {
        processed: 0,
        skipped: vercelTools.length,
        errors: 0,
        total: vercelTools.length,
      };
    }

    // Step 3: Convert new tools using AI
    console.log('🤖 Converting new tools with OpenAI...\n');

    const convertedTools: ManualTool[] = [];
    let errors = 0;

    for (const vercelTool of newVercelTools) {
      try {
        const tools = await convertToolWithAI(vercelTool);
        convertedTools.push(...tools);
      } catch (error) {
        console.error(`❌ Failed to convert ${vercelTool.name}:`, error);
        errors++;
      }
    }

    console.log('\n📊 Conversion Summary:');
    console.log(`   New Vercel tools: ${newVercelTools.length}`);
    console.log(`   Converted ManualTools: ${convertedTools.length}`);
    console.log(`   Errors: ${errors}\n`);

    // Step 4: Append to manual-tools.ts
    if (convertedTools.length > 0) {
      await appendToManualTools(convertedTools);
    }

    console.log('═══════════════════════════════════════\n');
    console.log('✅ Vercel AI Registry Sync Complete!\n');

    return {
      processed: convertedTools.length,
      skipped: vercelTools.length - newVercelTools.length,
      errors,
      total: vercelTools.length,
    };
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then((result) => {
      console.log('\n📊 Final Results:');
      console.log(`   Processed: ${result.processed}`);
      console.log(`   Skipped: ${result.skipped}`);
      console.log(`   Errors: ${result.errors}`);
      console.log(`   Total: ${result.total}\n`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { main as syncVercelRegistry };
