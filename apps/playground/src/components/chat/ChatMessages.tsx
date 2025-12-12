'use client';

import type { UIMessage } from 'ai';
import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';

interface ChatMessagesProps {
  messages: UIMessage[];
  isStreaming?: boolean;
}

export function ChatMessages({
  messages,
  isStreaming = false,
}: ChatMessagesProps): React.ReactElement {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surface">
            <span className="text-3xl">🐟</span>
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Test TPMJS Tools</h2>
          <p className="mb-4 text-sm text-foreground-secondary">
            Select tools from the sidebar and start chatting to test them.
          </p>
          <div className="rounded-lg border border-dashed border-border bg-surface/50 p-4">
            <p className="text-xs text-foreground-tertiary">
              Try: &ldquo;Tell me a fish joke&rdquo; or &ldquo;What tools are available?&rdquo;
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.map((message, idx) => {
        // Only animate the last message if it's streaming
        const isLastMessage = idx === messages.length - 1;
        return (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={isStreaming && isLastMessage}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
