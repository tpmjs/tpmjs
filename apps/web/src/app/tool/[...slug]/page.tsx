'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { ProgressBar } from '@tpmjs/ui/ProgressBar/ProgressBar';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';
import { Markdown } from '~/components/Markdown';
import { ToolPlayground } from '~/components/ToolPlayground';

interface Tool {
  id: string;
  npmPackageName: string;
  npmVersion: string;
  description: string;
  category: string;
  tags: string[];
  npmRepository: { url: string; type: string } | null;
  qualityScore: string;
  isOfficial: boolean;
  npmDownloadsLastMonth: number;
  npmDownloadsLastWeek: number;
  npmKeywords: string[];
  npmReadme: string | null;
  npmAuthor: { name: string; email?: string; url?: string } | string | null;
  npmMaintainers: Array<{ name: string; email?: string }> | null;
  tpmjsMetadata: {
    example?: string;
    parameters?: Array<{
      name: string;
      type: string;
      description: string;
      required: boolean;
      default?: unknown;
    }>;
    returns?: {
      type: string;
      description: string;
    };
    authentication?: {
      required: boolean;
      type?: string;
    };
    pricing?: {
      model: string;
    };
    frameworks?: string[];
    links?: {
      documentation?: string;
      repository?: string;
      homepage?: string;
    };
    aiAgent?: {
      useCase?: string;
      limitations?: string;
      examples?: string[];
    };
  } | null;
  githubStars: number | null;
  npmLicense: string | null;
  createdAt: string;
  updatedAt: string;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex UI component with many conditional renders
export default function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): React.ReactElement {
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>('');

  useEffect(() => {
    // Join slug array to reconstruct package name (e.g., ['@tpmjs', 'text-transformer'] -> '@tpmjs/text-transformer')
    params.then((p) => setSlug(p.slug.join('/')));
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    const fetchTool = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tools/${slug}`);
        const data = await response.json();

        if (data.success) {
          setTool(data.data);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch tool');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTool();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <Container size="xl" padding="md" className="py-12">
          <div className="text-center text-foreground-secondary">Loading tool...</div>
        </Container>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <Container size="xl" padding="md" className="py-12">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-4">{error || 'Tool not found'}</p>
            <Link href="/tool/tool-search">
              <Button variant="default">Browse All Tools</Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const authorName = typeof tool.npmAuthor === 'string' ? tool.npmAuthor : tool.npmAuthor?.name;

  return (
    <div className="min-h-screen bg-background">
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
          <span className="text-foreground">{tool.npmPackageName}</span>
        </div>

        {/* Title section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{tool.npmPackageName}</h1>
              <p className="text-lg text-foreground-secondary">{tool.description}</p>
              {authorName && (
                <p className="text-sm text-foreground-tertiary mt-2">
                  by <span className="text-foreground-secondary">{authorName}</span>
                </p>
              )}
            </div>
            {tool.isOfficial && (
              <Badge variant="default" size="lg">
                Official
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{tool.category}</Badge>
            <Badge variant="outline">v{tool.npmVersion}</Badge>
            {tool.npmLicense && <Badge variant="outline">{tool.npmLicense}</Badge>}
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interactive Playground */}
            {/* biome-ignore lint/suspicious/noExplicitAny: Prisma Tool type compatibility with component props */}
            <ToolPlayground tool={tool as any} />

            {/* Installation */}
            <Card>
              <CardHeader>
                <CardTitle>Installation</CardTitle>
                <CardDescription>
                  Install this tool using your preferred package manager
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CodeBlock
                  code={`npm install ${tool.npmPackageName}`}
                  language="bash"
                  showCopy={true}
                />
                <CodeBlock
                  code={`yarn add ${tool.npmPackageName}`}
                  language="bash"
                  showCopy={true}
                />
                <CodeBlock
                  code={`pnpm add ${tool.npmPackageName}`}
                  language="bash"
                  showCopy={true}
                />
              </CardContent>
            </Card>

            {/* README */}
            {tool.npmReadme && (
              <Card>
                <CardHeader>
                  <CardTitle>README</CardTitle>
                </CardHeader>
                <CardContent>
                  <Markdown content={tool.npmReadme} />
                </CardContent>
              </Card>
            )}

            {/* Usage Example */}
            {tool.tpmjsMetadata?.example && (
              <Card>
                <CardHeader>
                  <CardTitle>Usage Example</CardTitle>
                  <CardDescription>Quick start example</CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={tool.tpmjsMetadata.example}
                    language="typescript"
                    showCopy={true}
                  />
                </CardContent>
              </Card>
            )}

            {/* AI Agent Information */}
            {tool.tpmjsMetadata?.aiAgent && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Agent Integration</CardTitle>
                  <CardDescription>How AI agents can use this tool</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tool.tpmjsMetadata.aiAgent.useCase && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Use Case</h4>
                      <p className="text-sm text-foreground-secondary">
                        {tool.tpmjsMetadata.aiAgent.useCase}
                      </p>
                    </div>
                  )}
                  {tool.tpmjsMetadata.aiAgent.limitations && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Limitations</h4>
                      <p className="text-sm text-foreground-secondary">
                        {tool.tpmjsMetadata.aiAgent.limitations}
                      </p>
                    </div>
                  )}
                  {tool.tpmjsMetadata.aiAgent.examples &&
                    tool.tpmjsMetadata.aiAgent.examples.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">Examples</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {tool.tpmjsMetadata.aiAgent.examples.map((example) => (
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

            {/* Parameters */}
            {tool.tpmjsMetadata?.parameters && tool.tpmjsMetadata.parameters.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Parameters</CardTitle>
                  <CardDescription>Available configuration options</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tool.tpmjsMetadata.parameters.map((param) => (
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
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column - Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-foreground-secondary mb-1">Downloads/month</p>
                  <p className="text-2xl font-bold text-foreground">
                    {tool.npmDownloadsLastMonth?.toLocaleString() || '0'}
                  </p>
                </div>
                {tool.githubStars !== null && (
                  <div>
                    <p className="text-sm text-foreground-secondary mb-1">GitHub Stars</p>
                    <p className="text-2xl font-bold text-foreground">
                      {tool.githubStars.toLocaleString()}
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

            {/* NPM Keywords */}
            {tool.npmKeywords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>NPM Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tool.npmKeywords.map((keyword) => (
                      <Badge key={keyword} variant="outline" size="sm">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {tool.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tool.tags.map((tag) => (
                      <Badge key={tag} variant="outline" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Maintainers */}
            {tool.npmMaintainers && tool.npmMaintainers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Maintainers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tool.npmMaintainers.map((maintainer) => (
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
                  href={`https://www.npmjs.com/package/${tool.npmPackageName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground"
                >
                  <Icon icon="externalLink" size="sm" />
                  <span>View on NPM</span>
                </a>
                {tool.tpmjsMetadata?.links?.documentation && (
                  <a
                    href={tool.tpmjsMetadata.links.documentation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground"
                  >
                    <Icon icon="externalLink" size="sm" />
                    <span>Documentation</span>
                  </a>
                )}
                {tool.tpmjsMetadata?.links?.repository && (
                  <a
                    href={tool.tpmjsMetadata.links.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground"
                  >
                    <Icon icon="github" size="sm" />
                    <span>Repository</span>
                  </a>
                )}
                {tool.tpmjsMetadata?.links?.homepage && (
                  <a
                    href={tool.tpmjsMetadata.links.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground"
                  >
                    <Icon icon="externalLink" size="sm" />
                    <span>Homepage</span>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Frameworks */}
            {tool.tpmjsMetadata?.frameworks && tool.tpmjsMetadata.frameworks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Frameworks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tool.tpmjsMetadata.frameworks.map((framework) => (
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
