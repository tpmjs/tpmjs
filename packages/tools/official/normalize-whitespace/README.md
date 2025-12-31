# @tpmjs/tools-normalize-whitespace

Normalize whitespace in text by trimming lines, collapsing spaces, and standardizing line endings.

## Installation

```bash
npm install @tpmjs/tools-normalize-whitespace
```

## Usage

```typescript
import { normalizeWhitespaceTool } from '@tpmjs/tools-normalize-whitespace';

// Use with AI SDK
const result = await normalizeWhitespaceTool.execute({
  text: '  Hello    World  \n  This  is   a test  \r\n',
  options: {
    trimLines: true,
    collapseSpaces: true,
    normalizeLineEndings: true
  }
});

console.log(result.text);
// "Hello World\nThis is a test"

console.log(result.changes);
// {
//   linesTrimmed: 2,
//   spacesCollapsed: 5,
//   lineEndingsNormalized: 1,
//   originalLength: 44,
//   normalizedLength: 24
// }
```

## Features

- **Trim Lines**: Remove leading and trailing whitespace from each line
- **Collapse Spaces**: Replace multiple consecutive spaces with a single space
- **Normalize Line Endings**: Convert CRLF (`\r\n`) to LF (`\n`)
- **Change Tracking**: Reports detailed statistics about transformations applied
- **Configurable**: Enable/disable each normalization option independently

## Input Schema

| Parameter | Type   | Required | Description                    |
|-----------|--------|----------|--------------------------------|
| text      | string | Yes      | The text to normalize          |
| options   | object | No       | Normalization options (see below) |

### Options

| Option              | Type    | Default | Description                              |
|---------------------|---------|---------|------------------------------------------|
| trimLines           | boolean | true    | Trim whitespace from start/end of lines  |
| collapseSpaces      | boolean | true    | Collapse multiple spaces into one        |
| normalizeLineEndings| boolean | true    | Convert CRLF to LF                       |

## Output Schema

```typescript
interface NormalizeWhitespaceResult {
  text: string;           // The normalized text
  changes: {
    linesTrimmed: number;          // Number of lines that were trimmed
    spacesCollapsed: number;       // Number of spaces removed by collapsing
    lineEndingsNormalized: number; // Number of CRLF converted to LF
    originalLength: number;        // Character count before normalization
    normalizedLength: number;      // Character count after normalization
  };
}
```

## Examples

### Trim Lines Only

```typescript
const result = await normalizeWhitespaceTool.execute({
  text: '  Hello  \n  World  ',
  options: {
    trimLines: true,
    collapseSpaces: false,
    normalizeLineEndings: false
  }
});
console.log(result.text);
// "Hello\nWorld"
```

### Collapse Spaces Only

```typescript
const result = await normalizeWhitespaceTool.execute({
  text: 'Hello    World   Test',
  options: {
    trimLines: false,
    collapseSpaces: true,
    normalizeLineEndings: false
  }
});
console.log(result.text);
// "Hello World Test"
```

### Normalize Line Endings Only

```typescript
const result = await normalizeWhitespaceTool.execute({
  text: 'Line 1\r\nLine 2\r\nLine 3',
  options: {
    trimLines: false,
    collapseSpaces: false,
    normalizeLineEndings: true
  }
});
console.log(result.text);
// "Line 1\nLine 2\nLine 3"
```

### All Options Enabled (Default)

```typescript
const result = await normalizeWhitespaceTool.execute({
  text: '  Hello    World  \r\n  Line   2  '
});
console.log(result.text);
// "Hello World\nLine 2"
console.log(result.changes);
// {
//   linesTrimmed: 2,
//   spacesCollapsed: 5,
//   lineEndingsNormalized: 1,
//   originalLength: 35,
//   normalizedLength: 18
// }
```

## Use Cases

- **Data Cleaning**: Normalize text data from various sources
- **Configuration Files**: Clean up YAML/JSON/config file content
- **User Input**: Sanitize and normalize user-submitted text
- **Text Processing**: Prepare text for analysis or comparison
- **Code Formatting**: Normalize whitespace in code snippets

## License

MIT
