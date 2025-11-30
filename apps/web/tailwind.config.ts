import baseConfig from '@tpmjs/tailwind-config/base';
import type { Config } from 'tailwindcss';

export default {
  ...baseConfig,
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.ts',
  ],
  plugins: [...(baseConfig.plugins || []), require('@tailwindcss/typography')],
} satisfies Config;
