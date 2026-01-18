'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from '~/lib/auth-client';

interface Scenario {
  id: string;
  prompt: string;
  name: string | null;
  description: string | null;
  tags: string[];
  metrics: {
    qualityScore: number;
    totalRuns: number;
    consecutivePasses: number;
    consecutiveFails: number;
    lastRunStatus: string | null;
    lastRunAt: string | null;
  };
  timestamps: {
    createdAt: string;
    updatedAt: string;
  };
}

interface ScenariosSectionProps {
  collectionId: string;
  collectionOwnerId: string;
  username: string;
  slug: string;
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <Badge variant="secondary" className="text-xs">
        Not run
      </Badge>
    );
  }

  switch (status) {
    case 'pass':
      return (
        <Badge className="text-xs bg-success/10 text-success border-success/20">
          <Icon icon="check" className="w-3 h-3 mr-1" />
          Pass
        </Badge>
      );
    case 'fail':
      return (
        <Badge className="text-xs bg-error/10 text-error border-error/20">
          <Icon icon="x" className="w-3 h-3 mr-1" />
          Fail
        </Badge>
      );
    case 'error':
      return (
        <Badge className="text-xs bg-warning/10 text-warning border-warning/20">
          <Icon icon="alertTriangle" className="w-3 h-3 mr-1" />
          Error
        </Badge>
      );
    case 'running':
      return (
        <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
          <Icon icon="loader" className="w-3 h-3 mr-1 animate-spin" />
          Running
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="text-xs">
          {status}
        </Badge>
      );
  }
}

function QualityIndicator({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const color =
    percentage >= 70
      ? 'text-success'
      : percentage >= 40
        ? 'text-warning'
        : 'text-foreground-tertiary';

  return (
    <div className="flex items-center gap-1" title={`Quality score: ${percentage}%`}>
      <Icon icon="star" className={`w-3 h-3 ${color}`} />
      <span className={`text-xs ${color}`}>{percentage}%</span>
    </div>
  );
}

export function ScenariosSection({
  collectionId,
  collectionOwnerId,
  username,
  slug,
}: ScenariosSectionProps) {
  const { data: session } = useSession();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [runningScenarioId, setRunningScenarioId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner = session?.user?.id === collectionOwnerId;

  const fetchScenarios = useCallback(async () => {
    try {
      const response = await fetch(`/api/collections/${collectionId}/scenarios`);
      if (!response.ok) {
        throw new Error('Failed to fetch scenarios');
      }
      const data = await response.json();
      if (data.success) {
        setScenarios(data.data.scenarios);
      }
    } catch {
      setError('Failed to load scenarios');
    } finally {
      setIsLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/collections/${collectionId}/scenarios/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 1 }),
      });

      if (response.status === 429) {
        const data = await response.json();
        setError(`Rate limited. Try again in ${Math.ceil(data.retryAfter / 60)} minute(s).`);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to generate scenario');
      }

      // Refresh the scenarios list
      await fetchScenarios();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate scenario');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunScenario = async (scenarioId: string) => {
    setRunningScenarioId(scenarioId);
    setError(null);

    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/run`, {
        method: 'POST',
      });

      if (response.status === 429) {
        const data = await response.json();
        setError(`Rate limited. Try again in ${Math.ceil(data.retryAfter / 60)} minute(s).`);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to run scenario');
      }

      // Refresh to show updated status
      await fetchScenarios();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run scenario');
    } finally {
      setRunningScenarioId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Icon icon="terminal" className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Test Scenarios</h2>
          {scenarios.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {scenarios.length}
            </Badge>
          )}
        </div>
        {isOwner && (
          <Button variant="secondary" size="sm" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Icon icon="loader" className="w-4 h-4 mr-1.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Icon icon="plus" className="w-4 h-4 mr-1.5" />
                Add Scenario
              </>
            )}
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-sm text-error">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Icon icon="loader" className="w-6 h-6 animate-spin text-foreground-secondary" />
        </div>
      ) : scenarios.length === 0 ? (
        <div className="p-6 bg-surface border border-border rounded-xl text-center">
          <Icon icon="terminal" className="w-8 h-8 mx-auto text-foreground-tertiary mb-3" />
          <p className="text-foreground-secondary mb-3">No test scenarios yet</p>
          {isOwner && (
            <Button onClick={handleGenerate} disabled={isGenerating}>
              <Icon icon="plus" className="w-4 h-4 mr-1.5" />
              Generate Scenario
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="p-4 bg-surface border border-border rounded-xl space-y-3 hover:border-foreground-secondary/30 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {scenario.name && (
                      <h3 className="font-medium text-foreground truncate">{scenario.name}</h3>
                    )}
                    <StatusBadge status={scenario.metrics.lastRunStatus} />
                  </div>
                  <p className="text-sm text-foreground-secondary line-clamp-2">
                    {scenario.prompt}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <QualityIndicator score={scenario.metrics.qualityScore} />
                  {isOwner && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRunScenario(scenario.id)}
                      disabled={runningScenarioId === scenario.id}
                    >
                      {runningScenarioId === scenario.id ? (
                        <Icon icon="loader" className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon icon="arrowRight" className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Tags */}
              {scenario.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {scenario.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Metrics */}
              <div className="flex items-center gap-4 text-xs text-foreground-tertiary">
                <span className="flex items-center gap-1">
                  <Icon icon="clock" className="w-3 h-3" />
                  {scenario.metrics.totalRuns} runs
                </span>
                {scenario.metrics.consecutivePasses > 0 && (
                  <span className="flex items-center gap-1 text-success">
                    <Icon icon="check" className="w-3 h-3" />
                    {scenario.metrics.consecutivePasses} streak
                  </span>
                )}
                {scenario.metrics.consecutiveFails > 0 && (
                  <span className="flex items-center gap-1 text-error">
                    <Icon icon="x" className="w-3 h-3" />
                    {scenario.metrics.consecutiveFails} fails
                  </span>
                )}
                {scenario.metrics.lastRunAt && (
                  <span>Last: {new Date(scenario.metrics.lastRunAt).toLocaleDateString()}</span>
                )}
              </div>

              {/* View Details Link */}
              <div className="pt-2 border-t border-border/50">
                <Link
                  href={`/@${username}/collections/${slug}/scenarios/${scenario.id}`}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  View details & run history
                  <Icon icon="chevronRight" className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
