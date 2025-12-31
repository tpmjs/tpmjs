# @tpmjs/tools-yaml-stringify

Convert JavaScript objects to YAML strings with formatting options.

## Installation

```bash
npm install @tpmjs/tools-yaml-stringify
```

## Usage

```typescript
import { yamlStringifyTool } from '@tpmjs/tools-yaml-stringify';

// Use with AI SDK
const result = await yamlStringifyTool.execute({
  data: {
    name: 'John Doe',
    age: 30,
    hobbies: ['reading', 'coding', 'hiking']
  },
  indent: 2
});

console.log(result.yaml);
// name: John Doe
// age: 30
// hobbies:
//   - reading
//   - coding
//   - hiking
```

## Features

- **Configurable Indentation**: Control spacing with indent parameter (1-8 spaces)
- **Metadata**: Returns line count, character count, and indent level
- **Type Support**: Handles objects, arrays, strings, numbers, booleans, and null
- **Standards Compliant**: Uses `js-yaml` library for YAML 1.2 output
- **Clean Output**: No anchors/references, preserves key order

## Input Schema

| Parameter | Type   | Required | Description                              |
|-----------|--------|----------|------------------------------------------|
| data      | any    | Yes      | The JavaScript data to convert to YAML   |
| indent    | number | No       | Spaces for indentation (default: 2, range: 1-8) |

## Output Schema

```typescript
interface YamlStringifyResult {
  yaml: string;           // The YAML string output
  metadata: {
    lines: number;        // Number of lines in the output
    characters: number;   // Total character count
    indent: number;       // Indentation level used
  };
}
```

## Examples

### Stringify Object with Default Indent

```typescript
const result = await yamlStringifyTool.execute({
  data: { name: 'Alice', role: 'Developer' }
});
console.log(result.yaml);
// name: Alice
// role: Developer
```

### Stringify Array with Custom Indent

```typescript
const result = await yamlStringifyTool.execute({
  data: ['apple', 'banana', 'cherry'],
  indent: 4
});
console.log(result.yaml);
// -    apple
// -    banana
// -    cherry
```

### Stringify Nested Object

```typescript
const result = await yamlStringifyTool.execute({
  data: {
    server: {
      host: 'localhost',
      port: 8080,
      options: {
        ssl: true,
        timeout: 3000
      }
    }
  }
});
console.log(result.yaml);
// server:
//   host: localhost
//   port: 8080
//   options:
//     ssl: true
//     timeout: 3000
```

### Get Metadata

```typescript
const result = await yamlStringifyTool.execute({
  data: { config: { debug: true } }
});
console.log(result.metadata);
// { lines: 2, characters: 25, indent: 2 }
```

## License

MIT
