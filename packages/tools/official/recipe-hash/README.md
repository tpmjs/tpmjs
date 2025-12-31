# @tpmjs/tools-recipe-hash

Generates a deterministic SHA-256 hash for a recipe/workflow object.

## Features

- **Deterministic Hashing**: Same input always produces same hash
- **Key Normalization**: Automatically sorts object keys for consistency
- **SHA-256**: Industry-standard cryptographic hash algorithm
- **Size Reporting**: Returns input size in bytes
- **Fast**: Uses Node.js built-in crypto module

## Installation

```bash
npm install @tpmjs/tools-recipe-hash
```

## Usage

```typescript
import { recipeHashTool } from '@tpmjs/tools-recipe-hash';

const recipe = {
  name: 'Data Processing Pipeline',
  steps: [
    { id: 'fetch', action: 'fetchData', source: 'api.example.com' },
    { id: 'transform', action: 'processData', input: 'fetch.output' },
    { id: 'store', action: 'saveData', input: 'transform.output' }
  ],
  version: '1.0.0'
};

const result = await recipeHashTool.execute({ recipe });

console.log(result);
// {
//   hash: 'a3f5e8c9d1b2a7f4e6c8d9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
//   algorithm: 'SHA-256',
//   inputSize: 245
// }
```

## Deterministic Behavior

The tool ensures deterministic hashing by:

1. **Sorting object keys recursively**: `{ b: 1, a: 2 }` becomes `{ a: 2, b: 1 }`
2. **Consistent JSON serialization**: No whitespace, sorted keys
3. **UTF-8 encoding**: Consistent string encoding

This means these two recipes produce the **same hash**:

```typescript
const recipe1 = { name: 'test', version: '1.0' };
const recipe2 = { version: '1.0', name: 'test' }; // Different key order

const hash1 = await recipeHashTool.execute({ recipe: recipe1 });
const hash2 = await recipeHashTool.execute({ recipe: recipe2 });

console.log(hash1.hash === hash2.hash); // true
```

## Use Cases

### 1. Recipe Versioning

```typescript
// Detect if a recipe has changed
const currentHash = await recipeHashTool.execute({ recipe });

if (currentHash.hash !== storedHash) {
  console.log('Recipe has been modified!');
  // Update version, invalidate cache, etc.
}
```

### 2. Workflow Caching

```typescript
// Cache workflow results by recipe hash
const { hash } = await recipeHashTool.execute({ recipe });
const cachedResult = await cache.get(hash);

if (cachedResult) {
  return cachedResult; // Skip execution
}

const result = await executeWorkflow(recipe);
await cache.set(hash, result);
```

### 3. Change Detection

```typescript
// Track recipe changes over time
const versions = [
  { hash: 'abc123...', timestamp: '2025-01-01', version: '1.0.0' },
  { hash: 'def456...', timestamp: '2025-01-15', version: '1.1.0' },
  { hash: 'ghi789...', timestamp: '2025-02-01', version: '1.2.0' }
];

const currentHash = await recipeHashTool.execute({ recipe });
const hasChanged = !versions.some(v => v.hash === currentHash.hash);
```

### 4. Deduplication

```typescript
// Prevent duplicate recipe execution
const { hash } = await recipeHashTool.execute({ recipe });

if (await isAlreadyExecuted(hash)) {
  throw new Error('This recipe has already been executed');
}

await executeRecipe(recipe);
await markAsExecuted(hash);
```

## Input Size

The `inputSize` field returns the size in bytes of the normalized JSON:

```typescript
const result = await recipeHashTool.execute({
  recipe: {
    name: 'Small Recipe',
    steps: [1, 2, 3]
  }
});

console.log(result.inputSize); // 42 (bytes)
```

This is useful for:
- Monitoring recipe complexity
- Setting size limits
- Estimating storage requirements

## Array Support

Arrays are also supported:

```typescript
const recipeArray = [
  { step: 1, action: 'fetch' },
  { step: 2, action: 'process' },
  { step: 3, action: 'store' }
];

const result = await recipeHashTool.execute({ recipe: recipeArray });
```

## Hash Properties

- **Length**: Always 64 characters (SHA-256 hex)
- **Character set**: `0-9a-f` (hexadecimal)
- **Collision resistance**: Cryptographically secure
- **Deterministic**: Same input → same output

## Error Handling

```typescript
try {
  await recipeHashTool.execute({ recipe: null });
} catch (error) {
  console.error(error.message); // "Recipe cannot be null or undefined"
}

try {
  await recipeHashTool.execute({ recipe: "not an object" });
} catch (error) {
  console.error(error.message); // "Recipe must be an object or array"
}
```

## Performance

SHA-256 hashing is fast, even for large recipes:

- Small recipe (< 1 KB): < 1ms
- Medium recipe (< 100 KB): < 10ms
- Large recipe (< 1 MB): < 50ms

The normalization step adds minimal overhead.

## License

MIT
