# @tpmjs/tools-config-normalize

Normalizes configuration objects by sorting keys, removing nulls, and cleaning empty values.

## Installation

```bash
npm install @tpmjs/tools-config-normalize
```

## Usage

```typescript
import { configNormalize } from '@tpmjs/tools-config-normalize';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: { configNormalize },
  prompt: 'Normalize this config object: ...',
});
```

## Features

- Sorts object keys alphabetically for consistent ordering
- Removes null and undefined values
- Removes empty objects and empty arrays
- Recursively processes nested structures
- Tracks all changes made during normalization
- Provides before/after key counts

## Input

- `config` (object): The configuration object to normalize
- `options` (object, optional): Normalization options
  - `sortKeys` (boolean, default: true): Sort object keys alphabetically
  - `removeNulls` (boolean, default: true): Remove null and undefined values
  - `removeEmpty` (boolean, default: true): Remove empty objects and arrays

## Output

Returns an object with:

- `normalized` (object): The normalized configuration object
- `changes` (array): List of changes made during normalization
  - `type`: 'removed' | 'sorted' | 'cleaned'
  - `path`: Path to the changed property (e.g., "database.options")
  - `reason`: Human-readable explanation
  - `oldValue`: The original value (for removals)
- `keyCount` (number): Total keys in normalized config
- `originalKeyCount` (number): Total keys in original config

## Example

```typescript
const config = {
  name: "my-app",
  version: null,
  database: {
    port: 5432,
    host: "localhost",
    options: {}
  },
  cache: {
    enabled: true,
    ttl: undefined
  },
  features: []
};

const result = await configNormalize.execute({ config });

console.log(result.normalized);
// {
//   cache: {
//     enabled: true
//   },
//   database: {
//     host: "localhost",
//     port: 5432
//   },
//   name: "my-app"
// }

console.log(result.changes);
// [
//   {
//     type: 'removed',
//     path: 'version',
//     reason: 'null value',
//     oldValue: null
//   },
//   {
//     type: 'removed',
//     path: 'database.options',
//     reason: 'empty object',
//     oldValue: {}
//   },
//   {
//     type: 'removed',
//     path: 'cache.ttl',
//     reason: 'undefined value',
//     oldValue: undefined
//   },
//   {
//     type: 'removed',
//     path: 'features',
//     reason: 'empty array',
//     oldValue: []
//   },
//   {
//     type: 'sorted',
//     path: 'root',
//     reason: 'keys sorted alphabetically'
//   }
// ]

console.log(result.keyCount); // 4
console.log(result.originalKeyCount); // 9
```

## Custom Options

```typescript
// Only sort keys, don't remove anything
const result = await configNormalize.execute({
  config,
  options: {
    sortKeys: true,
    removeNulls: false,
    removeEmpty: false
  }
});

// Remove nulls but keep empty objects/arrays
const result = await configNormalize.execute({
  config,
  options: {
    sortKeys: true,
    removeNulls: true,
    removeEmpty: false
  }
});

// Don't sort, just clean
const result = await configNormalize.execute({
  config,
  options: {
    sortKeys: false,
    removeNulls: true,
    removeEmpty: true
  }
});
```

## Use Cases

- Cleaning up generated configuration files
- Normalizing user-provided config for comparison
- Preparing config for version control (consistent key ordering)
- Removing test/debug values before deployment
- Standardizing API responses

## Change Types

- **removed**: A key was removed due to null/undefined/empty value
- **sorted**: Keys in an object were reordered alphabetically
- **cleaned**: A nested structure became empty after normalization and was removed

## License

MIT
