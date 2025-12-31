# @tpmjs/tools-dedupe-by-key

Remove duplicate objects from an array based on one or more key fields.

## Features

- **Single or composite keys**: Dedupe by one field or multiple fields combined
- **Keep first or last**: Choose which occurrence to preserve
- **Nested field support**: Use dot notation to access nested properties
- **Detailed statistics**: Returns count of duplicates removed and unique rows
- **Type-safe**: Handles various data types in key fields (strings, numbers, objects)

## Installation

```bash
npm install @tpmjs/tools-dedupe-by-key ai
```

## Usage

```typescript
import { dedupeByKeyTool } from '@tpmjs/tools-dedupe-by-key';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    dedupeByKey: dedupeByKeyTool,
  },
  prompt: 'Remove duplicate users by email address',
});
```

## Parameters

- `rows` (array, required): Array of objects to deduplicate
- `key` (string | string[], required): Field name(s) to use as unique key
  - Single field: `"email"`
  - Multiple fields: `["firstName", "lastName"]`
  - Nested fields: `"user.email"` or `["user.id", "account.type"]`
- `keepLast` (boolean, optional): If true, keeps last occurrence; if false (default), keeps first

## Returns

```typescript
{
  rows: Record<string, unknown>[],  // Deduplicated array
  duplicatesRemoved: number,         // Number of duplicates removed
  originalCount: number,             // Original array length
  uniqueCount: number               // Deduplicated array length
}
```

## Examples

### Simple deduplication by single field

```typescript
const users = [
  { id: 1, email: 'alice@example.com', name: 'Alice' },
  { id: 2, email: 'bob@example.com', name: 'Bob' },
  { id: 3, email: 'alice@example.com', name: 'Alice Updated' },
];

// Keep first occurrence (default)
// Returns: { rows: [Alice, Bob], duplicatesRemoved: 1, ... }
await dedupeByKeyTool.execute({
  rows: users,
  key: 'email',
});

// Keep last occurrence
// Returns: { rows: [Bob, Alice Updated], duplicatesRemoved: 1, ... }
await dedupeByKeyTool.execute({
  rows: users,
  key: 'email',
  keepLast: true,
});
```

### Composite key (multiple fields)

```typescript
const events = [
  { userId: 1, action: 'login', timestamp: '2024-01-01T10:00:00Z' },
  { userId: 1, action: 'login', timestamp: '2024-01-01T10:05:00Z' },
  { userId: 1, action: 'logout', timestamp: '2024-01-01T11:00:00Z' },
  { userId: 2, action: 'login', timestamp: '2024-01-01T10:00:00Z' },
];

// Dedupe by userId AND action
// Returns: { rows: [user1-login, user1-logout, user2-login], duplicatesRemoved: 1, ... }
await dedupeByKeyTool.execute({
  rows: events,
  key: ['userId', 'action'],
});
```

### Nested field deduplication

```typescript
const orders = [
  { id: 1, customer: { email: 'alice@example.com' }, total: 100 },
  { id: 2, customer: { email: 'bob@example.com' }, total: 200 },
  { id: 3, customer: { email: 'alice@example.com' }, total: 150 },
];

// Dedupe by nested field
// Returns: { rows: [order1, order2], duplicatesRemoved: 1, ... }
await dedupeByKeyTool.execute({
  rows: orders,
  key: 'customer.email',
});
```

### Keep last occurrence use case

```typescript
const stockPrices = [
  { symbol: 'AAPL', price: 150.0, timestamp: '2024-01-01T09:00:00Z' },
  { symbol: 'GOOGL', price: 140.0, timestamp: '2024-01-01T09:00:00Z' },
  { symbol: 'AAPL', price: 152.0, timestamp: '2024-01-01T10:00:00Z' },
  { symbol: 'AAPL', price: 151.0, timestamp: '2024-01-01T11:00:00Z' },
];

// Get most recent price for each symbol
// Returns: { rows: [GOOGL@140, AAPL@151], duplicatesRemoved: 2, ... }
await dedupeByKeyTool.execute({
  rows: stockPrices,
  key: 'symbol',
  keepLast: true,
});
```

## Use Cases

- **User deduplication**: Remove duplicate user records by email or ID
- **Event deduplication**: Eliminate duplicate events in logs
- **Data merging**: Keep latest version when merging datasets
- **Cache invalidation**: Ensure unique cache keys
- **Form submissions**: Remove duplicate form entries

## Handling Edge Cases

- **null/undefined values**: Treated as distinct values in keys
- **Objects in key fields**: Converted to JSON strings for comparison
- **Missing fields**: Treated as undefined in the key
- **Empty arrays**: Returns empty result with zero duplicates removed

## License

MIT
