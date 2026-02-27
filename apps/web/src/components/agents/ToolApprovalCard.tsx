'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useState } from 'react';

export interface PendingApproval {
  approvalId: string;
  toolName: string;
  input: unknown;
  status: 'pending' | 'approved' | 'denied' | 'timeout';
}

interface ToolApprovalCardProps {
  approval: PendingApproval;
  agentId: string;
  conversationId: string;
  onResolved?: (approvalId: string, decision: 'approve' | 'deny') => void;
}

export function ToolApprovalCard({
  approval,
  agentId,
  conversationId,
  onResolved,
}: ToolApprovalCardProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleDecision = async (decision: 'approve' | 'deny') => {
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/agents/${agentId}/conversation/${conversationId}/approval`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approvalId: approval.approvalId, decision }),
        }
      );
      if (response.ok) {
        onResolved?.(approval.approvalId, decision);
      }
    } catch (error) {
      console.error('Failed to submit approval:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const isResolved = approval.status !== 'pending';

  const inputPreview =
    approval.input && typeof approval.input === 'object'
      ? JSON.stringify(approval.input, null, 2).slice(0, 500)
      : String(approval.input || '');

  return (
    <div
      className={`border rounded-lg p-4 my-2 ${
        approval.status === 'approved'
          ? 'border-success/30 bg-success/5'
          : approval.status === 'denied'
            ? 'border-error/30 bg-error/5'
            : approval.status === 'timeout'
              ? 'border-foreground-tertiary/30 bg-surface-secondary/50'
              : 'border-warning/50 bg-warning/5'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon
          icon="alertTriangle"
          size="sm"
          className={approval.status === 'pending' ? 'text-warning' : 'text-foreground-tertiary'}
        />
        <span className="font-mono text-sm font-medium">Tool Approval Required</span>
        {approval.status !== 'pending' && (
          <Badge
            variant={
              approval.status === 'approved'
                ? 'success'
                : approval.status === 'denied'
                  ? 'error'
                  : 'secondary'
            }
          >
            {approval.status}
          </Badge>
        )}
      </div>

      <div className="mb-3">
        <p className="text-sm text-foreground-secondary">
          <span className="font-mono text-foreground">{approval.toolName}</span> wants to execute
          with:
        </p>
        {inputPreview && (
          <pre className="mt-1 p-2 bg-surface-secondary rounded text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto">
            {inputPreview}
          </pre>
        )}
      </div>

      {!isResolved && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleDecision('approve')}
            disabled={submitting}
            className="bg-success/80 hover:bg-success text-white"
          >
            <Icon icon="check" size="xs" className="mr-1" />
            Allow
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDecision('deny')}
            disabled={submitting}
            className="border-error/50 text-error hover:bg-error/10"
          >
            <Icon icon="x" size="xs" className="mr-1" />
            Deny
          </Button>
        </div>
      )}
    </div>
  );
}
