import reactConfig from '@tpmjs/eslint-config/react.js';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'eslint.config.mjs']
  },
  ...reactConfig,
  {
    rules: {
      'import/no-internal-modules': ['error', {
        allow: [
          '@tpmjs/ui/*/[!index]*',
          '@tpmjs/utils/*',
          '@tpmjs/types/*',
          '@tpmjs/eslint-config/*',
          '@testing-library/**',
          'react/*',
        ]
      }],
    }
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      'jsx-a11y/no-autofocus': 'off',
    }
  }
];
