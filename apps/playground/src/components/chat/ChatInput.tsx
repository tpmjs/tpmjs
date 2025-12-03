'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Textarea } from '@tpmjs/ui/Textarea/Textarea';
import type { FormEvent } from 'react';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  setInput: (value: string) => void;
}

export function ChatInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
}: ChatInputProps): React.ReactElement {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        // Trigger form submission
        const form = e.currentTarget.form;
        if (form) {
          form.requestSubmit();
        }
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="border-t border-border bg-background p-4">
      <div className="mx-auto flex max-w-4xl gap-2">
        <Textarea
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask me to tell you a fish joke..."
          className="min-h-[60px] flex-1 resize-none"
          disabled={isLoading}
          rows={3}
        />
        <Button type="submit" disabled={!input.trim() || isLoading} loading={isLoading} size="lg">
          Send
        </Button>
      </div>
    </form>
  );
}
