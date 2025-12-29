import reactConfig from '@tpmjs/eslint-config/react.js';

export default [
  {
    ignores: [
      '.next/**',
      '.turbo/**',
      'node_modules/**',
      '*.config.js',
      '*.config.ts',
      'next-env.d.ts',
      'eslint.config.mjs',
    ],
  },
  ...reactConfig,
];
