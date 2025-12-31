# @tpmjs/tools-table-extract

Extract HTML tables from web pages and convert them to structured data.

## Installation

```bash
npm install @tpmjs/tools-table-extract
```

## Usage

```typescript
import { tableExtractTool } from '@tpmjs/tools-table-extract';

// Extract all tables from a page
const result = await tableExtractTool.execute({
  url: 'https://example.com/data'
});

console.log(result);
// {
//   url: 'https://example.com/data',
//   tables: [
//     {
//       headers: ['Name', 'Price', 'Stock'],
//       rows: [
//         { name: 'Widget', price: '$10', stock: '50' },
//         { name: 'Gadget', price: '$20', stock: '30' }
//       ],
//       rowCount: 2,
//       columnCount: 3,
//       caption: 'Product Inventory'
//     }
//   ],
//   tableCount: 1,
//   metadata: {
//     fetchedAt: '2025-12-31T12:00:00.000Z',
//     domain: 'example.com'
//   }
// }

// Extract only the first table (index 0)
const firstTable = await tableExtractTool.execute({
  url: 'https://example.com/data',
  tableIndex: 0
});
```

## Features

- **Smart Header Detection**: Automatically finds headers from:
  - `<thead>` elements
  - `<th>` cells in first row
  - First data row (if no headers found)
  - Generates generic headers as fallback

- **Structured Output**: Converts tables to arrays of objects using headers as keys
- **Caption Extraction**: Captures table captions when present
- **Flexible Extraction**: Extract all tables or a specific table by index
- **Normalized Keys**: Header text is normalized for use as object keys
- **Empty Row Filtering**: Skips rows with no data
- **Comprehensive Error Handling**: Detailed error messages for network issues

## API

### Input

```typescript
{
  url: string;          // The URL to fetch and extract tables from
  tableIndex?: number;  // Optional: Which table to extract (0-based index)
}
```

### Output

```typescript
{
  url: string;              // The fetched URL
  tables: StructuredTable[]; // Array of extracted tables
  tableCount: number;       // Total number of tables found on page
  metadata: {
    fetchedAt: string;      // ISO timestamp of fetch
    domain: string;         // Domain name extracted from URL
  };
}

interface StructuredTable {
  headers: string[];                  // Original header text
  rows: Array<Record<string, string>>; // Data rows as objects
  rowCount: number;                   // Number of data rows
  columnCount: number;                // Number of columns
  caption?: string;                   // Table caption if present
}
```

## Use Cases

1. **Data Extraction**: Pull pricing tables, product comparisons, statistics
2. **Web Scraping**: Extract structured data for analysis
3. **Competitor Research**: Analyze competitor pricing and features
4. **Content Migration**: Extract table data when moving content
5. **Market Research**: Collect data from multiple sources
6. **SEO Analysis**: Extract ranking tables, comparison charts
7. **Financial Data**: Extract stock tables, financial reports

## Example: Pricing Table Extraction

```typescript
const result = await tableExtractTool.execute({
  url: 'https://example.com/pricing'
});

// Find the pricing table (assuming it's the first one)
const pricingTable = result.tables[0];

console.log(`Found ${pricingTable.rowCount} pricing tiers`);

// Access individual rows
for (const row of pricingTable.rows) {
  console.log(`${row.plan}: ${row.price}/month`);
}

// Convert to CSV
const csv = [
  pricingTable.headers.join(','),
  ...pricingTable.rows.map(row =>
    pricingTable.headers.map(h => row[h.toLowerCase().replace(/\s+/g, '_')]).join(',')
  )
].join('\n');
```

## Example: Extract Specific Table

```typescript
// If you know there are multiple tables and want the third one
const result = await tableExtractTool.execute({
  url: 'https://example.com/reports',
  tableIndex: 2  // Third table (0-based index)
});

const table = result.tables[0]; // Only contains the requested table
console.log(`Extracted table with ${table.rowCount} rows`);
```

## Header Normalization

Headers are normalized for use as object keys:
- Converted to lowercase
- Whitespace replaced with underscores
- Special characters removed
- Truncated to 50 characters

**Examples:**
- `"Product Name"` → `"product_name"`
- `"Price ($)"` → `"price"`
- `"Stock Level"` → `"stock_level"`

This ensures consistent, JavaScript-friendly property names.

## Handling Tables Without Headers

If a table has no `<thead>` or `<th>` elements, the tool:
1. Uses the first data row as headers
2. Removes that row from the data
3. If even the first row is all `<td>` cells with no clear headers, generates generic headers: `column_1`, `column_2`, etc.

## Empty Cells and Missing Data

- Empty cells are represented as empty strings `""`
- Rows with all empty cells are filtered out
- Missing cells in a row are filled with `""`

## Error Handling

The tool provides detailed error messages:

- **Invalid URL**: URL format is incorrect
- **Network Errors**: DNS failures, connection refused, timeouts
- **SSL Errors**: Invalid certificates
- **Content Type Errors**: Non-HTML responses
- **Table Index Errors**: Requested table doesn't exist
- **Empty Responses**: Server returns empty content

## Performance Considerations

- Large tables with hundreds of rows may take a few seconds to process
- Complex nested tables are flattened to their visible structure
- The tool uses a 30-second timeout for fetching pages
- Tables with excessive columns (50+) have normalized headers truncated

## Limitations

- Does not support tables generated by JavaScript (page must have static HTML)
- Nested tables are treated as separate tables
- Rowspan and colspan attributes are not explicitly handled
- Tables used for layout (not data) may produce unexpected results

## Requirements

- Node.js 18+ (uses native `fetch` API)
- Works with both ESM and CommonJS projects

## Related Tools

- `@tpmjs/tools-page-brief` - Extract main content and create summaries
- `@tpmjs/tools-extract-json-ld` - Extract JSON-LD structured data
- `@tpmjs/tools-links-catalog` - Extract and categorize all links

## License

MIT
