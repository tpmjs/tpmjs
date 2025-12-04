'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Card, CardContent } from '@tpmjs/ui/Card/Card';
import type { UIMessage } from 'ai';
import { Streamdown } from 'streamdown';

interface MessageBubbleProps {
  message: UIMessage;
  isStreaming?: boolean;
}

export function MessageBubble({
  message,
  isStreaming = false,
}: MessageBubbleProps): React.ReactElement {
  const isUser = message.role === 'user';

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
                  return (
                    <div key={`text-${message.id}-${idx}`} className="text-sm">
                      <Streamdown isAnimating={isStreaming && !isUser}>
                        {part.text || ''}
                      </Streamdown>
                    </div>
                  );
                }

                // Render tool calls (type starts with 'tool-')
                if (part.type.startsWith('tool-')) {
                  const toolName = part.type.replace('tool-', '');
                  // Type assertion for tool parts
                  const toolPart = part as any;
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
                      {toolPart.error && (
                        <div>
                          <div className="mb-1 text-xs font-semibold text-red-500">Error:</div>
                          <pre className="overflow-x-auto rounded bg-red-500/10 p-2 text-xs text-red-400">
                            {typeof toolPart.error === 'string'
                              ? toolPart.error
                              : JSON.stringify(toolPart.error, null, 2)}
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
