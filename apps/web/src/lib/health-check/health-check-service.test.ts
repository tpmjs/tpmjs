import type { Package, Tool } from '@tpmjs/db';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkExecutionHealth } from './health-check-service';

function healthTool(healthCheckConfig: Tool['healthCheckConfig']): Tool & { package: Package } {
  return {
    id: 'tool_1',
    name: 'createThing',
    healthCheckConfig,
    parameters: [],
    inputSchema: { type: 'object', properties: {} },
    package: {
      npmPackageName: '@example/tools',
      npmVersion: '1.2.3',
    },
  } as unknown as Tool & { package: Package };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.EXECUTOR_API_KEY;
});

describe('checkExecutionHealth', () => {
  it('records an author-skipped execution as UNKNOWN without invoking the executor', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await checkExecutionHealth(healthTool({ skipExecution: true }));

    expect(result).toMatchObject({
      status: 'UNKNOWN',
      error: 'Skipped by author healthCheck contract',
      timeMs: 0,
      testParams: {},
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses safe params then performs authenticated same-package cleanup with no env', async () => {
    process.env.EXECUTOR_API_KEY = 'test-executor-key';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, output: { resource: { id: 'thing_1' } } }))
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, output: {} })));
    vi.stubGlobal('fetch', fetchMock);

    const result = await checkExecutionHealth(
      healthTool({
        testParams: { name: 'health-check-{{timestamp}}' },
        cleanup: [
          {
            tool: 'deleteThing',
            params: { name: 'health-check-{{timestamp}}' },
            mapping: { id: 'resource.id' },
          },
        ],
      })
    );

    expect(result.status).toBe('HEALTHY');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const executionInit = fetchMock.mock.calls.at(0)?.[1] as RequestInit;
    const cleanupInit = fetchMock.mock.calls.at(1)?.[1] as RequestInit;
    const executionRequest = JSON.parse(executionInit.body as string);
    const cleanupRequest = JSON.parse(cleanupInit.body as string);
    expect(executionRequest).toMatchObject({
      packageName: '@example/tools',
      name: 'createThing',
      version: '1.2.3',
      env: {},
    });
    expect(cleanupRequest).toMatchObject({
      packageName: '@example/tools',
      name: 'deleteThing',
      version: '1.2.3',
      env: {},
      params: { name: executionRequest.params.name, id: 'thing_1' },
    });
    expect(cleanupInit.headers).toMatchObject({
      Authorization: 'Bearer test-executor-key',
    });
  });
});
