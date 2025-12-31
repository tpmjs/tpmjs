# @tpmjs/tools-executive-brief

Format content into executive summary style with key bullets and concise overview.

## Installation

```bash
npm install @tpmjs/tools-executive-brief
```

## Usage

```typescript
import { executiveBriefTool } from '@tpmjs/tools-executive-brief';

const result = await executiveBriefTool.execute({
  content: `Our Q4 performance exceeded expectations with revenue growing 25% year-over-year.
    The product launch was successful, acquiring 10,000 new customers in the first month.
    Customer satisfaction scores improved to 4.5/5. We expanded to three new markets.
    The team grew from 50 to 75 employees. Infrastructure costs were reduced by 15%.`,
  maxBullets: 5,
});

console.log(result.brief);
// # Executive Brief
//
// ## Overview
// Our Q4 performance exceeded expectations with revenue growing 25% year-over-year.
// The product launch was successful, acquiring 10,000 new customers in the first month.
// Customer satisfaction scores improved to 4.5/5.
//
// ## Key Points
// - Our Q4 performance exceeded expectations with revenue growing 25% year-over-year
// - The product launch was successful, acquiring 10,000 new customers in the first month
// - Customer satisfaction scores improved to 4.5/5
// - We expanded to three new markets
// - Infrastructure costs were reduced by 15%

console.log(result.bulletCount); // 5
console.log(result.wordCount);   // ~75
```

## API

### `executiveBriefTool.execute(input)`

Formats content into an executive brief with overview and key bullet points.

#### Input

- `content` (string, required): The content to format into an executive brief
- `maxBullets` (number, optional): Maximum number of bullet points (default: 5)

#### Output

Returns a `Promise<ExecutiveBrief>` with:

- `brief` (string): The formatted brief in markdown
- `bulletCount` (number): Number of bullet points included
- `wordCount` (number): Total word count of the brief

## Features

- **Smart bullet extraction**: Identifies key points with action words, numbers, and important indicators
- **Concise overview**: Summarizes the main message in 2-3 sentences
- **Markdown formatting**: Returns clean, readable markdown
- **Configurable**: Adjust the number of bullets to fit your needs

## Use Cases

- Summarize long reports for executives
- Create meeting briefs from detailed notes
- Distill technical documents for non-technical audiences
- Generate quick summaries of proposals or plans

## License

MIT
