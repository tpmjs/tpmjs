import * as path from 'node:path';
import * as clack from '@clack/prompts';
import { generateTsConfig, generateTsupConfig } from './generators/config-files.js';
import { generatePackageJson } from './generators/package-json.js';
import { generateReadme } from './generators/readme.js';
import { generateIndexFile, generateToolFile } from './generators/source-code.js';
import type { GenerationResult, GeneratorConfig } from './types.js';
import {
  copyTemplate,
  ensureDir,
  getAbsolutePath,
  pathExists,
  writeFile,
} from './utils/file-writer.js';
import * as logger from './utils/logger.js';

/**
 * Runs the interactive CLI workflow
 */
export async function runInteractiveCLI(): Promise<GenerationResult> {
  clack.intro(logger.bold('create-tpmjs'));

  // Only ask for package name
  const name = await clack.text({
    message: 'Package name',
    placeholder: '@yourname/my-tools',
    validate: (value) => {
      if (!value) return 'Package name is required';
      if (!value.includes('/')) return 'Package name should be scoped (e.g., @yourname/my-tools)';
    },
  });

  if (clack.isCancel(name)) {
    clack.cancel('Operation cancelled');
    process.exit(0);
  }

  // Use defaults for everything else
  const packageNameWithoutScope = (name as string).split('/').pop() || (name as string);
  const defaultPath = `./${packageNameWithoutScope}`;
  const absoluteOutputPath = getAbsolutePath(defaultPath);

  // Check if directory exists
  if (await pathExists(absoluteOutputPath)) {
    clack.log.error(`Directory already exists: ${absoluteOutputPath}`);
    clack.cancel('Operation cancelled');
    process.exit(1);
  }

  // Generate with sensible defaults
  const spinner = clack.spinner();
  spinner.start('Generating package...');

  const packageInfo = {
    name: name as string,
    description: `AI SDK tools for ${packageNameWithoutScope}`,
    author: '',
    license: 'MIT',
    category: 'ai-ml',
  };

  const tools = [
    {
      name: 'exampleTool',
      description: 'An example tool - customize this for your use case',
    },
    {
      name: 'anotherTool',
      description: 'Another example tool - add your implementation here',
    },
  ];

  const config: GeneratorConfig = {
    packageInfo,
    tools,
    outputPath: absoluteOutputPath,
    mode: 'simple',
  };

  try {
    const result = await generatePackage(config);

    spinner.stop('Package generated successfully!');

    clack.outro(`
${logger.green('✓')} Success! Created ${logger.bold(packageInfo.name)} at ${logger.cyan(defaultPath)}

   Files created:
${result.filesCreated.map((f) => `     ${f}`).join('\n')}

   Next steps:
     ${logger.cyan(`cd ${defaultPath}`)}
     ${logger.cyan('pnpm install')}
     ${logger.cyan('pnpm build')}
     ${logger.cyan('pnpm type-check')}
     ${logger.cyan('pnpm publish')}
`);

    return result;
  } catch (error) {
    spinner.stop('Generation failed');
    clack.log.error(error instanceof Error ? error.message : 'Unknown error occurred');
    clack.cancel('Operation failed');
    process.exit(1);
  }
}

/**
 * Generates the package files
 */
async function generatePackage(config: GeneratorConfig): Promise<GenerationResult> {
  const { packageInfo, tools, outputPath } = config;
  const filesCreated: string[] = [];

  // Create directory structure
  await ensureDir(outputPath);
  await ensureDir(path.join(outputPath, 'src'));
  await ensureDir(path.join(outputPath, 'src', 'tools'));

  // Generate package.json
  const packageJsonPath = path.join(outputPath, 'package.json');
  await writeFile(packageJsonPath, generatePackageJson(config));
  filesCreated.push('package.json');

  // Generate tool files
  for (const tool of tools) {
    const toolPath = path.join(outputPath, 'src', 'tools', `${tool.name}.ts`);
    await writeFile(toolPath, generateToolFile(tool));
    filesCreated.push(`src/tools/${tool.name}.ts`);
  }

  // Generate index.ts
  const indexPath = path.join(outputPath, 'src', 'index.ts');
  await writeFile(indexPath, generateIndexFile(tools));
  filesCreated.push('src/index.ts');

  // Generate tsconfig.json
  const tsconfigPath = path.join(outputPath, 'tsconfig.json');
  await writeFile(tsconfigPath, generateTsConfig());
  filesCreated.push('tsconfig.json');

  // Generate tsup.config.ts
  const tsupConfigPath = path.join(outputPath, 'tsup.config.ts');
  await writeFile(tsupConfigPath, generateTsupConfig());
  filesCreated.push('tsup.config.ts');

  // Generate README.md
  const readmePath = path.join(outputPath, 'README.md');
  await writeFile(readmePath, generateReadme(config));
  filesCreated.push('README.md');

  // Copy static templates
  const gitignorePath = path.join(outputPath, '.gitignore');
  await copyTemplate('gitignore.txt', gitignorePath);
  filesCreated.push('.gitignore');

  const npmignorePath = path.join(outputPath, '.npmignore');
  await copyTemplate('npmignore.txt', npmignorePath);
  filesCreated.push('.npmignore');

  const licensePath = path.join(outputPath, 'LICENSE');
  await copyTemplate('license-mit.txt', licensePath, {
    YEAR: new Date().getFullYear().toString(),
    AUTHOR: packageInfo.author || 'Author Name',
  });
  filesCreated.push('LICENSE');

  return {
    success: true,
    outputPath,
    filesCreated,
  };
}
