# @tpmjs/tools-rows-filter

Filter an array of objects by comparing field values against target values using various comparison operators.

## Features

- **Multiple operators**: eq, ne, gt, lt, gte, lte, contains
- **Nested field support**: Use dot notation to access nested properties (e.g., `user.name`)
- **Type-aware comparisons**: Handles numbers, strings, and arrays appropriately
- **Case-insensitive contains**: String matching is case-insensitive for contains operator
- **Match statistics**: Returns count of matches and total rows

## Installation

```bash
npm install @tpmjs/tools-rows-filter ai
```

## Usage

```typescript
import { rowsFilterTool } from '@tpmjs/tools-rows-filter';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    rowsFilter: rowsFilterTool,
  },
  prompt: 'Filter the users to show only those over 25 years old',
});
```

## Parameters

- `rows` (array, required): Array of objects to filter
- `field` (string, required): Field name to filter on (supports dot notation)
- `operator` (string, required): Comparison operator to use
  - `eq`: equals
  - `ne`: not equals
  - `gt`: greater than (numbers/strings)
  - `lt`: less than (numbers/strings)
  - `gte`: greater than or equal (numbers/strings)
  - `lte`: less than or equal (numbers/strings)
  - `contains`: substring match (case-insensitive) or array contains
- `value` (any, required): Value to compare against

## Returns

```typescript
{
  rows: Record<string, unknown>[],  // Filtered array
  matchCount: number,                // Number of matching rows
  totalCount: number                 // Total number of input rows
}
```

## Examples

### Filter by numeric comparison

```typescript
const data = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
  { name: 'Charlie', age: 35 },
];

// Returns: { rows: [Alice, Charlie], matchCount: 2, totalCount: 3 }
await rowsFilterTool.execute({
  rows: data,
  field: 'age',
  operator: 'gte',
  value: 30,
});
```

### Filter by string equality

```typescript
const products = [
  { name: 'Laptop', category: 'electronics' },
  { name: 'Desk', category: 'furniture' },
  { name: 'Phone', category: 'electronics' },
];

// Returns: { rows: [Laptop, Phone], matchCount: 2, totalCount: 3 }
await rowsFilterTool.execute({
  rows: products,
  field: 'category',
  operator: 'eq',
  value: 'electronics',
});
```

### Filter by substring contains

```typescript
const users = [
  { email: 'alice@example.com' },
  { email: 'bob@gmail.com' },
  { email: 'charlie@example.com' },
];

// Returns: { rows: [alice, charlie], matchCount: 2, totalCount: 3 }
await rowsFilterTool.execute({
  rows: users,
  field: 'email',
  operator: 'contains',
  value: 'example',
});
```

### Filter by nested field

```typescript
const orders = [
  { id: 1, customer: { name: 'Alice', tier: 'premium' } },
  { id: 2, customer: { name: 'Bob', tier: 'basic' } },
  { id: 3, customer: { name: 'Charlie', tier: 'premium' } },
];

// Returns: { rows: [order1, order3], matchCount: 2, totalCount: 3 }
await rowsFilterTool.execute({
  rows: orders,
  field: 'customer.tier',
  operator: 'eq',
  value: 'premium',
});
```

## License

MIT
