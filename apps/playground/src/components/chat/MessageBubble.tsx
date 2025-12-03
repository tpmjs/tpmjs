'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Card, CardContent } from '@tpmjs/ui/Card/Card';

interface MessagePart {
  type: string; // Can be 'text', 'tool-{toolName}', 'step-start', etc.
  text?: string;
  toolCallId?: string;
  input?: unknown;
  output?: unknown;
  state?: string;
  providerMetadata?: unknown;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parts?: MessagePart[];
  createdAt?: Date;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps): React.ReactElement {
  const isUser = message.role === 'user';

  // Debug: Log message structure
  console.log('Message:', {
    id: message.id,
    role: message.role,
    content: message.content,
    parts: message.parts,
    fullMessage: message,
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <Card variant={isUser ? 'elevated' : 'outline'} className="w-full max-w-2xl">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant={isUser ? 'default' : 'secondary'} size="sm">
              {isUser ? 'You' : 'AI'}
            </Badge>
            <span className="text-xs text-foreground-tertiary">
              {new Date(message.createdAt || Date.now()).toLocaleTimeString()}
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

                // Render text parts
                if (part.type === 'text') {
                  return (
                    <div key={`text-${message.id}-${idx}`} className="whitespace-pre-wrap text-sm">
                      {part.text}
                    </div>
                  );
                }

                // Render tool calls (type starts with 'tool-')
                if (part.type.startsWith('tool-')) {
                  const toolName = part.type.replace('tool-', '');
                  return (
                    <div
                      key={part.toolCallId || idx}
                      className="rounded border border-amber-500/20 bg-amber-500/5 p-3"
                    >
                      <div className="mb-3 flex items-center gap-2 border-b border-amber-500/20 pb-2">
                        <span className="text-base">🔧</span>
                        <strong className="font-mono text-sm text-foreground">{toolName}</strong>
                        {part.state && (
                          <Badge variant="secondary" size="sm">
                            {part.state}
                          </Badge>
                        )}
                      </div>

                      {/* Tool Input */}
                      <div className="mb-3">
                        <div className="mb-1 text-xs font-semibold text-foreground-secondary">
                          Input:
                        </div>
                        <pre className="overflow-x-auto rounded bg-surface p-2 text-xs text-foreground-secondary">
                          {JSON.stringify(part.input, null, 2)}
                        </pre>
                      </div>

                      {/* Tool Output */}
                      {part.output && (
                        <div>
                          <div className="mb-1 text-xs font-semibold text-foreground-secondary">
                            Output:
                          </div>
                          <pre className="overflow-x-auto rounded bg-surface p-2 text-xs text-foreground-secondary">
                            {JSON.stringify(part.output, null, 2)}
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
            // Fallback to content if no parts
            <div className="whitespace-pre-wrap text-sm">{message.content || '...'}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
