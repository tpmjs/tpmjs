'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

interface BrokenTool {
  id: string;
  exportName: string;
  description: string;
  importHealth: 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
  executionHealth: 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
  healthCheckError: string | null;
  lastHealthCheck: string | null;
  package: {
    npmPackageName: string;
    npmVersion: string;
    category: string;
    isOfficial: boolean;
  };
}

/**
 * Broken Tools Page
 *
 * Displays all tools with broken health status (importHealth='BROKEN' OR executionHealth='BROKEN')
 */
export default function BrokenToolsPage(): React.ReactElement {
  const [tools, setTools] = useState<BrokenTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch broken tools from API
  useEffect(() => {
    const fetchBrokenTools = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tools/broken');
        const data = await response.json();

        if (data.success) {
          setTools(data.data);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch broken tools');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchBrokenTools();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Main content */}
      <Container size="xl" padding="md" className="py-8">
        {/* Page header */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <h1 className="text-4xl font-bold text-foreground">Broken Tools</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Tools that are currently failing health checks. These tools may not work correctly until
            the underlying issues are resolved.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <Spinner size="xl" />
            <span className="text-foreground-secondary text-lg">Loading broken tools...</span>
          </div>
        )}

        {/* Error state */}
        {error && <div className="text-center py-12 text-red-500">Error: {error}</div>}

        {/* Empty state - All healthy! */}
        {!loading && !error && tools.length === 0 && (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <Icon icon="check" size="lg" className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">All Tools are Healthy!</h2>
                <p className="text-foreground-secondary">
                  No broken tools detected. All tools are passing health checks.
                </p>
              </div>
              <Link href="/tool/tool-search">
                <Button variant="default" size="md">
                  Browse Tools
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Broken tools grid */}
        {!loading && !error && tools.length > 0 && (
          <>
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">⚠️</span>
                <div>
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                    {tools.length} {tools.length === 1 ? 'tool is' : 'tools are'} currently broken
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    These tools are experiencing import or execution failures. Click on a tool to
                    see details and manually trigger a health recheck.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Broken tools page requires conditional rendering for health status */}
              {tools.map((tool) => {
                const toolUrl = `/tool/${tool.package.npmPackageName}/${tool.exportName}`;
                const lastCheckedDate = tool.lastHealthCheck
                  ? new Date(tool.lastHealthCheck)
                  : null;

                return (
                  <Card key={tool.id} className="flex flex-col border-red-200 dark:border-red-900">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle>
                            {tool.exportName !== 'default'
                              ? tool.exportName
                              : tool.package.npmPackageName}
                          </CardTitle>
                          <div className="text-sm text-foreground-secondary mt-1">
                            {tool.package.npmPackageName}
                          </div>
                        </div>
                      </div>
                      <CardDescription>{tool.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-4">
                      {/* Category badge and version */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" size="sm">
                          {tool.package.category}
                        </Badge>
                        <span className="text-xs text-foreground-tertiary">
                          v{tool.package.npmVersion}
                        </span>
                        {tool.package.isOfficial && (
                          <Badge variant="default" size="sm">
                            Official
                          </Badge>
                        )}
                      </div>

                      {/* Health status badges */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground-secondary mb-2">
                          Health Status:
                        </div>
                        <div className="flex flex-col gap-2">
                          {/* Import health */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-foreground-tertiary w-20">Import:</span>
                            {tool.importHealth === 'BROKEN' ? (
                              <Badge variant="error" size="sm">
                                <Icon icon="x" size="sm" className="mr-1" />
                                Broken
                              </Badge>
                            ) : tool.importHealth === 'HEALTHY' ? (
                              <Badge variant="success" size="sm">
                                <Icon icon="check" size="sm" className="mr-1" />
                                Healthy
                              </Badge>
                            ) : (
                              <Badge variant="secondary" size="sm">
                                Unknown
                              </Badge>
                            )}
                          </div>

                          {/* Execution health */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-foreground-tertiary w-20">
                              Execution:
                            </span>
                            {tool.executionHealth === 'BROKEN' ? (
                              <Badge variant="error" size="sm">
                                <Icon icon="x" size="sm" className="mr-1" />
                                Broken
                              </Badge>
                            ) : tool.executionHealth === 'HEALTHY' ? (
                              <Badge variant="success" size="sm">
                                <Icon icon="check" size="sm" className="mr-1" />
                                Healthy
                              </Badge>
                            ) : (
                              <Badge variant="secondary" size="sm">
                                Unknown
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Error message */}
                      {tool.healthCheckError && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-foreground-secondary">
                            Error:
                          </div>
                          <CodeBlock
                            code={tool.healthCheckError}
                            language="text"
                            className="text-xs"
                          />
                        </div>
                      )}

                      {/* Last checked timestamp */}
                      {lastCheckedDate && (
                        <div className="text-xs text-foreground-tertiary">
                          Last checked: {lastCheckedDate.toLocaleString()}
                        </div>
                      )}
                    </CardContent>

                    <CardFooter>
                      <Link href={toolUrl} className="w-full">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details & Recheck →
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </Container>
    </div>
  );
}
