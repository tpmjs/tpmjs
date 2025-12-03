'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
  toolInvocations?: Array<{
    toolName: string;
    args: unknown;
    result?: unknown;
  }>;
}

interface ChatMessagesProps {
  messages: Message[];
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
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-foreground-secondary">
          <div className="mb-2 text-4xl">🐟</div>
          <p className="text-lg">Start chatting to test TPMJS tools</p>
          <p className="mt-2 text-sm">Try asking: "Tell me a fish joke"</p>
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
