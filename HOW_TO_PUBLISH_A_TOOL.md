# How to Publish a TPMJS Tool

This guide shows you how to create and publish an AI tool that will be automatically discovered and listed on tpmjs.com.

## Quick Start

1. Create a new NPM package
2. Add `"tpmjs"` to the `keywords` array in package.json
3. Add a `tpmjs` field with your tool's metadata
4. Publish to NPM
5. Your tool will automatically appear on tpmjs.com within 15 minutes

## Step-by-Step Guide

### 1. Create Your NPM Package

Create a standard NPM package with your tool implementation:

```bash
mkdir my-awesome-tool
cd my-awesome-tool
npm init -y
```

### 2. Add the Required Keyword

In your `package.json`, add `"tpmjs"` to the keywords array:

```json
{
  "name": "@yourname/my-awesome-tool",
  "version": "1.0.0",
  "keywords": ["tpmjs", "ai", "other-keywords"],
  ...
}
```

**Important:** The `"tpmjs"` keyword is REQUIRED for automatic discovery!

### 3. Add TPMJS Metadata

Add a `tpmjs` field to your `package.json` with your tool's metadata. There are three tiers:

#### Tier 1: Minimal (Required Fields Only)

The bare minimum to get listed:

```json
{
  "tpmjs": {
    "category": "text-analysis",
    "description": "A concise description of what your tool does"
  }
}
```

**Required fields:**
- `category` - One of: `text-analysis`, `code-generation`, `data-processing`, `image-generation`, `audio-processing`, `search`, `integration`, `other`
- `description` - Clear description of what the tool does (1-3 sentences)

#### Tier 2: Basic (Recommended)

Add parameter and return type information:

```json
{
  "tpmjs": {
    "category": "text-analysis",
    "description": "Analyzes sentiment in text and returns a score",
    "parameters": [
      {
        "name": "text",
        "type": "string",
        "description": "The text to analyze",
        "required": true
      },
      {
        "name": "language",
        "type": "string",
        "description": "Language code (e.g., 'en', 'es')",
        "required": false,
        "default": "en"
      }
    ],
    "returns": {
      "type": "SentimentResult",
      "description": "Object containing score (-1 to 1) and label (positive/negative/neutral)"
    }
  }
}
```

#### Tier 3: Rich (Full Documentation)

Complete metadata for maximum visibility:

```json
{
  "tpmjs": {
    "category": "text-analysis",
    "description": "Advanced sentiment analysis with emotion detection",
    "parameters": [
      {
        "name": "text",
        "type": "string",
        "description": "The text to analyze",
        "required": true
      },
      {
        "name": "language",
        "type": "string",
        "description": "Language code",
        "required": false,
        "default": "en"
      },
      {
        "name": "includeEmotions",
        "type": "boolean",
        "description": "Whether to include emotion breakdown",
        "required": false,
        "default": false
      }
    ],
    "returns": {
      "type": "SentimentResult",
      "description": "Object with score, label, and optional emotions array"
    },
    "env": [
      {
        "name": "SENTIMENT_API_KEY",
        "description": "API key for sentiment analysis service",
        "required": true
      }
    ],
    "frameworks": ["vercel-ai", "langchain"],
    "aiAgent": {
      "useCase": "Use this tool when users need to analyze sentiment in text, detect emotions, or understand the tone of customer feedback, reviews, or social media posts.",
      "limitations": "Only supports English and Spanish. Maximum 10,000 characters per request.",
      "examples": [
        "Analyze customer review sentiment",
        "Detect emotions in user feedback",
        "Monitor social media sentiment"
      ]
    }
  }
}
```

### 4. Implement Your Tool

Write your tool's implementation. Here's the example from `@tpmjs/createblogpost`:

```typescript
// src/index.ts
export interface BlogPostOptions {
  title: string;
  author: string;
  content: string;
  tags?: string[];
  format?: 'markdown' | 'mdx';
  excerpt?: string;
}

export interface BlogPost {
  frontmatter: {
    title: string;
    author: string;
    date: string;
    tags: string[];
    excerpt?: string;
    slug: string;
    wordCount: number;
    readingTime: number;
  };
  content: string;
  formattedOutput: string;
}

export async function createBlogPost(options: BlogPostOptions): Promise<BlogPost> {
  // Your implementation here
  const { title, author, content, tags = [], format = 'markdown', excerpt } = options;

  // Validate inputs
  if (!title || !author || !content) {
    throw new Error('Title, author, and content are required');
  }

  // Process and return result
  return {
    frontmatter: { /* ... */ },
    content,
    formattedOutput: '...'
  };
}

export default createBlogPost;
```

### 5. Build and Publish

Build your package and publish to NPM:

```bash
# Build your package
npm run build

# Publish to NPM
npm publish --access public
```

### 6. Verification

Your tool will be automatically discovered through:

1. **Keyword Search** - Runs every 15 minutes, searches NPM for `"tpmjs"`
2. **Changes Feed** - Monitors NPM publishes in real-time (every 2 minutes)

After publishing, your tool should appear on https://tpmjs.com within 15 minutes!

You can verify by searching: https://tpmjs.com/api/tools?q=yourpackagename

## Real Example: @tpmjs/createblogpost

Here's the complete `package.json` from the published example:

```json
{
  "name": "@tpmjs/createblogpost",
  "version": "0.2.0",
  "description": "A tool for creating structured blog posts with AI-generated content",
  "type": "module",
  "keywords": ["tpmjs", "blog", "content", "ai", "writing"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "type-check": "tsc --noEmit"
  },
  "publishConfig": {
    "access": "public"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/ajaxdavis/tpmjs.git",
    "directory": "packages/tools/createBlogPost"
  },
  "homepage": "https://tpmjs.com",
  "license": "MIT",
  "tpmjs": {
    "category": "text-analysis",
    "description": "Creates structured blog posts with customizable frontmatter, content sections, and SEO metadata. Supports multiple output formats including Markdown and MDX.",
    "parameters": [
      {
        "name": "title",
        "type": "string",
        "description": "The title of the blog post",
        "required": true
      },
      {
        "name": "author",
        "type": "string",
        "description": "The author of the blog post",
        "required": true
      },
      {
        "name": "content",
        "type": "string",
        "description": "The main content of the blog post",
        "required": true
      },
      {
        "name": "tags",
        "type": "string[]",
        "description": "Array of tags for categorization",
        "required": false,
        "default": []
      },
      {
        "name": "format",
        "type": "'markdown' | 'mdx'",
        "description": "Output format for the blog post",
        "required": false,
        "default": "markdown"
      },
      {
        "name": "excerpt",
        "type": "string",
        "description": "Short excerpt or summary of the post",
        "required": false
      }
    ],
    "returns": {
      "type": "BlogPost",
      "description": "A structured blog post object with frontmatter, content, and metadata including slug, wordCount, readingTime, and formattedOutput"
    },
    "frameworks": ["vercel-ai", "langchain"],
    "aiAgent": {
      "useCase": "Use this tool when users need to generate blog posts, articles, or structured content with proper frontmatter and metadata. Ideal for content management systems, static site generators, and documentation sites.",
      "limitations": "Does not include AI content generation - you must provide the content. Only formats and structures existing content.",
      "examples": [
        "Create a blog post about TypeScript best practices",
        "Generate a tutorial post with code examples",
        "Format an article with SEO metadata"
      ]
    }
  }
}
```

## Field Reference

### Required Fields (Tier 1 - Minimal)

| Field | Type | Description |
|-------|------|-------------|
| `category` | string | Tool category (see categories below) |
| `description` | string | Clear description (1-3 sentences) |

### Optional Fields (Tier 2 - Basic)

| Field | Type | Description |
|-------|------|-------------|
| `parameters` | array | Array of parameter objects |
| `returns` | object | Return type information |

### Optional Fields (Tier 3 - Rich)

| Field | Type | Description |
|-------|------|-------------|
| `env` | array | Required environment variables |
| `frameworks` | array | Compatible frameworks |
| `aiAgent` | object | AI agent integration info |

### Categories

Choose one of these for the `category` field:

- `text-analysis` - NLP, sentiment, summarization
- `code-generation` - Code generation and transformation
- `data-processing` - Data manipulation and transformation
- `image-generation` - Image creation and editing
- `audio-processing` - Audio/speech processing
- `search` - Search and retrieval
- `integration` - Third-party integrations
- `other` - Anything else

### Environment Variables

If your tool requires environment variables:

```json
"env": [
  {
    "name": "OPENAI_API_KEY",
    "description": "API key for OpenAI services",
    "required": true
  },
  {
    "name": "API_ENDPOINT",
    "description": "Custom API endpoint URL",
    "required": false,
    "default": "https://api.example.com"
  }
]
```

## Quality Score

Your tool gets a quality score based on:

- **Tier**: Rich (1.0) > Basic (0.5) > Minimal (0.25)
- **Downloads**: Logarithmic scale based on monthly NPM downloads
- **GitHub Stars**: Logarithmic scale based on repository stars

Higher scores = better visibility on tpmjs.com!

## Tips for Success

1. **Use descriptive names** - Make your package name clear and searchable
2. **Complete metadata** - Tier 3 (Rich) tools get 4x the base score
3. **Good documentation** - Add documentation URL to package.json homepage or repository fields
4. **Active maintenance** - Regular updates boost download counts
5. **AI-friendly descriptions** - Write the `aiAgent.useCase` field as guidance for AI agents

## Testing Locally

Before publishing, you can validate your `tpmjs` field using the validation schema:

```bash
# In the tpmjs monorepo
pnpm --filter=@tpmjs/types test
```

Or manually check the structure matches the examples above.

## Troubleshooting

**Tool not appearing after 15 minutes?**
- Check that you added `"tpmjs"` to keywords
- Verify your `tpmjs` field has required fields (category, description)
- Check the NPM package is public: `npm view yourpackage`

**Tool showing as "minimal" tier?**
- Add `parameters` and `returns` fields for Basic tier
- Add all Rich tier fields for maximum visibility

**Want to force a sync?**
You can manually trigger a sync (requires auth):
```bash
curl -X POST "https://tpmjs.com/api/sync/keyword" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Support

Questions or issues?
- File an issue: https://github.com/ajaxdavis/tpmjs/issues
- Check the API: https://tpmjs.com/api/tools
