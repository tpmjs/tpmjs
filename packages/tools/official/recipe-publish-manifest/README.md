# Recipe Publish Manifest

Create a publish manifest for recipes with metadata, versioning, and cryptographic verification.

## Installation

```bash
npm install @tpmjs/tools-recipe-publish-manifest
```

## Usage

```typescript
import { recipePublishManifestTool } from '@tpmjs/tools-recipe-publish-manifest';

const result = await recipePublishManifestTool.execute({
  recipe: {
    name: 'Deploy to Production',
    description: 'Automated production deployment workflow',
    steps: [
      { action: 'run-tests', details: 'Execute full test suite' },
      { action: 'build', details: 'Build production bundle' },
      { action: 'deploy', details: 'Deploy to production servers' }
    ]
  },
  metadata: {
    author: 'DevOps Team',
    version: '1.2.0',
    description: 'Production deployment recipe with comprehensive testing',
    license: 'MIT',
    tags: ['deployment', 'production', 'ci-cd'],
    repository: 'https://github.com/example/recipes'
  }
});

console.log(result.manifest);
// {
//   recipe: { name: 'Deploy to Production', ... },
//   metadata: {
//     author: 'DevOps Team',
//     version: '1.2.0',
//     description: '...',
//     publishedAt: '2025-01-01T00:00:00.000Z',
//     hash: 'abc123...',
//     manifestVersion: '1.0.0'
//   },
//   verification: {
//     recipeHash: 'abc123...',
//     algorithm: 'sha256'
//   }
// }

console.log(result.hash); // Full manifest hash for storage/lookup
```

## Features

- **Versioning**: Enforces semantic versioning (semver) format
- **Cryptographic Hash**: SHA-256 hash for recipe integrity verification
- **Metadata**: Comprehensive publication metadata (author, license, tags, etc.)
- **Sanitization**: Automatically removes internal/temporary fields from recipes
- **Verification**: Built-in manifest verification function

## Metadata Fields

### Required Fields

- `author` (string) - Author name or identifier
- `version` (string) - Semver version (e.g., "1.0.0", "2.1.3-beta.1")
- `description` (string) - Publication description

### Optional Fields

- `license` (string) - License identifier (e.g., "MIT", "Apache-2.0")
- `tags` (string[]) - Array of tags for categorization
- `repository` (string) - Repository URL

## Version Format

Versions must follow semantic versioning:
- `1.0.0` - Valid
- `2.1.3` - Valid
- `3.0.0-beta.1` - Valid (pre-release)
- `1.0` - Invalid (missing patch version)
- `v1.0.0` - Invalid (no 'v' prefix)

## Verification

The tool provides a `verifyManifest` function to check manifest integrity:

```typescript
import { recipePublishManifestTool, verifyManifest } from '@tpmjs/tools-recipe-publish-manifest';

const result = await recipePublishManifestTool.execute({ recipe, metadata });

// Later, verify the manifest hasn't been tampered with
const isValid = verifyManifest(result.manifest);
console.log(isValid); // true if recipe hash matches
```

## Recipe Sanitization

The tool automatically removes internal fields before publishing:
- `_internal` - Internal state
- `_temp` - Temporary data
- `_cache` - Cached values

```typescript
const recipe = {
  name: 'My Recipe',
  steps: [...],
  _internal: { debug: true }, // Will be removed
  _temp: { workingData: {} }  // Will be removed
};

const result = await recipePublishManifestTool.execute({ recipe, metadata });
// result.manifest.recipe will NOT include _internal or _temp
```

## Examples

### Minimal Recipe

```typescript
const result = await recipePublishManifestTool.execute({
  recipe: {
    name: 'Simple Backup'
  },
  metadata: {
    author: 'admin',
    version: '1.0.0',
    description: 'Basic backup procedure'
  }
});
```

### Complete Recipe with Tags

```typescript
const result = await recipePublishManifestTool.execute({
  recipe: {
    name: 'ML Model Training',
    description: 'Train and evaluate ML model',
    steps: [
      { action: 'load-data', details: 'Load training dataset' },
      { action: 'train', details: 'Train model', duration: 3600 },
      { action: 'evaluate', details: 'Evaluate on test set' },
      { action: 'save', details: 'Save model checkpoint' }
    ],
    metadata: {
      framework: 'pytorch',
      gpuRequired: true
    }
  },
  metadata: {
    author: 'ML Team',
    version: '2.0.0',
    description: 'PyTorch model training pipeline',
    license: 'Apache-2.0',
    tags: ['ml', 'training', 'pytorch'],
    repository: 'https://github.com/example/ml-recipes'
  }
});
```

### Pre-release Version

```typescript
const result = await recipePublishManifestTool.execute({
  recipe: {
    name: 'Experimental Feature'
  },
  metadata: {
    author: 'research-team',
    version: '3.0.0-alpha.1',
    description: 'Experimental feature in alpha testing'
  }
});
```

## Output Structure

```typescript
{
  manifest: {
    recipe: {
      name: 'Recipe Name',
      // ... other recipe fields (sanitized)
    },
    metadata: {
      author: 'Author Name',
      version: '1.0.0',
      description: 'Description',
      publishedAt: '2025-01-01T00:00:00.000Z',
      hash: 'abc123...', // Recipe hash
      manifestVersion: '1.0.0' // Manifest schema version
    },
    verification: {
      recipeHash: 'abc123...', // SHA-256 of recipe
      algorithm: 'sha256'
    }
  },
  hash: 'def456...', // SHA-256 of entire manifest
  publishedAt: '2025-01-01T00:00:00.000Z'
}
```

## Use Cases

- Publishing recipes to a registry
- Versioning workflow definitions
- Creating tamper-proof recipe archives
- Distributing automation scripts
- Recipe marketplace/sharing platforms
- Audit trails for production deployments

## Security

The SHA-256 hash provides:
- **Integrity verification** - Detect any modifications to the recipe
- **Content addressing** - Use hash as unique identifier
- **Tamper detection** - Verify recipe hasn't been altered

Note: This is not a digital signature. For authentication, combine with signing mechanisms.

## License

MIT
