# @tpmjs/tools-rows-join

Joins two arrays of objects by key fields, supporting inner, left, right, and full outer joins.

## Installation

```bash
npm install @tpmjs/tools-rows-join
```

## Usage

```typescript
import { rowsJoinTool } from '@tpmjs/tools-rows-join';

const result = await rowsJoinTool.execute({
  left: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ],
  right: [
    { userId: 1, score: 95 },
    { userId: 2, score: 87 },
    { userId: 4, score: 92 },
  ],
  leftKey: 'id',
  rightKey: 'userId',
  type: 'left',
});

console.log(result);
// {
//   rows: [
//     { joinKey: 1, left_id: 1, left_name: 'Alice', right_userId: 1, right_score: 95 },
//     { joinKey: 2, left_id: 2, left_name: 'Bob', right_userId: 2, right_score: 87 },
//     { joinKey: 3, left_id: 3, left_name: 'Charlie' }
//   ],
//   matchedCount: 2,
//   unmatchedLeft: 1,
//   unmatchedRight: 0
// }
```

## Parameters

- **left** (required): Left array of objects to join
- **right** (required): Right array of objects to join
- **leftKey** (required): Field name in left array to join on (supports dot notation)
- **rightKey** (required): Field name in right array to join on (supports dot notation)
- **type** (optional): Join type, defaults to `'inner'`
  - `'inner'`: Only return rows that match in both arrays
  - `'left'`: Return all rows from left array, with matches from right
  - `'right'`: Return all rows from right array, with matches from left
  - `'full'`: Return all rows from both arrays

## Output Format

The joined rows have fields prefixed to avoid collisions:
- Left array fields are prefixed with `left_`
- Right array fields are prefixed with `right_`
- `joinKey` field contains the matched key value

## Features

- Supports nested field access with dot notation
- Handles one-to-many relationships (cartesian product for multiple matches)
- Type-safe with TypeScript
- Returns match statistics for analysis

## Examples

### Inner Join (Only Matches)

```typescript
const result = await rowsJoinTool.execute({
  left: [{ id: 1 }, { id: 2 }],
  right: [{ id: 1 }],
  leftKey: 'id',
  rightKey: 'id',
  type: 'inner',
});
// Returns only the row with id: 1
```

### Full Outer Join (All Rows)

```typescript
const result = await rowsJoinTool.execute({
  left: [{ id: 1 }, { id: 2 }],
  right: [{ id: 2 }, { id: 3 }],
  leftKey: 'id',
  rightKey: 'id',
  type: 'full',
});
// Returns rows for id: 1, 2, and 3
```

## License

MIT
