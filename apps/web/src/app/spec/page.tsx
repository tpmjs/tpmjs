import { TPMJS_CATEGORIES } from '@tpmjs/types/tpmjs';
import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';

export const metadata = {
  title: 'TPMJS Specification | The Open Standard for AI Tool Discovery',
  description:
    'Complete technical reference for the TPMJS specification - field definitions, validation rules, and integration guide for AI tool developers.',
};

export default function SpecPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 py-16">
        <Container size="lg" padding="lg">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              TPMJS Specification
            </h1>
            <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
              The open standard for AI tool discovery and integration
            </p>
          </div>

          {/* What is TPMJS */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">What is TPMJS?</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-foreground-secondary mb-4">
                TPMJS (Tool Package Manager for JavaScript) is an open standard and registry for AI
                tool discovery and integration. It solves the problem of fragmented AI tool
                ecosystems by providing:
              </p>
              <ul className="space-y-2 text-foreground-secondary list-disc list-inside">
                <li>
                  <strong className="text-foreground">Automatic Discovery</strong> - Tools are
                  automatically indexed from NPM based on keywords
                </li>
                <li>
                  <strong className="text-foreground">Standardized Metadata</strong> - A unified
                  specification for describing tool capabilities
                </li>
                <li>
                  <strong className="text-foreground">Quality Scoring</strong> - Algorithmic ranking
                  based on documentation completeness and community adoption
                </li>
                <li>
                  <strong className="text-foreground">AI Agent Integration</strong> - Structured
                  metadata optimized for LLM tool selection
                </li>
              </ul>
            </div>
          </section>

          {/* How it Works */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">How it Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="text-3xl mb-2">📦</div>
                  <CardTitle>1. Publish to NPM</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground-secondary">
                    Add the{' '}
                    <code className="text-foreground bg-surface px-1 rounded">tpmjs-tool</code>{' '}
                    keyword and a{' '}
                    <code className="text-foreground bg-surface px-1 rounded">tpmjs</code> metadata
                    field to your package.json
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="text-3xl mb-2">🔍</div>
                  <CardTitle>2. Automatic Discovery</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground-secondary">
                    TPMJS monitors NPM every 2 minutes for new tools and updates the registry
                    automatically
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="text-3xl mb-2">⚡</div>
                  <CardTitle>3. Instant Availability</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground-secondary">
                    Your tool appears on tpmjs.com within 15 minutes, searchable by AI agents and
                    developers
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* The Specification */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">The Specification</h2>
            <p className="text-lg text-foreground-secondary mb-8">
              The TPMJS specification defines a{' '}
              <code className="text-foreground bg-surface px-2 py-1 rounded">tpmjs</code> field in
              package.json with three tiers of metadata. Higher tiers receive better visibility and
              quality scores.
            </p>

            {/* Tier 1: Minimal */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" size="lg">
                  Tier 1: Minimal
                </Badge>
                <span className="text-foreground-secondary">Required fields only</span>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        <code>category</code> <span className="text-red-500">*</span>
                      </h4>
                      <p className="text-sm text-foreground-secondary mb-3">
                        Tool category for organization. Must be one of the following:
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {TPMJS_CATEGORIES.map((cat) => (
                          <Badge key={cat} variant="secondary" size="sm">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        <code>description</code> <span className="text-red-500">*</span>
                      </h4>
                      <p className="text-sm text-foreground-secondary">
                        Clear description of what the tool does. Must be 20-500 characters. This
                        appears in search results and tool listings.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h5 className="text-sm font-semibold text-foreground mb-3">Example:</h5>
                    <CodeBlock
                      language="json"
                      code={`{
  "tpmjs": {
    "category": "text-analysis",
    "description": "Analyzes sentiment in text and returns positive/negative/neutral classification"
  }
}`}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tier 2: Basic */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="default" size="lg">
                  Tier 2: Basic
                </Badge>
                <span className="text-foreground-secondary">
                  + Parameter and return type documentation
                </span>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        <code>parameters</code>
                      </h4>
                      <p className="text-sm text-foreground-secondary mb-3">
                        Array of parameter objects describing function inputs. Each parameter has:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-foreground-secondary ml-4">
                        <li>
                          <code className="text-foreground">name</code> - Parameter name
                        </li>
                        <li>
                          <code className="text-foreground">type</code> - TypeScript type
                        </li>
                        <li>
                          <code className="text-foreground">description</code> - What it does
                        </li>
                        <li>
                          <code className="text-foreground">required</code> - Boolean
                        </li>
                        <li>
                          <code className="text-foreground">default</code> - Default value
                          (optional)
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        <code>returns</code>
                      </h4>
                      <p className="text-sm text-foreground-secondary mb-3">
                        Object describing the return value:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-foreground-secondary ml-4">
                        <li>
                          <code className="text-foreground">type</code> - Return type
                        </li>
                        <li>
                          <code className="text-foreground">description</code> - What is returned
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h5 className="text-sm font-semibold text-foreground mb-3">Example:</h5>
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
        "description": "Language code (e.g., 'en', 'es')",
        "required": false,
        "default": "en"
      }
    ],
    "returns": {
      "type": "SentimentResult",
      "description": "Object with score (-1 to 1) and label (positive/negative/neutral)"
    }
  }
}`}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tier 3: Rich */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="success" size="lg">
                  Tier 3: Rich
                </Badge>
                <span className="text-foreground-secondary">
                  + Complete metadata for maximum visibility
                </span>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        <code>env</code>
                      </h4>
                      <p className="text-sm text-foreground-secondary mb-2">
                        Array of environment variables required by the tool. Each variable has:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-foreground-secondary ml-4">
                        <li>
                          <code className="text-foreground">name</code> - Environment variable name
                          (e.g., &quot;OPENAI_API_KEY&quot;)
                        </li>
                        <li>
                          <code className="text-foreground">description</code> - What the variable
                          is used for
                        </li>
                        <li>
                          <code className="text-foreground">required</code> - Boolean (defaults to
                          true)
                        </li>
                        <li>
                          <code className="text-foreground">default</code> - Default value if not
                          provided (optional)
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        <code>frameworks</code>
                      </h4>
                      <p className="text-sm text-foreground-secondary mb-2">
                        Array of compatible AI frameworks. Supported values:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[
                          'vercel-ai',
                          'langchain',
                          'llamaindex',
                          'haystack',
                          'semantic-kernel',
                        ].map((fw) => (
                          <Badge key={fw} variant="outline" size="sm">
                            {fw}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        <code>aiAgent</code>
                      </h4>
                      <p className="text-sm text-foreground-secondary mb-2">
                        AI agent integration guidance. Helps LLMs understand when and how to use
                        your tool:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-foreground-secondary ml-4">
                        <li>
                          <code className="text-foreground">useCase</code> - When to use this tool
                          (min 10 chars, required)
                        </li>
                        <li>
                          <code className="text-foreground">limitations</code> - Known constraints
                          (optional)
                        </li>
                        <li>
                          <code className="text-foreground">examples</code> - Array of example use
                          cases (optional)
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h5 className="text-sm font-semibold text-foreground mb-3">
                      Complete Example:
                    </h5>
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
      "useCase": "Use when users need to analyze sentiment or detect emotions in text",
      "limitations": "English and Spanish only. Max 10,000 characters per request.",
      "examples": [
        "Analyze customer review sentiment",
        "Detect emotions in user feedback"
      ]
    }
  }
}`}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Field Reference Table */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Field Reference</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-foreground">Field</th>
                        <th className="text-left py-3 px-4 text-foreground">Type</th>
                        <th className="text-left py-3 px-4 text-foreground">Tier</th>
                        <th className="text-left py-3 px-4 text-foreground">Required</th>
                        <th className="text-left py-3 px-4 text-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-foreground-secondary">
                      <tr className="border-b border-border">
                        <td className="py-3 px-4">
                          <code className="text-foreground">category</code>
                        </td>
                        <td className="py-3 px-4">string</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" size="sm">
                            Minimal
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-red-500">Yes</span>
                        </td>
                        <td className="py-3 px-4">Tool category from predefined list</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4">
                          <code className="text-foreground">description</code>
                        </td>
                        <td className="py-3 px-4">string</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" size="sm">
                            Minimal
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-red-500">Yes</span>
                        </td>
                        <td className="py-3 px-4">Tool description (20-500 chars)</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4">
                          <code className="text-foreground">parameters</code>
                        </td>
                        <td className="py-3 px-4">array</td>
                        <td className="py-3 px-4">
                          <Badge variant="default" size="sm">
                            Basic
                          </Badge>
                        </td>
                        <td className="py-3 px-4">No</td>
                        <td className="py-3 px-4">Function parameter definitions</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4">
                          <code className="text-foreground">returns</code>
                        </td>
                        <td className="py-3 px-4">object</td>
                        <td className="py-3 px-4">
                          <Badge variant="default" size="sm">
                            Basic
                          </Badge>
                        </td>
                        <td className="py-3 px-4">No</td>
                        <td className="py-3 px-4">Return type definition</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4">
                          <code className="text-foreground">env</code>
                        </td>
                        <td className="py-3 px-4">array</td>
                        <td className="py-3 px-4">
                          <Badge variant="success" size="sm">
                            Rich
                          </Badge>
                        </td>
                        <td className="py-3 px-4">No</td>
                        <td className="py-3 px-4">Required environment variables</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4">
                          <code className="text-foreground">frameworks</code>
                        </td>
                        <td className="py-3 px-4">array</td>
                        <td className="py-3 px-4">
                          <Badge variant="success" size="sm">
                            Rich
                          </Badge>
                        </td>
                        <td className="py-3 px-4">No</td>
                        <td className="py-3 px-4">Compatible AI frameworks</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4">
                          <code className="text-foreground">aiAgent</code>
                        </td>
                        <td className="py-3 px-4">object</td>
                        <td className="py-3 px-4">
                          <Badge variant="success" size="sm">
                            Rich
                          </Badge>
                        </td>
                        <td className="py-3 px-4">No</td>
                        <td className="py-3 px-4">AI agent integration guidance</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Quality Score */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Quality Score</h2>
            <p className="text-lg text-foreground-secondary mb-6">
              Tools are ranked by quality score, calculated from three factors:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tier Multiplier</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-foreground-secondary">
                    <li>
                      <strong className="text-foreground">Rich:</strong> 4x multiplier
                    </li>
                    <li>
                      <strong className="text-foreground">Basic:</strong> 2x multiplier
                    </li>
                    <li>
                      <strong className="text-foreground">Minimal:</strong> 1x multiplier
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>NPM Downloads</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground-secondary">
                    Logarithmic scale based on monthly downloads. More downloads = higher score.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>GitHub Stars</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground-secondary">
                    Logarithmic scale based on repository stars. Community validation boosts
                    visibility.
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-sm font-semibold text-foreground mb-3">Formula:</h4>
                <CodeBlock
                  language="typescript"
                  code={`function calculateQualityScore(params: {
  tier: 'minimal' | 'basic' | 'rich';
  downloads: number;
  githubStars: number;
}): number {
  const tierScore = tier === 'rich' ? 0.6 : tier === 'basic' ? 0.4 : 0.2;
  const downloadsScore = Math.min(0.3, Math.log10(downloads + 1) / 10);
  const starsScore = Math.min(0.1, Math.log10(githubStars + 1) / 10);

  return Math.min(1.0, tierScore + downloadsScore + starsScore);
}`}
                />
              </CardContent>
            </Card>
          </section>

          {/* Discovery & Sync */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Discovery & Sync</h2>
            <p className="text-lg text-foreground-secondary mb-6">
              TPMJS automatically discovers and updates tools using three strategies:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Changes Feed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground-secondary mb-2">
                    Monitors NPM&apos;s real-time changes feed every 2 minutes
                  </p>
                  <Badge variant="outline" size="sm">
                    Real-time
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Keyword Search</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground-secondary mb-2">
                    Searches for{' '}
                    <code className="text-foreground bg-surface px-1 rounded">tpmjs-tool</code>{' '}
                    keyword every 15 minutes
                  </p>
                  <Badge variant="outline" size="sm">
                    Every 15 min
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Metrics Update</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground-secondary mb-2">
                    Updates download stats and quality scores hourly
                  </p>
                  <Badge variant="outline" size="sm">
                    Hourly
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Validation */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Validation</h2>
            <p className="text-lg text-foreground-secondary mb-6">
              The TPMJS specification is validated using Zod schemas. The validation logic is
              available in the{' '}
              <a
                href="https://www.npmjs.com/package/@tpmjs/types"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @tpmjs/types
              </a>{' '}
              package.
            </p>
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  Common Validation Errors:
                </h4>
                <ul className="space-y-2 text-sm text-foreground-secondary list-disc list-inside">
                  <li>
                    <strong className="text-foreground">Invalid category:</strong> Category must be
                    one of the 12 predefined values
                  </li>
                  <li>
                    <strong className="text-foreground">Description too short/long:</strong>{' '}
                    Description must be 20-500 characters
                  </li>
                  <li>
                    <strong className="text-foreground">Invalid env:</strong> Each environment
                    variable must have a name and description
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Publishing Your Tool */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Publishing Your Tool</h2>
            <p className="text-lg text-foreground-secondary mb-6">
              Publishing a tool to TPMJS is simple:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl mb-2">1️⃣</div>
                  <p className="text-sm text-foreground-secondary">
                    Add <code className="text-foreground bg-surface px-1 rounded">tpmjs-tool</code>{' '}
                    keyword
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl mb-2">2️⃣</div>
                  <p className="text-sm text-foreground-secondary">
                    Add <code className="text-foreground bg-surface px-1 rounded">tpmjs</code> field
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl mb-2">3️⃣</div>
                  <p className="text-sm text-foreground-secondary">Publish to NPM</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-sm text-foreground-secondary">
                    Appears on tpmjs.com in 15 min
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="text-center">
              <Link href="/publish">
                <Button size="lg" variant="default">
                  View Complete Publishing Guide →
                </Button>
              </Link>
            </div>
          </section>

          {/* Support & Resources */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Support & Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Documentation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link
                    href="/publish"
                    className="block text-sm text-foreground-secondary hover:text-primary"
                  >
                    → Publishing Guide
                  </Link>
                  <a
                    href="https://github.com/tpmjs/tpmjs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-foreground-secondary hover:text-primary"
                  >
                    → GitHub Repository
                  </a>
                  <a
                    href="https://www.npmjs.com/package/@tpmjs/types"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-foreground-secondary hover:text-primary"
                  >
                    → TypeScript Types Package
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Examples</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link
                    href="/tool/tool-search"
                    className="block text-sm text-foreground-secondary hover:text-primary"
                  >
                    → Browse All Tools
                  </Link>
                  <Link
                    href="/playground"
                    className="block text-sm text-foreground-secondary hover:text-primary"
                  >
                    → Try the Playground
                  </Link>
                  <a
                    href="https://github.com/tpmjs/tpmjs/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-foreground-secondary hover:text-primary"
                  >
                    → Report Issues or Ask Questions
                  </a>
                </CardContent>
              </Card>
            </div>
          </section>
        </Container>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-surface">
        <Container size="xl" padding="lg">
          <div className="text-center text-foreground-secondary">
            <p>
              TPMJS is an open standard. Contribute on{' '}
              <a
                href="https://github.com/tpmjs/tpmjs"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
