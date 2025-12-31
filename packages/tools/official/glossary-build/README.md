# @tpmjs/tools-glossary-build

Build a glossary from term definitions in text. Detects various definition patterns and extracts them into a structured format.

## Installation

```bash
npm install @tpmjs/tools-glossary-build ai
```

## Usage

```typescript
import { glossaryBuildTool } from '@tpmjs/tools-glossary-build';

const result = await glossaryBuildTool.execute({
  text: `
    API: Application Programming Interface
    REST - Representational State Transfer
    **JSON** JavaScript Object Notation
    CLI: Command Line Interface
  `,
});

console.log(result);
// {
//   terms: [
//     { term: "API", definition: "Application Programming Interface" },
//     { term: "REST", definition: "Representational State Transfer" },
//     { term: "JSON", definition: "JavaScript Object Notation" },
//     { term: "CLI", definition: "Command Line Interface" }
//   ],
//   count: 4,
//   alphabetized: true
// }
```

## Features

- Detects multiple definition formats:
  - Colon separator: `Term: definition`
  - Dash separator: `Term - definition` or `Term — definition`
  - Markdown bold: `**Term** definition`
  - Markdown italic: `*Term* definition`
- Automatically removes duplicates (case-insensitive)
- Cleans up formatting (bold markers, bullets, numbers)
- Checks if terms are alphabetically sorted

## Parameters

- `text` (string, required) - Text containing term definitions in various formats

## Returns

```typescript
{
  terms: Array<{
    term: string;
    definition: string;
  }>;
  count: number;
  alphabetized: boolean;
}
```

## Example Input Formats

The tool recognizes various definition formats:

```
API: Application Programming Interface
REST - Representational State Transfer
**GraphQL** A query language for APIs
*SDK* Software Development Kit
```

## License

MIT
