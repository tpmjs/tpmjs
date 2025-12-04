import * as clack from '@clack/prompts';
import type { PackageInfo } from '../types.js';
import { validateNpmPackageName } from '../validation/package-name.js';

/**
 * Prompts for basic package information
 */
export async function promptBasicInfo(): Promise<PackageInfo | null> {
  const name = await clack.text({
    message: 'Package name',
    placeholder: '@myorg/content-tools',
    validate: (value) => {
      if (!value) return 'Package name is required';
      const validation = validateNpmPackageName(value);
      if (!validation.valid) {
        return validation.errors?.[0] || 'Invalid package name';
      }
    },
  });

  if (clack.isCancel(name)) {
    return null;
  }

  const description = await clack.text({
    message: 'Package description',
    placeholder: 'AI SDK tools for content processing',
    validate: (value) => {
      if (!value) return 'Description is required';
      if (value.length < 10) return 'Description must be at least 10 characters';
    },
  });

  if (clack.isCancel(description)) {
    return null;
  }

  const author = await clack.text({
    message: 'Author name',
    placeholder: 'Your Name',
    initialValue: '',
  });

  if (clack.isCancel(author)) {
    return null;
  }

  const license = await clack.select({
    message: 'License',
    options: [
      { value: 'MIT', label: 'MIT' },
      { value: 'Apache-2.0', label: 'Apache-2.0' },
      { value: 'ISC', label: 'ISC' },
      { value: 'BSD-3-Clause', label: 'BSD-3-Clause' },
    ],
    initialValue: 'MIT',
  });

  if (clack.isCancel(license)) {
    return null;
  }

  return {
    name: name as string,
    description: description as string,
    author: author as string,
    license: license as string,
    category: '', // Will be set later
  };
}
