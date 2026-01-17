import { Args, Command, Flags } from '@oclif/core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { createOutput } from '../../lib/output.js';

const CATEGORIES = [
  'research',
  'web',
  'data',
  'documentation',
  'engineering',
  'security',
  'statistics',
  'ops',
  'agent',
  'sandbox',
  'utilities',
  'html',
  'compliance',
];

export default class ToolInit extends Command {
  static description = 'Initialize a new TPMJS tool package';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> my-tool',
    '<%= config.bin %> <%= command.id %> --template minimal',
  ];

  static flags = {
    template: Flags.string({
      char: 't',
      description: 'Template to use',
      options: ['minimal', 'rich'],
      default: 'minimal',
    }),
    category: Flags.string({
      char: 'c',
      description: 'Tool category',
      options: CATEGORIES,
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Overwrite existing files',
      default: false,
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip prompts and use defaults',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show verbose output',
      default: false,
    }),
  };

  static args = {
    name: Args.string({
      description: 'Tool name (creates directory if not exists)',
      required: false,
    }),
  };

  private rl?: readline.Interface;

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ToolInit);
    const output = createOutput(flags);

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      // Gather configuration
      const config = await this.gatherConfig(args.name as string | undefined, flags, output);

      // Determine target directory
      const targetDir = config.name ? path.resolve(config.name) : process.cwd();

      // Check if files exist
      const packageJsonPath = path.join(targetDir, 'package.json');
      if (fs.existsSync(packageJsonPath) && !flags.force) {
        output.error('package.json already exists. Use --force to overwrite.');
        return;
      }

      // Create directory if needed
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Generate files
      await this.generateFiles(targetDir, config, flags.template, output);

      output.success('TPMJS tool initialized successfully!');
      output.text('');
      output.text('Next steps:');
      output.listItem('Install dependencies: npm install');
      output.listItem('Implement your tool in src/index.ts');
      output.listItem('Validate: tpm tool validate');
      output.listItem('Build: npm run build');
      output.listItem('Publish: npm publish');
    } finally {
      this.rl?.close();
    }
  }

  private async gatherConfig(
    name: string | undefined,
    flags: { category?: string; yes: boolean },
    output: ReturnType<typeof createOutput>
  ): Promise<{
    name: string;
    description: string;
    category: string;
    author: string;
  }> {
    if (flags.yes) {
      return {
        name: name || 'my-tpmjs-tool',
        description: 'A TPMJS tool',
        category: flags.category || 'utilities',
        author: process.env.USER || 'unknown',
      };
    }

    output.heading('TPMJS Tool Initialization');
    output.text('');

    const toolName = name || (await this.prompt('Tool name: ')) || 'my-tpmjs-tool';
    const description = (await this.prompt('Description: ')) || 'A TPMJS tool';

    let category = flags.category;
    if (!category) {
      output.text('');
      output.text('Available categories:');
      CATEGORIES.forEach((cat, i) => {
        output.text(`  ${i + 1}. ${cat}`);
      });
      const catIndex = await this.prompt('Category (number or name): ');
      const index = parseInt(catIndex, 10);
      if (index > 0 && index <= CATEGORIES.length) {
        category = CATEGORIES[index - 1];
      } else if (CATEGORIES.includes(catIndex)) {
        category = catIndex;
      } else {
        category = 'utilities';
      }
    }

    const author = (await this.prompt(`Author (${process.env.USER}): `)) || process.env.USER || 'unknown';

    return { name: toolName, description, category: category ?? 'utilities', author };
  }

  private prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl?.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  private async generateFiles(
    targetDir: string,
    config: { name: string; description: string; category: string; author: string },
    template: string,
    output: ReturnType<typeof createOutput>
  ): Promise<void> {
    const spinner = output.spinner('Generating files...');

    // package.json
    const packageJson = {
      name: config.name.startsWith('@') ? config.name : config.name,
      version: '0.1.0',
      description: config.description,
      type: 'module',
      main: './dist/index.js',
      types: './dist/index.d.ts',
      exports: {
        '.': {
          import: './dist/index.js',
          types: './dist/index.d.ts',
        },
      },
      files: ['dist'],
      keywords: ['tpmjs', 'mcp', 'ai-tools', config.category],
      author: config.author,
      license: 'MIT',
      scripts: {
        build: 'tsup',
        dev: 'tsup --watch',
        'type-check': 'tsc --noEmit',
        prepublishOnly: 'npm run build',
      },
      dependencies: {
        ai: '^4.0.0',
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        tsup: '^8.0.0',
        typescript: '^5.0.0',
      },
      tpmjs: {
        name: config.name.replace(/@[^/]+\//, '').replace(/-/g, ' '),
        description: config.description,
        category: config.category,
        tools: [
          {
            name: 'myTool',
            description: 'Description of what this tool does',
          },
        ],
        ...(template === 'rich'
          ? {
              documentation: 'https://github.com/yourname/' + config.name + '#readme',
              examples: [
                {
                  title: 'Basic usage',
                  code: 'const result = await myTool.execute({ input: "hello" });',
                },
              ],
            }
          : {}),
      },
    };

    fs.writeFileSync(
      path.join(targetDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // tsconfig.json
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        declaration: true,
        declarationMap: true,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        outDir: './dist',
        rootDir: './src',
      },
      include: ['src'],
      exclude: ['node_modules', 'dist'],
    };

    fs.writeFileSync(
      path.join(targetDir, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, 2)
    );

    // tsup.config.ts
    const tsupConfig = `import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
});
`;

    fs.writeFileSync(path.join(targetDir, 'tsup.config.ts'), tsupConfig);

    // Create src directory
    const srcDir = path.join(targetDir, 'src');
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }

    // src/index.ts
    const indexTs = `import { jsonSchema, tool } from 'ai';

/**
 * ${config.description}
 */
export const myTool = tool({
  description: '${config.description}',
  parameters: jsonSchema<{ input: string }>({
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'The input to process',
      },
    },
    required: ['input'],
  }),
  async execute({ input }) {
    // TODO: Implement your tool logic here
    return {
      result: \`Processed: \${input}\`,
    };
  },
});

export default myTool;
`;

    fs.writeFileSync(path.join(srcDir, 'index.ts'), indexTs);

    // block.ts (required for TPMJS validation)
    const blockTs = `import { myTool } from './src/index.js';

export const block = {
  name: '${config.name}',
  tools: { myTool },
};
`;

    fs.writeFileSync(path.join(targetDir, 'block.ts'), blockTs);

    // README.md
    const readme = `# ${config.name}

${config.description}

## Installation

\`\`\`bash
npm install ${config.name}
\`\`\`

## Usage

\`\`\`typescript
import { myTool } from '${config.name}';

const result = await myTool.execute({ input: 'hello' });
console.log(result);
\`\`\`

## Category

${config.category}

## License

MIT
`;

    fs.writeFileSync(path.join(targetDir, 'README.md'), readme);

    // .gitignore
    const gitignore = `node_modules/
dist/
*.log
.DS_Store
`;

    fs.writeFileSync(path.join(targetDir, '.gitignore'), gitignore);

    spinner.stop();

    output.text('');
    output.text('Files created:');
    output.listItem('package.json');
    output.listItem('tsconfig.json');
    output.listItem('tsup.config.ts');
    output.listItem('src/index.ts');
    output.listItem('block.ts');
    output.listItem('README.md');
    output.listItem('.gitignore');
  }
}
