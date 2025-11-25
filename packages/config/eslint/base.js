import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Module boundaries
      'import/no-internal-modules': ['error', {
        allow: [
          '@tpmjs/ui/*/[!index]*',
          '@tpmjs/utils/*',
          '@tpmjs/types/*',
        ]
      }],
      'import/no-restricted-paths': ['error', {
        zones: [
          { target: './packages', from: './apps' },
          { target: './packages/ui', from: './packages/utils' },
        ]
      }],
      'import/no-anonymous-default-export': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
);
