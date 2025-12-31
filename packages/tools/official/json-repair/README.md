# @tpmjs/tools-json-repair

Attempt to repair malformed JSON using [jsonrepair](https://github.com/josdejong/jsonrepair).

## Installation

```bash
npm install @tpmjs/tools-json-repair
# or
pnpm add @tpmjs/tools-json-repair
# or
yarn add @tpmjs/tools-json-repair
```

## Usage

### With Vercel AI SDK

```typescript
import { jsonRepairTool } from '@tpmjs/tools-json-repair';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    jsonRepair: jsonRepairTool,
  },
  prompt: 'Fix this JSON: {name: "Alice", age: 25,}',
});
```

### Direct Usage

```typescript
import { jsonRepairTool } from '@tpmjs/tools-json-repair';

const result = await jsonRepairTool.execute({
  json: "{name: 'Alice', age: 25,}",
});

console.log(result.repaired);
// {"name":"Alice","age":25}

console.log(result);
// {
//   repaired: '{"name":"Alice","age":25}',
//   wasModified: true,
//   changes: [
//     'Converted single quotes to double quotes',
//     'Added quotes to unquoted keys',
//     'Removed trailing commas'
//   ],
//   metadata: {
//     repairedAt: '2025-01-15T12:00:00.000Z',
//     originalLength: 27,
//     repairedLength: 26,
//     isValidJson: true
//   }
// }
```

## Features

- **Unquoted Keys** - Adds quotes to object keys
- **Single Quotes** - Converts single quotes to double quotes
- **Trailing Commas** - Removes trailing commas
- **Missing Commas** - Adds missing commas between elements
- **Unclosed Brackets** - Adds missing closing brackets/braces
- **Comments** - Removes single-line and multi-line comments
- **Escape Sequences** - Fixes invalid escape sequences
- **Change Tracking** - Reports what modifications were made

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `json` | `string` | Yes | The malformed JSON string to repair |

## Returns

```typescript
{
  repaired: string;
  wasModified: boolean;
  changes: string[];
  metadata: {
    repairedAt: string;
    originalLength: number;
    repairedLength: number;
    isValidJson: boolean;
  };
}
```

## Examples

### Fix Unquoted Keys

```typescript
const result = await jsonRepairTool.execute({
  json: '{name: "Alice", age: 25}',
});

console.log(result.repaired);
// {"name":"Alice","age":25}

console.log(result.changes);
// ['Added quotes to unquoted keys']
```

### Fix Single Quotes

```typescript
const result = await jsonRepairTool.execute({
  json: "{'name': 'Alice', 'age': 25}",
});

console.log(result.repaired);
// {"name":"Alice","age":25}

console.log(result.changes);
// ['Converted single quotes to double quotes', 'Added quotes to unquoted keys']
```

### Fix Trailing Commas

```typescript
const result = await jsonRepairTool.execute({
  json: '{"items": [1, 2, 3,], "count": 3,}',
});

console.log(result.repaired);
// {"items":[1,2,3],"count":3}

console.log(result.changes);
// ['Removed trailing commas']
```

### Fix Missing Closing Brackets

```typescript
const result = await jsonRepairTool.execute({
  json: '{"users": [{"name": "Alice"}, {"name": "Bob"}',
});

console.log(result.repaired);
// {"users":[{"name":"Alice"},{"name":"Bob"}]}

console.log(result.changes);
// ['Added missing closing bracket']
```

### Fix Comments

```typescript
const result = await jsonRepairTool.execute({
  json: `{
    // User data
    "name": "Alice",
    "age": 25 /* current age */
  }`,
});

console.log(result.repaired);
// {"name":"Alice","age":25}

console.log(result.changes);
// ['Removed comments']
```

### Already Valid JSON

```typescript
const result = await jsonRepairTool.execute({
  json: '{"name":"Alice","age":25}',
});

console.log(result.wasModified);
// false

console.log(result.changes);
// []
```

### Error Handling

```typescript
try {
  const result = await jsonRepairTool.execute({
    json: 'This is not even close to JSON',
  });
} catch (error) {
  console.error(error.message);
  // "Failed to repair JSON: ... The input may be too malformed to fix."
}
```

### Using Repaired JSON

```typescript
const result = await jsonRepairTool.execute({
  json: "{name: 'Alice', age: 25}",
});

if (result.metadata.isValidJson) {
  const parsed = JSON.parse(result.repaired);
  console.log(parsed.name); // "Alice"
  console.log(parsed.age);  // 25
}
```

## Common Issues Fixed

| Issue | Before | After |
|-------|--------|-------|
| Unquoted keys | `{name: "Alice"}` | `{"name":"Alice"}` |
| Single quotes | `{'name': 'Alice'}` | `{"name":"Alice"}` |
| Trailing commas | `{"age": 25,}` | `{"age":25}` |
| Missing commas | `{"a": 1 "b": 2}` | `{"a":1,"b":2}` |
| Unclosed brackets | `{"items": [1, 2}` | `{"items":[1,2]}` |
| Comments | `{/* comment */ "a": 1}` | `{"a":1}` |

## Limitations

- Cannot repair fundamentally invalid structures
- May not preserve original formatting (whitespace, indentation)
- Very corrupted JSON may still fail to repair
- Does not validate semantic correctness of the JSON content

## License

MIT
