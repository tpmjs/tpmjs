'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import type { UIMessage } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { Streamdown } from 'streamdown';

interface PartTiming {
  startTime: number;
  endTime?: number;
  duration?: number;
}

interface MessageBubbleProps {
  message: UIMessage;
  isStreaming?: boolean;
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

export function MessageBubble({
  message,
  isStreaming = false,
}: MessageBubbleProps): React.ReactElement {
  const isUser = message.role === 'user';

  // Track timing for each part by index
  const [partTimings, setPartTimings] = useState<Map<string, PartTiming>>(new Map());
  const prevPartsRef = useRef<string>('');

  // Track part appearances and completions
  useEffect(() => {
    if (!message.parts || isUser) return;

    const currentPartsKey = JSON.stringify(
      // biome-ignore lint/suspicious/noExplicitAny: UIMessage.parts type varies by AI SDK version
      message.parts.map((p: any) => ({
        type: p.type,
        id: p.toolCallId || p.type,
        state: p.state,
        textLen: p.text?.length,
      }))
    );

    // Only process if parts changed
    if (currentPartsKey === prevPartsRef.current) return;
    prevPartsRef.current = currentPartsKey;

    const now = Date.now();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPartTimings((prev) => {
      const updated = new Map(prev);

      // biome-ignore lint/suspicious/noExplicitAny: UIMessage.parts type varies by AI SDK version
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex part timing logic for streaming messages
      message.parts?.forEach((part: any, idx: number) => {
        const partKey = part.toolCallId || `${part.type}-${idx}`;
        const existing = updated.get(partKey);

        // Skip step-start markers
        if (part.type === 'step-start') return;

        if (!existing) {
          // New part - record start time
          updated.set(partKey, { startTime: now });
        } else if (!existing.endTime) {
          // Check if part is complete
          const isToolComplete = part.type.startsWith('tool-') && part.state === 'result';
          const isTextComplete = part.type === 'text' && !isStreaming;

          if (isToolComplete || isTextComplete) {
            updated.set(partKey, {
              ...existing,
              endTime: now,
              duration: now - existing.startTime,
            });
          }
        }
      });

      return updated;
    });
  }, [message.parts, isStreaming, isUser]);

  // Get timing for a specific part
  // biome-ignore lint/suspicious/noExplicitAny: UIMessage.parts type varies by AI SDK version
  const getPartTiming = (part: any, idx: number): PartTiming | undefined => {
    const partKey = part.toolCallId || `${part.type}-${idx}`;
    return partTimings.get(partKey);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`w-full max-w-3xl rounded-xl border p-4 ${
          isUser ? 'border-foreground/10 bg-foreground/5' : 'border-border bg-background shadow-sm'
        }`}
      >
        <div className="mb-3 flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
              isUser ? 'bg-foreground text-background' : 'bg-surface text-foreground-secondary'
            }`}
          >
            {isUser ? 'Y' : 'AI'}
          </div>
          <span className="text-xs font-medium text-foreground-secondary">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-foreground-tertiary">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Render message parts */}
        {message.parts && message.parts.length > 0 ? (
          <div className="space-y-4">
            {message.parts.map((part, idx) => {
              // Skip step-start markers
              if (part.type === 'step-start') {
                return null;
              }

              // Render text parts with markdown support
              if (part.type === 'text') {
                const timing = getPartTiming(part, idx);
                return (
                  <div key={`text-${message.id}-${idx}`} className="text-sm leading-relaxed">
                    <Streamdown isAnimating={isStreaming && !isUser}>{part.text || ''}</Streamdown>
                    {timing?.duration && (
                      <div className="mt-2 text-xs text-foreground-tertiary">
                        ⏱ {formatDuration(timing.duration)}
                      </div>
                    )}
                  </div>
                );
              }

              // Render tool calls (type starts with 'tool-')
              if (part.type.startsWith('tool-')) {
                const toolName = part.type.replace('tool-', '');
                // biome-ignore lint/suspicious/noExplicitAny: Tool part properties vary by AI SDK version
                const toolPart = part as any;
                const timing = getPartTiming(part, idx);
                const isResult = toolPart.state === 'result';
                const hasError = toolPart.errorText || toolPart.error;

                return (
                  <div
                    key={toolPart.toolCallId || idx}
                    className={`rounded-lg border p-3 ${
                      hasError
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-amber-500/30 bg-amber-500/5'
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-sm">🔧</span>
                      <code className="text-sm font-medium">{toolName}</code>
                      <Badge
                        variant={hasError ? 'error' : isResult ? 'success' : 'secondary'}
                        size="sm"
                      >
                        {hasError ? 'error' : toolPart.state || 'running'}
                      </Badge>
                      {timing?.duration && (
                        <span className="ml-auto text-xs text-foreground-tertiary">
                          {formatDuration(timing.duration)}
                        </span>
                      )}
                    </div>

                    {/* Tool Input */}
                    {toolPart.input && (
                      <details className="group">
                        <summary className="cursor-pointer text-xs font-medium text-foreground-secondary hover:text-foreground">
                          Input
                        </summary>
                        <pre className="mt-2 overflow-x-auto rounded-md bg-surface p-2 text-xs text-foreground-secondary">
                          {JSON.stringify(toolPart.input, null, 2)}
                        </pre>
                      </details>
                    )}

                    {/* Tool Output */}
                    {toolPart.output && (
                      <details className="group mt-2" open>
                        <summary className="cursor-pointer text-xs font-medium text-foreground-secondary hover:text-foreground">
                          Output
                        </summary>
                        <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-surface p-2 text-xs text-foreground-secondary">
                          {JSON.stringify(toolPart.output, null, 2)}
                        </pre>
                      </details>
                    )}

                    {/* Tool Error */}
                    {hasError && (
                      <div className="mt-2">
                        <div className="mb-1 text-xs font-medium text-red-500">Error</div>
                        <pre className="overflow-x-auto rounded-md bg-red-500/10 p-2 text-xs text-red-400">
                          {typeof (toolPart.errorText || toolPart.error) === 'string'
                            ? toolPart.errorText || toolPart.error
                            : JSON.stringify(toolPart.errorText || toolPart.error, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        ) : (
          // Fallback if no parts
          <div className="text-sm">
            <Streamdown isAnimating={isStreaming && !isUser}>...</Streamdown>
          </div>
        )}
      </div>
    </div>
  );
}
