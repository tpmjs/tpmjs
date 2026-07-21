import type { ExecuteToolResponse, HealthResponse, TestResult, TestSuite } from '../types.js';

const FIXTURE = {
  packageName: '@tpmjs/tools-normalize-whitespace',
  name: 'normalizeWhitespaceTool',
  version: '0.2.0',
  params: { text: 'hello   world' },
};

async function testHealthReturns200(baseUrl: string, _apiKey?: string): Promise<TestResult> {
  const start = Date.now();
  const name = 'GET /health returns 200';

  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'X-TPMJS-Protocol-Version': '1.1',
      },
    });

    const durationMs = Date.now() - start;

    if (response.status === 200) {
      return { name, passed: true, durationMs };
    }

    return {
      name,
      passed: false,
      message: `Expected status 200, got ${response.status}`,
      durationMs,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      durationMs: Date.now() - start,
    };
  }
}

async function testHealthIncludesProtocolVersion(
  baseUrl: string,
  _apiKey?: string
): Promise<TestResult> {
  const start = Date.now();
  const name = 'GET /health includes protocolVersion';

  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'X-TPMJS-Protocol-Version': '1.1',
      },
    });

    const data = (await response.json()) as HealthResponse;
    const durationMs = Date.now() - start;

    if (data.protocolVersion) {
      return { name, passed: true, durationMs };
    }

    return {
      name,
      passed: false,
      message: 'Response missing protocolVersion field',
      durationMs,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      durationMs: Date.now() - start,
    };
  }
}

async function testHealthIncludesImplementationVersion(
  baseUrl: string,
  _apiKey?: string
): Promise<TestResult> {
  const start = Date.now();
  const name = 'GET /health includes implementationVersion';

  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'X-TPMJS-Protocol-Version': '1.1',
      },
    });

    const data = (await response.json()) as HealthResponse;
    const durationMs = Date.now() - start;

    if (data.implementationVersion) {
      return { name, passed: true, durationMs };
    }

    return {
      name,
      passed: false,
      message: 'Response missing implementationVersion field',
      durationMs,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      durationMs: Date.now() - start,
    };
  }
}

async function testExecuteToolAcceptsValidRequest(
  baseUrl: string,
  apiKey?: string
): Promise<TestResult> {
  const start = Date.now();
  const name = 'POST /execute-tool accepts valid request';

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-TPMJS-Protocol-Version': '1.1',
    };

    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${baseUrl}/execute-tool`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...FIXTURE,
      }),
    });

    const durationMs = Date.now() - start;

    // We expect 200 even if the tool fails
    if (response.status === 200) {
      return { name, passed: true, durationMs };
    }

    // 401 is acceptable if auth is required and not provided
    if (response.status === 401 && !apiKey) {
      return {
        name,
        passed: true,
        message: 'Authentication required (expected)',
        durationMs,
      };
    }

    return {
      name,
      passed: false,
      message: `Expected status 200, got ${response.status}`,
      durationMs,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      durationMs: Date.now() - start,
    };
  }
}

async function testExecuteToolReturnsStructuredResponse(
  baseUrl: string,
  apiKey?: string
): Promise<TestResult> {
  const start = Date.now();
  const name = 'POST /execute-tool returns structured response';

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-TPMJS-Protocol-Version': '1.1',
    };

    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${baseUrl}/execute-tool`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...FIXTURE,
      }),
    });

    const durationMs = Date.now() - start;

    // Skip if auth required
    if (response.status === 401 && !apiKey) {
      return {
        name,
        passed: true,
        message: 'Skipped: Authentication required',
        durationMs,
      };
    }

    const data = (await response.json()) as ExecuteToolResponse;

    // Check required fields
    if (typeof data.success !== 'boolean') {
      return {
        name,
        passed: false,
        message: 'Response missing "success" boolean field',
        durationMs,
      };
    }

    if (typeof data.executionTimeMs !== 'number') {
      return {
        name,
        passed: false,
        message: 'Response missing "executionTimeMs" number field',
        durationMs,
      };
    }

    if (data.success && data.output === undefined) {
      return {
        name,
        passed: false,
        message: 'Successful response missing "output" field',
        durationMs,
      };
    }

    if (!data.success && !data.error) {
      return {
        name,
        passed: false,
        message: 'Error response missing "error" field',
        durationMs,
      };
    }

    if (
      !data.success &&
      (!data.errorStage || !data.errorCode || typeof data.retryable !== 'boolean')
    ) {
      return {
        name,
        passed: false,
        message: 'Error response missing typed failure metadata',
        durationMs,
      };
    }

    return { name, passed: true, durationMs };
  } catch (error) {
    return {
      name,
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      durationMs: Date.now() - start,
    };
  }
}

async function testExecuteToolReturnsErrorForInvalidTool(
  baseUrl: string,
  apiKey?: string
): Promise<TestResult> {
  const start = Date.now();
  const name = 'POST /execute-tool returns error for invalid tool';

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-TPMJS-Protocol-Version': '1.1',
    };

    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${baseUrl}/execute-tool`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        packageName: '@tpmjs/nonexistent-package-12345',
        name: 'nonexistentTool',
        version: '0.0.0',
        params: {},
      }),
    });

    const durationMs = Date.now() - start;

    // Skip if auth required
    if (response.status === 401 && !apiKey) {
      return {
        name,
        passed: true,
        message: 'Skipped: Authentication required',
        durationMs,
      };
    }

    const data = (await response.json()) as ExecuteToolResponse;

    if (
      data.success === false &&
      data.error &&
      data.errorCode &&
      data.errorStage &&
      typeof data.retryable === 'boolean'
    ) {
      return { name, passed: true, durationMs };
    }

    return {
      name,
      passed: false,
      message: 'Expected error response with code for nonexistent package',
      durationMs,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      durationMs: Date.now() - start,
    };
  }
}

async function testCORSHeaders(baseUrl: string, _apiKey?: string): Promise<TestResult> {
  const start = Date.now();
  const name = 'CORS headers present';

  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
    });

    const durationMs = Date.now() - start;

    const allowOrigin = response.headers.get('access-control-allow-origin');

    if (allowOrigin) {
      return { name, passed: true, durationMs };
    }

    return {
      name,
      passed: false,
      message: 'Missing Access-Control-Allow-Origin header',
      durationMs,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      durationMs: Date.now() - start,
    };
  }
}

async function testOPTIONSPreflight(baseUrl: string, _apiKey?: string): Promise<TestResult> {
  const start = Date.now();
  const name = 'OPTIONS preflight works';

  try {
    const response = await fetch(`${baseUrl}/execute-tool`, {
      method: 'OPTIONS',
    });

    const durationMs = Date.now() - start;

    if (response.status === 200 || response.status === 204) {
      const allowMethods = response.headers.get('access-control-allow-methods');
      const allowHeaders = response.headers.get('access-control-allow-headers');

      if (allowMethods && allowHeaders) {
        return { name, passed: true, durationMs };
      }

      return {
        name,
        passed: false,
        message: 'Missing CORS preflight headers',
        durationMs,
      };
    }

    return {
      name,
      passed: false,
      message: `Expected status 200 or 204, got ${response.status}`,
      durationMs,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      durationMs: Date.now() - start,
    };
  }
}

export async function runCoreTests(baseUrl: string, apiKey?: string): Promise<TestSuite> {
  const results: TestResult[] = [];

  // Run tests sequentially to avoid overwhelming the executor
  results.push(await testHealthReturns200(baseUrl, apiKey));
  results.push(await testHealthIncludesProtocolVersion(baseUrl, apiKey));
  results.push(await testHealthIncludesImplementationVersion(baseUrl, apiKey));
  results.push(await testExecuteToolAcceptsValidRequest(baseUrl, apiKey));
  results.push(await testExecuteToolReturnsStructuredResponse(baseUrl, apiKey));
  results.push(await testExecuteToolReturnsErrorForInvalidTool(baseUrl, apiKey));
  results.push(await testCORSHeaders(baseUrl, apiKey));
  results.push(await testOPTIONSPreflight(baseUrl, apiKey));

  return {
    name: 'Core Requirements',
    level: 'core',
    results,
  };
}
