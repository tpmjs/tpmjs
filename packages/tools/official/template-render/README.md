# @tpmjs/tools-template-render

Render mustache-style templates with variable tracking.

## Installation

```bash
npm install @tpmjs/tools-template-render
```

## Usage

```typescript
import { templateRenderTool } from '@tpmjs/tools-template-render';

const result = await templateRenderTool.execute({
  template: 'Hello {{name}}! Your score is {{score}}.',
  data: {
    name: 'Alice',
    score: 95,
    unused: 'extra data'
  }
});

console.log(result.rendered);
// => "Hello Alice! Your score is 95."

console.log(result.variablesUsed);
// => ["name", "score"]

console.log(result.unusedVariables);
// => ["unused"]
```

## Options

```typescript
// Disable HTML escaping
const result = await templateRenderTool.execute({
  template: 'Content: {{html}}',
  data: { html: '<strong>Bold</strong>' },
  options: { escape: false }
});
```

## Features

- **Mustache syntax**: Uses standard `{{variable}}` placeholders
- **Variable tracking**: Reports which variables were used and which were provided but unused
- **HTML escaping**: Automatically escapes HTML by default (can be disabled)
- **Nested data**: Supports nested object access with dot notation

## License

MIT
