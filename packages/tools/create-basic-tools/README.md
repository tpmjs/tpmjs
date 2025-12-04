# @tpmjs/create-basic-tools

CLI generator for scaffolding production-ready TPMJS tool packages with 2-3 tools by default.

## Features

- 🎯 **Multi-tool packages**: Generates packages with minimum 2 tools (ideally 2-3)
- 🔧 **Zod 4 schemas**: Uses Zod directly (not jsonSchema wrapper)
- ⚡ **AI SDK v6**: Full compatibility with the latest AI SDK
- 📦 **One file per tool**: Clean `src/tools/<toolName>.ts` structure
- ✅ **TPMJS validated**: Auto-validates against official TPMJS schemas
- 🎨 **Beautiful CLI**: Interactive prompts with @clack/prompts
- 📝 **Complete setup**: Generates package.json, tsconfig, tsup config, README, and more
- 🚀 **Publish ready**: Generated packages are ready to publish to npm immediately

## Usage

### Interactive Mode (Recommended)

```bash
pnpmx @tpmjs/create-basic-tools
```

This will guide you through an interactive wizard that asks:

1. **Package info**: name, description, author, license
2. **Tool definitions**: At least 2 tools (export name + description)
3. **Category**: Choose from 12 TPMJS categories
4. **Mode**: Simple (basic Zod schemas) or Advanced (full control)
5. **Output path**: Where to create the package
6. **Confirmation**: Review and confirm

### Example Session

```bash
$ pnpmx @tpmjs/create-basic-tools

┌  create-tpmjs-tool
│
◇  Package name
│  @myorg/content-tools
│
◇  Package description
│  AI SDK tools for content processing
│
◇  Tool #1 export name
│  summarizeText
│
◇  Tool #1 description
│  Summarize a block of text into a concise overview.
│
◇  Tool #2 export name
│  extractKeywords
│
◇  Tool #2 description
│  Extract important keywords from text.
│
◇  Add tool #3? (already have 2)
│  Yes
│
◇  Tool #3 export name
│  classifySentiment
│
◇  Tool #3 description
│  Classify the sentiment of text as positive, negative, or neutral.
│
◇  Category
│  text-analysis
│
◇  Mode
│  Simple Mode - Basic Zod schemas
│
◇  Where should we create the package?
│  ./content-tools
│
◇  Ready to generate?
│  Yes
│
└  Success! Created @myorg/content-tools at ./content-tools
```

## Generated Package Structure

```
content-tools/
├── src/
│   ├── tools/                # One file per tool
│   │   ├── summarizeText.ts
│   │   ├── extractKeywords.ts
│   │   └── classifySentiment.ts
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

## Generated Tool File Example

Each tool file follows this Zod-first pattern:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const SummarizeTextSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').describe('The input text to process.'),
  options: z.object({
    language: z.string().default('en').describe('Language code (e.g., en, es, fr).'),
    maxLength: z.number().int().positive().default(100).describe('Maximum length of output.'),
  }).default({ language: 'en', maxLength: 100 }).describe('Optional configuration.'),
});

export const summarizeText = tool({
  description: 'Summarize a block of text into a concise overview.',
  inputSchema: SummarizeTextSchema,
  async execute(input: z.infer<typeof SummarizeTextSchema>) {
    // TODO: Implement the tool logic here
    console.log('summarizeText called with:', input);

    return {
      success: true,
      message: 'Tool executed successfully. Replace this with your implementation.',
      input,
    };
  },
});
```

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
