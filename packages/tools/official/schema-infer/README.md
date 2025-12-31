# @tpmjs/tools-schema-infer

Infer JSON Schema from sample data.

## Installation

```bash
npm install @tpmjs/tools-schema-infer
```

## Usage

```typescript
import { schemaInferTool } from '@tpmjs/tools-schema-infer';

const samples = [
  { name: 'Alice', age: 25, email: 'alice@example.com' },
  { name: 'Bob', age: 30, email: 'bob@example.com' }
];

const result = await schemaInferTool.execute({ samples });

console.log(result.schema);
// => {
//   $schema: "http://json-schema.org/draft-04/schema#",
//   type: "object",
//   properties: {
//     name: { type: "string" },
//     age: { type: "number" },
//     email: { type: "string" }
//   }
// }

console.log(result.sampleCount);
// => 2

console.log(result.properties);
// => ["name", "age", "email"]
```

## Options

```typescript
// Mark all fields as required
const result = await schemaInferTool.execute({
  samples: [{ name: 'Alice', age: 25 }],
  options: { required: true }
});

// Disallow additional properties
const result = await schemaInferTool.execute({
  samples: [{ name: 'Alice' }],
  options: { additionalProperties: false }
});
```

## Features

- **Automatic type detection**: Infers types from sample values
- **Multiple samples**: Combine multiple samples for comprehensive schemas
- **Required fields**: Optionally mark all properties as required
- **Nested objects**: Handles nested object structures
- **Arrays**: Detects array types and item schemas
- **JSON Schema standard**: Generates standard JSON Schema Draft-04

## Use Cases

- Generate schemas from API responses
- Create validation schemas from sample data
- Document data structures automatically
- Bootstrap TypeScript types from JSON examples

## License

MIT
