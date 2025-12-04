import * as clack from '@clack/prompts';
import { getAvailableCategories } from '../validation/tool-metadata.js';

/**
 * Prompts for category and mode selection
 */
export async function promptCategoryAndMode(): Promise<{
  category: string;
  mode: 'simple' | 'advanced';
} | null> {
  const categories = getAvailableCategories();

  const category = await clack.select({
    message: 'Tool category',
    options: categories.map((cat) => ({
      value: cat,
      label: cat,
    })),
  });

  if (clack.isCancel(category)) {
    return null;
  }

  const modeResult = await clack.select({
    message: 'Generation mode',
    options: [
      {
        value: 'simple',
        label: 'Simple Mode - Basic Zod schemas (recommended)',
        hint: 'Generates simple string/number parameters with defaults',
      },
      {
        value: 'advanced',
        label: 'Advanced Mode - Full control',
        hint: 'Configure parameters, returns, env vars, and AI agent guidance',
      },
    ],
  });

  if (clack.isCancel(modeResult)) {
    return null;
  }

  const mode = modeResult as 'simple' | 'advanced';

  return {
    category: category as string,
    mode,
  };
}

/**
 * Prompts for output path
 */
export async function promptOutputPath(defaultPath: string): Promise<string | null> {
  const outputPath = await clack.text({
    message: 'Where should we create the package?',
    placeholder: defaultPath,
    initialValue: defaultPath,
    validate: (value) => {
      if (!value) return 'Output path is required';
    },
  });

  if (clack.isCancel(outputPath)) {
    return null;
  }

  return outputPath as string;
}

/**
 * Prompts for final confirmation
 */
export async function promptConfirmation(
  packageName: string,
  toolCount: number,
  outputPath: string
): Promise<boolean> {
  const confirmed = await clack.confirm({
    message: `Ready to generate ${packageName} with ${toolCount} tools at ${outputPath}?`,
    initialValue: true,
  });

  if (clack.isCancel(confirmed)) {
    return false;
  }

  return confirmed;
}
