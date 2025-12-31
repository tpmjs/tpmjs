# @tpmjs/tools-date-parse

Parse dates in various natural language formats using chrono-node.

## Installation

```bash
npm install @tpmjs/tools-date-parse
```

## Usage

```typescript
import { dateParseTool } from '@tpmjs/tools-date-parse';

const result = await dateParseTool.execute({
  text: 'Meeting tomorrow at 3pm and follow-up next Friday'
});

console.log(result.count);
// => 2

console.log(result.dates[0]);
// => {
//   parsed: "Thursday, January 16, 2025 at 3:00:00 PM EST",
//   original: "tomorrow at 3pm",
//   iso: "2025-01-16T20:00:00.000Z",
//   timestamp: 1737057600000
// }
```

## Options

```typescript
// Use a custom reference date
const result = await dateParseTool.execute({
  text: 'in 2 weeks',
  referenceDate: '2024-01-01T00:00:00Z'
});

// Use strict mode for fewer false positives
const result = await dateParseTool.execute({
  text: 'The year 2024 was great',
  strict: true
});
```

## Features

- **Natural language**: Parses dates like "tomorrow", "next week", "in 3 days"
- **Absolute dates**: Handles "December 25th, 2024", "Jan 1", "2024-01-15"
- **Times**: Supports "3pm", "15:30", "9:00 AM"
- **Multiple dates**: Extracts all dates from a single text input
- **Reference dates**: Calculate relative dates from a custom starting point
- **Strict mode**: Reduce false positives with stricter parsing

## License

MIT
