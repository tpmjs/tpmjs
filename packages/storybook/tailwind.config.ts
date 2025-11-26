import baseConfig from '@tpmjs/tailwind-config/base';
import type { Config } from 'tailwindcss';

export default {
  ...baseConfig,
  content: ['./stories/**/*.{ts,tsx}', '../ui/src/**/*.{ts,tsx}'],
} satisfies Config;
