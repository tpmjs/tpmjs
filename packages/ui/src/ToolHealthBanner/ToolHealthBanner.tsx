'use client';

import type React from 'react';
import { Badge } from '../Badge/Badge';

export interface ToolHealthBannerProps {
  importHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
  executionHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
  healthCheckError?: string | null;
  lastHealthCheck?: string | null;
  onRecheck?: () => void;
  recheckLoading?: boolean;
  className?: string;
}

/**
 * Banner component to display detailed health status for broken tools
 */
export function ToolHealthBanner({
  importHealth,
  executionHealth,
  healthCheckError,
  lastHealthCheck,
  onRecheck,
  recheckLoading = false,
  className,
}: ToolHealthBannerProps): React.ReactElement | null {
  const isBroken = importHealth === 'BROKEN' || executionHealth === 'BROKEN';

  if (!isBroken) {
    return null;
  }

  return (
    <div
      className={`p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 ${className || ''}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">⚠️</span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
            This tool is currently broken
          </h3>
          <div className="space-y-1 text-sm text-red-700 dark:text-red-400">
            {importHealth === 'BROKEN' && (
              <div className="flex items-center gap-2">
                <Badge variant="error" size="sm">
                  Import Failed
                </Badge>
                <span className="text-xs">Cannot load from Railway service</span>
              </div>
            )}
            {executionHealth === 'BROKEN' && (
              <div className="flex items-center gap-2">
                <Badge variant="error" size="sm">
                  Execution Failed
                </Badge>
                <span className="text-xs">Runtime error with test parameters</span>
              </div>
            )}
          </div>
          {healthCheckError && (
            <pre className="mt-2 p-2 rounded bg-red-100 dark:bg-red-900/30 text-xs font-mono text-red-800 dark:text-red-300 overflow-x-auto whitespace-pre-wrap">
              {healthCheckError}
            </pre>
          )}
          {lastHealthCheck && (
            <p className="text-xs text-red-600 dark:text-red-500 mt-2">
              Last checked: {new Date(lastHealthCheck).toLocaleString()}
            </p>
          )}
          {onRecheck && (
            <button
              type="button"
              onClick={onRecheck}
              disabled={recheckLoading}
              className="mt-3 text-sm font-medium text-red-700 dark:text-red-400 hover:underline disabled:opacity-50"
            >
              {recheckLoading ? 'Rechecking...' : 'Recheck health →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
