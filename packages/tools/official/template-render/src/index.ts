/**
 * Template Render Tool for TPMJS
 * Render mustache-style templates with variable tracking
 *
 * @requires Node.js 18+
 */

import { jsonSchema, tool } from 'ai';
import Mustache from 'mustache';

/**
 * Input interface for template rendering
 */
export interface TemplateRenderInput {
  template: string;
  data: Record<string, any>;
  options?: {
    escape?: boolean;
  };
}

/**
 * Output interface for template rendering
 */
export interface TemplateRenderResult {
  rendered: string;
  variablesUsed: string[];
  unusedVariables: string[];
}

/**
 * Extract all variable names from a mustache template
 */
function extractTemplateVariables(template: string): string[] {
  const variablePattern = /\{\{([^{}]+)\}\}/g;
  const variables = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = variablePattern.exec(template)) !== null) {
    if (match[1]) {
      const variable = match[1].trim();
      // Remove mustache directives (#, ^, /, etc.)
      const cleanVariable = variable.replace(/^[#^\/&]/, '').trim();
      if (cleanVariable) {
        variables.add(cleanVariable);
      }
    }
  }

  return Array.from(variables);
}

/**
 * Template Render Tool
 * Renders mustache-style templates with data and tracks variable usage
 */
export const templateRenderTool = tool({
  description:
    'Render mustache-style templates with data. Supports {{variable}} syntax and tracks which variables were used and which were defined but unused. Optionally disable HTML escaping.',
  inputSchema: jsonSchema<TemplateRenderInput>({
    type: 'object',
    properties: {
      template: {
        type: 'string',
        description: 'The mustache-style template string with {{variable}} placeholders',
      },
      data: {
        type: 'object',
        description: 'Data object to substitute into the template',
      },
      options: {
        type: 'object',
        description: 'Optional rendering settings',
        properties: {
          escape: {
            type: 'boolean',
            description: 'Whether to HTML-escape variables (default: true)',
          },
        },
        additionalProperties: false,
      },
    },
    required: ['template', 'data'],
    additionalProperties: false,
  }),
  async execute({ template, data, options }): Promise<TemplateRenderResult> {
    // Validate input
    if (typeof template !== 'string') {
      throw new Error('Template must be a string');
    }

    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new Error('Data must be a non-null object');
    }

    // Extract variables from template
    const templateVariables = extractTemplateVariables(template);

    // Configure escaping
    const escape = options?.escape !== false; // Default to true

    // Render the template
    let rendered: string;
    try {
      if (escape) {
        rendered = Mustache.render(template, data);
      } else {
        // Disable escaping by saving original escape function
        const originalEscape = Mustache.escape;
        Mustache.escape = (text: string) => text;
        rendered = Mustache.render(template, data);
        // Reset escape function to original
        Mustache.escape = originalEscape;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to render template: ${message}`);
    }

    // Determine which variables were used
    const dataKeys = Object.keys(data);
    const variablesUsed = templateVariables.filter((v) => v in data);
    const unusedVariables = dataKeys.filter((key) => !templateVariables.includes(key));

    return {
      rendered,
      variablesUsed,
      unusedVariables,
    };
  },
});

export default templateRenderTool;
