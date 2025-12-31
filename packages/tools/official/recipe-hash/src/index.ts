/**
 * Recipe Hash Tool for TPMJS
 * Generates a deterministic hash for a recipe/workflow using SHA-256.
 * Uses Node.js built-in crypto module for hashing.
 *
 * @requires Node.js 18+ (uses native crypto API)
 */

import { createHash } from 'node:crypto';
import { jsonSchema, tool } from 'ai';

/**
 * Hash result containing hash value and metadata
 */
export interface HashResult {
  hash: string;
  algorithm: string;
  inputSize: number;
}

type RecipeHashInput = {
  recipe: Record<string, unknown> | unknown[];
};

/**
 * Normalizes an object to ensure deterministic serialization
 * Sorts object keys recursively to produce consistent output
 */
function normalizeForHashing(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(normalizeForHashing);
  }

  // Handle objects
  if (typeof obj === 'object') {
    const normalized: Record<string, unknown> = {};
    const keys = Object.keys(obj as Record<string, unknown>).sort();

    for (const key of keys) {
      normalized[key] = normalizeForHashing((obj as Record<string, unknown>)[key]);
    }

    return normalized;
  }

  // Primitives return as-is
  return obj;
}

/**
 * Generates a deterministic SHA-256 hash for a recipe/workflow
 */
function generateRecipeHash(recipe: Record<string, unknown> | unknown[]): HashResult {
  // Normalize the recipe to ensure deterministic serialization
  const normalized = normalizeForHashing(recipe);

  // Convert to JSON with no whitespace for consistent hashing
  const jsonString = JSON.stringify(normalized);

  // Calculate input size in bytes
  const inputSize = Buffer.byteLength(jsonString, 'utf8');

  // Generate SHA-256 hash
  const hash = createHash('sha256').update(jsonString, 'utf8').digest('hex');

  return {
    hash,
    algorithm: 'SHA-256',
    inputSize,
  };
}

/**
 * Recipe Hash Tool
 * Generates a deterministic hash for a recipe/workflow
 */
export const recipeHashTool = tool({
  description:
    'Generates a deterministic SHA-256 hash for a recipe or workflow object. The hash is consistent across runs for identical recipes, making it useful for caching, version control, and change detection. Object keys are sorted before hashing to ensure determinism.',
  inputSchema: jsonSchema<RecipeHashInput>({
    type: 'object',
    properties: {
      recipe: {
        description:
          'Recipe or workflow object to hash. Can be any valid JSON object or array. The structure will be normalized (keys sorted) before hashing to ensure deterministic output.',
        oneOf: [
          {
            type: 'object',
            description: 'Recipe as an object with any structure',
          },
          {
            type: 'array',
            description: 'Recipe as an array',
          },
        ],
      },
    },
    required: ['recipe'],
    additionalProperties: false,
  }),
  async execute({ recipe }): Promise<HashResult> {
    // Validate input
    if (recipe === null || recipe === undefined) {
      throw new Error('Recipe cannot be null or undefined');
    }

    if (typeof recipe !== 'object') {
      throw new Error('Recipe must be an object or array');
    }

    try {
      return generateRecipeHash(recipe);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate hash: ${message}`);
    }
  },
});

export default recipeHashTool;
