import * as clack from '@clack/prompts';
import type { ToolDefinition } from '../types.js';
import { validateExportName } from '../validation/package-name.js';
import { validateDescription } from '../validation/tool-metadata.js';

/**
 * Prompts for tool definitions (minimum 2 tools required)
 */
export async function promptTools(): Promise<ToolDefinition[] | null> {
  const tools: ToolDefinition[] = [];

  clack.note(
    'Define at least 2 tools for your package.\nExamples: summarizeText, extractKeywords, classifySentiment',
    'Tool Definitions'
  );

  // First tool (required)
  const tool1 = await promptSingleTool(1);
  if (!tool1) return null;
  tools.push(tool1);

  // Second tool (required)
  const tool2 = await promptSingleTool(2);
  if (!tool2) return null;
  tools.push(tool2);

  // Additional tools (optional)
  let continueAdding = true;
  let toolNumber = 3;

  while (continueAdding) {
    const addMore = await clack.confirm({
      message: `Add tool #${toolNumber}? (already have ${tools.length})`,
      initialValue: toolNumber === 3, // Default yes for the 3rd tool
    });

    if (clack.isCancel(addMore)) {
      return null;
    }

    if (!addMore) {
      continueAdding = false;
    } else {
      const tool = await promptSingleTool(toolNumber);
      if (!tool) return null;
      tools.push(tool);
      toolNumber++;
    }
  }

  return tools;
}

/**
 * Prompts for a single tool definition
 */
async function promptSingleTool(number: number): Promise<ToolDefinition | null> {
  const name = await clack.text({
    message: `Tool #${number} export name`,
    placeholder: number === 1 ? 'summarizeText' : number === 2 ? 'extractKeywords' : 'myTool',
    validate: (value) => {
      if (!value) return 'Export name is required';
      const validation = validateExportName(value as string);
      if (!validation.valid) {
        return validation.error || 'Invalid export name';
      }
    },
  });

  if (clack.isCancel(name)) {
    return null;
  }

  const description = await clack.text({
    message: `Tool #${number} description`,
    placeholder:
      number === 1
        ? 'Summarize a block of text into a concise overview.'
        : number === 2
          ? 'Extract important keywords from text.'
          : 'Description of what this tool does.',
    validate: (value) => {
      if (!value) return 'Description is required';
      const validation = validateDescription(value as string);
      if (!validation.valid) {
        return validation.error || 'Invalid description';
      }
    },
  });

  if (clack.isCancel(description)) {
    return null;
  }

  return {
    name: name as string,
    description: description as string,
  };
}
