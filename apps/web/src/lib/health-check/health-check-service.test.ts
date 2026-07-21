import type { Package, Tool } from '@tpmjs/db';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkExecutionHealth, checkImportHealth } from './health-check-service';

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
        new Response(
          JSON.stringify({
            success: true,
            output: { resource: { id: 'thing_1' } },
            executionTimeMs: 10,
          })
        )
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

  it('treats a typed execute-stage throw as proof the tool is callable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: 'message wording is irrelevant',
            errorStage: 'execute',
            errorCode: 'TOOL_EXECUTION_FAILED',
            retryable: false,
            executionTimeMs: 12,
          })
        )
      )
    );

    const result = await checkExecutionHealth(healthTool(null));

    expect(result).toMatchObject({ status: 'HEALTHY', error: null });
  });

  it('marks a deterministic typed load failure broken', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: 'export does not exist',
            errorStage: 'load',
            errorCode: 'TOOL_NOT_FOUND',
            retryable: false,
            executionTimeMs: 8,
          }),
          { status: 404 }
        )
      )
    );

    const result = await checkExecutionHealth(healthTool(null));

    expect(result).toMatchObject({
      status: 'BROKEN',
      error: 'TOOL_NOT_FOUND: export does not exist',
    });
  });

  it('keeps prior state for legacy prose-only failures instead of guessing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: false, error: 'API key is required' }), {
          status: 500,
        })
      )
    );

    const result = await checkExecutionHealth(healthTool(null));

    expect(result.status).toBe('UNKNOWN');
    expect(result.error).toContain('Executor protocol error');
  });
});

describe('checkImportHealth', () => {
  it('marks a deterministic typed load failure broken', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: 'missing export',
            errorStage: 'load',
            errorCode: 'TOOL_NOT_FOUND',
            retryable: false,
          }),
          { status: 404 }
        )
      )
    );

    const result = await checkImportHealth(healthTool(null));

    expect(result).toMatchObject({
      status: 'BROKEN',
      error: 'TOOL_NOT_FOUND: missing export',
    });
  });

  it('keeps prior state when a factory requires configuration', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: 'configuration is required',
            errorStage: 'load',
            errorCode: 'TOOL_CONFIGURATION_REQUIRED',
            retryable: false,
          }),
          { status: 400 }
        )
      )
    );

    const result = await checkImportHealth(healthTool(null));

    expect(result.status).toBe('UNKNOWN');
  });

  it('does not infer health from an untyped environment-error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: false, error: 'API key is required' }), {
          status: 400,
        })
      )
    );

    const result = await checkImportHealth(healthTool(null));

    expect(result.status).toBe('UNKNOWN');
    expect(result.error).toContain('Executor protocol error');
  });
});
