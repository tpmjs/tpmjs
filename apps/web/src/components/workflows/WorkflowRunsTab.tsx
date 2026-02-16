'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@tpmjs/ui/Table/Table';
import { useEffect, useState } from 'react';

interface Execution {
  id: string;
  status: string;
  triggeredBy: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  error: string | null;
  workflowVersion: number;
  createdAt: string;
}

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'outline'> = {
  COMPLETED: 'default',
  FAILED: 'secondary',
  RUNNING: 'outline',
  PENDING: 'outline',
  CANCELLED: 'secondary',
};

function formatDuration(ms: number | null): string {
  if (ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface WorkflowRunsTabProps {
  workflowId: string;
}

export function WorkflowRunsTab({ workflowId }: WorkflowRunsTabProps): React.ReactElement {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/workflows/${workflowId}/executions?limit=50`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setExecutions(result.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [workflowId]);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Triggered By</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [0, 1, 2].map((idx) => (
                <TableRow key={`exec-skeleton-${idx}`}>
                  <TableCell>
                    <div className="h-5 w-20 bg-surface-secondary rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 bg-surface-secondary rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-32 bg-surface-secondary rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 bg-surface-secondary rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-8 bg-surface-secondary rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 bg-surface-secondary rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : executions.length === 0 ? (
              <TableEmpty
                colSpan={6}
                icon={
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon icon="send" size="md" className="text-primary" />
                  </div>
                }
                title="No runs yet"
                description="Execute this workflow to see run history here."
              />
            ) : (
              executions.map((exec) => (
                <TableRow key={exec.id}>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[exec.status] || 'outline'} size="sm">
                      {exec.status.charAt(0) + exec.status.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground-secondary">{exec.triggeredBy}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground-secondary">
                      {formatTime(exec.startedAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground-secondary font-mono">
                      {formatDuration(exec.durationMs)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground-tertiary">
                      v{exec.workflowVersion}
                    </span>
                  </TableCell>
                  <TableCell>
                    {exec.error ? (
                      <span className="text-sm text-error truncate max-w-[200px] block">
                        {exec.error}
                      </span>
                    ) : (
                      <span className="text-sm text-foreground-tertiary">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
