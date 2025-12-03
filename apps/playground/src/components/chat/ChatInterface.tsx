'use client';

import { useState } from 'react';
import { useChat } from '~/hooks/useChat';
import { ChatInput } from './ChatInput';
import { ChatMessages } from './ChatMessages';

export function ChatInterface(): React.ReactElement {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState('');

  const isLoading = status !== 'ready';

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() && status === 'ready') {
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <ChatMessages messages={messages} isStreaming={isLoading} />
      <ChatInput
        input={input}
        isLoading={isLoading}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        setInput={setInput}
      />
    </div>
  );
}
