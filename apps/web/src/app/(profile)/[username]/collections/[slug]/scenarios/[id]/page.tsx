'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

interface ScenarioRun {
  id: string;
  status: string;
  retryCount: number;
  evaluator: {
    model: string | null;
    verdict: string | null;
    reason: string | null;
  };
  assertions: { passed: string[]; failed: string[] } | null;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    executionTimeMs: number | null;
    estimatedCost: number | null;
  };
  timestamps: {
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
  };
  output?: string;
  errorLog?: string;
  conversation?: unknown[];
}

interface ScenarioDetail {
  id: string;
  collectionId: string | null;
  prompt: string;
  name: string | null;
  description: string | null;
  tags: string[];
  qualityScore: number;
  consecutivePasses: number;
  consecutiveFails: number;
  totalRuns: number;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
  collection: {
    id: string;
    name: string;
    slug: string;
    username: string;
  } | null;
  recentRuns: ScenarioRun[];
  runCount: number;
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return <Badge variant="secondary">Not run</Badge>;
  }

  switch (status) {
    case 'pass':
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          <Icon icon="check" className="w-3.5 h-3.5 mr-1" />
          Pass
        </Badge>
      );
    case 'fail':
      return (
        <Badge className="bg-error/10 text-error border-error/20">
          <Icon icon="x" className="w-3.5 h-3.5 mr-1" />
          Fail
        </Badge>
      );
    case 'error':
      return (
        <Badge className="bg-warning/10 text-warning border-warning/20">
          <Icon icon="alertTriangle" className="w-3.5 h-3.5 mr-1" />
          Error
        </Badge>
      );
    case 'running':
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20">
          <Icon icon="loader" className="w-3.5 h-3.5 mr-1 animate-spin" />
          Running
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary">
          <Icon icon="clock" className="w-3.5 h-3.5 mr-1" />
          Pending
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function QualityIndicator({ score, showLabel = true }: { score: number; showLabel?: boolean }) {
  const percentage = Math.round(score * 100);
  const color =
    percentage >= 70
      ? 'text-success'
      : percentage >= 40
        ? 'text-warning'
        : 'text-foreground-tertiary';

  return (
    <div className="flex items-center gap-1.5" title={`Quality score: ${percentage}%`}>
      <Icon icon="star" className={`w-4 h-4 ${color}`} />
      <span className={`font-medium ${color}`}>{percentage}%</span>
      {showLabel && <span className="text-foreground-tertiary">quality</span>}
    </div>
  );
}

function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CollectionScenarioDetailPage(): React.ReactElement {
  const params = useParams();
  const rawUsername = params.username as string;
  const username = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;
  const slug = params.slug as string;
  const scenarioId = params.id as string;

  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [runs, setRuns] = useState<ScenarioRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const fetchScenario = useCallback(async () => {
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}?runsLimit=50`);
      if (response.status === 404) {
        setError('not_found');
        return;
      }
      const data = await response.json();

      if (data.success) {
        setScenario(data.data);
        setRuns(data.data.recentRuns || []);
      } else {
        setError(data.error?.message || 'Failed to load scenario');
      }
    } catch {
      setError('Failed to load scenario');
    } finally {
      setIsLoading(false);
    }
  }, [scenarioId]);

  useEffect(() => {
    fetchScenario();
  }, [fetchScenario]);

  const handleRunScenario = async () => {
    setIsRunning(true);
    setRunError(null);

    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/run`, {
        method: 'POST',
      });

      if (response.status === 429) {
        const data = await response.json();
        setRunError(`Rate limited. Try again in ${Math.ceil(data.retryAfter / 60)} minute(s).`);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to run scenario');
      }

      // Refresh to show updated status
      await fetchScenario();
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Failed to run scenario');
    } finally {
      setIsRunning(false);
    }
  };

  if (error === 'not_found') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Icon icon="loader" className="w-8 h-8 animate-spin text-foreground-secondary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-error">{error}</p>
          </div>
        ) : scenario ? (
          <div className="space-y-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-foreground-secondary">
              <Link href={`/@${username}`} className="hover:text-foreground transition-colors">
                @{username}
              </Link>
              <Icon icon="chevronRight" className="w-4 h-4" />
              <Link
                href={`/@${username}/collections/${slug}`}
                className="hover:text-foreground transition-colors"
              >
                {scenario.collection?.name || slug}
              </Link>
              <Icon icon="chevronRight" className="w-4 h-4" />
              <span className="text-foreground">{scenario.name || 'Scenario'}</span>
            </nav>

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">
                  {scenario.name || 'Unnamed Scenario'}
                </h1>
                {scenario.description && (
                  <p className="text-foreground-secondary mt-2">{scenario.description}</p>
                )}
              </div>
              {scenario.isOwner && (
                <Button onClick={handleRunScenario} disabled={isRunning}>
                  {isRunning ? (
                    <>
                      <Icon icon="loader" className="w-4 h-4 mr-1.5 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Icon icon="arrowRight" className="w-4 h-4 mr-1.5" />
                      Run Scenario
                    </>
                  )}
                </Button>
              )}
            </div>

            {runError && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-sm text-error">
                {runError}
              </div>
            )}

            {/* Prompt */}
            <div className="p-4 bg-surface border border-border rounded-xl">
              <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wide mb-2">
                Prompt
              </h2>
              <p className="text-foreground whitespace-pre-wrap">{scenario.prompt}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 bg-surface border border-border rounded-xl">
                <div className="text-sm text-foreground-secondary mb-1">Quality</div>
                <QualityIndicator score={scenario.qualityScore} showLabel={false} />
              </div>
              <div className="p-4 bg-surface border border-border rounded-xl">
                <div className="text-sm text-foreground-secondary mb-1">Total Runs</div>
                <div className="text-xl font-semibold text-foreground">{scenario.totalRuns}</div>
              </div>
              <div className="p-4 bg-surface border border-border rounded-xl">
                <div className="text-sm text-foreground-secondary mb-1">Pass Streak</div>
                <div className="text-xl font-semibold text-success flex items-center gap-1">
                  <Icon icon="check" className="w-5 h-5" />
                  {scenario.consecutivePasses}
                </div>
              </div>
              <div className="p-4 bg-surface border border-border rounded-xl">
                <div className="text-sm text-foreground-secondary mb-1">Fail Streak</div>
                <div className="text-xl font-semibold text-error flex items-center gap-1">
                  <Icon icon="x" className="w-5 h-5" />
                  {scenario.consecutiveFails}
                </div>
              </div>
              <div className="p-4 bg-surface border border-border rounded-xl">
                <div className="text-sm text-foreground-secondary mb-1">Last Status</div>
                <StatusBadge status={scenario.lastRunStatus} />
              </div>
            </div>

            {/* Tags */}
            {scenario.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {scenario.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Run History */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">Run History</h2>

              {runs.length === 0 ? (
                <div className="p-8 bg-surface border border-border rounded-xl text-center">
                  <Icon icon="clock" className="w-8 h-8 mx-auto text-foreground-tertiary mb-3" />
                  <p className="text-foreground-secondary">No runs yet</p>
                  {scenario.isOwner && (
                    <Button className="mt-4" onClick={handleRunScenario} disabled={isRunning}>
                      Run Scenario
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {runs.map((run) => (
                    <div
                      key={run.id}
                      className="bg-surface border border-border rounded-xl overflow-hidden"
                    >
                      {/* Run Header */}
                      <button
                        type="button"
                        onClick={() => setExpandedRunId(expandedRunId === run.id ? null : run.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-surface-secondary transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <StatusBadge status={run.status} />
                          <span className="text-sm text-foreground-secondary">
                            {formatDate(run.timestamps.createdAt)}
                          </span>
                          {run.usage.executionTimeMs && (
                            <span className="text-sm text-foreground-tertiary">
                              {formatDuration(run.usage.executionTimeMs)}
                            </span>
                          )}
                          {run.usage.totalTokens && (
                            <span className="text-sm text-foreground-tertiary">
                              {run.usage.totalTokens.toLocaleString()} tokens
                            </span>
                          )}
                        </div>
                        <Icon
                          icon={expandedRunId === run.id ? 'chevronDown' : 'chevronRight'}
                          className="w-5 h-5 text-foreground-tertiary"
                        />
                      </button>

                      {/* Run Details (Expanded) */}
                      {expandedRunId === run.id && (
                        <div className="px-4 pb-4 border-t border-border/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {/* Evaluator */}
                            {run.evaluator.verdict && (
                              <div className="p-3 bg-surface-secondary rounded-lg">
                                <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wide mb-2">
                                  LLM Evaluation
                                </h4>
                                <div className="flex items-center gap-2 mb-2">
                                  <StatusBadge status={run.evaluator.verdict} />
                                  {run.evaluator.model && (
                                    <Badge variant="secondary" size="sm">
                                      {run.evaluator.model}
                                    </Badge>
                                  )}
                                </div>
                                {run.evaluator.reason && (
                                  <p className="text-sm text-foreground-secondary">
                                    {run.evaluator.reason}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Usage Stats */}
                            <div className="p-3 bg-surface-secondary rounded-lg">
                              <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wide mb-2">
                                Usage
                              </h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-foreground-tertiary">Duration:</span>{' '}
                                  <span className="text-foreground">
                                    {formatDuration(run.usage.executionTimeMs)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-foreground-tertiary">Tokens:</span>{' '}
                                  <span className="text-foreground">
                                    {run.usage.totalTokens?.toLocaleString() || '—'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-foreground-tertiary">Retries:</span>{' '}
                                  <span className="text-foreground">{run.retryCount}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Output (if owner) */}
                          {run.output && (
                            <div className="mt-4">
                              <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wide mb-2">
                                Output
                              </h4>
                              <pre className="p-3 bg-surface-secondary rounded-lg text-sm text-foreground overflow-x-auto whitespace-pre-wrap">
                                {run.output}
                              </pre>
                            </div>
                          )}

                          {/* Error Log (if owner and error) */}
                          {run.errorLog && (
                            <div className="mt-4">
                              <h4 className="text-xs font-semibold text-error uppercase tracking-wide mb-2">
                                Error Log
                              </h4>
                              <pre className="p-3 bg-error/5 border border-error/20 rounded-lg text-sm text-error overflow-x-auto whitespace-pre-wrap">
                                {run.errorLog}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
