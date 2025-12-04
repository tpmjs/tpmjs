import validatePackageName from 'validate-npm-package-name';

export interface PackageNameValidation {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Validates an npm package name
 */
export function validateNpmPackageName(name: string): PackageNameValidation {
  const result = validatePackageName(name);

  if (result.validForNewPackages) {
    return {
      valid: true,
      warnings: result.warnings,
    };
  }

  return {
    valid: false,
    errors: result.errors,
    warnings: result.warnings,
  };
}

/**
 * Validates that export name is a valid JavaScript identifier
 */
export function validateExportName(name: string): { valid: boolean; error?: string } {
  if (!name || name.length === 0) {
    return { valid: false, error: 'Export name cannot be empty' };
  }

  // JavaScript identifier regex: must start with letter, $, or _, followed by letters, digits, $, or _
  const identifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

  if (!identifierRegex.test(name)) {
    return {
      valid: false,
      error: 'Export name must be a valid JavaScript identifier (e.g., myTool, summarizeText)',
    };
  }

  // Check for reserved words
  const reservedWords = [
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'export',
    'extends',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'new',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield',
  ];

  if (reservedWords.includes(name)) {
    return { valid: false, error: `"${name}" is a reserved JavaScript keyword` };
  }

  return { valid: true };
}
