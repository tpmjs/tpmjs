import { TPMJS_CATEGORIES, TpmjsToolDefinitionSchema } from '@tpmjs/types/tpmjs';
import type { TpmjsCategory } from '@tpmjs/types/tpmjs';
import type { ToolDefinition } from '../types.js';

/**
 * Validates a tool definition against TPMJS schema
 */
export function validateToolDefinition(tool: ToolDefinition): {
  valid: boolean;
  errors?: string[];
} {
  const result = TpmjsToolDefinitionSchema.safeParse(tool);

  if (result.success) {
    return { valid: true };
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.join('.');
    return `${path}: ${issue.message}`;
  });

  return { valid: false, errors };
}

/**
 * Validates that category is one of the allowed TPMJS categories
 */
export function validateCategory(category: string): {
  valid: boolean;
  error?: string;
} {
  if (!TPMJS_CATEGORIES.includes(category as TpmjsCategory)) {
    return {
      valid: false,
      error: `Category must be one of: ${TPMJS_CATEGORIES.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validates tool description length
 */
export function validateDescription(description: string): {
  valid: boolean;
  error?: string;
} {
  if (description.length < 20) {
    return {
      valid: false,
      error: 'Description must be at least 20 characters',
    };
  }

  if (description.length > 500) {
    return {
      valid: false,
      error: 'Description must be at most 500 characters',
    };
  }

  return { valid: true };
}

/**
 * Get all available TPMJS categories
 */
export function getAvailableCategories(): readonly TpmjsCategory[] {
  return TPMJS_CATEGORIES;
}
