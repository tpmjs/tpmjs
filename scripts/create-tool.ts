#!/usr/bin/env tsx

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const toolName = process.argv[2];

if (!toolName) {
  console.error('Usage: tsx scripts/create-tool.ts <tool-name>');
  process.exit(1);
}

// Validate tool name (lowercase, alphanumeric, hyphens)
if (!/^[a-z0-9-]+$/.test(toolName)) {
  console.error('Tool name must be lowercase alphanumeric with hyphens only');
  process.exit(1);
}

const toolDir = join(process.cwd(), 'packages', 'tools', 'official', toolName);
const srcDir = join(toolDir, 'src');

// Convert kebab-case to PascalCase for function names
const pascalName = toolName
  .split('-')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join('');

async function createToolPackage() {
  console.log(`Creating tool package: @tpmjs/tools-${toolName}`);

  // Create directories
  await mkdir(srcDir, { recursive: true });
  console.log(`  Created: ${toolDir}`);

  // package.json
  const packageJson = {
    name: `@tpmjs/tools-${toolName}`,
    version: '0.1.0',
    description: `${pascalName} tools for AI agents`,
    type: 'module',
    keywords: ['tpmjs', toolName, 'agent'],
    exports: {
      '.': {
        types: './dist/index.d.ts',
        default: './dist/index.js',
      },
    },
    files: ['dist'],
    scripts: {
      build: 'tsdown --logLevel warn',
      dev: 'tsdown --watch',
      'type-check':
        'tsc --checkers 1 --noEmit --incremental --tsBuildInfoFile tsconfig.tsbuildinfo',
      test: 'vitest',
      clean: 'rm -rf dist .turbo',
    },
    devDependencies: {
      '@tpmjs/tsconfig': 'workspace:*',
      '@tpmjs/tool-test-utils': 'workspace:*',
      typescript: 'catalog:',
      vitest: '^4.0.16',
    },
    dependencies: {
      ai: '6.0.49',
    },
    publishConfig: {
      access: 'public',
    },
    repository: {
      type: 'git',
      url: 'https://github.com/tpmjs/tpmjs.git',
      directory: `packages/tools/official/${toolName}`,
    },
    homepage: 'https://tpmjs.com',
    license: 'MIT',
    tpmjs: {
      category: 'general',
      frameworks: ['vercel-ai'],
      tools: [
        {
          name: `example${pascalName}`,
          description: `Example ${toolName} tool`,
        },
      ],
    },
  };

  await writeFile(join(toolDir, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
  console.log(`  Created: package.json`);

  // tsconfig.json
  const tsconfig = {
    extends: '@tpmjs/tsconfig/base.json',
    compilerOptions: {
      outDir: 'dist',
      rootDir: 'src',
      incremental: false,
      composite: false,
    },
    include: ['src'],
    exclude: ['node_modules', 'dist'],
  };

  await writeFile(join(toolDir, 'tsconfig.json'), `${JSON.stringify(tsconfig, null, 2)}\n`);
  console.log(`  Created: tsconfig.json`);

  // README.md
  const readme = `# @tpmjs/tools-${toolName}

${pascalName} tools for AI agents.

## Installation

\`\`\`bash
npm install @tpmjs/tools-${toolName}
\`\`\`

## Usage

\`\`\`typescript
import { example${pascalName} } from '@tpmjs/tools-${toolName}';

// Use with Vercel AI SDK
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    example${pascalName},
  },
  prompt: 'Your prompt here',
});
\`\`\`

## Tools

### example${pascalName}

Example ${toolName} tool that demonstrates the basic structure.

**Parameters:**
- \`message\` (string, required): A message to process

## Environment Variables

None required for the example tool.

## License

MIT
`;

  await writeFile(join(toolDir, 'README.md'), readme);
  console.log(`  Created: README.md`);

  // src/index.ts
  const indexTs = `import { jsonSchema, tool } from 'ai';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Example${pascalName}Input {
  message: string;
}

interface Example${pascalName}Output {
  success: boolean;
  message: string;
  timestamp: string;
}

// ─── Tools ──────────────────────────────────────────────────────────────────

/**
 * Example ${toolName} tool that demonstrates the basic structure.
 *
 * Replace this with your actual tool implementation.
 */
export const example${pascalName} = tool({
  description: 'Example ${toolName} tool that echoes a message',
  inputSchema: jsonSchema<Example${pascalName}Input>({
    type: 'object',
    properties: {
      message: { type: 'string', description: 'The message to echo' },
    },
    required: ['message'],
    additionalProperties: false,
  }),
  execute: async ({ message }): Promise<Example${pascalName}Output> => {
    return {
      success: true,
      message: \`Echo: \${message}\`,
      timestamp: new Date().toISOString(),
    };
  },
});

// Export all tools
export const ${toolName}Tools = {
  example${pascalName},
};
`;

  await writeFile(join(srcDir, 'index.ts'), indexTs);
  console.log(`  Created: src/index.ts`);

  // src/index.test.ts
  const testTs = `import { describe, it, expect } from 'vitest';
import { assertValidTool, executeTool } from '@tpmjs/tool-test-utils';
import { example${pascalName} } from './index.js';

describe('${toolName} tools', () => {
  describe('example${pascalName}', () => {
    it('should have valid tool structure', () => {
      assertValidTool(example${pascalName}, 'example${pascalName}');
    });

    it('should echo a message', async () => {
      const { result, error } = await executeTool(example${pascalName}, {
        message: 'Hello, World!',
      });

      expect(error).toBeUndefined();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Echo: Hello, World!');
      expect(result).toHaveProperty('timestamp');
    });

    it('should handle empty message', async () => {
      const { result, error } = await executeTool(example${pascalName}, {
        message: '',
      });

      expect(error).toBeUndefined();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('message', 'Echo: ');
    });
  });
});
`;

  await writeFile(join(srcDir, 'index.test.ts'), testTs);
  console.log(`  Created: src/index.test.ts`);

  console.log(`\nTool package created successfully!`);
  console.log(`\nNext steps:`);
  console.log(`  1. cd packages/tools/official/${toolName}`);
  console.log(`  2. pnpm install (from repo root)`);
  console.log(`  3. pnpm --filter=@tpmjs/tools-${toolName} build`);
  console.log(`  4. pnpm --filter=@tpmjs/tools-${toolName} test`);
  console.log(`\nEdit the following files to implement your tool:`);
  console.log(`  - src/index.ts (tool implementation)`);
  console.log(`  - src/index.test.ts (tests)`);
  console.log(`  - README.md (documentation)`);
  console.log(`  - package.json (update description, category, tools list)`);
}

createToolPackage().catch((error) => {
  console.error('Error creating tool package:', error);
  process.exit(1);
});
