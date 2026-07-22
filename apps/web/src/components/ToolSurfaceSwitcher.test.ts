import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
