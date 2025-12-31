# @tpmjs/official-regex-extract

Extract all regex matches from text with optional capture group support.

## Installation

```bash
npm install @tpmjs/official-regex-extract
```

## Usage

```typescript
import { regexExtractTool } from '@tpmjs/official-regex-extract';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    regexExtract: regexExtractTool,
  },
  prompt: 'Extract all email addresses from the text',
});
```

## Parameters

- `text` (string, required): The text to search for matches
- `pattern` (string, required): Regular expression pattern (without delimiters)
- `flags` (string, optional): Regular expression flags
  - `g` - global (automatically added if not present)
  - `i` - case-insensitive
  - `m` - multiline
  - `s` - dotAll (. matches newlines)
  - `u` - unicode
  - `y` - sticky
- `groups` (boolean, optional): If true, return detailed match objects with capture groups and positions. Default: false

## Returns

```typescript
{
  matches: string[] | MatchWithGroups[];  // Array of matches
  matchCount: number;                     // Total number of matches
  hasMatches: boolean;                    // Whether any matches were found
}

// When groups=true, each match is:
{
  match: string;                          // The full matched text
  groups: Record<string, string>;         // Named capture groups
  index: number;                          // Position in text
}
```

## Examples

### Extract email addresses

```typescript
const result = await regexExtractTool.execute({
  text: 'Contact us at support@example.com or sales@example.com',
  pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
  flags: 'i',
});
// {
//   matches: ['support@example.com', 'sales@example.com'],
//   matchCount: 2,
//   hasMatches: true
// }
```

### Extract URLs with capture groups

```typescript
const result = await regexExtractTool.execute({
  text: 'Visit https://example.com and http://test.org',
  pattern: '(?<protocol>https?)://(?<domain>[^\\s]+)',
  groups: true,
});
// {
//   matches: [
//     {
//       match: 'https://example.com',
//       groups: { protocol: 'https', domain: 'example.com' },
//       index: 6
//     },
//     {
//       match: 'http://test.org',
//       groups: { protocol: 'http', domain: 'test.org' },
//       index: 30
//     }
//   ],
//   matchCount: 2,
//   hasMatches: true
// }
```

### Extract phone numbers

```typescript
const result = await regexExtractTool.execute({
  text: 'Call (555) 123-4567 or (555) 987-6543',
  pattern: '\\(\\d{3}\\)\\s\\d{3}-\\d{4}',
});
// {
//   matches: ['(555) 123-4567', '(555) 987-6543'],
//   matchCount: 2,
//   hasMatches: true
// }
```

### Extract hashtags (case-insensitive)

```typescript
const result = await regexExtractTool.execute({
  text: 'Love #JavaScript and #TypeScript!',
  pattern: '#\\w+',
  flags: 'i',
});
// {
//   matches: ['#JavaScript', '#TypeScript'],
//   matchCount: 2,
//   hasMatches: true
// }
```

### Extract dates with named groups

```typescript
const result = await regexExtractTool.execute({
  text: 'Event on 2024-03-15 and deadline 2024-06-30',
  pattern: '(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})',
  groups: true,
});
// {
//   matches: [
//     {
//       match: '2024-03-15',
//       groups: { year: '2024', month: '03', day: '15' },
//       index: 9
//     },
//     {
//       match: '2024-06-30',
//       groups: { year: '2024', month: '06', day: '30' },
//       index: 33
//     }
//   ],
//   matchCount: 2,
//   hasMatches: true
// }
```

## Use Cases

- Extracting email addresses from text
- Finding URLs in content
- Parsing phone numbers
- Extracting hashtags or mentions
- Finding dates in various formats
- Extracting code snippets or code blocks
- Parsing structured data from text
- Finding price values
- Extracting IP addresses
- Validating and extracting specific patterns

## Tips

- The `g` (global) flag is automatically added to find all matches
- Use named capture groups `(?<name>...)` for clearer results when `groups=true`
- Escape special regex characters: `\` `^` `$` `.` `*` `+` `?` `(` `)` `[` `]` `{` `}` `|`
- Use `i` flag for case-insensitive matching
- Use `m` flag when matching across multiple lines with `^` and `$`

## Error Handling

The tool throws an error if:
- The pattern is invalid regex syntax
- Text or pattern is not a string

## License

MIT
