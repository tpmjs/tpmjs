import type { GeneratorConfig } from '../types.js';

/**
 * Generates the package.json content for a TPMJS tool package
 */
export function generatePackageJson(config: GeneratorConfig): string {
  const { packageInfo, tools } = config;

  const pkg = {
    name: packageInfo.name,
    version: '0.0.1',
    description: packageInfo.description,
    type: 'module',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    scripts: {
      build: 'tsup',
      dev: 'tsup --watch',
      'type-check': 'tsc --noEmit',
    },
    keywords: ['tpmjs-tool', 'ai-sdk', packageInfo.category],
    author: packageInfo.author || '',
    license: packageInfo.license,
    tpmjs: {
      category: packageInfo.category,
      tools: tools.map((tool) => ({
        name: tool.exportName,
        description: tool.description,
      })),
      ...(tools.some((t) => t.env) && {
        env: tools.flatMap((t) => t.env || []),
      }),
      ...(tools.some((t) => t.frameworks) && {
        frameworks: Array.from(new Set(tools.flatMap((t) => t.frameworks || []))),
      }),
    },
    dependencies: {
      ai: '6.0.0-beta.131',
      zod: '^4.1.13',
    },
    devDependencies: {
      tsup: '^8.3.5',
      typescript: '^5.9.3',
    },
    files: ['dist', 'README.md'],
  };

  return JSON.stringify(pkg, null, 2);
}
