# @tpmjs/tools-csv-parse

Parse CSV text into array of objects using [papaparse](https://www.papaparse.com/).

## Installation

```bash
npm install @tpmjs/tools-csv-parse
# or
pnpm add @tpmjs/tools-csv-parse
# or
yarn add @tpmjs/tools-csv-parse
```

## Usage

### With Vercel AI SDK

```typescript
import { csvParseTool } from '@tpmjs/tools-csv-parse';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    csvParse: csvParseTool,
  },
  prompt: 'Parse this CSV data and tell me the average age: name,age\nAlice,25\nBob,30\nCharlie,35',
});
```

### Direct Usage

```typescript
import { csvParseTool } from '@tpmjs/tools-csv-parse';

const result = await csvParseTool.execute({
  csv: `name,age,city
Alice,25,New York
Bob,30,San Francisco
Charlie,35,Boston`,
  hasHeaders: true,
});

console.log(result);
// {
//   rows: [
//     { name: 'Alice', age: 25, city: 'New York' },
//     { name: 'Bob', age: 30, city: 'San Francisco' },
//     { name: 'Charlie', age: 35, city: 'Boston' }
//   ],
//   headers: ['name', 'age', 'city'],
//   rowCount: 3,
//   metadata: {
//     parsedAt: '2025-01-15T12:00:00.000Z',
//     hasErrors: false,
//     errorCount: 0
//   }
// }
```

## Features

- **Automatic Type Inference** - Numbers and booleans are automatically converted
- **Header Detection** - Automatically uses first row as headers or generates generic ones
- **Error Handling** - Reports parsing errors with row numbers
- **Data Cleaning** - Trims whitespace from headers and values
- **Empty Line Handling** - Automatically skips empty lines

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `csv` | `string` | Yes | - | The CSV text to parse |
| `hasHeaders` | `boolean` | No | `true` | Whether the first row contains headers |

## Returns

```typescript
{
  rows: Record<string, string | number | boolean | null>[];
  headers: string[];
  rowCount: number;
  metadata: {
    parsedAt: string;
    hasErrors: boolean;
    errorCount: number;
    errors?: Array<{
      row: number;
      message: string;
    }>;
  };
}
```

## Examples

### CSV with Headers

```typescript
const result = await csvParseTool.execute({
  csv: 'product,price,inStock\nLaptop,999.99,true\nMouse,29.99,false',
});
// rows: [
//   { product: 'Laptop', price: 999.99, inStock: true },
//   { product: 'Mouse', price: 29.99, inStock: false }
// ]
```

### CSV without Headers

```typescript
const result = await csvParseTool.execute({
  csv: 'Alice,25,Engineer\nBob,30,Designer',
  hasHeaders: false,
});
// rows: [
//   { col_0: 'Alice', col_1: 25, col_2: 'Engineer' },
//   { col_0: 'Bob', col_1: 30, col_2: 'Designer' }
// ]
```

### Handling Errors

```typescript
const result = await csvParseTool.execute({
  csv: 'name,age\nAlice,25\nBob,invalid\nCharlie,35',
});
// metadata.hasErrors: true
// metadata.errors: [{ row: 1, message: '...' }]
```

## License

MIT
