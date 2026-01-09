'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useTheme } from 'next-themes';
import { createElement, useEffect, useState } from 'react';

export function ThemeToggle(): React.ReactElement {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client - intentional hydration safety pattern
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with the same dimensions to avoid layout shift
    return createElement(Button, {
      variant: 'ghost',
      size: 'sm',
      className: 'w-9 h-9 p-0',
      'aria-label': 'Toggle theme',
    });
  }

  const isDark = theme === 'dark';

  return createElement(
    Button,
    {
      variant: 'ghost',
      size: 'sm',
      className: 'w-9 h-9 p-0',
      onClick: () => setTheme(isDark ? 'light' : 'dark'),
      'aria-label': `Switch to ${isDark ? 'light' : 'dark'} mode`,
      title: `Switch to ${isDark ? 'light' : 'dark'} mode`,
    },
    createElement(Icon, {
      icon: isDark ? 'sun' : 'moon',
      size: 'md',
      className: 'transition-transform duration-300',
    })
  );
}
