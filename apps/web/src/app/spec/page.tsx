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
              package.json. TPMJS automatically extracts parameter schemas from your tool code, so
              you only need to provide basic metadata.
            </p>

            {/* Auto-extraction callout */}
            <div className="mb-12 p-6 border-2 border-primary/30 rounded-lg bg-primary/5">
              <div className="flex items-start gap-4">
                <div className="text-3xl">✨</div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Automatic Schema Extraction
                  </h3>
                  <p className="text-foreground-secondary mb-4">
                    TPMJS automatically extracts your tool&apos;s input schema (parameters) by
                    analyzing your code when it syncs. You no longer need to manually document
                    parameters, returns, or AI agent guidance in package.json.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-background rounded border border-border">
                      <strong className="text-foreground">inputSchema</strong>
                      <p className="text-foreground-secondary mt-1">
                        Auto-extracted from your Zod schema
                      </p>
                    </div>
                    <div className="p-3 bg-background rounded border border-border">
                      <strong className="text-foreground">parameters</strong>
                      <p className="text-foreground-secondary mt-1">
                        Derived from inputSchema automatically
                      </p>
                    </div>
                    <div className="p-3 bg-background rounded border border-border">
                      <strong className="text-foreground">Tool page</strong>
                      <p className="text-foreground-secondary mt-1">
                        Shows extracted schema with source badge
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Required Fields */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="default" size="lg">
                  Required Fields
                </Badge>
                <span className="text-foreground-secondary">What you need to provide</span>
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
                        <code>tools</code> <span className="text-red-500">*</span>
                      </h4>
                      <p className="text-sm text-foreground-secondary mb-3">
                        Array of tools exported by your package. Each tool needs:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-foreground-secondary ml-4">
                        <li>
                          <code className="text-foreground">exportName</code> - The exported
                          function name (required)
                        </li>
                        <li>
                          <code className="text-foreground">description</code> - What the tool does,
                          20-500 chars (required)
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h5 className="text-sm font-semibold text-foreground mb-3">Minimal Example:</h5>
                    <CodeBlock
                      language="json"
                      code={`{
  "name": "@yourname/my-tool",
  "keywords": ["tpmjs-tool"],
  "tpmjs": {
    "category": "text-analysis",
    "tools": [
      {
        "exportName": "sentimentAnalysisTool",
        "description": "Analyzes sentiment in text and returns positive/negative/neutral classification"
      }
    ]
  }
}`}
                    />
                    <p className="text-sm text-foreground-secondary mt-4">
                      That&apos;s it! TPMJS will automatically extract the inputSchema from your
                      tool when it syncs.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Optional Fields */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="success" size="lg">
                  Optional Fields
                </Badge>
                <span className="text-foreground-secondary">
                  Additional metadata for better visibility
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
                  </div>

                  <div className="mt-6">
                    <h5 className="text-sm font-semibold text-foreground mb-3">
                      Complete Example with Optional Fields:
                    </h5>
                    <CodeBlock
                      language="json"
                      code={`{
  "name": "@yourname/sentiment-tool",
  "keywords": ["tpmjs-tool"],
  "tpmjs": {
    "category": "text-analysis",
    "frameworks": ["vercel-ai", "langchain"],
    "env": [
      {
        "name": "SENTIMENT_API_KEY",
        "description": "API key for sentiment analysis service",
        "required": true
      }
    ],
    "tools": [
      {
        "exportName": "sentimentAnalysisTool",
        "description": "Advanced sentiment analysis with emotion detection"
      }
    ]
  }
}`}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Deprecated Fields */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" size="lg">
                  Deprecated
                </Badge>
                <span className="text-foreground-secondary">
                  Now auto-extracted (kept for backward compatibility)
                </span>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-foreground-secondary mb-4">
                    The following fields are now automatically extracted from your tool code. You no
                    longer need to specify them manually:
                  </p>
                  <ul className="space-y-3 text-sm text-foreground-secondary">
                    <li className="flex items-start gap-2">
                      <code className="text-foreground bg-surface px-2 py-1 rounded">
                        parameters
                      </code>
                      <span>→ Auto-extracted from tool&apos;s Zod inputSchema</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <code className="text-foreground bg-surface px-2 py-1 rounded">returns</code>
                      <span>→ Auto-extracted from tool definition</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <code className="text-foreground bg-surface px-2 py-1 rounded">aiAgent</code>
                      <span>→ Auto-extracted from tool metadata</span>
                    </li>
                  </ul>
                  <p className="text-foreground-secondary mt-4 text-sm">
                    If auto-extraction fails, TPMJS will fall back to any manually provided values.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Schema Extraction */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Schema Extraction</h2>
            <p className="text-lg text-foreground-secondary mb-6">
              When TPMJS syncs your package, it automatically extracts your tool&apos;s inputSchema
              by loading and inspecting your tool in a sandboxed environment.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <div className="text-3xl mb-2">🔄</div>
                  <CardTitle>During Sync</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground-secondary">
                    Schema is extracted automatically when your package is discovered or updated
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="text-3xl mb-2">🏷️</div>
                  <CardTitle>Source Badge</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground-secondary">
                    Tool pages show whether schema was &quot;Auto-extracted&quot; or
                    &quot;Author-provided&quot;
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="text-3xl mb-2">🔁</div>
                  <CardTitle>Manual Re-extract</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground-secondary">
                    Users can trigger re-extraction from the tool page if needed
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-sm font-semibold text-foreground mb-3">How It Works:</h4>
                <ol className="space-y-2 text-sm text-foreground-secondary list-decimal list-inside">
                  <li>Your tool is loaded in a Deno sandbox via esm.sh</li>
                  <li>
                    The <code className="text-foreground">inputSchema</code> property is read from
                    your exported tool
                  </li>
                  <li>The JSON Schema is stored in our database</li>
                  <li>Parameters are derived from the schema for display</li>
                </ol>
              </CardContent>
            </Card>
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
                          <span className="text-red-500">Yes</span>
                        </td>
                        <td className="py-3 px-4">Tool category from predefined list</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4">
                          <code className="text-foreground">tools</code>
                        </td>
                        <td className="py-3 px-4">array</td>
                        <td className="py-3 px-4">
                          <span className="text-red-500">Yes</span>
                        </td>
                        <td className="py-3 px-4">
                          Array of tool definitions (exportName + description)
                        </td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4">
                          <code className="text-foreground">env</code>
                        </td>
                        <td className="py-3 px-4">array</td>
                        <td className="py-3 px-4">No</td>
                        <td className="py-3 px-4">Required environment variables</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4">
                          <code className="text-foreground">frameworks</code>
                        </td>
                        <td className="py-3 px-4">array</td>
                        <td className="py-3 px-4">No</td>
                        <td className="py-3 px-4">Compatible AI frameworks</td>
                      </tr>
                      <tr className="border-b border-border bg-surface/50">
                        <td className="py-3 px-4">
                          <code className="text-foreground-tertiary">parameters</code>
                        </td>
                        <td className="py-3 px-4 text-foreground-tertiary">array</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" size="sm">
                            Deprecated
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-foreground-tertiary">
                          Auto-extracted from tool
                        </td>
                      </tr>
                      <tr className="border-b border-border bg-surface/50">
                        <td className="py-3 px-4">
                          <code className="text-foreground-tertiary">returns</code>
                        </td>
                        <td className="py-3 px-4 text-foreground-tertiary">object</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" size="sm">
                            Deprecated
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-foreground-tertiary">
                          Auto-extracted from tool
                        </td>
                      </tr>
                      <tr className="border-b border-border bg-surface/50">
                        <td className="py-3 px-4">
                          <code className="text-foreground-tertiary">aiAgent</code>
                        </td>
                        <td className="py-3 px-4 text-foreground-tertiary">object</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" size="sm">
                            Deprecated
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-foreground-tertiary">
                          Auto-extracted from tool
                        </td>
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
