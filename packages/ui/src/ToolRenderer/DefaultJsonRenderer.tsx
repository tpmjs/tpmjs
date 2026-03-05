/**
 * Default JSON Renderer
 *
 * Fallback renderer that displays tool input/output as formatted JSON.
 * Used when no specific renderer is registered for a tool.
 */

import { cn } from '@tpmjs/utils/cn';
import { useState } from 'react';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import type { ToolRendererProps } from './types';

/**
 * Format data as JSON string for display
 */
function formatJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * DefaultJsonRenderer - Fallback renderer for any tool
 *
 * Displays:
 * - Collapsible header with tool name and status
 * - Input parameters as formatted JSON
 * - Output results as formatted JSON
 * - Loading state while executing
 * - Error state styling
 */
export function DefaultJsonRenderer({
  toolName,
  input,
  output,
  state,
  isStreaming,
  error,
}: ToolRendererProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(true);

  // Determine status based on state
  const status = error
    ? 'error'
    : state === 'result'
      ? 'success'
      : isStreaming
        ? 'running'
        : 'pending';

  const statusConfig = {
    pending: {
      icon: 'info' as const,
      colorClass: 'bg-warning/10 text-warning border-warning/30',
      label: 'Pending',
    },
    running: {
      icon: 'loader' as const,
      colorClass: 'bg-info/10 text-info border-info/30',
      label: 'Running',
    },
    success: {
      icon: 'check' as const,
      colorClass: 'bg-success/10 text-success border-success/30',
      label: 'Success',
    },
    error: {
      icon: 'alertCircle' as const,
      colorClass: 'bg-error/10 text-error border-error/30',
      label: 'Error',
    },
  };

  const { icon, colorClass, label } = statusConfig[status];

  return (
    <div className="rounded-lg border border-border bg-surface-secondary/50 overflow-hidden font-mono text-xs">
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 h-auto justify-start rounded-none hover:bg-surface-secondary/80"
      >
        <div className={cn('p-1.5 rounded border', colorClass)}>
          <Icon icon={icon} size="xs" className={status === 'running' ? 'animate-spin' : ''} />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-foreground font-semibold">{toolName}</span>
            <span className="text-foreground-tertiary text-[10px]">{label}</span>
          </div>
        </div>
        <Icon
          icon="chevronRight"
          size="xs"
          className={cn('text-foreground-tertiary transition-transform', isExpanded && 'rotate-90')}
        />
      </Button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Input Section */}
          {input !== undefined && input !== null && (
            <div className="p-3 border-b border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-foreground-tertiary">
                  Input
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              <pre className="text-[11px] text-foreground-secondary overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                {formatJson(input)}
              </pre>
            </div>
          )}

          {/* Error Section */}
          {error && (
            <div className="p-3 bg-error/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-error">Error</span>
                <div className="flex-1 h-px bg-error/30" />
              </div>
              <pre className="text-[11px] text-error overflow-x-auto whitespace-pre-wrap break-all">
                {error}
              </pre>
            </div>
          )}

          {/* Output Section */}
          {output !== undefined && output !== null && (
            <div className="p-3 border-t border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-foreground-tertiary">
                  Output
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              <pre
                className={cn(
                  'text-[11px] overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto',
                  error ? 'text-error' : 'text-success'
                )}
              >
                {formatJson(output)}
              </pre>
            </div>
          )}

          {/* Loading state */}
          {status === 'running' && !output && !error && (
            <div className="p-3 flex items-center gap-2 text-foreground-tertiary">
              <Icon icon="loader" size="xs" className="animate-spin" />
              <span>Executing...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
