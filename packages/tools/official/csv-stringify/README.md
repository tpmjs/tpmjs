# @tpmjs/tools-csv-stringify

Convert array of objects to CSV string using [papaparse](https://www.papaparse.com/).

## Installation

```bash
npm install @tpmjs/tools-csv-stringify
# or
pnpm add @tpmjs/tools-csv-stringify
# or
yarn add @tpmjs/tools-csv-stringify
```

## Usage

### With Vercel AI SDK

```typescript
import { csvStringifyTool } from '@tpmjs/tools-csv-stringify';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    csvStringify: csvStringifyTool,
  },
  prompt: 'Convert this data to CSV format: [{"name":"Alice","age":25},{"name":"Bob","age":30}]',
});
```

### Direct Usage

```typescript
import { csvStringifyTool } from '@tpmjs/tools-csv-stringify';

const result = await csvStringifyTool.execute({
  rows: [
    { name: 'Alice', age: 25, city: 'New York' },
    { name: 'Bob', age: 30, city: 'San Francisco' },
    { name: 'Charlie', age: 35, city: 'Boston' },
  ],
});

console.log(result.csv);
// name,age,city
// Alice,25,New York
// Bob,30,San Francisco
// Charlie,35,Boston

console.log(result);
// {
//   csv: '...',
//   rowCount: 3,
//   metadata: {
//     headers: ['name', 'age', 'city'],
//     stringifiedAt: '2025-01-15T12:00:00.000Z',
//     byteSize: 85
//   }
// }
```

## Features

- **Automatic Header Detection** - Uses object keys from first row if headers not provided
- **Custom Headers** - Optionally specify custom header names and order
- **Type Preservation** - Properly handles strings, numbers, booleans, and null values
- **Standards Compliant** - Follows RFC 4180 CSV specification
- **Byte Size Reporting** - Returns UTF-8 byte size for file writing

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `rows` | `Record<string, unknown>[]` | Yes | - | Array of objects to convert to CSV |
| `headers` | `string[]` | No | Object keys from first row | Custom header names |

## Returns

```typescript
{
  csv: string;
  rowCount: number;
  metadata: {
    headers: string[];
    stringifiedAt: string;
    byteSize: number;
  };
}
```

## Examples

### Basic Usage

```typescript
const result = await csvStringifyTool.execute({
  rows: [
    { product: 'Laptop', price: 999.99, inStock: true },
    { product: 'Mouse', price: 29.99, inStock: false },
  ],
});

console.log(result.csv);
// product,price,inStock
// Laptop,999.99,true
// Mouse,29.99,false
```

### Custom Headers

```typescript
const result = await csvStringifyTool.execute({
  rows: [
    { name: 'Alice', age: 25, city: 'NYC' },
    { name: 'Bob', age: 30, city: 'SF' },
  ],
  headers: ['name', 'city'], // Only include these columns
});

console.log(result.csv);
// name,city
// Alice,NYC
// Bob,SF
```

### Custom Header Order

```typescript
const result = await csvStringifyTool.execute({
  rows: [
    { age: 25, name: 'Alice', city: 'NYC' },
    { age: 30, name: 'Bob', city: 'SF' },
  ],
  headers: ['name', 'age', 'city'], // Specify order
});

console.log(result.csv);
// name,age,city
// Alice,25,NYC
// Bob,30,SF
```

### Handling Special Characters

```typescript
const result = await csvStringifyTool.execute({
  rows: [
    { name: 'Alice, Jr.', message: 'Hello "World"' },
    { name: 'Bob\nSmith', message: 'Line\nBreak' },
  ],
});

// Properly escapes commas, quotes, and newlines
console.log(result.csv);
// name,message
// "Alice, Jr.","Hello ""World"""
// "Bob\nSmith","Line\nBreak"
```

### Writing to File

```typescript
import { writeFile } from 'fs/promises';

const result = await csvStringifyTool.execute({
  rows: [...],
});

await writeFile('output.csv', result.csv, 'utf-8');
console.log(`Wrote ${result.metadata.byteSize} bytes to output.csv`);
```

## Error Handling

```typescript
try {
  const result = await csvStringifyTool.execute({
    rows: [],
  });
} catch (error) {
  console.error(error.message); // "Rows array cannot be empty"
}

try {
  const result = await csvStringifyTool.execute({
    rows: ['not', 'objects'], // Invalid
  });
} catch (error) {
  console.error(error.message); // "All rows must be objects"
}
```

## License

MIT
