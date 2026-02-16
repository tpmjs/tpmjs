'use client';

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

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function TerminalShellExec({ entry }: { entry: SandboxLogEntry }) {
  const command = (entry.toolInput?.command as string) || (entry.toolInput?.cmd as string) || '';
  const result = entry.toolResult || {};
  const stdout = (result.stdout as string) || '';
  const stderr = (result.stderr as string) || '';
  const exitCode = result.exitCode as number | undefined;
  const durationMs = result.durationMs as number | undefined;

  return (
    <>
      <div className="flex items-baseline gap-2">
        <span className="text-[#7ee787] select-none shrink-0">$</span>
        <span className="text-[#e6edf3] break-all">{command}</span>
        <span className="ml-auto text-[#484f58] text-[10px] shrink-0 tabular-nums select-none">
          {durationMs != null && `${durationMs}ms `}
          {exitCode != null && exitCode !== 0 && (
            <span className="text-[#f85149]">[exit {exitCode}]</span>
          )}
        </span>
      </div>
      {stdout && <pre className="text-[#c9d1d9] whitespace-pre-wrap break-all ml-4">{stdout}</pre>}
      {stderr && <pre className="text-[#f85149] whitespace-pre-wrap break-all ml-4">{stderr}</pre>}
    </>
  );
}

function TerminalReadFile({ entry }: { entry: SandboxLogEntry }) {
  const path = (entry.toolInput?.path as string) || (entry.toolResult?.path as string) || '';
  const content = (entry.toolResult?.content as string) || entry.content || '';
  const size = entry.toolResult?.size as number | undefined;
  const sizeStr = size != null ? (size > 1024 ? `${(size / 1024).toFixed(1)}K` : `${size}B`) : '';

  return (
    <>
      <div className="flex items-baseline gap-2">
        <span className="text-[#79c0ff] select-none shrink-0">cat</span>
        <span className="text-[#e6edf3] break-all">{path}</span>
        {sizeStr && (
          <span className="ml-auto text-[#484f58] text-[10px] shrink-0 select-none">{sizeStr}</span>
        )}
      </div>
      {content && (
        <pre className="text-[#8b949e] whitespace-pre-wrap break-all ml-4 max-h-48 overflow-y-auto">
          {content}
        </pre>
      )}
    </>
  );
}

function TerminalWriteFile({ entry }: { entry: SandboxLogEntry }) {
  const path = (entry.toolInput?.path as string) || (entry.toolResult?.path as string) || '';
  const content = (entry.toolInput?.content as string) || '';
  const success = entry.toolResult?.success as boolean | undefined;
  const bytesWritten = entry.toolResult?.bytesWritten as number | undefined;
  const sizeStr =
    bytesWritten != null
      ? bytesWritten > 1024
        ? `${(bytesWritten / 1024).toFixed(1)}K`
        : `${bytesWritten}B`
      : '';

  return (
    <>
      <div className="flex items-baseline gap-2">
        <span className="text-[#d2a8ff] select-none shrink-0">write</span>
        <span className="text-[#e6edf3] break-all">{path}</span>
        <span className="ml-auto text-[#484f58] text-[10px] shrink-0 select-none">
          {sizeStr}
          {success === false && <span className="text-[#f85149] ml-1">[FAILED]</span>}
        </span>
      </div>
      {content && (
        <pre className="text-[#8b949e] whitespace-pre-wrap break-all ml-4 max-h-32 overflow-y-auto">
          {content}
        </pre>
      )}
    </>
  );
}

function TerminalListFiles({ entry }: { entry: SandboxLogEntry }) {
  const path = (entry.toolInput?.path as string) || (entry.toolInput?.directory as string) || '.';
  const entries =
    (entry.toolResult?.entries as Array<{ name: string; type: string; size: number | null }>) || [];

  return (
    <>
      <div className="flex items-baseline gap-2">
        <span className="text-[#ffa657] select-none shrink-0">ls</span>
        <span className="text-[#e6edf3] break-all">{path}</span>
        <span className="ml-auto text-[#484f58] text-[10px] shrink-0 select-none">
          {entries.length} items
        </span>
      </div>
      {entries.length > 0 && (
        <div className="ml-4 flex flex-wrap gap-x-4 gap-y-0.5">
          {entries.map((e) => (
            <span
              key={e.name}
              className={e.type === 'directory' ? 'text-[#79c0ff]' : 'text-[#c9d1d9]'}
            >
              {e.name}
              {e.type === 'directory' && '/'}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function TerminalLogLine({
  entry,
  showConversation,
}: {
  entry: SandboxLogEntry;
  showConversation: boolean;
}) {
  return (
    <div className="group py-1.5 border-b border-[#21262d] last:border-b-0">
      {/* Timestamp + conversation */}
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-[#484f58] text-[10px] tabular-nums select-none">
          {formatTime(entry.timestamp)}
        </span>
        {showConversation && (
          <span className="text-[#484f58] text-[10px] truncate max-w-[120px]">
            {entry.conversationSlug}
          </span>
        )}
      </div>

      {/* Tool-specific rendering */}
      {entry.toolName === 'shellExec' && <TerminalShellExec entry={entry} />}
      {entry.toolName === 'readFile' && <TerminalReadFile entry={entry} />}
      {entry.toolName === 'writeFile' && <TerminalWriteFile entry={entry} />}
      {entry.toolName === 'listFiles' && <TerminalListFiles entry={entry} />}
    </div>
  );
}

export function SandboxTerminal({
  logs,
  showConversation = true,
  className = '',
}: {
  logs: SandboxLogEntry[];
  showConversation?: boolean;
  className?: string;
}) {
  // Logs come newest-first from the API; reverse to show chronological (oldest at top)
  const chronological = [...logs].reverse();

  return (
    <div
      className={`bg-[#0d1117] rounded-lg border border-[#30363d] font-mono text-xs leading-relaxed overflow-hidden ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#161b22] border-b border-[#30363d]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#f85149]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#e3b341]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#3fb950]" />
        <span className="ml-2 text-[10px] text-[#484f58] select-none">sandbox</span>
      </div>

      {/* Log content */}
      <div className="p-3 overflow-y-auto max-h-[600px]">
        {chronological.map((entry) => (
          <TerminalLogLine key={entry.id} entry={entry} showConversation={showConversation} />
        ))}
      </div>
    </div>
  );
}
