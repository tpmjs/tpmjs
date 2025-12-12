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
    <form onSubmit={onSubmit} className="border-t border-border bg-surface p-4">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-3 rounded-xl border border-border bg-background p-3 shadow-sm">
          <Textarea
            value={input}
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to tell you a fish joke..."
            className="min-h-[44px] max-h-[200px] flex-1 resize-none border-0 bg-transparent p-0 focus:ring-0"
            disabled={isLoading}
            rows={1}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            loading={isLoading}
            size="md"
            className="shrink-0"
          >
            Send
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-foreground-tertiary">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </form>
  );
}
