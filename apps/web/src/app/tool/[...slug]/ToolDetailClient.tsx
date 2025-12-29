'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { ProgressBar } from '@tpmjs/ui/ProgressBar/ProgressBar';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import Link from 'next/link';
import { useState } from 'react';
import { AppHeader } from '~/components/AppHeader';
import { BundleSize } from '~/components/BundleSize';
import { DownloadSparkline } from '~/components/DownloadSparkline';
import { Markdown } from '~/components/Markdown';
import { ToolPlayground } from '~/components/ToolPlayground';

interface Package {
  id: string;
  npmPackageName: string;
  npmVersion: string;
  npmDescription: string | null;
  npmHomepage: string | null;
  category: string;
  npmRepository: { url: string; type: string } | null;
  isOfficial: boolean;
  npmDownloadsLastMonth: number | null;
  npmKeywords: string[];
  npmReadme: string | null;
  npmAuthor: { name: string; email?: string; url?: string } | string | null;
  npmMaintainers: Array<{ name: string; email?: string }> | null;
  npmLicense: string | null;
  githubStars: number | null;
  frameworks: string[];
  tier: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    default?: unknown;
  }> | null;
  inputSchema: Record<string, unknown> | null;
  schemaSource: 'extracted' | 'author' | null;
  schemaExtractedAt: string | null;
  toolDiscoverySource: 'auto' | 'manual' | null;
  returns: {
    type: string;
    description: string;
  } | null;
  aiAgent: {
    useCase?: string;
    limitations?: string;
    examples?: string[];
  } | null;
  qualityScore: string | null;
  importHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
  executionHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
  healthCheckError?: string | null;
  lastHealthCheck?: string | null;
  package: Package;
  createdAt: string;
  updatedAt: string;
}

interface ToolDetailClientProps {
  tool: Tool;
  slug: string;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex UI component with many conditional renders
export function ToolDetailClient({ tool, slug }: ToolDetailClientProps): React.ReactElement {
  const [recheckLoading, setRecheckLoading] = useState(false);
  const [extractSchemaLoading, setExtractSchemaLoading] = useState(false);

  const pkg = tool.package;
  const authorName = typeof pkg.npmAuthor === 'string' ? pkg.npmAuthor : pkg.npmAuthor?.name;

  // Generate JSON-LD structured data for SEO
  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': authorName ? 'Person' : 'Organization',
      name: authorName || 'Unknown',
    },
    url: `https://tpmjs.com/tool/${pkg.npmPackageName}/${tool.name}`,
    softwareVersion: pkg.npmVersion,
    ...(pkg.npmHomepage && { mainEntityOfPage: pkg.npmHomepage }),
    ...(pkg.npmRepository &&
      typeof pkg.npmRepository === 'object' &&
      pkg.npmRepository.url && {
        codeRepository: pkg.npmRepository.url.replace(/^git\+/, '').replace(/\.git$/, ''),
      }),
    ...(pkg.npmLicense && { license: pkg.npmLicense }),
    ...(pkg.npmDownloadsLastMonth && {
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/DownloadAction',
        userInteractionCount: pkg.npmDownloadsLastMonth,
      },
    }),
    ...(pkg.githubStars && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Math.min(5, (pkg.githubStars / 1000) * 5),
        bestRating: 5,
        worstRating: 0,
      },
    }),
  };

  const recheckHealth = async () => {
    setRecheckLoading(true);
    try {
      const response = await fetch(`/api/tools/${slug}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Recheck failed');
        return;
      }

      // Refresh page to show updated health
      window.location.reload();
    } catch {
      alert('Failed to recheck health');
    } finally {
      setRecheckLoading(false);
    }
  };

  const extractSchema = async () => {
    if (!tool) return;

    setExtractSchemaLoading(true);
    try {
      const response = await fetch('/api/tools/extract-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName: tool.package.npmPackageName,
          name: tool.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || data.error || 'Schema extraction failed');
        return;
      }

      if (data.success) {
        // Refresh page to show updated schema
        window.location.reload();
      } else {
        alert(data.message || 'Schema extraction failed');
      }
    } catch {
      alert('Failed to extract schema');
    } finally {
      setExtractSchemaLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <AppHeader />

      {/* Main content */}
      <Container size="xl" padding="md" className="py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-foreground-secondary mb-6">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link href="/tool/tool-search" className="hover:text-foreground">
            Tools
          </Link>
          <span>/</span>
          <span className="text-foreground">{pkg.npmPackageName}</span>
        </div>

        {/* Title section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
                {tool.name}
              </h1>
              <p className="text-sm text-foreground-tertiary font-mono mb-2">
                {pkg.npmPackageName}
              </p>
              <p className="text-lg text-foreground-secondary">{tool.description}</p>
              {authorName && (
                <p className="text-sm text-foreground-tertiary mt-2">
                  by <span className="text-foreground-secondary">{authorName}</span>
                </p>
              )}
            </div>
            {pkg.isOfficial && (
              <Badge variant="default" size="lg">
                Official
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{pkg.category}</Badge>
            <Badge variant="outline">v{pkg.npmVersion}</Badge>
            {pkg.npmLicense && <Badge variant="outline">{pkg.npmLicense}</Badge>}
            {tool.toolDiscoverySource === 'auto' && (
              <Badge variant="warning" size="sm">
                Auto-discovered
              </Badge>
            )}
          </div>
        </div>

        {/* Auto-discovery info banner */}
        {tool.toolDiscoverySource === 'auto' && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">🔍</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  Auto-discovered tool
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  This tool was automatically discovered from the package exports. The author did
                  not explicitly register it in their{' '}
                  <code className="font-mono">package.json</code>. Schema and description were
                  auto-extracted.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Health warning banner */}
        {(tool.importHealth === 'BROKEN' || tool.executionHealth === 'BROKEN') && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">⚠️</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                  This tool is currently broken
                </h3>
                <div className="space-y-1 text-sm text-red-700 dark:text-red-400">
                  {tool.importHealth === 'BROKEN' && (
                    <div className="flex items-center gap-2">
                      <Badge variant="error" size="sm">
                        Import Failed
                      </Badge>
                      <span className="text-xs">Cannot load from Railway service</span>
                    </div>
                  )}
                  {tool.executionHealth === 'BROKEN' && (
                    <div className="flex items-center gap-2">
                      <Badge variant="error" size="sm">
                        Execution Failed
                      </Badge>
                      <span className="text-xs">Runtime error with test parameters</span>
                    </div>
                  )}
                </div>
                {tool.healthCheckError && (
                  <pre className="mt-2 p-2 rounded bg-red-100 dark:bg-red-900/30 text-xs font-mono text-red-800 dark:text-red-300 overflow-x-auto whitespace-pre-wrap">
                    {tool.healthCheckError}
                  </pre>
                )}
                {tool.lastHealthCheck && (
                  <p className="text-xs text-red-600 dark:text-red-500 mt-2">
                    Last checked: {new Date(tool.lastHealthCheck).toLocaleString()}
                  </p>
                )}
                <button
                  type="button"
                  onClick={recheckHealth}
                  disabled={recheckLoading}
                  className="mt-3 text-sm font-medium text-red-700 dark:text-red-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {recheckLoading ? 'Rechecking...' : 'Recheck health →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Interactive Playground */}
            {/* biome-ignore lint/suspicious/noExplicitAny: Prisma Tool type compatibility with component props */}
            <ToolPlayground tool={tool as any} />

            {/* Installation & Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Installation & Usage</CardTitle>
                <CardDescription>Install this tool and use it with the AI SDK</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    1. Install the package
                  </h4>
                  <div className="space-y-2">
                    <CodeBlock
                      code={`npm install ${pkg.npmPackageName}`}
                      language="bash"
                      showCopy={true}
                    />
                    <CodeBlock
                      code={`pnpm add ${pkg.npmPackageName}`}
                      language="bash"
                      showCopy={true}
                    />
                    <CodeBlock
                      code={`yarn add ${pkg.npmPackageName}`}
                      language="bash"
                      showCopy={true}
                    />
                    <CodeBlock
                      code={`bun add ${pkg.npmPackageName}`}
                      language="bash"
                      showCopy={true}
                    />
                    <CodeBlock
                      code={`deno add npm:${pkg.npmPackageName}`}
                      language="bash"
                      showCopy={true}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">2. Import the tool</h4>
                  <CodeBlock
                    code={`import { ${tool.name} } from '${pkg.npmPackageName}';`}
                    language="typescript"
                    showCopy={true}
                  />
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">3. Use with AI SDK</h4>
                  <CodeBlock
                    code={`import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { ${tool.name} } from '${pkg.npmPackageName}';

const result = await generateText({
  model: openai('gpt-4o'),
  tools: { ${tool.name} },
  prompt: 'Your prompt here...',
});

console.log(result.text);`}
                    language="typescript"
                    showCopy={true}
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Agent Information */}
            {tool.aiAgent && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Agent Integration</CardTitle>
                  <CardDescription>How AI agents can use this tool</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tool.aiAgent.useCase && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Use Case</h4>
                      <p className="text-sm text-foreground-secondary">{tool.aiAgent.useCase}</p>
                    </div>
                  )}
                  {tool.aiAgent.limitations && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Limitations</h4>
                      <p className="text-sm text-foreground-secondary">
                        {tool.aiAgent.limitations}
                      </p>
                    </div>
                  )}
                  {tool.aiAgent.examples && tool.aiAgent.examples.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Examples</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {tool.aiAgent.examples.map((example) => (
                          <li key={example} className="text-sm text-foreground-secondary">
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Parameters / Input Schema */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Parameters</CardTitle>
                    <CardDescription>Available configuration options</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {tool.schemaSource === 'extracted' ? (
                      <Badge variant="default" size="sm">
                        Auto-extracted
                      </Badge>
                    ) : tool.schemaSource === 'author' ? (
                      <Badge variant="secondary" size="sm">
                        Author-provided
                      </Badge>
                    ) : (
                      <Badge variant="outline" size="sm">
                        No schema
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {tool.parameters && tool.parameters.length > 0 ? (
                  <div className="space-y-4">
                    {tool.parameters.map((param) => (
                      <div key={param.name} className="border-b border-border pb-4 last:border-0">
                        <div className="flex items-start justify-between mb-2">
                          <code className="text-sm font-mono text-foreground">{param.name}</code>
                          {param.required ? (
                            <Badge variant="error" size="sm">
                              Required
                            </Badge>
                          ) : (
                            <Badge variant="outline" size="sm">
                              Optional
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-foreground-secondary mb-1">
                          <span className="font-semibold">Type: </span>
                          <code className="font-mono">{param.type}</code>
                        </div>
                        <p className="text-sm text-foreground-secondary">{param.description}</p>
                        {param.default !== undefined && (
                          <div className="text-sm text-foreground-tertiary mt-1">
                            <span className="font-semibold">Default: </span>
                            <code className="font-mono">{JSON.stringify(param.default)}</code>
                          </div>
                        )}
                      </div>
                    ))}
                    {tool.schemaExtractedAt && (
                      <p className="text-xs text-foreground-tertiary">
                        Schema extracted: {new Date(tool.schemaExtractedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-foreground-secondary mb-4">
                      No schema available for this tool.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={extractSchema}
                      disabled={extractSchemaLoading}
                    >
                      {extractSchemaLoading ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Extracting...
                        </>
                      ) : (
                        'Extract Schema'
                      )}
                    </Button>
                  </div>
                )}
                {tool.schemaSource !== 'extracted' &&
                  tool.parameters &&
                  tool.parameters.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={extractSchema}
                        disabled={extractSchemaLoading}
                      >
                        {extractSchemaLoading ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Extracting...
                          </>
                        ) : (
                          'Re-extract Schema'
                        )}
                      </Button>
                      <p className="text-xs text-foreground-tertiary mt-2">
                        Try to auto-extract schema from the package
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* README */}
            {pkg.npmReadme && (
              <Card>
                <CardHeader>
                  <CardTitle>README</CardTitle>
                </CardHeader>
                <CardContent>
                  <Markdown content={pkg.npmReadme} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column - Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-foreground-secondary mb-1">Downloads/month</p>
                  <p className="text-2xl font-bold text-foreground">
                    {pkg.npmDownloadsLastMonth?.toLocaleString() || '0'}
                  </p>
                  <div className="mt-2">
                    <DownloadSparkline packageName={pkg.npmPackageName} />
                  </div>
                </div>
                {pkg.githubStars != null && (
                  <div>
                    <p className="text-sm text-foreground-secondary mb-1">GitHub Stars</p>
                    <p className="text-2xl font-bold text-foreground">
                      {pkg.githubStars.toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-foreground-secondary mb-2">Quality Score</p>
                  <ProgressBar
                    value={(tool.qualityScore ? Number.parseFloat(tool.qualityScore) : 0) * 100}
                    variant={
                      tool.qualityScore && Number.parseFloat(tool.qualityScore) >= 0.7
                        ? 'success'
                        : tool.qualityScore && Number.parseFloat(tool.qualityScore) >= 0.5
                          ? 'primary'
                          : 'warning'
                    }
                    size="md"
                    showLabel={true}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bundle Size */}
            <BundleSize packageName={pkg.npmPackageName} version={pkg.npmVersion} />

            {/* NPM Keywords */}
            {pkg.npmKeywords && pkg.npmKeywords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>NPM Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {pkg.npmKeywords.map((keyword) => (
                      <Badge key={keyword} variant="outline" size="sm">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Maintainers */}
            {pkg.npmMaintainers && pkg.npmMaintainers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Maintainers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pkg.npmMaintainers.map((maintainer) => (
                      <div key={maintainer.name} className="text-sm">
                        <span className="text-foreground font-medium">{maintainer.name}</span>
                        {maintainer.email && (
                          <span className="text-foreground-tertiary ml-2">
                            ({maintainer.email})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Links */}
            <Card>
              <CardHeader>
                <CardTitle>Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a
                  href={`https://www.npmjs.com/package/${pkg.npmPackageName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground"
                >
                  <Icon icon="externalLink" size="sm" />
                  <span>View on NPM</span>
                </a>
                {pkg.npmHomepage && (
                  <a
                    href={pkg.npmHomepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground"
                  >
                    <Icon icon="externalLink" size="sm" />
                    <span>Homepage</span>
                  </a>
                )}
                {pkg.npmRepository &&
                  typeof pkg.npmRepository === 'object' &&
                  pkg.npmRepository.url && (
                    <a
                      href={pkg.npmRepository.url.replace(/^git\+/, '').replace(/\.git$/, '')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground"
                    >
                      <Icon icon="github" size="sm" />
                      <span>Repository</span>
                    </a>
                  )}
              </CardContent>
            </Card>

            {/* Frameworks */}
            {pkg.frameworks && pkg.frameworks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Frameworks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {pkg.frameworks.map((framework) => (
                      <Badge key={framework} variant="secondary" size="sm">
                        {framework}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
