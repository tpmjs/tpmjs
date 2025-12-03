'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ChatHeaderProps {
  onClear: () => void;
}

export function ChatHeader({ onClear }: ChatHeaderProps): React.ReactElement {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="border-b border-border bg-background px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">TPMJS Playground</h1>
          <Link
            href="https://tpmjs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-foreground-secondary hover:text-foreground"
          >
            View Registry →
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {mounted && (
            <Button variant="ghost" onClick={toggleTheme} size="md">
              {theme === 'dark' ? '☀️' : '🌙'}
            </Button>
          )}
          <Button variant="ghost" onClick={onClear} size="md">
            Clear Chat
          </Button>
        </div>
      </div>
    </header>
  );
}
