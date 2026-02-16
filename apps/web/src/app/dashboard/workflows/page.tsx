'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

interface Workflow {
  id: string;
  uid: string;
  name: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  triggerType: string;
  nodeCount: number;
  executionCount: number;
  lastExecutedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'outline'> = {
  DRAFT: 'outline',
  ACTIVE: 'default',
  ARCHIVED: 'secondary',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export default function WorkflowsPage(): React.ReactElement {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    try {
      const response = await fetch('/api/workflows');
      const data = await response.json();

      if (data.success) {
        setWorkflows(data.data);
      } else {
        if (response.status === 401) {
          router.push('/sign-in');
          return;
        }
        setError(data.error || 'Failed to fetch workflows');
      }
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
      setError('Failed to fetch workflows');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
      } else {
        throw new Error(result.error || 'Failed to delete workflow');
      }
    } catch (err) {
      console.error('Failed to delete workflow:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete workflow');
    } finally {
      setDeletingId(null);
    }
  };

  if (error) {
    return (
      <DashboardLayout
        title="Workflows"
        actions={
          <Link href="/dashboard/workflows/new">
            <Button>
              <Icon icon="plus" size="sm" className="mr-2" />
              New Workflow
            </Button>
          </Link>
        }
      >
        <div className="text-center py-16">
          <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
          <p className="text-foreground-secondary mb-4">{error}</p>
          <Button onClick={fetchWorkflows}>Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Workflows"
      subtitle={
        workflows.length > 0
          ? `${workflows.length} workflow${workflows.length !== 1 ? 's' : ''}`
          : undefined
      }
      actions={
        <Link href="/dashboard/workflows/new">
          <Button>
            <Icon icon="plus" size="sm" className="mr-2" />
            New Workflow
          </Button>
        </Link>
      }
    >
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Nodes</TableHead>
              <TableHead>Last Run</TableHead>
              <TableHead className="w-[140px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [0, 1, 2].map((idx) => (
                <TableRow key={`workflow-skeleton-${idx}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-secondary animate-pulse" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-32 bg-surface-secondary rounded animate-pulse" />
                        <div className="h-3 w-48 bg-surface-secondary rounded animate-pulse" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-16 bg-surface-secondary rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-12 bg-surface-secondary rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 bg-surface-secondary rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-8 w-24 bg-surface-secondary rounded animate-pulse ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : workflows.length === 0 ? (
              <TableEmpty
                colSpan={5}
                icon={
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon icon="gitFork" size="lg" className="text-primary" />
                  </div>
                }
                title="No workflows yet"
                description="Create your first workflow to visually wire together tools, agents, and logic into automated pipelines."
                action={
                  <Link href="/dashboard/workflows/new">
                    <Button>
                      <Icon icon="plus" size="sm" className="mr-2" />
                      Create Your First Workflow
                    </Button>
                  </Link>
                }
              />
            ) : (
              workflows.map((workflow) => (
                <TableRow
                  key={workflow.id}
                  interactive
                  onClick={() => router.push(`/dashboard/workflows/${workflow.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon icon="gitFork" size="sm" className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{workflow.name}</p>
                        {workflow.description && (
                          <p className="text-sm text-foreground-tertiary truncate max-w-[250px]">
                            {workflow.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[workflow.status] || 'outline'} size="sm">
                      {workflow.status.charAt(0) + workflow.status.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground-secondary">{workflow.nodeCount}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground-secondary text-sm">
                      {workflow.lastExecutedAt
                        ? formatRelativeTime(workflow.lastExecutedAt)
                        : 'Never'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/workflows/${workflow.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button size="sm" variant="default">
                          <Icon icon="edit" size="xs" className="mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDelete(workflow.id, e)}
                        disabled={deletingId === workflow.id}
                      >
                        <Icon icon="trash" size="xs" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
