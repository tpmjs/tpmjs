'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LogEntryCard, logsToJson, type SandboxLogEntry } from './SandboxLogEntries';

const PAGE_SIZE = 50;

export function ConversationSandboxLogs({
  agentId,
  conversationSlug,
  isOpen,
  onClose,
}: {
  agentId: string;
  conversationSlug: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [logs, setLogs] = useState<SandboxLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = useCallback(
    async (offset = 0, append = false) => {
      if (!conversationSlug) return;
      try {
        const res = await fetch(
          `/api/agents/${agentId}/logs?sandbox=true&conversation=${encodeURIComponent(conversationSlug)}&limit=${PAGE_SIZE}&offset=${offset}`
        );
        const json = await res.json();
        if (json.success) {
          const newLogs = json.data.logs as SandboxLogEntry[];
          setLogs((prev) => (append ? [...prev, ...newLogs] : newLogs));
          setHasMore(json.data.pagination.hasMore);
        }
      } catch (err) {
        console.error('Failed to fetch conversation sandbox logs:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [agentId, conversationSlug]
  );

  // Fetch when opened or conversation changes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setLogs([]);
      fetchLogs();
    }
  }, [isOpen, fetchLogs]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && isOpen) {
      intervalRef.current = setInterval(() => fetchLogs(), 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, isOpen, fetchLogs]);

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

  const copyJson = async () => {
    await navigator.clipboard.writeText(logsToJson(logs));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-dashed border-border flex flex-col bg-surface hidden lg:flex">
      {/* Header */}
      <div className="p-3 border-b border-dashed border-border flex items-center justify-between">
        <span className="font-mono text-xs text-foreground-tertiary lowercase">sandbox logs</span>
        <div className="flex items-center gap-1">
          {logs.length > 0 && (
            <Button size="sm" variant="ghost" onClick={copyJson} title="Copy all as JSON">
              <Icon icon={copied ? 'check' : 'copy'} size="xs" />
            </Button>
          )}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
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
          <Button size="sm" variant="ghost" onClick={onClose} title="Close">
            <Icon icon="x" size="xs" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Icon icon="loader" size="sm" className="animate-spin text-foreground-tertiary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <Icon icon="terminal" size="md" className="mx-auto text-foreground-tertiary mb-2" />
            <p className="text-xs text-foreground-tertiary font-mono">no sandbox logs yet</p>
          </div>
        ) : (
          <>
            {logs.map((entry) => (
              <LogEntryCard
                key={entry.id}
                entry={entry}
                expanded={expandedIds.has(entry.id)}
                onToggle={() => toggleExpanded(entry.id)}
                showConversation={false}
              />
            ))}
            {hasMore && (
              <div className="flex justify-center py-2">
                <Button variant="ghost" size="sm" onClick={loadMore} disabled={isLoadingMore}>
                  {isLoadingMore ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
