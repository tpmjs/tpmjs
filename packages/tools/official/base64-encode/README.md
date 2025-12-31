# @tpmjs/official-base64-encode

Encode string or buffer to base64 format with support for multiple character encodings.

## Installation

```bash
npm install @tpmjs/official-base64-encode
```

## Usage

```typescript
import { base64EncodeTool } from '@tpmjs/official-base64-encode';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    base64Encode: base64EncodeTool,
  },
  prompt: 'Encode "Hello, World!" to base64',
});
```

## Parameters

- `data` (string, required): The data to encode to base64
- `encoding` (string, optional): Character encoding of the input data
  - Options: `'utf8'` (default), `'binary'`, `'hex'`

## Returns

```typescript
{
  base64: string;        // The base64 encoded string
  byteLength: number;    // The byte length of the original data
}
```

## Examples

### Encode UTF-8 text (default)

```typescript
const result = await base64EncodeTool.execute({
  data: 'Hello, World!',
});
// { base64: 'SGVsbG8sIFdvcmxkIQ==', byteLength: 13 }
```

### Encode binary data

```typescript
const result = await base64EncodeTool.execute({
  data: '\x00\x01\x02\x03',
  encoding: 'binary',
});
// { base64: 'AAECAw==', byteLength: 4 }
```

### Encode hex string

```typescript
const result = await base64EncodeTool.execute({
  data: 'deadbeef',
  encoding: 'hex',
});
// { base64: '3q2+7w==', byteLength: 4 }
```

## Use Cases

- Encoding text for data URIs
- Preparing binary data for transmission
- Converting hex strings to base64
- Encoding authentication credentials
- Creating base64-encoded images or files

## License

MIT
