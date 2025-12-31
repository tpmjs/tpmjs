/**
 * Environment Variable Documentation Generator Tool for TPMJS
 * Parses .env files and generates structured documentation with
 * variable names, descriptions, required status, and default values.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Represents a single environment variable
 */
export interface EnvVariable {
  name: string;
  description: string;
  required: boolean;
  default?: string;
  example?: string;
}

/**
 * Output interface for environment variable documentation
 */
export interface EnvVarDocs {
  variables: EnvVariable[];
  markdown: string;
  totalVariables: number;
  requiredCount: number;
  optionalCount: number;
}

type EnvVarDocsInput = {
  envContent: string;
};

/**
 * Parses a single line from a .env file
 * Supports various comment formats:
 * - # Comment before variable
 * - # REQUIRED: Description
 * - # OPTIONAL: Description
 * - VAR_NAME=value # inline comment
 */
function parseEnvLine(
  line: string,
  previousComment: string
): { variable: EnvVariable | null; comment: string } {
  const trimmed = line.trim();

  // Skip empty lines
  if (!trimmed) {
    return { variable: null, comment: '' };
  }

  // Handle comment lines
  if (trimmed.startsWith('#')) {
    const comment = trimmed.substring(1).trim();
    return { variable: null, comment };
  }

  // Handle variable assignment
  const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
  if (!match) {
    return { variable: null, comment: '' };
  }

  const name = match[1];
  const value = match[2];

  if (!name || value === undefined) {
    return { variable: null, comment: '' };
  }

  // Extract inline comment if present
  let actualValue = value;
  let inlineComment = '';
  const hashIndex = value.indexOf('#');
  if (hashIndex > 0) {
    actualValue = value.substring(0, hashIndex).trim();
    inlineComment = value.substring(hashIndex + 1).trim();
  }

  // Remove quotes from value
  actualValue = actualValue.replace(/^["']|["']$/g, '');

  // Determine description from comments
  let description = previousComment || inlineComment || 'No description provided';
  let required = false;

  // Check for REQUIRED/OPTIONAL markers
  const requiredMatch = description.match(/^REQUIRED:?\s*(.+)/i);
  const optionalMatch = description.match(/^OPTIONAL:?\s*(.+)/i);

  if (requiredMatch?.[1]) {
    description = requiredMatch[1].trim();
    required = true;
  } else if (optionalMatch?.[1]) {
    description = optionalMatch[1].trim();
    required = false;
  } else {
    // Default: treat as required if no default value, optional if has value
    required = !actualValue;
  }

  const variable: EnvVariable = {
    name,
    description,
    required,
  };

  // Add default value if present
  if (actualValue) {
    variable.default = actualValue;
  }

  // Generate example if it looks like a template
  if (actualValue && /^(your|example|change|replace|enter)/i.test(actualValue)) {
    variable.example = actualValue;
  }

  return { variable, comment: '' };
}

/**
 * Parses .env file content and extracts all variables
 */
function parseEnvContent(content: string): EnvVariable[] {
  const lines = content.split('\n');
  const variables: EnvVariable[] = [];
  let previousComment = '';

  for (const line of lines) {
    const { variable, comment } = parseEnvLine(line, previousComment);

    if (variable) {
      variables.push(variable);
      previousComment = ''; // Reset after using
    } else if (comment) {
      // Accumulate multi-line comments
      previousComment = previousComment ? `${previousComment} ${comment}` : comment;
    } else {
      // Empty line resets comment accumulator
      previousComment = '';
    }
  }

  return variables;
}

/**
 * Generates markdown documentation from environment variables
 */
function generateMarkdown(variables: EnvVariable[]): string {
  if (variables.length === 0) {
    return '# Environment Variables\n\nNo environment variables found.\n';
  }

  const required = variables.filter((v) => v.required);
  const optional = variables.filter((v) => !v.required);

  let markdown = '# Environment Variables\n\n';

  // Summary
  markdown += `Total: ${variables.length} variables (${required.length} required, ${optional.length} optional)\n\n`;

  // Required variables section
  if (required.length > 0) {
    markdown += '## Required Variables\n\n';
    markdown += 'These variables must be set for the application to function:\n\n';
    markdown += '| Variable | Description | Example |\n';
    markdown += '|----------|-------------|----------|\n';

    for (const v of required) {
      const example = v.example || v.default || '-';
      markdown += `| \`${v.name}\` | ${v.description} | \`${example}\` |\n`;
    }
    markdown += '\n';
  }

  // Optional variables section
  if (optional.length > 0) {
    markdown += '## Optional Variables\n\n';
    markdown += 'These variables have default values and can be customized:\n\n';
    markdown += '| Variable | Description | Default |\n';
    markdown += '|----------|-------------|----------|\n';

    for (const v of optional) {
      const defaultVal = v.default || 'Not set';
      markdown += `| \`${v.name}\` | ${v.description} | \`${defaultVal}\` |\n`;
    }
    markdown += '\n';
  }

  // Example .env section
  markdown += '## Example .env File\n\n';
  markdown += '```bash\n';
  for (const v of variables) {
    if (v.description !== 'No description provided') {
      markdown += `# ${v.required ? 'REQUIRED: ' : ''}${v.description}\n`;
    }
    const value = v.example || v.default || '';
    markdown += `${v.name}=${value}\n\n`;
  }
  markdown += '```\n';

  return markdown;
}

/**
 * Environment Variable Documentation Generator Tool
 * Parses .env file content and generates structured documentation
 */
export const envVarDocsGenerate = tool({
  description:
    'Parse .env file content and generate structured documentation with variable names, descriptions, required status, and default values. Supports comment-based documentation and REQUIRED/OPTIONAL markers.',
  inputSchema: jsonSchema<EnvVarDocsInput>({
    type: 'object',
    properties: {
      envContent: {
        type: 'string',
        description: 'The content of the .env file to parse and document',
      },
    },
    required: ['envContent'],
    additionalProperties: false,
  }),
  async execute({ envContent }): Promise<EnvVarDocs> {
    // Validate input
    if (!envContent || typeof envContent !== 'string') {
      throw new Error('envContent is required and must be a string');
    }

    if (envContent.trim().length === 0) {
      throw new Error('envContent cannot be empty');
    }

    // Parse the .env content
    const variables = parseEnvContent(envContent);

    // Generate markdown documentation
    const markdown = generateMarkdown(variables);

    // Calculate statistics
    const requiredCount = variables.filter((v) => v.required).length;
    const optionalCount = variables.filter((v) => !v.required).length;

    return {
      variables,
      markdown,
      totalVariables: variables.length,
      requiredCount,
      optionalCount,
    };
  },
});

export default envVarDocsGenerate;
