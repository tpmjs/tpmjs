# @tpmjs/tools-json-schema-validate

Validates JSON data against JSON Schema using the ajv validator.

## Installation

```bash
npm install @tpmjs/tools-json-schema-validate
```

## Usage

```typescript
import { jsonSchemaValidateTool } from '@tpmjs/tools-json-schema-validate';

const result = await jsonSchemaValidateTool.execute({
  data: {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  },
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      email: { type: 'string', format: 'email' },
      age: { type: 'number', minimum: 0, maximum: 120 },
    },
    required: ['name', 'email'],
    additionalProperties: false,
  },
});

console.log(result);
// {
//   valid: true,
//   errors: [],
//   errorCount: 0
// }
```

### Validation Failure Example

```typescript
const result = await jsonSchemaValidateTool.execute({
  data: {
    name: '',
    email: 'invalid-email',
    age: 150,
  },
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      email: { type: 'string', format: 'email' },
      age: { type: 'number', minimum: 0, maximum: 120 },
    },
    required: ['name', 'email'],
  },
});

console.log(result);
// {
//   valid: false,
//   errors: [
//     {
//       path: '/name',
//       message: 'String length must be >= 1',
//       keyword: 'minLength',
//       params: { limit: 1 }
//     },
//     {
//       path: '/email',
//       message: 'Invalid email format',
//       keyword: 'format',
//       params: { format: 'email' }
//     },
//     {
//       path: '/age',
//       message: 'Value must be <= 120',
//       keyword: 'maximum',
//       params: { limit: 120 }
//     }
//   ],
//   errorCount: 3
// }
```

## Parameters

- **data** (required): The JSON data to validate (any valid JSON type)
- **schema** (required): JSON Schema object defining validation rules

## Supported JSON Schema Features

- **Type validation**: string, number, integer, boolean, object, array, null
- **String validation**: minLength, maxLength, pattern, format
- **Number validation**: minimum, maximum, multipleOf
- **Object validation**: properties, required, additionalProperties
- **Array validation**: items, minItems, maxItems, uniqueItems
- **Common formats**: email, uri, date-time, date, time, ipv4, ipv6, uuid

## Output Format

Returns a `ValidationResult` object with:
- **valid**: `true` if data passes validation, `false` otherwise
- **errors**: Array of validation errors (empty if valid)
- **errorCount**: Number of validation errors

Each error includes:
- **path**: JSON pointer to the invalid field (e.g., `/user/email`)
- **message**: Human-readable error message
- **keyword**: JSON Schema keyword that failed (e.g., `required`, `type`)
- **params**: Additional error parameters

## Advanced Examples

### Validating Arrays

```typescript
const result = await jsonSchemaValidateTool.execute({
  data: [1, 2, 3, 4, 5],
  schema: {
    type: 'array',
    items: { type: 'number' },
    minItems: 1,
    maxItems: 10,
  },
});
```

### Nested Objects

```typescript
const result = await jsonSchemaValidateTool.execute({
  data: {
    user: {
      name: 'Alice',
      address: {
        city: 'New York',
        zip: '10001',
      },
    },
  },
  schema: {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          address: {
            type: 'object',
            properties: {
              city: { type: 'string' },
              zip: { type: 'string', pattern: '^[0-9]{5}$' },
            },
            required: ['city', 'zip'],
          },
        },
        required: ['name', 'address'],
      },
    },
    required: ['user'],
  },
});
```

### Enum Validation

```typescript
const result = await jsonSchemaValidateTool.execute({
  data: { status: 'active' },
  schema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['active', 'inactive', 'pending'],
      },
    },
  },
});
```

## Features

- Powered by [ajv](https://ajv.js.org/) - the fastest JSON Schema validator
- Supports JSON Schema Draft 7
- Built-in format validators (email, uri, date-time, etc.)
- Detailed error messages with path information
- Type-safe with TypeScript
- All errors collected (not just first failure)

## Error Handling

If the schema itself is invalid, the tool throws an error:

```typescript
try {
  const result = await jsonSchemaValidateTool.execute({
    data: {},
    schema: { type: 'invalid-type' }, // Invalid schema
  });
} catch (error) {
  console.error(error.message);
  // "Invalid JSON Schema: ..."
}
```

## License

MIT
