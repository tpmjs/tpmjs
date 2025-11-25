import type { Config } from 'tailwindcss';
import baseConfig from '@tpmjs/tailwind-config/base';

export default {
  ...baseConfig,
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.ts',
  ],
} satisfies Config;
