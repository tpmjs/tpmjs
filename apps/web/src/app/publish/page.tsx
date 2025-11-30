import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';

export const metadata = {
  title: 'Publish a Tool | TPMJS',
  description: 'Learn how to publish your AI tool to the TPMJS registry',
};

export default function PublishPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 py-16">
        <Container size="lg" padding="lg">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Publish Your AI Tool
            </h1>
            <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
              Share your tool with the world. Automatic discovery, quality scoring, and AI agent
              integration.
            </p>
          </div>

          {/* Quick Start */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Quick Start</h2>
            <div className="prose prose-invert max-w-none">
              <ol className="space-y-4 text-foreground-secondary">
                <li className="text-lg">Create a new NPM package</li>
                <li className="text-lg">
                  Add{' '}
                  <code className="text-foreground bg-surface px-2 py-1 rounded">tpmjs-tool</code>{' '}
                  to keywords
                </li>
                <li className="text-lg">
                  Add a <code className="text-foreground bg-surface px-2 py-1 rounded">tpmjs</code>{' '}
                  field with metadata
                </li>
                <li className="text-lg">Publish to NPM</li>
                <li className="text-lg">
                  Your tool appears on{' '}
                  <Link href="/tool/tool-search" className="text-primary hover:underline">
                    tpmjs.com
                  </Link>{' '}
                  within 15 minutes!
                </li>
              </ol>
            </div>
          </section>

          {/* Step 1: Package.json Setup */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              Step 1: Add Required Keyword
            </h2>
            <p className="text-lg text-foreground-secondary mb-6">
              Add the{' '}
              <code className="text-foreground bg-surface px-2 py-1 rounded">tpmjs-tool</code>{' '}
              keyword to your package.json. This is required for automatic discovery.
            </p>
            <CodeBlock
              language="json"
              code={`{
  "name": "@yourname/my-awesome-tool",
  "version": "1.0.0",
  "keywords": ["tpmjs-tool", "ai", "text"],
  ...
}`}
            />
          </section>

          {/* Step 2: Metadata Tiers */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Step 2: Add TPMJS Metadata</h2>
            <p className="text-lg text-foreground-secondary mb-6">
              There are three tiers of metadata. Higher tiers get better visibility and quality
              scores.
            </p>

            {/* Tier 1: Minimal */}
            <div className="mb-8 p-6 border border-border rounded-lg bg-surface">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-foreground/10 rounded text-sm font-medium text-foreground">
                  Tier 1: Minimal
                </span>
                <span className="text-foreground-secondary">Required fields only</span>
              </div>
              <CodeBlock
                language="json"
                code={`{
  "tpmjs": {
    "category": "text-analysis",
    "description": "A concise description of what your tool does"
  }
}`}
              />
              <p className="mt-4 text-sm text-foreground-secondary">
                Quality Score: <strong className="text-foreground">1x base multiplier</strong>
              </p>
            </div>

            {/* Tier 2: Basic */}
            <div className="mb-8 p-6 border border-border rounded-lg bg-surface">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-primary/20 rounded text-sm font-medium text-foreground">
                  Tier 2: Basic
                </span>
                <span className="text-foreground-secondary">Add parameter & return info</span>
              </div>
              <CodeBlock
                language="json"
                code={`{
  "tpmjs": {
    "category": "text-analysis",
    "description": "Analyzes sentiment in text",
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
        "description": "Language code (e.g., 'en')",
        "required": false,
        "default": "en"
      }
    ],
    "returns": {
      "type": "SentimentResult",
      "description": "Object with score and label"
    }
  }
}`}
              />
              <p className="mt-4 text-sm text-foreground-secondary">
                Quality Score: <strong className="text-foreground">2x base multiplier</strong>
              </p>
            </div>

            {/* Tier 3: Rich */}
            <div className="mb-8 p-6 border border-border rounded-lg bg-surface">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-success/20 rounded text-sm font-medium text-foreground">
                  Tier 3: Rich
                </span>
                <span className="text-foreground-secondary">Full documentation</span>
              </div>
              <CodeBlock
                language="json"
                code={`{
  "tpmjs": {
    "category": "text-analysis",
    "description": "Advanced sentiment analysis with emotion detection",
    "parameters": [...],
    "returns": {...},
    "env": [
      {
        "name": "SENTIMENT_API_KEY",
        "description": "API key for sentiment analysis service",
        "required": true
      }
    ],
    "frameworks": ["vercel-ai", "langchain"],
    "aiAgent": {
      "useCase": "Use when users need to analyze sentiment or detect emotions",
      "limitations": "English and Spanish only. Max 10,000 characters",
      "examples": [
        "Analyze customer review sentiment",
        "Detect emotions in feedback"
      ]
    }
  }
}`}
              />
              <p className="mt-4 text-sm text-foreground-secondary">
                Quality Score: <strong className="text-foreground">4x base multiplier</strong> 🚀
              </p>
            </div>
          </section>

          {/* Categories */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Available Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'text-analysis', desc: 'NLP, sentiment, summarization' },
                { name: 'code-generation', desc: 'Code generation and transformation' },
                { name: 'data-processing', desc: 'Data manipulation and transformation' },
                { name: 'image-generation', desc: 'Image creation and editing' },
                { name: 'audio-processing', desc: 'Audio/speech processing' },
                { name: 'search', desc: 'Search and retrieval' },
                { name: 'integration', desc: 'Third-party integrations' },
                { name: 'other', desc: 'Anything else' },
              ].map((cat) => (
                <div key={cat.name} className="p-4 border border-border rounded-lg bg-surface">
                  <code className="text-foreground font-medium">{cat.name}</code>
                  <p className="text-sm text-foreground-secondary mt-1">{cat.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Step 3: Publish */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Step 3: Publish to NPM</h2>
            <p className="text-lg text-foreground-secondary mb-6">
              Build your package and publish it to NPM. Your tool will be automatically discovered
              within 15 minutes.
            </p>
            <CodeBlock
              language="bash"
              code={`# Build your package
npm run build

# Publish to NPM (use --access public for scoped packages)
npm publish --access public

# That's it! Your tool will appear on tpmjs.com soon`}
            />
          </section>

          {/* Quality Score */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Quality Score</h2>
            <p className="text-lg text-foreground-secondary mb-6">
              Your tool gets a quality score based on three factors:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Tier</h3>
                <ul className="space-y-2 text-foreground-secondary">
                  <li>Rich: 4x multiplier</li>
                  <li>Basic: 2x multiplier</li>
                  <li>Minimal: 1x multiplier</li>
                </ul>
              </div>
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Downloads</h3>
                <p className="text-foreground-secondary">
                  Logarithmic scale based on monthly NPM downloads
                </p>
              </div>
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-3 text-foreground">GitHub Stars</h3>
                <p className="text-foreground-secondary">
                  Logarithmic scale based on repository stars
                </p>
              </div>
            </div>
          </section>

          {/* Real Example */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Real Example</h2>
            <p className="text-lg text-foreground-secondary mb-6">
              Here is a complete example from{' '}
              <Link
                href="/tool/@tpmjs/createblogpost"
                className="text-primary hover:underline font-medium"
              >
                @tpmjs/createblogpost
              </Link>
              :
            </p>
            <CodeBlock
              language="json"
              code={`{
  "name": "@tpmjs/createblogpost",
  "version": "0.2.0",
  "keywords": ["tpmjs-tool", "blog", "content"],
  "tpmjs": {
    "category": "text-analysis",
    "description": "Creates structured blog posts with frontmatter and SEO metadata",
    "parameters": [
      {
        "name": "title",
        "type": "string",
        "description": "The title of the blog post",
        "required": true
      },
      {
        "name": "content",
        "type": "string",
        "description": "The main content",
        "required": true
      }
    ],
    "returns": {
      "type": "BlogPost",
      "description": "Structured blog post with frontmatter"
    },
    "frameworks": ["vercel-ai", "langchain"]
  }
}`}
            />
          </section>

          {/* Tips */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Tips for Success</h2>
            <div className="space-y-4">
              {[
                {
                  icon: '📝',
                  title: 'Use descriptive names',
                  desc: 'Make your package name clear and searchable',
                },
                {
                  icon: '📊',
                  title: 'Complete metadata',
                  desc: 'Rich tier tools get 4x better visibility',
                },
                {
                  icon: '📚',
                  title: 'Good documentation',
                  desc: 'Add documentation URL to package.json homepage or repository fields',
                },
                {
                  icon: '🔄',
                  title: 'Active maintenance',
                  desc: 'Regular updates boost download counts',
                },
                {
                  icon: '🤖',
                  title: 'AI-friendly descriptions',
                  desc: 'Write aiAgent.useCase as guidance for AI agents',
                },
              ].map((tip) => (
                <div
                  key={tip.title}
                  className="flex gap-4 p-6 border border-border rounded-lg bg-surface"
                >
                  <div className="text-4xl">{tip.icon}</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">{tip.title}</h3>
                    <p className="text-foreground-secondary">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-16 px-6 border border-border rounded-lg bg-surface">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Publish?</h2>
            <p className="text-xl text-foreground-secondary mb-8 max-w-2xl mx-auto">
              Follow the steps above and your tool will be live on TPMJS within 15 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/tool/tool-search">
                <Button size="lg" variant="default">
                  Browse Existing Tools
                </Button>
              </Link>
              <a href="https://github.com/tpmjs/tpmjs" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline">
                  View on GitHub
                </Button>
              </a>
            </div>
          </section>
        </Container>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <Container size="xl" padding="lg">
          <div className="text-center text-foreground-secondary">
            <p>
              Questions?{' '}
              <a
                href="https://github.com/tpmjs/tpmjs/issues"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                File an issue on GitHub
              </a>
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
