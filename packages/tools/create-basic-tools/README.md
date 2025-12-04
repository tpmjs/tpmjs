# @tpmjs/create-basic-tools

CLI generator for scaffolding production-ready TPMJS tool packages. Just enter your package name and you're done!

## Features

- ⚡ **Super fast**: Just asks for your package name, generates everything else
- 🎯 **2 example tools**: Start with working examples you can customize
- 🔧 **Zod 4 schemas**: Uses Zod directly (not jsonSchema wrapper)
- ⚡ **AI SDK v6**: Full compatibility with the latest AI SDK
- 📦 **One file per tool**: Clean `src/tools/<toolName>.ts` structure
- ✅ **TPMJS validated**: Auto-validates against official TPMJS schemas
- 📝 **Complete setup**: Generates package.json, tsconfig, tsup config, README, and more
- 🚀 **Publish ready**: Generated packages are ready to publish to npm immediately

## Usage

### Interactive Mode (Recommended)

```bash
pnpmx @tpmjs/create-basic-tools
```

The CLI asks for just your package name and uses sensible defaults for everything else:

- **Description**: Auto-generated from package name
- **Tools**: 2 example tools you can customize
- **Category**: `ai-ml` (generic)
- **License**: MIT
- **Output**: Derived from package name

### Example Session

```bash
$ pnpmx @tpmjs/create-basic-tools

┌  create-tpmjs-tool
│
◇  Package name
│  @myorg/content-tools
│
◆  Generating package...
│
└  ✓ Success! Created @myorg/content-tools at ./content-tools

   Files created:
     src/tools/exampleTool.ts
     src/tools/anotherTool.ts
     src/index.ts
     package.json

   Next steps:
     cd ./content-tools
     pnpm install
     pnpm build
     pnpm type-check
     pnpm publish
```

That's it! The generator creates 2 example tools you can rename and customize for your use case.

## Generated Package Structure

```
content-tools/
├── src/
│   ├── tools/                # One file per tool
│   │   ├── exampleTool.ts
│   │   └── anotherTool.ts
│   └── index.ts              # Re-exports all tools
├── dist/                     # Build output (after pnpm build)
│   ├── index.js
│   └── index.d.ts
├── package.json              # With complete tpmjs field
├── tsconfig.json
├── tsup.config.ts
├── README.md
├── .gitignore
├── .npmignore
└── LICENSE
```

Simply rename `exampleTool.ts` and `anotherTool.ts` to match your use case, then customize the implementation.

## Generated Tool File Example

Each tool file follows this Zod-first pattern:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const ExampleToolSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').describe('The input text to process.'),
  options: z.object({
    language: z.string().default('en').describe('Language code (e.g., en, es, fr).'),
    maxLength: z.number().int().positive().default(100).describe('Maximum length of output.'),
  }).default({ language: 'en', maxLength: 100 }).describe('Optional configuration.'),
});

export const exampleTool = tool({
  description: 'An example tool - customize this for your use case',
  inputSchema: ExampleToolSchema,
  async execute(input: z.infer<typeof ExampleToolSchema>) {
    // Defensive check: Validate required parameters
    // This prevents crashes when tools are called with missing/empty params
    if (!input.text || input.text.trim().length === 0) {
      return {
        success: false,
        error: 'Missing required parameter: text',
        message: 'The "text" parameter is required and cannot be empty.',
      };
    }

    // TODO: Implement the tool logic here
    console.log('exampleTool called with:', input);

    return {
      success: true,
      message: 'Tool executed successfully. Replace this with your implementation.',
      input,
    };
  },
});
```

### Why Defensive Parameter Validation?

Generated tools include defensive checks for required parameters. While Zod validates the schema, these checks prevent crashes in edge cases where:

- Tools are called with empty/missing parameters during AI exploration
- Parameters are undefined due to serialization issues
- The LLM makes initial "probe" calls to understand tool capabilities

**Best Practice**: Always validate critical required parameters before using them, especially when:
- The parameter is used in string operations (`.toLowerCase()`, `.trim()`, etc.)
- The parameter is required for the tool's core functionality
- Missing the parameter would cause a runtime error

This defensive approach ensures tools return helpful error messages instead of crashing.

## After Generation

Once the package is generated:

```bash
cd content-tools

# Install dependencies
pnpm install

# Build the package
pnpm build

# Type-check
pnpm type-check

# Publish to npm
pnpm publish --access public
```

Your tools will appear on [tpmjs.com](https://tpmjs.com) within 2-15 minutes after publishing!

## TPMJS Categories

The generator validates against these official TPMJS categories:

- `web-scraping`
- `data-processing`
- `file-operations`
- `communication`
- `database`
- `api-integration`
- `image-processing`
- `text-analysis`
- `automation`
- `ai-ml`
- `security`
- `monitoring`

## Requirements

- Node.js 18+
- pnpm (recommended)

## Development

This is a generator package itself. To work on it:

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Type-check
pnpm type-check

# Test locally
node dist/index.js
```

## License

MIT
