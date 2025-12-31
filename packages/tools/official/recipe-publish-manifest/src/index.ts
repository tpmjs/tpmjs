/**
 * Recipe Publish Manifest Tool for TPMJS
 * Creates a publish manifest for recipes with metadata and verification hash
 *
 * @requires Node.js 18+
 */

import { createHash } from 'node:crypto';
import { jsonSchema, tool } from 'ai';

/**
 * Recipe structure (flexible)
 */
export interface Recipe {
  name: string;
  description?: string;
  steps?: Array<{
    action: string;
    details?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

/**
 * Publication metadata
 */
export interface PublicationMetadata {
  author: string;
  version: string;
  description: string;
  license?: string;
  tags?: string[];
  repository?: string;
}

/**
 * Complete manifest structure
 */
export interface Manifest {
  recipe: Recipe;
  metadata: PublicationMetadata & {
    publishedAt: string;
    hash: string;
    manifestVersion: string;
  };
  verification: {
    recipeHash: string;
    algorithm: string;
  };
}

/**
 * Output interface for manifest generation
 */
export interface PublishManifestResult {
  manifest: Manifest;
  hash: string;
  publishedAt: string;
}

type PublishManifestInput = {
  recipe: Recipe;
  metadata: PublicationMetadata;
};

/**
 * Validates recipe structure
 */
function validateRecipe(recipe: Recipe): void {
  if (!recipe || typeof recipe !== 'object') {
    throw new Error('Recipe must be an object');
  }

  if (!recipe.name || typeof recipe.name !== 'string') {
    throw new Error('Recipe must have a name string');
  }

  if (recipe.name.trim().length === 0) {
    throw new Error('Recipe name cannot be empty');
  }
}

/**
 * Validates publication metadata
 */
function validateMetadata(metadata: PublicationMetadata): void {
  if (!metadata || typeof metadata !== 'object') {
    throw new Error('Metadata must be an object');
  }

  if (!metadata.author || typeof metadata.author !== 'string') {
    throw new Error('Metadata must include author string');
  }

  if (!metadata.version || typeof metadata.version !== 'string') {
    throw new Error('Metadata must include version string');
  }

  if (!metadata.description || typeof metadata.description !== 'string') {
    throw new Error('Metadata must include description string');
  }

  // Validate version format (semver-like)
  const versionPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
  if (!versionPattern.test(metadata.version)) {
    throw new Error('Version must follow semver format (e.g., "1.0.0", "2.1.3-beta.1")');
  }
}

/**
 * Creates a SHA-256 hash of content
 */
function createContentHash(content: any): string {
  const json = JSON.stringify(content, null, 0);
  return createHash('sha256').update(json).digest('hex');
}

/**
 * Sanitizes recipe for manifest (removes internal/temporary fields)
 */
function sanitizeRecipe(recipe: Recipe): Recipe {
  const sanitized = { ...recipe };

  // Remove internal fields that shouldn't be published
  sanitized._internal = undefined;
  sanitized._temp = undefined;
  sanitized._cache = undefined;

  return sanitized;
}

/**
 * Creates a publish manifest for a recipe
 */
function createPublishManifest(recipe: Recipe, metadata: PublicationMetadata): Manifest {
  const publishedAt = new Date().toISOString();
  const sanitizedRecipe = sanitizeRecipe(recipe);
  const recipeHash = createContentHash(sanitizedRecipe);

  const manifest: Manifest = {
    recipe: sanitizedRecipe,
    metadata: {
      ...metadata,
      publishedAt,
      hash: recipeHash,
      manifestVersion: '1.0.0',
    },
    verification: {
      recipeHash,
      algorithm: 'sha256',
    },
  };

  return manifest;
}

/**
 * Verifies manifest integrity
 */
export function verifyManifest(manifest: Manifest): boolean {
  const recipeHash = createContentHash(manifest.recipe);
  return recipeHash === manifest.verification.recipeHash;
}

/**
 * Recipe Publish Manifest Tool
 * Creates a publish manifest for recipes with metadata and verification
 */
export const recipePublishManifestTool = tool({
  description:
    'Create a publish manifest for a recipe with author metadata, versioning, and cryptographic hash for verification. The manifest includes the recipe, publication metadata, and a SHA-256 hash for integrity verification.',
  inputSchema: jsonSchema<PublishManifestInput>({
    type: 'object',
    properties: {
      recipe: {
        type: 'object',
        description: 'Recipe object to publish (must include a name)',
        properties: {
          name: {
            type: 'string',
            description: 'Recipe name (required)',
          },
          description: {
            type: 'string',
            description: 'Optional recipe description',
          },
          steps: {
            type: 'array',
            description: 'Optional array of recipe steps',
            items: {
              type: 'object',
            },
          },
        },
        required: ['name'],
        additionalProperties: true,
      },
      metadata: {
        type: 'object',
        description: 'Publication metadata',
        properties: {
          author: {
            type: 'string',
            description: 'Author name or identifier (required)',
          },
          version: {
            type: 'string',
            description: 'Semver version (e.g., "1.0.0") (required)',
          },
          description: {
            type: 'string',
            description: 'Publication description (required)',
          },
          license: {
            type: 'string',
            description: 'Optional license identifier (e.g., "MIT", "Apache-2.0")',
          },
          tags: {
            type: 'array',
            description: 'Optional array of tags',
            items: {
              type: 'string',
            },
          },
          repository: {
            type: 'string',
            description: 'Optional repository URL',
          },
        },
        required: ['author', 'version', 'description'],
        additionalProperties: true,
      },
    },
    required: ['recipe', 'metadata'],
    additionalProperties: false,
  }),
  async execute({ recipe, metadata }): Promise<PublishManifestResult> {
    // Validate inputs
    validateRecipe(recipe);
    validateMetadata(metadata);

    // Create the manifest
    const manifest = createPublishManifest(recipe, metadata);

    // Generate overall manifest hash
    const manifestHash = createContentHash(manifest);

    return {
      manifest,
      hash: manifestHash,
      publishedAt: manifest.metadata.publishedAt,
    };
  },
});

export default recipePublishManifestTool;
