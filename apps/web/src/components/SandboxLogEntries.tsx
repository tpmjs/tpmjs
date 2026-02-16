'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Icon } from '@tpmjs/ui/Icon/Icon';

export interface SandboxLogEntry {
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

export const TOOL_ICONS: Record<
  string,
  { icon: 'terminal' | 'eye' | 'edit' | 'folder'; label: string }
> = {
  shellExec: { icon: 'terminal', label: 'Shell' },
  readFile: { icon: 'eye', label: 'Read' },
  writeFile: { icon: 'edit', label: 'Write' },
  listFiles: { icon: 'folder', label: 'List' },
};

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Convert logs array to a clean JSON structure for LLM pasting */
export function logsToJson(logs: SandboxLogEntry[]): string {
  const cleaned = logs.map((entry) => ({
    tool: entry.toolName,
    timestamp: entry.timestamp,
    conversation: entry.conversationSlug,
    input: entry.toolInput || null,
    result: entry.toolResult || null,
  }));
  return JSON.stringify(cleaned, null, 2);
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

export function LogEntryCard({
  entry,
  expanded,
  onToggle,
  showConversation = true,
}: {
  entry: SandboxLogEntry;
  expanded: boolean;
  onToggle: () => void;
  showConversation?: boolean;
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
        {showConversation && (
          <span className="text-xs text-foreground-tertiary font-mono">
            {entry.conversationSlug}
          </span>
        )}
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
