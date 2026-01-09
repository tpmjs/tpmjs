'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface ChatHeaderProps {
  onClear: () => void;
}

export function ChatHeader({ onClear }: ChatHeaderProps): React.ReactElement {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch - this is intentional for SSR
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="border-b border-border bg-surface px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold tracking-tight">TPMJS Playground</h1>
          <Link
            href="https://tpmjs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-foreground-tertiary transition-colors hover:text-foreground"
          >
            View Registry →
          </Link>
        </div>
        <div className="flex items-center gap-1">
          {mounted && (
            <Button variant="ghost" onClick={toggleTheme} size="sm">
              {theme === 'dark' ? '☀️' : '🌙'}
            </Button>
          )}
          <Button variant="ghost" onClick={onClear} size="sm">
            Clear Chat
          </Button>
        </div>
      </div>
    </header>
  );
}
