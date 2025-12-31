# @tpmjs/tools-rows-sort

Sort an array of objects by one or more fields with support for ascending and descending order.

## Features

- **Multi-level sorting**: Sort by multiple fields with priority order
- **Flexible directions**: Choose ascending or descending for each field
- **Nested field support**: Use dot notation to sort by nested properties
- **Smart comparisons**: Type-aware sorting for numbers, strings, dates, and booleans
- **Locale-aware**: String sorting uses natural language comparison with numeric awareness

## Installation

```bash
npm install @tpmjs/tools-rows-sort ai
```

## Usage

```typescript
import { rowsSortTool } from '@tpmjs/tools-rows-sort';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    rowsSort: rowsSortTool,
  },
  prompt: 'Sort the users by age descending, then by name ascending',
});
```

## Parameters

- `rows` (array, required): Array of objects to sort
- `sortBy` (array, required): Array of sort specifications, each containing:
  - `field` (string, required): Field name to sort by (supports dot notation)
  - `direction` (string, required): Sort direction - `asc` or `desc`

## Returns

```typescript
{
  rows: Record<string, unknown>[],  // Sorted array
  sortedBy: SortSpec[]               // Sort criteria that was applied
}
```

## Examples

### Single field sort

```typescript
const data = [
  { name: 'Charlie', age: 35 },
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
];

// Returns: [Bob(25), Alice(30), Charlie(35)]
await rowsSortTool.execute({
  rows: data,
  sortBy: [{ field: 'age', direction: 'asc' }],
});
```

### Multi-level sort

```typescript
const products = [
  { name: 'Laptop', category: 'electronics', price: 999 },
  { name: 'Phone', category: 'electronics', price: 699 },
  { name: 'Desk', category: 'furniture', price: 299 },
  { name: 'Chair', category: 'furniture', price: 199 },
];

// Sort by category (asc), then price (desc) within each category
// Returns: [Phone(699), Laptop(999), Desk(299), Chair(199)]
await rowsSortTool.execute({
  rows: products,
  sortBy: [
    { field: 'category', direction: 'asc' },
    { field: 'price', direction: 'desc' },
  ],
});
```

### Sort by nested field

```typescript
const orders = [
  { id: 1, customer: { name: 'Charlie', tier: 'basic' } },
  { id: 2, customer: { name: 'Alice', tier: 'premium' } },
  { id: 3, customer: { name: 'Bob', tier: 'premium' } },
];

// Sort by tier (desc), then customer name (asc)
// Returns: [Alice(premium), Bob(premium), Charlie(basic)]
await rowsSortTool.execute({
  rows: orders,
  sortBy: [
    { field: 'customer.tier', direction: 'desc' },
    { field: 'customer.name', direction: 'asc' },
  ],
});
```

### Natural language sorting

```typescript
const files = [
  { name: 'file10.txt', size: 1024 },
  { name: 'file2.txt', size: 512 },
  { name: 'file1.txt', size: 256 },
];

// Natural sort handles numbers in strings correctly
// Returns: [file1.txt, file2.txt, file10.txt]
await rowsSortTool.execute({
  rows: files,
  sortBy: [{ field: 'name', direction: 'asc' }],
});
```

## Type Handling

The tool intelligently compares values based on their types:

- **Numbers**: Numeric comparison
- **Strings**: Locale-aware comparison with numeric awareness
- **Booleans**: false < true
- **Dates**: Chronological comparison
- **null/undefined**: Sorts before all other values
- **Mixed types**: Converted to strings for comparison

## License

MIT
