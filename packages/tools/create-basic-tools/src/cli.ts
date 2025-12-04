import * as path from 'node:path';
import * as clack from '@clack/prompts';
import { generateTsConfig, generateTsupConfig } from './generators/config-files.js';
import { generatePackageJson } from './generators/package-json.js';
import { generateReadme } from './generators/readme.js';
import { generateIndexFile, generateToolFile } from './generators/source-code.js';
import { promptCategoryAndMode, promptConfirmation, promptOutputPath } from './prompts/advanced.js';
import { promptBasicInfo } from './prompts/basic.js';
import { promptTools } from './prompts/tools.js';
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
  clack.intro(logger.bold('create-tpmjs-tool'));

  // Step 1: Get basic package info
  const packageInfo = await promptBasicInfo();
  if (!packageInfo) {
    clack.cancel('Operation cancelled');
    process.exit(0);
  }

  // Step 2: Get tool definitions (minimum 2)
  const tools = await promptTools();
  if (!tools || tools.length < 2) {
    clack.cancel('Operation cancelled');
    process.exit(0);
  }

  // Step 3: Get category and mode
  const categoryAndMode = await promptCategoryAndMode();

  if (!categoryAndMode) {
    clack.cancel('Operation cancelled');
    process.exit(0);
  }

  packageInfo.category = categoryAndMode.category;

  // Step 4: Get output path
  const packageNameWithoutScope = packageInfo.name.split('/').pop() || packageInfo.name;
  const defaultPath = `./${packageNameWithoutScope}`;

  const outputPath = await promptOutputPath(defaultPath);
  if (!outputPath) {
    clack.cancel('Operation cancelled');
    process.exit(0);
  }

  const absoluteOutputPath = getAbsolutePath(outputPath);

  // Check if directory exists
  if (await pathExists(absoluteOutputPath)) {
    clack.log.error(`Directory already exists: ${absoluteOutputPath}`);
    clack.cancel('Operation cancelled');
    process.exit(1);
  }

  // Step 5: Confirm generation
  const confirmed = await promptConfirmation(packageInfo.name, tools.length, outputPath);
  if (!confirmed) {
    clack.cancel('Operation cancelled');
    process.exit(0);
  }

  // Step 6: Generate the package
  const spinner = clack.spinner();
  spinner.start('Generating package...');

  const config: GeneratorConfig = {
    packageInfo,
    tools,
    outputPath: absoluteOutputPath,
    mode: categoryAndMode.mode,
  };

  try {
    const result = await generatePackage(config);

    spinner.stop('Package generated successfully!');

    clack.outro(`
${logger.green('✓')} Success! Created ${logger.bold(packageInfo.name)} at ${logger.cyan(outputPath)}

   Files created:
${result.filesCreated.map((f) => `     ${f}`).join('\n')}

   Next steps:
     ${logger.cyan(`cd ${outputPath}`)}
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
    const toolPath = path.join(outputPath, 'src', 'tools', `${tool.exportName}.ts`);
    await writeFile(toolPath, generateToolFile(tool));
    filesCreated.push(`src/tools/${tool.exportName}.ts`);
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
