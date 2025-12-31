# @tpmjs/tools-yaml-parse

Parse YAML text into JavaScript objects with validation and error handling.

## Installation

```bash
npm install @tpmjs/tools-yaml-parse
```

## Usage

```typescript
import { yamlParseTool } from '@tpmjs/tools-yaml-parse';

// Use with AI SDK
const result = await yamlParseTool.execute({
  yaml: `
name: John Doe
age: 30
hobbies:
  - reading
  - coding
  - hiking
  `
});

console.log(result);
// {
//   data: { name: 'John Doe', age: 30, hobbies: ['reading', 'coding', 'hiking'] },
//   isValid: true,
//   metadata: { type: 'object', size: 3 }
// }
```

## Features

- **Validation**: Returns both parsed data and validation status
- **Error Handling**: Graceful error messages for invalid YAML
- **Metadata**: Provides type information and size of parsed data
- **Standards Compliant**: Uses `js-yaml` library for full YAML 1.2 support

## Input Schema

| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| yaml      | string | Yes      | The YAML string to parse |

## Output Schema

```typescript
interface YamlParseResult {
  data: unknown;           // The parsed JavaScript object/value
  isValid: boolean;        // Whether parsing was successful
  error?: string;          // Error message if parsing failed
  metadata?: {
    type: string;          // Type of parsed data (object, array, string, etc.)
    size: number;          // Number of keys (objects) or items (arrays)
  };
}
```

## Examples

### Parse YAML Object

```typescript
const result = await yamlParseTool.execute({
  yaml: 'name: Alice\nage: 25'
});
// { data: { name: 'Alice', age: 25 }, isValid: true, ... }
```

### Parse YAML Array

```typescript
const result = await yamlParseTool.execute({
  yaml: '- apple\n- banana\n- cherry'
});
// { data: ['apple', 'banana', 'cherry'], isValid: true, metadata: { type: 'array', size: 3 } }
```

### Handle Invalid YAML

```typescript
const result = await yamlParseTool.execute({
  yaml: 'invalid: yaml: syntax:'
});
// { data: null, isValid: false, error: 'bad indentation...' }
```

## License

MIT
