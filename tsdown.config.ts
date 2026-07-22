import { defineConfig, type UserConfig } from 'tsdown';

const validatePackage = process.env.TPMJS_VALIDATE_PACKAGES === '1';

export const libraryConfig = {
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: { sourcemap: false },
  clean: true,
  treeshake: true,
  logLevel: 'warn',
  fixedExtension: false,
  inputOptions: {
    checks: {
      pluginTimings: false,
    },
  },
  outputOptions: {
    codeSplitting: false,
  },
  publint: validatePackage ? { level: 'error' } : false,
  attw: validatePackage ? { profile: 'esm-only', level: 'error' } : false,
} satisfies UserConfig;

export default defineConfig((inlineConfig) => ({
  ...libraryConfig,
  cwd: inlineConfig.cwd ?? process.cwd(),
}));
