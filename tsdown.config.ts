import { defineConfig } from 'tsdown';

const validatePackage = process.env.TPMJS_VALIDATE_PACKAGES === '1';

export default defineConfig((inlineConfig) => ({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: { sourcemap: false },
  clean: true,
  treeshake: true,
  logLevel: 'warn',
  fixedExtension: false,
  splitting: false,
  cwd: inlineConfig.cwd ?? process.cwd(),
  inputOptions: {
    checks: {
      pluginTimings: false,
    },
  },
  publint: validatePackage ? { level: 'error' } : false,
  attw: validatePackage ? { profile: 'esm-only', level: 'error' } : false,
}));
