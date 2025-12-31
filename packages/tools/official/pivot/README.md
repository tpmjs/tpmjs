# @tpmjs/tools-pivot

Pivot array data from row format to column format (row-to-column transformation).

## Installation

```bash
npm install @tpmjs/tools-pivot
```

## Usage

```typescript
import { pivotTool } from '@tpmjs/tools-pivot';

// Sample data: sales by region and quarter
const salesData = [
  { region: 'North', quarter: 'Q1', sales: 1000 },
  { region: 'North', quarter: 'Q2', sales: 1200 },
  { region: 'South', quarter: 'Q1', sales: 800 },
  { region: 'South', quarter: 'Q2', sales: 900 },
  { region: 'East', quarter: 'Q1', sales: 1100 },
  { region: 'East', quarter: 'Q2', sales: 1300 },
];

// Pivot the data
const result = await pivotTool.execute({
  rows: salesData,
  rowKey: 'region',     // Rows will be regions
  columnKey: 'quarter',  // Columns will be quarters
  valueKey: 'sales',     // Cell values will be sales numbers
});

console.log(result.pivoted);
// [
//   { region: 'East', Q1: 1100, Q2: 1300 },
//   { region: 'North', Q1: 1000, Q2: 1200 },
//   { region: 'South', Q1: 800, Q2: 900 },
// ]

console.log(result.columns);
// ['Q1', 'Q2']

console.log(result.metadata);
// {
//   uniqueRows: 3,
//   uniqueColumns: 2,
//   totalCells: 6,
//   nullCells: 0
// }
```

## Features

- **Row-to-column transformation**: Converts long-format data to wide-format
- **Automatic column detection**: Discovers unique column values from data
- **Null handling**: Tracks and reports missing values
- **Sorted output**: Rows and columns are sorted alphabetically
- **Metadata**: Provides statistics about the pivot operation

## Parameters

- `rows` (array, required): Array of objects to pivot
- `rowKey` (string, required): Field name to use as row identifiers
- `columnKey` (string, required): Field name whose values become column names
- `valueKey` (string, required): Field name whose values populate the cells

## Returns

```typescript
{
  pivoted: Array<Record<string, unknown>>;
  columns: string[];
  rowCount: number;
  metadata: {
    uniqueRows: number;
    uniqueColumns: number;
    totalCells: number;
    nullCells: number;
  };
}
```

## Use Cases

- Converting long-format data to wide-format for reporting
- Creating pivot tables from raw data
- Reshaping time-series data for visualization
- Preparing data for cross-tabulation analysis
- Transforming database query results for display

## Example: Time Series Data

```typescript
const temperatureData = [
  { city: 'NYC', month: 'Jan', temp: 32 },
  { city: 'NYC', month: 'Feb', temp: 35 },
  { city: 'LA', month: 'Jan', temp: 65 },
  { city: 'LA', month: 'Feb', temp: 67 },
];

const result = await pivotTool.execute({
  rows: temperatureData,
  rowKey: 'city',
  columnKey: 'month',
  valueKey: 'temp',
});

// Result:
// [
//   { city: 'LA', Jan: 65, Feb: 67 },
//   { city: 'NYC', Jan: 32, Feb: 35 },
// ]
```

## Example with AI Agent

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { pivotTool } from '@tpmjs/tools-pivot';

const result = await generateText({
  model: openai('gpt-4'),
  tools: {
    pivot: pivotTool,
  },
  prompt: 'Pivot this sales data by product and month: ...',
});
```

## Handling Missing Values

When a row/column combination doesn't exist in the input data, the pivot tool sets the cell value to `null`:

```typescript
const sparseData = [
  { product: 'A', region: 'North', sales: 100 },
  { product: 'B', region: 'South', sales: 200 },
  // Note: Product A has no South sales, Product B has no North sales
];

const result = await pivotTool.execute({
  rows: sparseData,
  rowKey: 'product',
  columnKey: 'region',
  valueKey: 'sales',
});

// Result:
// [
//   { product: 'A', North: 100, South: null },
//   { product: 'B', North: null, South: 200 },
// ]

console.log(result.metadata.nullCells); // 2
```

## License

MIT
