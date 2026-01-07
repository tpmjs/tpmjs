'use client';

import { TPMJS_CATEGORIES } from '@tpmjs/types/tpmjs';
import { Badge } from '@tpmjs/ui/Badge/Badge';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import { useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

type ViewMode = 'spec' | 'example';

const MINIMAL_EXAMPLE = `{
  "name": "@yourname/my-tool",
  "version": "1.0.0",
  "keywords": ["tpmjs"],
  "tpmjs": {
    "category": "text-analysis"
  }
}`;

const FULL_EXAMPLE = `{
  "name": "@acme/sentiment-analyzer",
  "version": "2.1.0",
  "description": "Advanced sentiment analysis with emotion detection and confidence scoring",
  "keywords": ["tpmjs", "sentiment", "nlp", "ai-tool"],
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "repository": {
    "type": "git",
    "url": "https://github.com/acme/sentiment-analyzer"
  },
  "tpmjs": {
    "category": "text-analysis",
    "frameworks": ["vercel-ai", "langchain"],
    "env": [
      {
        "name": "OPENAI_API_KEY",
        "description": "OpenAI API key for advanced analysis",
        "required": true
      },
      {
        "name": "SENTIMENT_MODEL",
        "description": "Model variant to use (default: gpt-4)",
        "required": false
      }
    ],
    "tools": [
      {
        "name": "analyzeSentiment",
        "description": "Analyze text sentiment with emotion breakdown"
      },
      {
        "name": "batchAnalyze",
        "description": "Analyze multiple texts in parallel"
      },
      {
        "name": "compareSentiments",
        "description": "Compare sentiment between two texts"
      }
    ]
  }
}`;

const TOOL_CODE_EXAMPLE = `import { tool } from 'ai';
import { z } from 'zod';

export const analyzeSentiment = tool({
  description: 'Analyze text sentiment with emotion breakdown',
  parameters: z.object({
    text: z.string().describe('The text to analyze'),
    language: z.string().optional().describe('ISO language code'),
    includeEmotions: z.boolean().default(true).describe('Include emotion breakdown'),
  }),
  execute: async ({ text, language, includeEmotions }) => {
    // Your implementation here
    return {
      sentiment: 'positive',
      confidence: 0.92,
      emotions: includeEmotions ? {
        joy: 0.7,
        trust: 0.2,
        anticipation: 0.1,
      } : undefined,
    };
  },
});

export const batchAnalyze = tool({
  description: 'Analyze multiple texts in parallel',
  parameters: z.object({
    texts: z.array(z.string()).describe('Array of texts to analyze'),
  }),
  execute: async ({ texts }) => {
    // Batch implementation
    return texts.map(text => ({ text, sentiment: 'neutral' }));
  },
});`;

export default function SpecPage(): React.ReactElement {
  const [view, setView] = useState<ViewMode>('spec');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1">
        {/* Hero */}
        <div className="border-b border-border bg-gradient-to-b from-surface to-background">
          <Container size="xl" padding="lg" className="py-16">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" size="lg">
                    v1.0
                  </Badge>
                  <span className="text-foreground-tertiary font-mono text-sm">package.json</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                  TPMJS Specification
                </h1>
              </div>

              {/* View Toggle */}
              <div className="flex gap-1 p-1 bg-surface rounded-lg border border-border self-center md:self-auto">
                <button
                  type="button"
                  onClick={() => setView('spec')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === 'spec'
                      ? 'bg-foreground text-background'
                      : 'text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  Specification
                </button>
                <button
                  type="button"
                  onClick={() => setView('example')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === 'example'
                      ? 'bg-foreground text-background'
                      : 'text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  Full Example
                </button>
              </div>
            </div>
          </Container>
        </div>

        {/* Content */}
        <Container size="xl" padding="lg" className="py-12">
          {view === 'spec' ? <SpecificationView /> : <ExampleView />}
        </Container>
      </main>
    </div>
  );
}

function SpecificationView(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-8 space-y-12">
        {/* Minimal Required */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-green-400 text-sm font-bold">1</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">Minimal Configuration</h2>
          </div>
          <p className="text-foreground-secondary mb-4">
            Add the <code className="text-foreground bg-surface px-1.5 py-0.5 rounded">tpmjs</code>{' '}
            keyword and field to your package.json. Tools are auto-discovered from your exports.
          </p>
          <CodeBlock language="json" code={MINIMAL_EXAMPLE} showCopy />
        </section>

        {/* Category Field */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-red-400 text-sm font-bold">*</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              category <span className="text-red-400 font-normal text-sm">(required)</span>
            </h2>
          </div>
          <p className="text-foreground-secondary mb-4">
            One of the following predefined categories:
          </p>
          <div className="flex flex-wrap gap-2">
            {TPMJS_CATEGORIES.map((cat) => (
              <code
                key={cat}
                className="px-3 py-1.5 rounded bg-surface border border-border text-sm text-foreground font-mono"
              >
                {cat}
              </code>
            ))}
          </div>
        </section>

        {/* Tools Array */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-blue-400 text-sm font-bold">?</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              tools <span className="text-foreground-tertiary font-normal text-sm">(optional)</span>
            </h2>
          </div>
          <p className="text-foreground-secondary mb-4">
            Explicit tool definitions. If omitted, tools are auto-discovered from your exports.
          </p>
          <CodeBlock
            language="json"
            code={`"tools": [
  {
    "name": "functionName",        // Export name (required)
    "description": "What it does"  // Optional, auto-extracted if omitted
  }
]`}
            showCopy
          />
        </section>

        {/* Env Array */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <span className="text-amber-400 text-sm font-bold">?</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              env <span className="text-foreground-tertiary font-normal text-sm">(optional)</span>
            </h2>
          </div>
          <p className="text-foreground-secondary mb-4">
            Environment variables required by your tools:
          </p>
          <CodeBlock
            language="json"
            code={`"env": [
  {
    "name": "API_KEY",              // Variable name (required)
    "description": "Your API key",  // What it's for (required)
    "required": true                // Default: true
  }
]`}
            showCopy
          />
        </section>

        {/* Frameworks Array */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-purple-400 text-sm font-bold">?</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              frameworks{' '}
              <span className="text-foreground-tertiary font-normal text-sm">(optional)</span>
            </h2>
          </div>
          <p className="text-foreground-secondary mb-4">Compatible AI frameworks:</p>
          <div className="flex flex-wrap gap-2">
            {['vercel-ai', 'langchain', 'llamaindex', 'haystack', 'semantic-kernel'].map((fw) => (
              <code
                key={fw}
                className="px-3 py-1.5 rounded bg-surface border border-border text-sm text-foreground font-mono"
              >
                {fw}
              </code>
            ))}
          </div>
        </section>
      </div>

      {/* Sidebar - Schema Reference */}
      <aside className="lg:col-span-4">
        <div className="sticky top-8 space-y-6">
          <div className="p-6 rounded-xl border border-border bg-surface">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              Schema Reference
            </h3>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-foreground">category</span>
                <span className="text-red-400">required</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">tools[]</span>
                <span className="text-foreground-tertiary">optional</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">├─ name</span>
                <span className="text-foreground-tertiary">string</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">└─ description</span>
                <span className="text-foreground-tertiary">string</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">env[]</span>
                <span className="text-foreground-tertiary">optional</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">├─ name</span>
                <span className="text-foreground-tertiary">string</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">├─ description</span>
                <span className="text-foreground-tertiary">string</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">└─ required</span>
                <span className="text-foreground-tertiary">boolean</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">frameworks[]</span>
                <span className="text-foreground-tertiary">optional</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-cyan-500/30 bg-cyan-500/5">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3">
              Auto-Extracted
            </h3>
            <p className="text-sm text-foreground-secondary mb-3">
              These fields are automatically extracted from your tool code:
            </p>
            <ul className="space-y-2 text-sm text-foreground-secondary font-mono">
              <li>• inputSchema</li>
              <li>• parameters</li>
              <li>• description</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ExampleView(): React.ReactElement {
  return (
    <div className="space-y-12">
      {/* Package.json Example */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <span className="text-white text-lg">📦</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">package.json</h2>
            <p className="text-foreground-tertiary text-sm">Complete TPMJS configuration</p>
          </div>
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-surface px-4 py-2 border-b border-border flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
            <span className="text-foreground-tertiary text-sm font-mono ml-2">package.json</span>
          </div>
          <CodeBlock language="json" code={FULL_EXAMPLE} showCopy className="rounded-none" />
        </div>
      </section>

      {/* Tool Code Example */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <span className="text-white text-lg">⚡</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">src/index.ts</h2>
            <p className="text-foreground-tertiary text-sm">
              Tool implementation with Vercel AI SDK
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-surface px-4 py-2 border-b border-border flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
            <span className="text-foreground-tertiary text-sm font-mono ml-2">src/index.ts</span>
          </div>
          <CodeBlock
            language="typescript"
            code={TOOL_CODE_EXAMPLE}
            showCopy
            className="rounded-none"
          />
        </div>
      </section>

      {/* What Happens */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-border bg-surface">
          <div className="text-3xl mb-4">1️⃣</div>
          <h3 className="font-bold text-foreground mb-2">Publish to npm</h3>
          <p className="text-sm text-foreground-secondary">
            Run <code className="text-foreground bg-background px-1 rounded">npm publish</code> to
            publish your package
          </p>
        </div>
        <div className="p-6 rounded-xl border border-border bg-surface">
          <div className="text-3xl mb-4">2️⃣</div>
          <h3 className="font-bold text-foreground mb-2">Auto-Discovery</h3>
          <p className="text-sm text-foreground-secondary">
            TPMJS detects your package and extracts tool schemas automatically
          </p>
        </div>
        <div className="p-6 rounded-xl border border-border bg-surface">
          <div className="text-3xl mb-4">3️⃣</div>
          <h3 className="font-bold text-foreground mb-2">Live on Registry</h3>
          <p className="text-sm text-foreground-secondary">
            Your tools appear on tpmjs.com, searchable by AI agents
          </p>
        </div>
      </section>
    </div>
  );
}
