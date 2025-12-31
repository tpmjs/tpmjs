# @tpmjs/tools-rows-group-aggregate

Groups rows by a key field and aggregates values using operations like sum, count, avg, min, max.

## Installation

```bash
npm install @tpmjs/tools-rows-group-aggregate
```

## Usage

```typescript
import { rowsGroupAggregateTool } from '@tpmjs/tools-rows-group-aggregate';

const result = await rowsGroupAggregateTool.execute({
  rows: [
    { category: 'A', value: 10, price: 5.5 },
    { category: 'A', value: 20, price: 6.0 },
    { category: 'B', value: 30, price: 7.5 },
    { category: 'B', value: 40, price: 8.0 },
  ],
  groupBy: 'category',
  aggregates: [
    { field: 'value', operation: 'sum' },
    { field: 'value', operation: 'avg' },
    { field: 'price', operation: 'max' },
    { field: 'price', operation: 'min' },
  ],
});

console.log(result);
// {
//   groups: [
//     {
//       groupKey: 'A',
//       aggregates: {
//         value_sum: 30,
//         value_avg: 15,
//         price_max: 6.0,
//         price_min: 5.5
//       },
//       rowCount: 2
//     },
//     {
//       groupKey: 'B',
//       aggregates: {
//         value_sum: 70,
//         value_avg: 35,
//         price_max: 8.0,
//         price_min: 7.5
//       },
//       rowCount: 2
//     }
//   ],
//   groupCount: 2
// }
```

## Parameters

- **rows** (required): Array of objects to group and aggregate
- **groupBy** (required): Field name to group by (supports nested fields with dot notation like `user.id`)
- **aggregates** (required): Array of aggregation operations, each with:
  - **field**: Field name to aggregate
  - **operation**: One of `sum`, `count`, `avg`, `min`, `max`

## Aggregation Operations

- **sum**: Total of all numeric values
- **count**: Number of rows in the group
- **avg**: Average of numeric values
- **min**: Minimum numeric value
- **max**: Maximum numeric value

## Features

- Supports nested field access with dot notation
- Handles null/undefined values gracefully
- Multiple aggregations per group
- Type-safe with TypeScript

## License

MIT
