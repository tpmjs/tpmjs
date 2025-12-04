import type { GeneratorConfig } from '../types.js';

/**
 * Generates README.md content for the tool package
 */
export function generateReadme(config: GeneratorConfig): string {
  const { packageInfo, tools } = config;

  const toolsList = tools.map((tool) => `- **${tool.exportName}**: ${tool.description}`).join('\n');

  const usageExample = tools[0];
  if (!usageExample) {
    throw new Error('At least one tool is required');
  }

  return `# ${packageInfo.name}

${packageInfo.description}

## Installation

\`\`\`bash
pnpm add ${packageInfo.name}
\`\`\`

## Tools

This package provides ${tools.length} tool${tools.length > 1 ? 's' : ''} for the AI SDK:

${toolsList}

## Usage

\`\`\`typescript
import { ${usageExample.exportName} } from '${packageInfo.name}';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = await generateText({
  model: openai('gpt-4'),
  prompt: 'Process this text for me',
  tools: {
    ${usageExample.exportName},
  },
});

console.log(result.text);
\`\`\`

## Development

\`\`\`bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Type-check
pnpm type-check

# Watch mode
pnpm dev
\`\`\`

## Publishing

1. Update the version in \`package.json\`
2. Build the package: \`pnpm build\`
3. Publish to npm: \`pnpm publish --access public\`
4. Your tools will appear on [tpmjs.com](https://tpmjs.com) within 2-15 minutes

## License

${packageInfo.license}
`;
}
