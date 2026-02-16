'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Skeleton } from '@tpmjs/ui/Skeleton/Skeleton';
import { useCallback, useEffect, useRef, useState } from 'react';
import { logsToJson, type SandboxLogEntry, SandboxTerminal } from './SandboxLogEntries';

const PAGE_SIZE = 50;

export function SandboxLogsPanel({ agentId }: { agentId: string }) {
  const [logs, setLogs] = useState<SandboxLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = useCallback(
    async (offset = 0, append = false) => {
      try {
        const res = await fetch(
          `/api/agents/${agentId}/logs?sandbox=true&limit=${PAGE_SIZE}&offset=${offset}`
        );
        const json = await res.json();
        if (json.success) {
          const newLogs = json.data.logs as SandboxLogEntry[];
          setLogs((prev) => (append ? [...prev, ...newLogs] : newLogs));
          setHasMore(json.data.pagination.hasMore);
        }
      } catch (err) {
        console.error('Failed to fetch sandbox logs:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [agentId]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchLogs(), 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchLogs]);

  const loadMore = async () => {
    setIsLoadingMore(true);
    await fetchLogs(logs.length, true);
    setIsLoadingMore(false);
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(logsToJson(logs));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
          <div key={i} className="border border-border rounded-lg bg-surface p-4">
            <Skeleton width="100%" height={20} />
            <Skeleton width="60%" height={14} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground-secondary">
          {logs.length} log{logs.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <Button size="sm" variant="ghost" onClick={copyJson} title="Copy all logs as JSON">
              <Icon icon={copied ? 'check' : 'copy'} size="xs" className="mr-1" />
              {copied ? 'Copied' : 'Copy JSON'}
            </Button>
          )}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded border transition-colors ${
              autoRefresh
                ? 'border-success/50 text-success bg-success/10'
                : 'border-border text-foreground-tertiary hover:text-foreground-secondary'
            }`}
          >
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-success animate-pulse' : 'bg-foreground-tertiary'}`}
            />
            {autoRefresh ? 'live' : 'paused'}
          </button>
          <Button size="sm" variant="ghost" onClick={() => fetchLogs()} title="Refresh">
            <Icon icon="loader" size="xs" />
          </Button>
        </div>
      </div>

      {/* Log entries */}
      {logs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <Icon icon="terminal" size="lg" className="mx-auto text-foreground-tertiary mb-3" />
          <p className="text-foreground-secondary font-medium mb-1">No sandbox logs yet</p>
          <p className="text-sm text-foreground-tertiary">
            Sandbox tool executions will appear here when your agent runs commands.
          </p>
        </div>
      ) : (
        <SandboxTerminal logs={logs} showConversation={true} />
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
