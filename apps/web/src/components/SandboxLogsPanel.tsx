'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Skeleton } from '@tpmjs/ui/Skeleton/Skeleton';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SandboxLogEntry {
  id: string;
  timestamp: string;
  type: string;
  conversationId: string;
  conversationSlug: string;
  toolName?: string;
  toolCallId?: string;
  toolResult?: Record<string, unknown>;
  toolInput?: Record<string, unknown>;
  content?: string;
}

const TOOL_ICONS: Record<string, { icon: 'terminal' | 'eye' | 'edit' | 'folder'; label: string }> =
  {
    shellExec: { icon: 'terminal', label: 'Shell' },
    readFile: { icon: 'eye', label: 'Read' },
    writeFile: { icon: 'edit', label: 'Write' },
    listFiles: { icon: 'folder', label: 'List' },
  };

const PAGE_SIZE = 50;

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function ShellExecEntry({
  entry,
  expanded,
  onToggle,
}: {
  entry: SandboxLogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const command = (entry.toolInput?.command as string) || (entry.toolInput?.cmd as string) || '';
  const result = entry.toolResult || {};
  const stdout = (result.stdout as string) || '';
  const stderr = (result.stderr as string) || '';
  const exitCode = result.exitCode as number | undefined;
  const durationMs = result.durationMs as number | undefined;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {command && (
            <code className="text-sm font-mono text-foreground bg-surface-secondary px-2 py-0.5 rounded truncate">
              {command}
            </code>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {durationMs != null && (
            <span className="text-xs text-foreground-tertiary">{durationMs}ms</span>
          )}
          {exitCode != null && (
            <Badge variant={exitCode === 0 ? 'success' : 'error'} size="sm">
              exit {exitCode}
            </Badge>
          )}
          <Icon
            icon={expanded ? 'chevronDown' : 'chevronRight'}
            size="xs"
            className="text-foreground-tertiary"
          />
        </div>
      </button>
      {expanded && (stdout || stderr) && (
        <div className="mt-2 space-y-2">
          {stdout && (
            <pre className="text-xs font-mono bg-[#0d1117] text-[#c9d1d9] p-3 rounded overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-all">
              {stdout}
            </pre>
          )}
          {stderr && (
            <pre className="text-xs font-mono bg-[#0d1117] text-[#f85149] p-3 rounded overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-all">
              {stderr}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function ReadFileEntry({
  entry,
  expanded,
  onToggle,
}: {
  entry: SandboxLogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const path = (entry.toolInput?.path as string) || (entry.toolResult?.path as string) || '';
  const content = (entry.toolResult?.content as string) || entry.content || '';
  const size = entry.toolResult?.size as number | undefined;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <code className="text-sm font-mono text-foreground truncate">{path}</code>
        <div className="flex items-center gap-2 flex-shrink-0">
          {size != null && (
            <span className="text-xs text-foreground-tertiary">
              {size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`}
            </span>
          )}
          <Icon
            icon={expanded ? 'chevronDown' : 'chevronRight'}
            size="xs"
            className="text-foreground-tertiary"
          />
        </div>
      </button>
      {expanded && content && (
        <pre className="mt-2 text-xs font-mono bg-surface-secondary text-foreground-secondary p-3 rounded overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-all">
          {content}
        </pre>
      )}
    </div>
  );
}

function WriteFileEntry({ entry }: { entry: SandboxLogEntry }) {
  const path = (entry.toolInput?.path as string) || (entry.toolResult?.path as string) || '';
  const success = entry.toolResult?.success as boolean | undefined;
  const bytesWritten = entry.toolResult?.bytesWritten as number | undefined;

  return (
    <div className="flex items-center justify-between gap-2">
      <code className="text-sm font-mono text-foreground truncate">{path}</code>
      <div className="flex items-center gap-2 flex-shrink-0">
        {bytesWritten != null && (
          <span className="text-xs text-foreground-tertiary">
            {bytesWritten > 1024 ? `${(bytesWritten / 1024).toFixed(1)}KB` : `${bytesWritten}B`}
          </span>
        )}
        {success != null && (
          <Badge variant={success ? 'success' : 'error'} size="sm">
            {success ? 'ok' : 'failed'}
          </Badge>
        )}
      </div>
    </div>
  );
}

function ListFilesEntry({
  entry,
  expanded,
  onToggle,
}: {
  entry: SandboxLogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const path = (entry.toolInput?.path as string) || (entry.toolInput?.directory as string) || '.';
  const entries =
    (entry.toolResult?.entries as Array<{ name: string; type: string; size: number | null }>) || [];

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <code className="text-sm font-mono text-foreground truncate">{path}</code>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-foreground-tertiary">{entries.length} items</span>
          <Icon
            icon={expanded ? 'chevronDown' : 'chevronRight'}
            size="xs"
            className="text-foreground-tertiary"
          />
        </div>
      </button>
      {expanded && entries.length > 0 && (
        <div className="mt-2 bg-surface-secondary rounded p-3 text-xs font-mono space-y-0.5 max-h-64 overflow-y-auto">
          {entries.map((e) => (
            <div key={e.name} className="flex items-center gap-2 text-foreground-secondary">
              <Icon
                icon={e.type === 'directory' ? 'folder' : 'box'}
                size="xs"
                className="flex-shrink-0 text-foreground-tertiary"
              />
              <span className="truncate">{e.name}</span>
              {e.size != null && e.type !== 'directory' && (
                <span className="text-foreground-tertiary ml-auto flex-shrink-0">
                  {e.size > 1024 ? `${(e.size / 1024).toFixed(1)}KB` : `${e.size}B`}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LogEntryCard({
  entry,
  expanded,
  onToggle,
}: {
  entry: SandboxLogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const toolInfo = TOOL_ICONS[entry.toolName || ''] || {
    icon: 'terminal' as const,
    label: entry.toolName || 'Unknown',
  };

  return (
    <div className="border border-border rounded-lg bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-surface-secondary border-b border-border">
        <Icon icon={toolInfo.icon} size="xs" className="text-foreground-tertiary" />
        <Badge variant="secondary" size="sm">
          {toolInfo.label}
        </Badge>
        <span className="text-xs text-foreground-tertiary font-mono">{entry.conversationSlug}</span>
        <span className="text-xs text-foreground-tertiary ml-auto">
          {formatTimestamp(entry.timestamp)}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {entry.toolName === 'shellExec' && (
          <ShellExecEntry entry={entry} expanded={expanded} onToggle={onToggle} />
        )}
        {entry.toolName === 'readFile' && (
          <ReadFileEntry entry={entry} expanded={expanded} onToggle={onToggle} />
        )}
        {entry.toolName === 'writeFile' && <WriteFileEntry entry={entry} />}
        {entry.toolName === 'listFiles' && (
          <ListFilesEntry entry={entry} expanded={expanded} onToggle={onToggle} />
        )}
      </div>
    </div>
  );
}

export function SandboxLogsPanel({ agentId }: { agentId: string }) {
  const [logs, setLogs] = useState<SandboxLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
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

  // Initial fetch
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh
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

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
        <div className="flex items-center gap-3">
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
        <div className="space-y-2">
          {logs.map((entry) => (
            <LogEntryCard
              key={entry.id}
              entry={entry}
              expanded={expandedIds.has(entry.id)}
              onToggle={() => toggleExpanded(entry.id)}
            />
          ))}
        </div>
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
