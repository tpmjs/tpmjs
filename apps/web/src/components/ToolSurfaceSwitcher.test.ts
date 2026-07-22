import * as React from 'react';
// eslint-disable-next-line import/no-internal-modules -- React documents this entry point for server rendering.
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Syntax highlighting has its own focused UI tests. Keeping Prism's complete
// grammar graph out of this contract test prevents a small SSR assertion from
// consuming most of the web test worker's timeout under parallel CI load.
vi.mock('@tpmjs/ui/CodeBlock/CodeBlock', async () => {
  const ReactModule = await vi.importActual<typeof import('react')>('react');
  return {
    CodeBlock: ({ code }: { code: string }) => ReactModule.createElement('code', null, code),
  };
});

afterEach(() => vi.unstubAllGlobals());

describe('ToolSurfaceSwitcher', () => {
  it('renders an accessible five-tab contract with CLI as the initial surface', async () => {
    // The web Vitest config preserves JSX without Next's automatic runtime.
    vi.stubGlobal('React', React);
    const { ToolSurfaceSwitcher } = await import('./ToolSurfaceSwitcher');
    const html = renderToStaticMarkup(
      React.createElement(ToolSurfaceSwitcher, {
        packageName: '@example/agent-tools',
        toolName: 'searchWeb',
        analyticsToolId: 'tool-1',
      })
    );

    expect(html).toContain('aria-label="Tool access surface"');
    expect(html.match(/role="tab"/g)).toHaveLength(5);
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('aria-labelledby="tab-cli"');
    expect(html).toContain('@example/agent-tools::searchWeb');
    expect(html).toContain('Terminal agents and local automation');
    expect(html).not.toContain('execute_tool arguments');
  });
});
