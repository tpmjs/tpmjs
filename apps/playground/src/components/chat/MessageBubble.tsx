'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Card, CardContent } from '@tpmjs/ui/Card/Card';
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

    setPartTimings((prev) => {
      const updated = new Map(prev);

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
  const getPartTiming = (part: any, idx: number): PartTiming | undefined => {
    const partKey = part.toolCallId || `${part.type}-${idx}`;
    return partTimings.get(partKey);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <Card variant={isUser ? 'elevated' : 'outline'} className="w-full max-w-2xl">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant={isUser ? 'default' : 'secondary'} size="sm">
              {isUser ? 'You' : 'AI'}
            </Badge>
            <span className="text-xs text-foreground-tertiary">
              {new Date().toLocaleTimeString()}
            </span>
          </div>

          {/* Render message parts */}
          {message.parts && message.parts.length > 0 ? (
            <div className="space-y-3">
              {message.parts.map((part, idx) => {
                // Skip step-start markers
                if (part.type === 'step-start') {
                  return null;
                }

                // Render text parts with markdown support
                if (part.type === 'text') {
                  const timing = getPartTiming(part, idx);
                  return (
                    <div key={`text-${message.id}-${idx}`} className="text-sm">
                      <Streamdown isAnimating={isStreaming && !isUser}>
                        {part.text || ''}
                      </Streamdown>
                      {timing?.duration && (
                        <div className="mt-1 text-xs text-foreground-tertiary">
                          ⏱ {formatDuration(timing.duration)}
                        </div>
                      )}
                    </div>
                  );
                }

                // Render tool calls (type starts with 'tool-')
                if (part.type.startsWith('tool-')) {
                  const toolName = part.type.replace('tool-', '');
                  // Type assertion for tool parts
                  const toolPart = part as any;
                  const timing = getPartTiming(part, idx);
                  return (
                    <div
                      key={toolPart.toolCallId || idx}
                      className="rounded border border-amber-500/20 bg-amber-500/5 p-3"
                    >
                      <div className="mb-3 flex items-center gap-2 border-b border-amber-500/20 pb-2">
                        <span className="text-base">🔧</span>
                        <strong className="font-mono text-sm text-foreground">{toolName}</strong>
                        {toolPart.state && (
                          <Badge variant="secondary" size="sm">
                            {toolPart.state}
                          </Badge>
                        )}
                        {timing?.duration && (
                          <span className="ml-auto text-xs text-foreground-tertiary">
                            ⏱ {formatDuration(timing.duration)}
                          </span>
                        )}
                      </div>

                      {/* Tool Input */}
                      {toolPart.input && (
                        <div className="mb-3">
                          <div className="mb-1 text-xs font-semibold text-foreground-secondary">
                            Input:
                          </div>
                          <pre className="overflow-x-auto rounded bg-surface p-2 text-xs text-foreground-secondary">
                            {JSON.stringify(toolPart.input, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Tool Output */}
                      {toolPart.output && (
                        <div>
                          <div className="mb-1 text-xs font-semibold text-foreground-secondary">
                            Output:
                          </div>
                          <pre className="overflow-x-auto rounded bg-surface p-2 text-xs text-foreground-secondary">
                            {JSON.stringify(toolPart.output, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Tool Error */}
                      {(toolPart.errorText || toolPart.error) && (
                        <div>
                          <div className="mb-1 text-xs font-semibold text-red-500">Error:</div>
                          <pre className="overflow-x-auto rounded bg-red-500/10 p-2 text-xs text-red-400">
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
        </CardContent>
      </Card>
    </div>
  );
}
