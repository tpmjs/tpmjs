/**
 * Coverage Tracker Tool for TPMJS
 * Tracks which tools have been used in a workflow and calculates coverage percentage.
 * Useful for testing workflow completeness and tool utilization.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Tool usage statistics for a single tool
 */
export interface ToolUsage {
  name: string;
  used: boolean;
  usageCount: number;
}

/**
 * Output interface for coverage tracking
 */
export interface CoverageReport {
  coverage: number;
  usedCount: number;
  totalCount: number;
  unusedTools: string[];
  usedTools: ToolUsage[];
  coveragePercent: string;
  summary: string;
}

type CoverageTrackerInput = {
  availableTools: string[];
  usedTools: string[];
};

/**
 * Counts occurrences of each tool in the used tools list
 */
function countToolUsage(usedTools: string[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const tool of usedTools) {
    counts.set(tool, (counts.get(tool) || 0) + 1);
  }

  return counts;
}

/**
 * Coverage Tracker Tool
 * Tracks which tools have been used and calculates coverage metrics
 */
export const coverageTrackerTool = tool({
  description:
    'Tracks which tools have been used in a workflow and calculates coverage percentage. Returns coverage metrics, lists of used/unused tools, and usage counts. Useful for testing workflow completeness and analyzing tool utilization patterns.',
  inputSchema: jsonSchema<CoverageTrackerInput>({
    type: 'object',
    properties: {
      availableTools: {
        type: 'array',
        description: 'Array of all available tool names in the workflow',
        items: {
          type: 'string',
          description: 'Name of an available tool',
        },
      },
      usedTools: {
        type: 'array',
        description: 'Array of tool names that were actually used (can include duplicates)',
        items: {
          type: 'string',
          description: 'Name of a used tool',
        },
      },
    },
    required: ['availableTools', 'usedTools'],
    additionalProperties: false,
  }),
  async execute({ availableTools, usedTools }): Promise<CoverageReport> {
    // Validate inputs
    if (!Array.isArray(availableTools)) {
      throw new Error('availableTools must be an array of strings');
    }
    if (!Array.isArray(usedTools)) {
      throw new Error('usedTools must be an array of strings');
    }

    // Remove duplicates from available tools and validate
    const uniqueAvailableTools = Array.from(
      new Set(availableTools.filter((t) => typeof t === 'string' && t.trim()))
    );

    if (uniqueAvailableTools.length === 0) {
      throw new Error('availableTools must contain at least one valid tool name');
    }

    // Filter valid used tools
    const validUsedTools = usedTools.filter((t) => typeof t === 'string' && t.trim());

    // Count usage for each tool
    const usageCounts = countToolUsage(validUsedTools);

    // Create tool usage list
    const usedToolsList: ToolUsage[] = [];
    const unusedTools: string[] = [];

    for (const toolName of uniqueAvailableTools) {
      const usageCount = usageCounts.get(toolName) || 0;

      if (usageCount > 0) {
        usedToolsList.push({
          name: toolName,
          used: true,
          usageCount,
        });
      } else {
        unusedTools.push(toolName);
      }
    }

    // Sort used tools by usage count (descending)
    usedToolsList.sort((a, b) => b.usageCount - a.usageCount);

    // Calculate coverage
    const totalCount = uniqueAvailableTools.length;
    const usedCount = usedToolsList.length;
    const coverage = totalCount > 0 ? usedCount / totalCount : 0;
    const coveragePercent = `${(coverage * 100).toFixed(1)}%`;

    // Identify tools that were used but not in available tools (potential issues)
    const unknownTools: string[] = [];
    const availableSet = new Set(uniqueAvailableTools);
    for (const tool of new Set(validUsedTools)) {
      if (!availableSet.has(tool)) {
        unknownTools.push(tool);
      }
    }

    // Generate summary
    const summaryParts = [`Coverage: ${coveragePercent} (${usedCount}/${totalCount} tools)`];

    if (unusedTools.length > 0) {
      summaryParts.push(
        `Unused: ${unusedTools.slice(0, 3).join(', ')}${unusedTools.length > 3 ? '...' : ''}`
      );
    }

    if (unknownTools.length > 0) {
      summaryParts.push(`Warning: ${unknownTools.length} unknown tool(s) used`);
    }

    const summary = summaryParts.join(' | ');

    return {
      coverage: Math.round(coverage * 1000) / 1000, // Round to 3 decimal places
      usedCount,
      totalCount,
      unusedTools,
      usedTools: usedToolsList,
      coveragePercent,
      summary,
    };
  },
});

export default coverageTrackerTool;
