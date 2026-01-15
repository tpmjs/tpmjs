import baseConfig from '@tpmjs/tailwind-config/base';
import type { Config } from 'tailwindcss';

export default {
  ...baseConfig,
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.ts',
  ],
  safelist: [
    ...(baseConfig.safelist || []),
    // Extended color utilities for style guide
    'bg-accent-strong',
    'bg-accent-muted',
    'bg-surface-2',
    'bg-surface-3',
    'bg-success-light',
    'bg-warning-light',
    'bg-error-light',
    'bg-info-light',
    'text-foreground-secondary',
    'text-foreground-tertiary',
    'text-foreground-muted',
    'border-border-strong',
    'border-border-subtle',
  ],
  plugins: [...(baseConfig.plugins || []), require('@tailwindcss/typography')],
} satisfies Config;
