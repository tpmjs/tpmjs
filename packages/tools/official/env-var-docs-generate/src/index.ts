/**
 * Environment Variable Documentation Generator Tool for TPMJS
 * Generates environment variable documentation table from schema.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Represents a single environment variable definition
 */
export interface EnvVariableDefinition {
  name: string;
  description: string;
  required?: boolean;
  default?: string;
  example?: string;
  type?: string;
}

/**
 * Output interface for environment variable documentation
 */
export interface EnvVarDocs {
  docs: string;
  totalVariables: number;
  requiredCount: number;
  optionalCount: number;
}

type EnvVarDocsInput = {
  vars: EnvVariableDefinition[];
};

/**
 * Generates markdown table documentation from environment variable definitions
 */
function generateMarkdownTable(vars: EnvVariableDefinition[]): string {
  if (vars.length === 0) {
    return '# Environment Variables\n\nNo environment variables defined.\n';
  }

  const required = vars.filter((v) => v.required !== false);
  const optional = vars.filter((v) => v.required === false);

  let markdown = '# Environment Variables\n\n';

  // Summary
  markdown += `Total: ${vars.length} variables (${required.length} required, ${optional.length} optional)\n\n`;

  // Main table
  markdown += '| Variable | Required | Type | Description | Default | Example |\n';
  markdown += '|----------|----------|------|-------------|---------|----------|\n';

  for (const v of vars) {
    const isRequired = v.required !== false ? '✅ Yes' : '❌ No';
    const type = v.type || 'string';
    const description = v.description || '-';
    const defaultVal = v.default || '-';
    const example = v.example || '-';

    markdown += `| \`${v.name}\` | ${isRequired} | \`${type}\` | ${description} | \`${defaultVal}\` | \`${example}\` |\n`;
  }

  markdown += '\n';

  // Example .env section
  markdown += '## Example .env File\n\n';
  markdown += '```bash\n';
  for (const v of vars) {
    const reqLabel = v.required !== false ? 'REQUIRED' : 'OPTIONAL';
    markdown += `# ${reqLabel}: ${v.description || v.name}\n`;
    const value = v.example || v.default || '';
    markdown += `${v.name}=${value}\n\n`;
  }
  markdown += '```\n';

  return markdown;
}

/**
 * Environment Variable Documentation Generator Tool
 * Generates environment variable documentation table from schema
 */
export const envVarDocsGenerate = tool({
  description:
    'Generate markdown documentation table for environment variables from schema definitions. Indicates required vs optional variables and includes example values.',
  inputSchema: jsonSchema<EnvVarDocsInput>({
    type: 'object',
    properties: {
      vars: {
        type: 'array',
        description: 'Environment variable definitions',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Variable name',
            },
            description: {
              type: 'string',
              description: 'Variable description',
            },
            required: {
              type: 'boolean',
              description: 'Whether the variable is required (default: true)',
            },
            default: {
              type: 'string',
              description: 'Default value',
            },
            example: {
              type: 'string',
              description: 'Example value',
            },
            type: {
              type: 'string',
              description: 'Variable type (default: string)',
            },
          },
          required: ['name', 'description'],
        },
      },
    },
    required: ['vars'],
    additionalProperties: false,
  }),
  async execute({ vars }): Promise<EnvVarDocs> {
    // Validate input
    if (!vars || !Array.isArray(vars)) {
      throw new Error('vars is required and must be an array');
    }

    if (vars.length === 0) {
      throw new Error('vars array cannot be empty');
    }

    // Validate each variable definition
    for (const v of vars) {
      if (!v.name || typeof v.name !== 'string') {
        throw new Error('Each variable must have a name string');
      }
      if (!v.description || typeof v.description !== 'string') {
        throw new Error('Each variable must have a description string');
      }
    }

    // Generate markdown documentation
    const docs = generateMarkdownTable(vars);

    // Calculate statistics
    const requiredCount = vars.filter((v) => v.required !== false).length;
    const optionalCount = vars.filter((v) => v.required === false).length;

    return {
      docs,
      totalVariables: vars.length,
      requiredCount,
      optionalCount,
    };
  },
});

export default envVarDocsGenerate;
